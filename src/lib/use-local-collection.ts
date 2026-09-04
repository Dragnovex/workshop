"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/lib/auth/permission-context";
import type { Resource } from "@/lib/auth/types";
import type { ClientStore, TombstoneStore } from "@/lib/client-store";

/**
 * محرّك CRUD الموحّد لوحدات الواجهة.
 *
 * يجمع ثلاثة أشياء كانت تُعاد كتابتها في كل وحدة:
 *   1) دمج بذرة الخادم مع المحفوظ محليًا **مع احترام المحذوفات**.
 *   2) التحقق من نجاح الحفظ فعليًا قبل تحديث الحالة أو إخبار المستخدم.
 *   3) فحص الصلاحية قبل كل عملية — لا mutation بلا حارس.
 *
 * ترتيب الخطوات مقصود: الصلاحية ← الكتابة ← التحقق ← الحالة. لو انعكس
 * (تحديث الحالة ثم الحفظ) لظهر السجل في الشاشة ثم اختفى عند التحديث،
 * وهو أسوأ من رفض واضح.
 *
 * **حذف سجل من البذرة** يحتاج شاهدة (tombstone): البذرة تُعاد من الخادم
 * في كل تحميل، فبلا تسجيل المعرّف المحذوف يعود السجل من الموت.
 */
export function useLocalCollection<T extends { id: string }>({
  resource,
  seed,
  store,
  tombstones,
}: {
  resource: Resource;
  seed: T[];
  store: ClientStore<T>;
  tombstones: TombstoneStore;
}) {
  const guard = useGuard();
  const tCommon = useTranslations("common");

  const [deletedIds, setDeletedIds] = useState<string[]>(() => tombstones.load());
  const [stored, setStored] = useState<T[]>(() => store.load(seed));

  const rows = useMemo(() => {
    const removed = new Set(deletedIds);
    return stored.filter((row) => !removed.has(row.id));
  }, [deletedIds, stored]);

  /** كتابة المجموعة كاملة والتحقق — نقطة واحدة تمر بها كل عملية. */
  const commit = useCallback(
    (next: T[]): boolean => {
      if (!store.save(next)) {
        toast.error(tCommon("storageSaveFailed"));
        return false;
      }
      setStored(next);
      return true;
    },
    [store, tCommon],
  );

  const create = useCallback(
    (row: T): boolean => {
      if (!guard(`${resource}:create`)) return false;
      return commit([row, ...stored]);
    },
    [commit, guard, resource, stored],
  );

  const update = useCallback(
    (id: string, apply: (row: T) => T): boolean => {
      if (!guard(`${resource}:update`)) return false;
      const index = stored.findIndex((row) => row.id === id);
      if (index === -1) return false;
      const next = [...stored];
      next[index] = apply(stored[index]);
      return commit(next);
    },
    [commit, guard, resource, stored],
  );

  /**
   * استبدال المجموعة كاملة في **كتابة واحدة**.
   *
   * ضرورية لا رفاهية: `update` تُغلِق على `stored` وقت الرسم، فاستدعاؤها
   * في حلقة يجعل كل نداء يكتب فوق سابقه ويضيع كل التعديلات إلا الأخير.
   * هذا بالضبط ما جعل استلام فاتورة شراء يعلّم الفاتورة «مستلَمة» بينما
   * لا تزيد كميات المخزون فعليًا.
   *
   * تُستخدم للعمليات التي تمسّ عدة سجلات دفعة واحدة (استلام مخزون).
   */
  const replaceAll = useCallback(
    (next: T[], action: "create" | "update" = "update"): boolean => {
      if (!guard(`${resource}:${action}`)) return false;
      return commit(next);
    },
    [commit, guard, resource],
  );

  const remove = useCallback(
    (id: string): boolean => {
      if (!guard(`${resource}:delete`)) return false;
      const next = stored.filter((row) => row.id !== id);
      if (!commit(next)) return false;

      // الشاهدة تُكتب بعد نجاح حذف السجل نفسه. فشلها لا يُلغي الحذف —
      // السجل اختفى فعلًا — لكنه يعني عودة سجل البذرة عند التحديث،
      // فنقولها للمستخدم بدل تركه يكتشفها بنفسه.
      const nextDeleted = [...deletedIds, id];
      if (!tombstones.save(nextDeleted)) {
        toast.error(tCommon("storageSaveFailed"));
      }
      setDeletedIds(nextDeleted);
      return true;
    },
    [commit, deletedIds, guard, resource, stored, tCommon, tombstones],
  );

  return { rows, create, update, remove, replaceAll };
}
