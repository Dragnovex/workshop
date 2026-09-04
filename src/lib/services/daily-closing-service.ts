import type { DailyClosing, DailyClosingEntry } from "@/modules/daily-closing/types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumAmounts(entries: DailyClosingEntry[]): number {
  return round2(entries.reduce((sum, entry) => sum + entry.amount, 0));
}

export type DailyClosingTotals = {
  totalReceipts: number;
  totalExpenses: number;
  totalPurchases: number;
  totalSales: number;
  /** إجمالي التدفق الداخل (المبيعات + القبض). */
  inflow: number;
  /** إجمالي التدفق الخارج (المصروفات + المشتريات). */
  outflow: number;
  /** صافي حركة اليوم وحدها (بلا الرصيد المرحّل). */
  dailyNet: number;
  /** الرصيد الختامي = الصافي الأولي (الرصيد المرحّل) + صافي اليومية. */
  closingBalance: number;
};

export function getDailyClosingTotals(closing: DailyClosing): DailyClosingTotals {
  const totalReceipts = sumAmounts(closing.receipts);
  const totalExpenses = sumAmounts(closing.expenses);
  const totalPurchases = sumAmounts(closing.purchases);
  const totalSales = sumAmounts(closing.sales);
  const inflow = round2(totalReceipts + totalSales);
  const outflow = round2(totalExpenses + totalPurchases);
  const dailyNet = round2(inflow - outflow);
  const closingBalance = round2(closing.openingBalance + dailyNet);

  return { totalReceipts, totalExpenses, totalPurchases, totalSales, inflow, outflow, dailyNet, closingBalance };
}

/**
 * صيغة التقرير — مطابقة حرفيًا لنموذج اليومية الورقي المعتمد في الورشة.
 *
 * تسلسل الاحتساب كما هو في الورقة، بخطوتي طرح لا خطوة واحدة:
 *
 *   رصيد ما قبله (مرحّل) + أوامر التشغيل اليومية + مجموع القبض = الإجمالي الكلي
 *   الإجمالي الكلي − مجموع المشتريات                          = الصافي الأولي
 *   الصافي الأولي     − مجموع المصروفات                        = صافي اليومية
 *
 * تحقّق على يومية ٢٤‏/٠٥‏/٢٠٢٦ الفعلية:
 *   13578 + 7987 + 0 = 21565 → −970 = 20595 → −6353 = 14242 ✓
 *
 * ⚠️ **الصافي الأولي قيمة محسوبة لا مُدخَلة.** كانت الشاشة تسمّي الرصيد
 * المرحّل «الصافي الأولي»، وهما حقلان مختلفان تمامًا في الورقة: الأول
 * مُدخَل في الأعلى، والثاني ناتج بعد خصم المشتريات.
 *
 * كل قيمة هنا محسوبة تلقائيًا — لا مجال لإدخال يدوي خاطئ للإجماليات.
 */
export type DailyClosingReportTotals = {
  /** رصيد ما قبله (مرحّل) — الحقل الوحيد المُدخَل يدويًا في هذه السلسلة. */
  openingBalance: number;
  /** أوامر التشغيل اليومية — فواتير اليوم الصادرة. */
  totalDailySales: number;
  /** مجموع القبض — سندات القبض المستقلة عن الفواتير. */
  totalReceipts: number;
  /** الإجمالي الكلي = المرحّل + أوامر التشغيل + القبض. */
  grandTotal: number;
  /** مجموع المشتريات — يُطرح أولًا. */
  totalPurchases: number;
  /** الصافي الأولي = الإجمالي الكلي − المشتريات. **محسوب لا مُدخَل.** */
  preliminaryNet: number;
  /** مجموع المصروفات — يُطرح ثانيًا. */
  totalExpenses: number;
  /** صافي اليومية = الصافي الأولي − المصروفات. */
  netDaily: number;
};

export function getDailyClosingReportTotals(closing: DailyClosing): DailyClosingReportTotals {
  const totals = getDailyClosingTotals(closing);

  const grandTotal = round2(
    closing.openingBalance + totals.totalSales + totals.totalReceipts,
  );
  const preliminaryNet = round2(grandTotal - totals.totalPurchases);
  const netDaily = round2(preliminaryNet - totals.totalExpenses);

  return {
    openingBalance: closing.openingBalance,
    totalDailySales: totals.totalSales,
    totalReceipts: totals.totalReceipts,
    grandTotal,
    totalPurchases: totals.totalPurchases,
    preliminaryNet,
    totalExpenses: totals.totalExpenses,
    netDaily,
  };
}

export function isDailyClosingLocked(closing: DailyClosing): boolean {
  return closing.status === "closed";
}

/** كل بند مصدره فاتورة/أمر شراء حقيقي — لا إدخال يدوي بلا تعليم صريح. */
export function hasUnflaggedManualEntries(closing: DailyClosing): boolean {
  const allEntries = [...closing.receipts, ...closing.expenses, ...closing.purchases, ...closing.sales];
  return allEntries.some((entry) => entry.source === "manual" && !entry.isManualAdjustment);
}
