import { z } from "zod";

import {
  isValidCommercialRegistration,
  isValidSaudiPhone,
  isValidSaudiVatNumber,
} from "./saudi";

/**
 * مخططات التحقق لنماذج الأعمال — مصدر الحقيقة الوحيد لقواعد الإدخال.
 *
 * كل مخطّط دالة تستقبل الرسائل المترجمة، لأن النصوص تعيش في `messages/*.json`
 * (قاعدة AGENTS.md رقم 5) ولا تُكتب داخل الكود. نفس نمط `login-form.tsx`.
 *
 * هذه المخططات مستقلة عن React عمدًا: تعمل على العميل الآن، وستُعاد
 * لاستخدامها كما هي داخل Server Actions عند وصول الباك-إند.
 */

/** حقل نصي مطلوب بعد إزالة الفراغات. */
function requiredText(message: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, message));
}

/** حقل نصي اختياري — الفراغ يصبح undefined بدل سلسلة فارغة. */
const optionalText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? undefined : value));

/**
 * رقم من حقل نصي. `Number.parseFloat` وحده يقبل "12abc" ويعطي 12،
 * و`|| 0` يبتلع أي إدخال غير صالح بصمت — لذلك نستخدم Number() الصارم.
 */
function numericField(message: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value !== "" && Number.isFinite(Number(value)), message)
    .transform((value) => Number(value));
}

// ── عميل جديد ──────────────────────────────────────────────────────────────

export type CustomerFormMessages = {
  nameRequired: string;
  phoneInvalid: string;
  emailInvalid: string;
  vatRequired: string;
  vatInvalid: string;
  crInvalid: string;
};

export function newCustomerSchema(m: CustomerFormMessages) {
  return z
    .object({
      kind: z.enum(["individual", "company", "institution"]),
      nameAr: requiredText(m.nameRequired),
      nameEn: optionalText,
      phone: optionalText.refine(
        (value) => value === undefined || isValidSaudiPhone(value),
        m.phoneInvalid,
      ),
      email: optionalText.refine(
        (value) => value === undefined || z.email().safeParse(value).success,
        m.emailInvalid,
      ),
      legalName: optionalText,
      vatNumber: optionalText.refine(
        (value) => value === undefined || isValidSaudiVatNumber(value),
        m.vatInvalid,
      ),
      commercialRegistration: optionalText.refine(
        (value) => value === undefined || isValidCommercialRegistration(value),
        m.crInvalid,
      ),
      // العنوان الوطني اختياري بالكامل — لا حقل منه إلزامي.
      buildingNo: optionalText,
      street: optionalText,
      district: optionalText,
      city: optionalText,
      postalCode: optionalText,
    })
    // الرقم الضريبي إلزامي للشركات والمؤسسات وحدها، لا للأفراد.
    .refine(
      (data) => data.kind === "individual" || Boolean(data.vatNumber),
      { message: m.vatRequired, path: ["vatNumber"] },
    );
}

export type NewCustomerInput = z.infer<ReturnType<typeof newCustomerSchema>>;

// ── موعد جديد ──────────────────────────────────────────────────────────────

export type AppointmentFormMessages = {
  requiredCustomer: string;
  requiredVehicle: string;
  requiredService: string;
  requiredDate: string;
  invalidDate: string;
  invalidDuration: string;
};

export function newAppointmentSchema(m: AppointmentFormMessages) {
  return z.object({
    customerId: requiredText(m.requiredCustomer),
    vehicleId: requiredText(m.requiredVehicle),
    serviceAr: requiredText(m.requiredService),
    serviceEn: optionalText,
    scheduledAt: requiredText(m.requiredDate).refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      m.invalidDate,
    ),
    durationMinutes: numericField(m.invalidDuration).pipe(
      z.number().int(m.invalidDuration).min(1, m.invalidDuration),
    ),
  });
}

export type NewAppointmentInput = z.infer<ReturnType<typeof newAppointmentSchema>>;

// ── فاتورة جديدة ───────────────────────────────────────────────────────────

export type InvoiceFormMessages = {
  requiredCustomer: string;
  requiredLine: string;
  invalidQty: string;
  invalidPrice: string;
  invalidDiscount: string;
};

/** خصم اختياري: الفراغ = صفر، وليس خطأ. */
function discountField(message: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine(
      (value) => value === "" || Number.isFinite(Number(value)),
      message,
    )
    .transform((value) => (value === "" ? 0 : Number(value)))
    .pipe(z.number().nonnegative(message));
}

export function newInvoiceLineSchema(m: InvoiceFormMessages) {
  return z
    .object({
      descriptionAr: requiredText(m.requiredLine),
      qty: numericField(m.invalidQty).pipe(z.number().positive(m.invalidQty)),
      unitPrice: numericField(m.invalidPrice).pipe(
        z.number().nonnegative(m.invalidPrice),
      ),
      discount: discountField(m.invalidDiscount),
    })
    // الخصم لا يتجاوز قيمة البند — وإلا صار الوعاء الضريبي سالبًا.
    .refine((line) => line.discount <= line.qty * line.unitPrice, {
      message: m.invalidDiscount,
      path: ["discount"],
    });
}

export function newInvoiceSchema(m: InvoiceFormMessages) {
  return z.object({
    /**
     * العميل اختياري: البيع النقدي المباشر لا يتطلب عميلًا مسجّلًا.
     * الفاتورة المبسّطة (B2C) لا توجب بيانات المشتري نظاميًا.
     */
    customerId: optionalText,
    vehicleId: optionalText,
    paymentMethod: z.enum(["cash", "card", "bankTransfer", "credit"]),
    lines: z.array(newInvoiceLineSchema(m)).min(1, m.requiredLine),
  });
}

export type NewInvoiceInput = z.infer<ReturnType<typeof newInvoiceSchema>>;

// ── أمر تشغيل جديد ─────────────────────────────────────────────────────────

export type WorkOrderFormMessages = {
  requiredCustomer: string;
  requiredVehicle: string;
  requiredComplaint: string;
};

export function newWorkOrderSchema(m: WorkOrderFormMessages) {
  return z.object({
    customerId: requiredText(m.requiredCustomer),
    vehicleId: requiredText(m.requiredVehicle),
    complaint: requiredText(m.requiredComplaint),
    /** المطلوب (إصلاح أو قطعة) — اختياري: قد يُحدَّد بعد الفحص. */
    request: optionalText,
    priority: z.enum(["low", "normal", "high", "urgent"]),
  });
}

export type NewWorkOrderInput = z.infer<ReturnType<typeof newWorkOrderSchema>>;

/** أول رسالة خطأ في نتيجة فاشلة — القناة الوحيدة لعرض الخطأ للمستخدم. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "";
}
