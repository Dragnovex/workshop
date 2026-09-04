"use client";

import { createClientStore, createTombstoneStore } from "@/lib/client-store";

import type { Estimate } from "./types";

/** عروض الأسعار (التسعير) — لم يكن للوحدة أي إنشاء أو تعديل قبل هذه المرحلة. */
export const estimateStore = createClientStore<Estimate>(
  "3mr-workshop-estimates-v1",
);

export const estimateTombstones = createTombstoneStore(
  "3mr-workshop-estimates-deleted-v1",
);

/**
 * مرجع فريد لعرض السعر بصيغة QT-MMYY-N — يتصاعد عن أعلى رقم في نفس الشهر.
 *
 * المرجع مطلوب على المستند المطبوع: العميل يعود بعد أسبوع ومعه ورقة،
 * وبلا رقم يميّزها لا سبيل لربطها بما في النظام.
 */
export function nextQuoteNumber(estimates: Estimate[]): string {
  const now = new Date();
  const prefix = `QT-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(2)}-`;
  let max = 0;
  for (const estimate of estimates) {
    if (!estimate.number.startsWith(prefix)) continue;
    const sequence = Number.parseInt(estimate.number.slice(prefix.length), 10);
    if (!Number.isNaN(sequence) && sequence > max) max = sequence;
  }
  return `${prefix}${max + 1}`;
}
