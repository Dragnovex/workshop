import type { Address, LocalizedText } from "@/lib/domain/contracts";

/**
 * شروط السداد مع المورّد. مستقلة عن `PaymentMethod` الخاص بفواتير البيع:
 * هذه شروط علاقة تجارية دائمة (آجل/نقدي/تحويل)، وتلك طريقة سداد فاتورة
 * واحدة. خلطهما كان سيجعل تغيير إحداهما يغيّر الأخرى بلا سبب.
 */
export const supplierPaymentTerms = ["cash", "credit", "bankTransfer"] as const;
export type SupplierPaymentTerms = (typeof supplierPaymentTerms)[number];

export type Supplier = {
  id: string;
  name: LocalizedText;
  /** رقم ضريبي سعودي 15 رقمًا — إلزامي لاسترداد ضريبة المدخلات من فواتيره. */
  vatNumber?: string;
  commercialRegistration?: string;
  /** العنوان الوطني — بصيغة منظّمة لا نص حر. */
  nationalAddress?: Address;
  phone?: string;
  email?: string;
  paymentTerms: SupplierPaymentTerms;
  /** مرجع داخلي: رقم الحساب لدى المورّد أو رقم العقد. */
  reference?: string;
  notes?: LocalizedText;
};
