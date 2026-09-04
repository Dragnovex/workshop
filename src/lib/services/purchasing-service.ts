import type { Part } from "@/modules/inventory/types";
import {
  PURCHASE_VAT_RATE,
  type PurchaseOrder,
} from "@/modules/purchasing/types";

/**
 * حسابات فاتورة الشراء وأثرها على المخزون.
 *
 * تعيش في `lib/services` لا في `server/`: الواجهة تحتاجها لعرض الإجماليات
 * قبل الحفظ، واستيراد أي شيء من `server/` في مكوّن عميل يُفشل البناء.
 */

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type PurchaseTotals = {
  subtotal: number;
  vat: number;
  total: number;
};

export function getPurchaseTotals(order: PurchaseOrder): PurchaseTotals {
  let subtotal = 0;
  let vat = 0;

  for (const item of order.items) {
    const lineNet = round2(Math.max(0, item.qty * item.unitCost - (item.discount ?? 0)));
    subtotal += lineNet;
    const rate = item.taxCategory
      ? (item.taxCategory === "standard" ? (item.taxRate ?? PURCHASE_VAT_RATE) : 0)
      : (order.vatRate ?? PURCHASE_VAT_RATE);
    vat += round2(lineNet * rate);
  }

  subtotal = round2(subtotal);
  vat = round2(vat);
  return { subtotal, vat, total: round2(subtotal + vat) };
}

/**
 * إدخال بنود فاتورة شراء إلى المخزون.
 *
 * المطابقة بـ `partId` أولًا ثم بـ `sku` (حساسية الحالة مُلغاة): المورّد
 * قد يكتب الرمز بحروف كبيرة أحيانًا وصغيرة أخرى، ومطابقة حرفية كانت
 * ستُنشئ صنفًا مكرّرًا لكل اختلاف في الكتابة.
 *
 * البند بلا مقابل في المخزون **يُنشئ صنفًا جديدًا** بدل أن يُهمَل: قطعة
 * دخلت المستودع فعلًا ولا تظهر في المخزون أسوأ من صنف زائد.
 *
 * دالة صافية: تعيد قائمة القطع الجديدة ولا تكتب شيئًا — الكتابة والتحقق
 * منها مسؤولية المستدعي.
 */
export function applyReceiptToParts(
  order: PurchaseOrder,
  parts: Part[],
  makeId: (prefix: string) => string,
): { parts: Part[]; created: number; updated: number } {
  const byId = new Map(parts.map((part) => [part.id, part]));
  const bySku = new Map(parts.map((part) => [part.sku.toLowerCase(), part]));

  const next = [...parts];
  let created = 0;
  let updated = 0;

  for (const item of order.items) {
    if (item.qty <= 0) continue;

    const existing =
      (item.partId ? byId.get(item.partId) : undefined) ??
      bySku.get(item.sku.trim().toLowerCase());

    if (existing) {
      const index = next.findIndex((part) => part.id === existing.id);
      const merged: Part = {
        ...existing,
        qtyOnHand: existing.qtyOnHand + item.qty,
        // سعر البيع لا يُلمس هنا: التكلفة شيء والسعر قرار تسعير منفصل.
      };
      next[index] = merged;

      // الخريطتان تُحدَّثان بالنسخة الجديدة، وإلا قرأ البند التالي الذي
      // يحمل نفس الرمز الكميةَ **القديمة** فكتب فوق الزيادة الأولى بدل
      // أن يتراكم عليها — فاتورة فيها سطران لنفس القطعة كانت تُدخل
      // كمية سطر واحد فقط.
      byId.set(merged.id, merged);
      bySku.set(merged.sku.toLowerCase(), merged);
      updated += 1;
      continue;
    }

    const part: Part = {
      id: makeId("part"),
      sku: item.sku.trim(),
      name: item.description,
      // التصنيف غير معروف من فاتورة المورّد — يُصحَّح من شاشة المخزون.
      category: "engine",
      qtyOnHand: item.qty,
      reorderLevel: 0,
      unitPrice: item.unitCost,
      location: "",
    };
    next.push(part);
    byId.set(part.id, part);
    bySku.set(part.sku.toLowerCase(), part);
    created += 1;
  }

  return { parts: next, created, updated };
}
