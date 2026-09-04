import type { Resource } from "@/lib/auth/types";

/**
 * مصادر منشئ التقارير.
 *
 * كل مصدر مربوط بـ **مورد صلاحية** حقيقي: من لا يملك قراءة المشتريات
 * لا يرى مصدر المشتريات في القائمة أصلًا، ولا يستطيع توليده لو حاول.
 * التقرير قناة تسريب سهلة — «تقرير» على بيانات ممنوعة يتجاوز كل شاشة
 * محمية في النظام.
 */
export const reportSources = [
  "workOrders",
  "purchases",
  "returns",
  "quotes",
  "dailyClosing",
] as const;

export type ReportSource = (typeof reportSources)[number];

/** المورد الذي تُفحص صلاحية قراءته قبل توليد كل مصدر. */
export const reportSourceResource: Record<ReportSource, Resource> = {
  workOrders: "workOrders",
  purchases: "purchasing",
  returns: "returns",
  quotes: "estimates",
  dailyClosing: "accounting",
};

export type ReportColumn = {
  key: string;
  label: string;
  /** الأرقام تُحاذى للنهاية وتحمل data-numeric. */
  numeric?: boolean;
};

export type ReportResult = {
  columns: ReportColumn[];
  rows: (string | number)[][];
  /** إجماليات الأعمدة الرقمية — تظهر أسفل الجدول وفي التصدير. */
  totals: Record<string, number>;
};
