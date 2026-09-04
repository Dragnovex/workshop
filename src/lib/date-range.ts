/**
 * فلترة «من تاريخ إلى تاريخ» — منطق واحد لكل السجلات المحاسبية.
 *
 * المقارنة تتم على **اليوم** لا على اللحظة: مستند مسجَّل الساعة ٤ عصرًا
 * كان يسقط من نطاق ينتهي بنفس اليوم لو قارنّا الطوابع الزمنية مباشرة،
 * فيختفي من التقرير بلا سبب ظاهر للمحاسب.
 */
export type DateRange = {
  /** YYYY-MM-DD أو فراغ = بلا حد أدنى. */
  from: string;
  /** YYYY-MM-DD أو فراغ = بلا حد أعلى. */
  to: string;
};

export const emptyRange: DateRange = { from: "", to: "" };

/** اليوم بصيغة YYYY-MM-DD من أي طابع زمني أو تاريخ. */
function toDay(value: string): string {
  // القيم المخزَّنة قد تكون "2026-07-28" أو ISO كاملة — الاقتطاع يكفي
  // للأولى، والثانية تُحوَّل بالتوقيت المحلي لا UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isWithinRange(value: string, range: DateRange): boolean {
  const day = toDay(value);
  if (!day) return false;
  // المقارنة النصية صحيحة هنا لأن الصيغة YYYY-MM-DD مرتّبة معجميًا.
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function isRangeActive(range: DateRange): boolean {
  return Boolean(range.from || range.to);
}
