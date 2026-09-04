/**
 * حدود الامتثال لفاتورة (ZATCA) — هذا الملف يفصل بوضوح بين ما هو مُنفَّذ
 * فعليًا (حساب الضريبة، ترميز حمل QR للمرحلة الأولى) وما هو معلَّق
 * (Pending) لأنه يتطلب تكاملًا خارجيًا أو مدخلات لا تتوفر بيئة محلية لها:
 *
 *  - توليد XML بصيغة UBL 2.1 المطابقة لمواصفة فاتورة.
 *  - توليد PDF/A-3 مع XML مُضمَّن (المرحلة الثانية).
 *  - الختم/التوقيع الرقمي عبر جهاز التوقيع المعتمد (CSID) ولوغاريتم التجزئة المتسلسل.
 *  - الاتصال بمنصة فاتورة (Fatoora) للتحقق أو الإصدار المباشر (Clearance/Reporting).
 *
 * المنشأة لم تستلم إشعار الانضمام لمرحلة الربط (المرحلة الثانية) حتى تاريخه
 * — لذلك تبقى هذه البنود Pending عمدًا ولا تُستدعى من أي مسار في الواجهة.
 * لا يجوز لأي كود عرض "التكامل مكتمل" استنادًا لوجود هذا الملف.
 */

export type ZatcaComplianceItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  status: "implemented" | "pending";
  notes?: string;
};

export const zatcaComplianceChecklist: ZatcaComplianceItem[] = [
  {
    key: "vatCalculation",
    labelAr: "حساب ضريبة القيمة المضافة وفق الفئات (قياسية/صفرية/معفاة)",
    labelEn: "VAT calculation across categories (standard/zero-rated/exempt)",
    status: "implemented",
  },
  {
    key: "simplifiedQrPayload",
    labelAr: "ترميز حمل QR للحقول الخمسة الدنيا (فاتورة مبسّطة، المرحلة الأولى)",
    labelEn: "Simplified invoice QR payload — five minimum fields (Phase 1)",
    status: "implemented",
  },
  {
    key: "invoiceImmutability",
    labelAr: "قفل الفاتورة بعد الإصدار (رقم/تسلسل/UUID/تاريخ) ومنع الحذف المباشر",
    labelEn: "Invoice lock after issuance (number/sequence/UUID/date) and delete prevention",
    status: "implemented",
  },
  {
    key: "ublXmlGeneration",
    labelAr: "توليد XML بصيغة UBL 2.1",
    labelEn: "UBL 2.1 XML generation",
    status: "pending",
    notes: "يتطلب مخطط UBL كامل وتحقق مقابل مواصفة فاتورة — غير مُنفَّذ.",
  },
  {
    key: "pdfA3Embedding",
    labelAr: "PDF/A-3 مع XML مُضمَّن",
    labelEn: "PDF/A-3 with embedded XML",
    status: "pending",
    notes: "يتطلب مكتبة توليد PDF/A متوافقة — غير مثبّتة.",
  },
  {
    key: "cryptographicStamp",
    labelAr: "الختم/التوقيع الرقمي عبر جهاز الفوترة المعتمد (CSID)",
    labelEn: "Cryptographic stamp via approved compliance device (CSID)",
    status: "pending",
    notes: "يتطلب اعتماد جهاز فوترة إلكتروني وشهادة CSID من فاتورة.",
  },
  {
    key: "fatooraIntegration",
    labelAr: "التكامل المباشر مع منصة فاتورة (Clearance/Reporting)",
    labelEn: "Direct integration with the Fatoora platform (Clearance/Reporting)",
    status: "pending",
    notes: "بانتظار إشعار الانضمام لمرحلة الربط من هيئة الزكاة والضريبة والجمارك.",
  },
];

export function isZatcaPhase2Ready(): boolean {
  return zatcaComplianceChecklist
    .filter((item) => item.key !== "vatCalculation" && item.key !== "simplifiedQrPayload" && item.key !== "invoiceImmutability")
    .every((item) => item.status === "implemented");
}
