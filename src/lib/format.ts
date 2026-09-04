/**
 * تنسيق الأرقام والتواريخ.
 *
 * قرار مقصود: نستخدم الأرقام اللاتينية (0-9) حتى في الواجهة العربية
 * عبر `ar-SA-u-nu-latn`. هذا هو العرف في البرمجيات المحاسبية السعودية،
 * ويمنع التباس المبالغ عند النسخ والتصدير والطباعة.
 */

const WORKSHOP_TIME_ZONE = "Asia/Riyadh";

export function numberLocale(locale: string): string {
  return locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale)).format(value);
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** بدقة هللتين — للمستندات المحاسبية (فواتير، تقفيل يومية) حيث التقريب يهم. */
export function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** «قبل ١٢ دقيقة» / «12 min ago» — يتحوّل للساعات تلقائيًا. */
export function formatRelativeMinutes(minutes: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(numberLocale(locale), {
    numeric: "auto",
    style: "short",
  });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(numberLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: WORKSHOP_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(numberLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WORKSHOP_TIME_ZONE,
  }).format(new Date(iso));
}

/** اسم اليوم المختصر لإزاحة بالأيام عن اليوم الحالي. */
export function shortWeekday(dayOffset: number, locale: string): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return new Intl.DateTimeFormat(numberLocale(locale), {
    weekday: "short",
  }).format(date);
}

/** اسم اليوم الكامل لتاريخ محدد (بصيغة YYYY-MM-DD) — لحقل «اليوم» في تقفيل اليومية. */
export function formatWeekdayName(dateOnly: string, locale: string): string {
  return new Intl.DateTimeFormat(numberLocale(locale), {
    weekday: "long",
    timeZone: WORKSHOP_TIME_ZONE,
  }).format(new Date(`${dateOnly}T12:00:00+03:00`));
}
