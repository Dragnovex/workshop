import { z } from "zod";

import { supplierPaymentTerms } from "@/modules/suppliers/types";

import { isValidSaudiVatNumber } from "./saudi";

/**
 * مخطّط المورّد — يعمل على الخادم والعميل معًا.
 *
 * يعيش في `lib/validation` لا في `server/`: الواجهة تتحقق قبل الإرسال
 * (راحة استخدام) و**الخادم يتحقق مرة أخرى بنفس المخطّط** (فرض). نسختان
 * مختلفتان من القاعدة كانتا ستنحرفان، فيقبل الخادم ما ترفضه الشاشة.
 *
 * الرسائل تُمرَّر مترجمة من المستدعي (قاعدة AGENTS رقم ٥). على الخادم
 * تُمرَّر رموز ثابتة لأن الخطأ هناك لا يُعرض للمستخدم مباشرةً.
 */
export type SupplierMessages = {
  nameRequired: string;
  vatInvalid: string;
};

const optionalText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? undefined : value));

export function supplierSchema(m: SupplierMessages) {
  return z.object({
    nameAr: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, m.nameRequired)),
    nameEn: optionalText,
    // الرقم الضريبي اختياري (مورّد صغير غير مسجّل)، لكنه إن وُجد فلا بد
    // أن يكون صالحًا: رقم مشوّه يعني ضريبة مدخلات غير قابلة للاسترداد.
    vatNumber: optionalText.refine(
      (value) => value === undefined || isValidSaudiVatNumber(value),
      m.vatInvalid,
    ),
    commercialRegistration: optionalText,
    phone: optionalText,
    email: optionalText,
    paymentTerms: z.enum(supplierPaymentTerms),
    reference: optionalText,
    buildingNo: optionalText,
    street: optionalText,
    district: optionalText,
    city: optionalText,
    postalCode: optionalText,
    notes: optionalText,
  });
}

export type SupplierInput = z.infer<ReturnType<typeof supplierSchema>>;

/** رسائل الخادم: رموز لا نصوص معروضة — الواجهة تترجم رمز النتيجة. */
export const serverSupplierMessages: SupplierMessages = {
  nameRequired: "NAME_REQUIRED",
  vatInvalid: "VAT_INVALID",
};
