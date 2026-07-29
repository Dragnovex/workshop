/**
 * البيانات المتبقّية التي لا مصدر لها في وحدة أخرى — سعة الفنيين اليومية
 * وعدد المرافع الفعلي. كل رقم آخر في لوحة التحكم يُشتقّ الآن من بيانات
 * الوحدات الحقيقية (أوامر التشغيل، الفواتير، المخزون) عبر read-models.ts.
 */

export type Bilingual = { ar: string; en: string };

export const technicianCapacity: Record<string, { name: Bilingual; initials: Bilingual; capacity: number }> = {
  "سعيد ناصر": { name: { ar: "سعيد ناصر", en: "Saeed Nasser" }, initials: { ar: "س", en: "S" }, capacity: 6 },
  "ماجد العتيبي": { name: { ar: "ماجد العتيبي", en: "Majed Al-Otaibi" }, initials: { ar: "م", en: "M" }, capacity: 6 },
  "عبدالله الزهراني": { name: { ar: "عبدالله الزهراني", en: "Abdullah Al-Zahrani" }, initials: { ar: "ع", en: "A" }, capacity: 6 },
  "تركي الشمري": { name: { ar: "تركي الشمري", en: "Turki Al-Shammari" }, initials: { ar: "ت", en: "T" }, capacity: 5 },
  "ياسر الغامدي": { name: { ar: "ياسر الغامدي", en: "Yasser Al-Ghamdi" }, initials: { ar: "ي", en: "Y" }, capacity: 5 },
};

export const totalBays = 8;
