/**
 * مدققات صيغة سعودية عامة — تحقق شكلي فقط (لا اتصال بأي جهة رسمية).
 */

/** رقم ضريبي سعودي: 15 رقمًا، يبدأ وينتهي بالرقم 3 (متطلب هيئة الزكاة والضريبة والجمارك). */
export function isValidSaudiVatNumber(value: string): boolean {
  return /^3\d{13}3$/.test(value.trim());
}

/** رقم سجل تجاري سعودي: 10 أرقام. */
export function isValidCommercialRegistration(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/** جوال سعودي: 05xxxxxxxx أو +9665xxxxxxxx. */
export function isValidSaudiPhone(value: string): boolean {
  const normalized = value.trim().replace(/\s|-/g, "");
  return /^(\+9665\d{8}|05\d{8})$/.test(normalized);
}

export function normalizeSaudiPhone(value: string): string {
  const digits = value.trim().replace(/\s|-/g, "");
  if (digits.startsWith("+966")) return digits;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  return digits;
}
