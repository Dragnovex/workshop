import type { LocalizedText } from "@/lib/domain/contracts";
import type { SupplierPaymentTerms } from "@/modules/suppliers/types";

export const purchaseOrderStatuses = [
  "draft",
  "ordered",
  "partiallyReceived",
  "received",
  "cancelled",
] as const;

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export type PurchaseOrderItem = {
  id: string;
  partId?: string;
  description: LocalizedText;
  sku: string;
  qty: number;
  unitCost: number;
  /** خصم البند قبل الضريبة. */
  discount?: number;
  /** فئة ضريبة القيمة المضافة وفق قاموس فاتورة ZATCA. */
  taxCategory?: "standard" | "zero" | "exempt" | "outOfScope";
  taxRate?: number;
  /** مطلوب عند الصفر أو الإعفاء أو خارج النطاق. */
  taxExemptionReason?: string;
  /** رمز وحدة القياس، PCE = قطعة. */
  unitCode?: string;
};

/** نسبة ضريبة القيمة المضافة القياسية على فواتير الشراء المحلية. */
export const PURCHASE_VAT_RATE = 0.15;

export type PurchaseOrder = {
  id: string;
  number: string;
  /**
   * اسم المورّد **كما كان وقت الشراء**. يبقى محفوظًا حتى بعد ربط
   * المورّد بسجله: حذف المورّد أو تغيير اسمه لاحقًا يجب ألا يعيد كتابة
   * تاريخ فاتورة صدرت فعلًا.
   */
  supplier: LocalizedText;
  /** المورّد في سجل الموردين — غير موجود في أوامر ما قبل وحدة الموردين. */
  supplierId?: string;
  status: PurchaseOrderStatus;
  orderedAt: string;
  expectedAt: string;
  items: PurchaseOrderItem[];
  notes?: LocalizedText;

  // ── بيانات فاتورة الشراء ────────────────────────────────────────────
  /** رقم الفاتورة الصادرة من المورّد — مرجع استرداد ضريبة المدخلات. */
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceTime?: string;
  supplyDate?: string;
  currency?: "SAR";
  paymentMethod?: "cash" | "card" | "bankTransfer" | "credit";
  /** لقطة بيانات المورّد وقت قيد الفاتورة لأغراض التدقيق. */
  supplierSnapshot?: {
    legalName: LocalizedText;
    vatNumber?: string;
    commercialRegistration?: string;
    nationalAddress?: import("@/lib/domain/contracts").Address;
  };
  paymentTerms?: SupplierPaymentTerms;
  /** مرجع داخلي: رقم سند القيد أو أمر التوريد. */
  reference?: string;
  /**
   * نسبة الضريبة الفعلية على هذه الفاتورة. مخزّنة لا محسوبة: مورّد غير
   * مسجّل ضريبيًا يصدر فاتورة بلا ضريبة، وتطبيق ١٥٪ عليها يخلق ضريبة
   * مدخلات غير موجودة.
   */
  vatRate?: number;
  /** وقت إدخال القطع للمخزون فعليًا — يُضبط مرة واحدة عند الاستلام. */
  receivedAt?: string;
};
