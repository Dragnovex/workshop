"use client";

/**
 * مصنع تخزين محلي لأي مجموعة سجلات لها `id`.
 *
 * نفس عقد `modules/<domain>/client-store.ts` الموجود حرفيًا (دمج بذرة +
 * محفوظات، و`save` تعيد boolean حقيقيًا) لكن بلا تكراره في كل وحدة جديدة.
 * الوحدات القديمة تبقى على ملفاتها كما هي — لا قيمة في إعادة كتابة شيء
 * يعمل ومُتحقَّق منه حيًا.
 *
 * ⚠️ حدود معروفة: `localStorage` جهاز واحد ومتصفح واحد. هذه طبقة المرحلة
 * الحالية حتى يصل الباك-إند، لا حل نهائي.
 */
export type ClientStore<T extends { id: string }> = {
  /** بذرة الخادم مدموجة مع المحفوظ محليًا — المحفوظ يفوز عند تطابق المعرّف. */
  load: (seed: T[]) => T[];
  /** تعيد `true` عند نجاح الكتابة فعليًا. المستدعي يتحقق قبل ادّعاء النجاح. */
  save: (rows: T[]) => boolean;
};

export function createClientStore<T extends { id: string }>(
  storageKey: string,
): ClientStore<T> {
  return {
    load(seed) {
      if (typeof window === "undefined") return seed;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return seed;
        const stored = JSON.parse(raw) as T[];
        if (!Array.isArray(stored)) return seed;
        // مصفوفة فارغة محفوظة ليست «لا بيانات»: قد يكون المستخدم حذف كل
        // السجلات عمدًا، وإعادة البذرة حينها تُحيي ما حذفه.
        const storedIds = new Set(stored.map((row) => row.id));
        const freshSeed = seed.filter((row) => !storedIds.has(row.id));
        return [...freshSeed, ...stored];
      } catch {
        return seed;
      }
    },
    save(rows) {
      if (typeof window === "undefined") return false;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(rows));
        return true;
      } catch (error) {
        console.error(`save failed for ${storageKey}`, error);
        return false;
      }
    },
  };
}

/**
 * حذف سجل من البذرة يحتاج علامة: البذرة تُعاد من الخادم في كل تحميل،
 * فالسجل المحذوف يعود ما لم نُسجّل حذفه. هذه قائمة المعرّفات المحذوفة.
 */
export type TombstoneStore = {
  load: () => string[];
  save: (ids: string[]) => boolean;
};

export function createTombstoneStore(storageKey: string): TombstoneStore {
  return {
    load() {
      if (typeof window === "undefined") return [];
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return [];
        const stored = JSON.parse(raw) as string[];
        return Array.isArray(stored) ? stored : [];
      } catch {
        return [];
      }
    },
    save(ids) {
      if (typeof window === "undefined") return false;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(ids));
        return true;
      } catch (error) {
        console.error(`tombstone save failed for ${storageKey}`, error);
        return false;
      }
    },
  };
}

/** معرّف فريد محليًا — نفس الصيغة المستخدمة في وحدات م2. */
export function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
