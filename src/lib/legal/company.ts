import type { LocalizedText } from "@/lib/domain/contracts";

/**
 * بيانات الكيان القانوني للمنشأة — مصدر الحقيقة الوحيد لبيانات البائع
 * في الفواتير والطباعة الرسمية. مستخرجة حرفيًا من:
 * - إثبات العنوان الوطني (رقم الإثبات 1073316003، صادر 13/10/2025)
 * - شهادة تسجيل ضريبة القيمة المضافة (تاريخ الإصدار 17/11/2021)
 * لا تُعدَّل هذه القيم إلا بمستند رسمي جديد.
 */

export type NationalAddress = {
  buildingNo: string;
  street: LocalizedText;
  secondaryNo: string;
  district: LocalizedText;
  city: LocalizedText;
  postalCode: string;
  country: LocalizedText;
  shortAddress: string;
};

export type CompanyProfile = {
  /** الاسم القانوني كما في شهادة الضريبة والعنوان الوطني — مطابق حرفيًا. */
  legalName: LocalizedText;
  /** الاسم التجاري المستخدم في الواجهة والطباعة — يختلف عن الاسم القانوني عمدًا. */
  tradeName: LocalizedText;
  vatNumber: string;
  commercialRegistration: string;
  vatEffectiveDate: string;
  vatRegistrationDate: string;
  vatCertificateNumber: string;
  nationalAddressProofNumber: string;
  nationalAddress: NationalAddress;
};

export const companyProfile: CompanyProfile = {
  legalName: {
    ar: "شركة سليمان احمد خميس النعماني للتجارة",
    en: "Sulaiman Ahmed Khamis Al-Numani Trading Co.",
  },
  tradeName: {
    ar: "شركة سليمان احمد خميس النعماني لصيانة السيارات",
    en: "Sulaiman Ahmed Khamis Al-Numani Auto Maintenance",
  },
  vatNumber: "311086716200003",
  commercialRegistration: "1010178378",
  vatEffectiveDate: "2021-12-01",
  vatRegistrationDate: "2021-11-17",
  vatCertificateNumber: "3110867162",
  nationalAddressProofNumber: "1073316003",
  nationalAddress: {
    buildingNo: "2571",
    street: { ar: "العنوز", en: "Al Onooz" },
    secondaryNo: "7933",
    district: { ar: "حي الخالدية", en: "Al Khalidiyah Dist." },
    city: { ar: "الرياض", en: "Riyadh" },
    postalCode: "12873",
    country: { ar: "المملكة العربية السعودية", en: "Kingdom of Saudi Arabia" },
    shortAddress: "REKA2571",
  },
};

export function formatNationalAddress(locale: string): string {
  const lang = locale === "en" ? "en" : "ar";
  const { nationalAddress: a } = companyProfile;
  if (lang === "en") {
    return `${a.street.en}, Bldg ${a.buildingNo}, ${a.district.en}, ${a.city.en} ${a.postalCode}, ${a.country.en}`;
  }
  return `${a.district.ar}، ${a.street.ar} ${a.buildingNo}، الرقم الإضافي ${a.secondaryNo}، ${a.city.ar} ${a.postalCode}، ${a.country.ar}`;
}
