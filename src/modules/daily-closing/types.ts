import type { LocalizedText } from "@/lib/domain/contracts";
import type { PaymentMethod } from "@/lib/domain/payment";

export { paymentMethods } from "@/lib/domain/payment";
export type { PaymentMethod } from "@/lib/domain/payment";

export const dailyClosingStatuses = ["draft", "closed"] as const;
export type DailyClosingStatus = (typeof dailyClosingStatuses)[number];

/** مصدر القيد — لتفادي الإدخال المكرر: مربوط بفاتورة/أمر شراء، أو تسوية يدوية صريحة. */
export const entrySources = ["invoice", "purchaseOrder", "manual"] as const;
export type EntrySource = (typeof entrySources)[number];

export type DailyClosingEntry = {
  id: string;
  /** رقم المرجع — رقم الفاتورة/أمر الشراء عند الربط، أو رقم سند يدوي. */
  referenceNumber: string;
  description: LocalizedText;
  amount: number;
  paymentMethod: PaymentMethod;
  responsible: LocalizedText;
  source: EntrySource;
  linkedInvoiceId?: string;
  linkedPurchaseOrderId?: string;
  /** تسوية يدوية خارج تدفق الفواتير/المشتريات الآلي — يجب أن تكون واضحة في الواجهة. */
  isManualAdjustment: boolean;
  time: string;
};

export type DailyClosingAuditEntry = {
  id: string;
  timestamp: string;
  actor: LocalizedText;
  action: LocalizedText;
  note?: LocalizedText;
  isManualAdjustment?: boolean;
};

export type DailyClosing = {
  id: string;
  /** رقم القيد — يظهر في شاشة الإدخال والطباعة. */
  entryNumber: string;
  date: string;
  branch: LocalizedText;
  /** الصندوق / الحساب الذي أُقفلت عليه اليومية. */
  cashAccount: LocalizedText;
  /** الرصيد المرحّل من إقفال اليوم السابق — نقطة البداية (الصافي الأولي). */
  openingBalance: number;
  receipts: DailyClosingEntry[];
  expenses: DailyClosingEntry[];
  purchases: DailyClosingEntry[];
  sales: DailyClosingEntry[];
  /** ملاحظات حرة يُدخلها المسؤول عند الإقفال. */
  notes?: string;
  status: DailyClosingStatus;
  closedBy?: LocalizedText;
  closedAt?: string;
  reviewedByAccountant?: LocalizedText;
  reviewedAt?: string;
  auditLog: DailyClosingAuditEntry[];
};
