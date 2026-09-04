import type { AuditLogEntry } from "@/lib/domain/audit";
import type { Address, CustomerId, LocalizedText, VehicleId } from "@/lib/domain/contracts";
import type { PaymentMethod } from "@/lib/domain/payment";

export { paymentMethods } from "@/lib/domain/payment";
export type { PaymentMethod } from "@/lib/domain/payment";
export type { AuditLogEntry } from "@/lib/domain/audit";

/** فاتورة ضريبية (B2B، تُرسَل للمنشآت المسجّلة) أو فاتورة مبسّطة (B2C). */
export const invoiceKinds = ["standard", "simplified"] as const;
export type InvoiceKind = (typeof invoiceKinds)[number];

export const invoiceDocumentTypes = ["invoice", "creditNote", "debitNote"] as const;
export type InvoiceDocumentType = (typeof invoiceDocumentTypes)[number];

/**
 * draft = مسودة قابلة للتعديل، لم تُصدر بعد.
 * issued وما بعدها = مُصدرة ومقفلة نهائيًا — أي تصحيح يكون بإشعار دائن/مدين منفصل.
 */
export const invoiceStatuses = [
  "draft",
  "issued",
  "partiallyPaid",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const taxCategories = ["standard", "zeroRated", "exempt"] as const;
export type TaxCategory = (typeof taxCategories)[number];

export const STANDARD_VAT_RATE = 0.15;

export type InvoiceLineItem = {
  id: string;
  description: LocalizedText;
  qty: number;
  unitPrice: number;
  /** مبلغ الخصم (وليس نسبة). */
  discount: number;
  taxCategory: TaxCategory;
  /** نسبة الضريبة الفعلية على البند: 0.15 للفئة القياسية، 0 لغير ذلك. */
  taxRate: number;
  /** إلزامي عند zeroRated أو exempt — سبب الإعفاء أو التصنيف صفري النسبة. */
  exemptionReason?: LocalizedText;
};

/** لقطة بيانات طرف الفاتورة وقت الإصدار — لا تتغيّر لاحقًا حتى لو تغيّرت بيانات العميل. */
export type PartySnapshot = {
  legalName: LocalizedText;
  vatNumber?: string;
  commercialRegistration?: string;
  address?: Address;
  phone?: string;
  email?: string;
};

export type Invoice = {
  id: string;
  documentType: InvoiceDocumentType;
  kind: InvoiceKind;
  /** رقم تسلسلي بشري للعرض والطباعة — يُخصَّص عند الإصدار ولا يتغيّر بعدها. */
  number: string;
  /** تسلسل رقمي صارم متصاعد لكل نوع مستند — غير قابل للتعديل بعد الإصدار (متطلب فاتورة). */
  sequenceNumber: number;
  /** معرّف فريد عالمي — متطلب فاتورة لكل مستند. */
  uuid: string;
  status: InvoiceStatus;
  /** يُضبط فقط عند الانتقال من draft إلى issued، ويصبح غير قابل للتغيير بعدها. */
  issuedAt?: string;
  /** تاريخ توريد السلعة/الخدمة — قد يسبق تاريخ الإصدار. */
  supplyDate: string;
  dueAt?: string;
  customerId: CustomerId;
  vehicleId?: VehicleId;
  linkedWorkOrderId?: string;
  linkedEstimateId?: string;
  sellerSnapshot: PartySnapshot;
  buyerSnapshot: PartySnapshot;
  items: InvoiceLineItem[];
  paymentMethod: PaymentMethod;
  paidAmount: number;
  notes?: LocalizedText;
  /** للإشعارات الدائنة/المدينة فقط — الفاتورة الأصلية المرتبطة. */
  relatedInvoiceId?: string;
  /** إلزامي للإشعارات الدائنة/المدينة. */
  reasonForNote?: LocalizedText;
  auditLog: AuditLogEntry[];
};
