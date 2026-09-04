"use client";

import { createTombstoneStore, type ClientStore } from "@/lib/client-store";
import type { Customer } from "@/lib/domain/contracts";

/**
 * تخزين محلي بسيط جدًا للعملاء — بلا باك-إند (نمط م2 لأوامر التشغيل).
 * أول زيارة: يعرض بيانات البذرة. أي عميل جديد يُحفظ في localStorage
 * ويبقى بعد إغلاق المتصفح. عند إضافة عملاء للبذرة لاحقًا تظهر أيضًا.
 */
const STORAGE_KEY = "3mr-workshop-customers-v1";

export function loadStoredCustomers(seed: Customer[]): Customer[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as Customer[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    const storedIds = new Set(stored.map((customer) => customer.id));
    const freshSeed = seed.filter((customer) => !storedIds.has(customer.id));
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل. المستدعي يجب أن
 * يتحقق من القيمة قبل إخبار المستخدم أن العميل حُفظ.
 */
export function saveStoredCustomers(customers: Customer[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return true;
  } catch (error) {
    console.error("saveStoredCustomers failed", error);
    return false;
  }
}

/**
 * نفس التخزين أعلاه بشكل عقد `ClientStore` ليستهلكه `useLocalCollection`
 * (التعديل والحذف). مفتاح تخزين واحد لا اثنان — لا نسخة ثانية من نفس
 * البيانات تنحرف عن الأولى.
 */
export const customerStore: ClientStore<Customer> = {
  load: loadStoredCustomers,
  save: saveStoredCustomers,
};

/** معرّفات عملاء البذرة المحذوفين — بدونها يعودون عند كل تحميل. */
export const customerTombstones = createTombstoneStore(
  "3mr-workshop-customers-deleted-v1",
);
