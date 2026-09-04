"use client";

import { createTombstoneStore, type ClientStore } from "@/lib/client-store";

import type { Invoice } from "./types";

/**
 * تخزين محلي بسيط جدًا للفواتير — بلا باك-إند (نمط م2 لأوامر التشغيل).
 */
const STORAGE_KEY = "3mr-workshop-invoices-v1";

export function loadStoredInvoices(seed: Invoice[]): Invoice[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as Invoice[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    const storedIds = new Set(stored.map((invoice) => invoice.id));
    const freshSeed = seed.filter((invoice) => !storedIds.has(invoice.id));
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل (مساحة ممتلئة،
 * متصفح خاص يحجب التخزين، ...). المستدعي **يجب** أن يتحقق من القيمة —
 * تجاهلها يعني إخبار المستخدم أن فاتورته حُفظت بينما اختفت فعليًا.
 */
export function saveStoredInvoices(invoices: Invoice[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    return true;
  } catch (error) {
    console.error("saveStoredInvoices failed", error);
    return false;
  }
}

/** نفس التخزين أعلاه بعقد `ClientStore` — يستهلكه `useLocalCollection`. */
export const invoiceStore: ClientStore<Invoice> = {
  load: loadStoredInvoices,
  save: saveStoredInvoices,
};

/**
 * مسودات محذوفة. الفاتورة المُصدَرة لا تُحذف إطلاقًا (تُلغى أو يصدر لها
 * إشعار دائن) — الحذف هنا مقصور على المسودات، ويُفرض في الواجهة قبل
 * استدعاء الحذف.
 */
export const invoiceTombstones = createTombstoneStore(
  "3mr-workshop-invoices-deleted-v1",
);
