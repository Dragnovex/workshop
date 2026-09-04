/**
 * تحويلات بين ISO ومدخلات `<input type="date|datetime-local">`.
 *
 * `toDateTimeInputValue` تستخدم التوقيت المحلي عمدًا لا `toISOString()`:
 * الأخيرة تحوّل إلى UTC، فموعد الساعة ٩ صباحًا بتوقيت الرياض كان سيظهر
 * في الحقل ٦ صباحًا — إزاحة ثلاث ساعات صامتة في كل تعديل.
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${toDateInputValue(iso)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** قيمة الحقل → ISO. تعيد `null` إذا كانت القيمة غير صالحة. */
export function fromDateInputValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
