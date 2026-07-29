import { defineRouting } from "next-intl/routing";

/**
 * إعداد التوجيه متعدد اللغات.
 * العربية هي الافتراضية، والإنجليزية مدعومة بالكامل منذ اليوم الأول.
 * المسارات (slugs) إنجليزية دائمًا — تتغيّر اللغة لا الرابط البنيوي.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/** اتجاه الكتابة لكل لغة — مصدر الحقيقة الوحيد لـ dir. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export function getDirection(locale: string): "rtl" | "ltr" {
  return localeDirection[locale as Locale] ?? "rtl";
}
