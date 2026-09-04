import { loadCollection, mutateCollection } from "./local/seed-store";

/**
 * عقد وصول عام لأي مجموعة سجلات لها معرّف.
 *
 * أغلب الوحدات لا تحتاج أكثر من `findAll` و`findById`. الوحدات التي تحتاج
 * استعلامات إضافية (العملاء، الفواتير، تقفيل اليومية) لها عقود موسَّعة
 * في ملفات مستقلة تَرِث هذا العقد.
 *
 * الهدف: عند وصول Supabase يتغيّر **المحوِّل** فقط (`local/index.ts` ←
 * `supabase/index.ts`) دون لمس أي صفحة أو مكوّن.
 */
export interface CollectionRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
}

/**
 * عقد الكتابة.
 *
 * منفصل عن القراءة عمدًا: أغلب الشاشات تقرأ فقط، وتمرير مستودع يكتب إلى
 * كل واحدة منها يوسّع سطح الخطأ بلا مقابل. الوحدات التي تكتب تطلب هذا
 * العقد صراحةً.
 *
 * كل دالة ترجع السجل بعد الكتابة لا `void`: قاعدة البيانات قد تضيف أو
 * تُطبّع قيمًا (طوابع زمنية، تسلسل)، والمستدعي يحتاج النسخة الحقيقية لا
 * ما أرسله.
 */
export interface WritableCollectionRepository<T> extends CollectionRepository<T> {
  create(row: T): Promise<T>;
  /**
   * تحديث جزئي. يرمي إذا لم يوجد السجل — «حدّثتُ لا شيء بنجاح» أسوأ من
   * خطأ صريح في نظام محاسبي.
   */
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

/**
 * محوّل محلي فوق مصفوفة بذرة في الذاكرة.
 *
 * `async` عمدًا رغم أن القراءة متزامنة: هذه هي نفس الواجهة التي سيحقّقها
 * محوّل Supabase، فلا تتغيّر مواضع `await` في الصفحات عند التبديل.
 */
export function createLocalCollection<T extends { id: string }>(
  rows: readonly T[],
): CollectionRepository<T> {
  return {
    async findAll() {
      return [...rows];
    },
    async findById(id: string) {
      return rows.find((row) => row.id === id) ?? null;
    },
  };
}

/**
 * محوّل محلي **يكتب** — يقرأ ويكتب في `.data/<name>.json`.
 *
 * `name` هو اسم الملف وهو أيضًا اسم الجدول المقابل في Supabase، فيبقى
 * التطابق واضحًا بين المحوّلين.
 */
export function createWritableLocalCollection<T extends { id: string }>(
  name: string,
  seed: readonly T[],
): WritableCollectionRepository<T> {
  return {
    async findAll() {
      return loadCollection(name, seed);
    },

    async findById(id: string) {
      return loadCollection(name, seed).find((row) => row.id === id) ?? null;
    },

    async create(row: T) {
      return mutateCollection<T, T>(name, seed, (rows) => {
        // معرّف مكرّر = فساد بيانات صامت لاحقًا (تحديث يصيب سجلين).
        if (rows.some((existing) => existing.id === row.id)) {
          throw new Error(`سجل بالمعرّف ${row.id} موجود سلفًا في ${name}`);
        }
        return { rows: [row, ...rows], result: row };
      });
    },

    async update(id: string, patch: Partial<T>) {
      return mutateCollection<T, T>(name, seed, (rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index === -1) {
          throw new Error(`لا يوجد سجل بالمعرّف ${id} في ${name}`);
        }
        // المعرّف لا يُعدَّل عبر patch مهما أُرسل: تغييره يعني سجلًا جديدًا
        // لا تحديثًا، ويكسر كل ما يشير إليه.
        const updated = { ...rows[index], ...patch, id: rows[index].id };
        const next = [...rows];
        next[index] = updated;
        return { rows: next, result: updated };
      });
    },

    async remove(id: string) {
      return mutateCollection<T, void>(name, seed, (rows) => {
        if (!rows.some((row) => row.id === id)) {
          throw new Error(`لا يوجد سجل بالمعرّف ${id} في ${name}`);
        }
        return { rows: rows.filter((row) => row.id !== id), result: undefined };
      });
    },
  };
}
