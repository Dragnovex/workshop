import type { NotificationSetting, Preferences, SystemUser, WorkshopProfile } from "./types";

export const workshopProfile: WorkshopProfile = {
  name: { ar: "ورشة النعماني", en: "Al-Numani Workshop" },
  companyName: { ar: "شركة سليمان أحمد خميس النعماني للتجارة", en: "Sulaiman Ahmed Khamis Al-Numani Trading Co." },
  taxNumber: "300123456700003",
  phone: "+966112223344",
  email: "info@3mr.sa",
  address: { ar: "الرياض، حي الصناعية، شارع الأمير سلطان", en: "Riyadh, Industrial District, Prince Sultan St." },
  workingHours: { ar: "السبت–الخميس، 7 صباحًا – 9 مساءً", en: "Sat–Thu, 7 AM – 9 PM" },
};

export const systemUsers: SystemUser[] = [
  { id: "usr-001", name: { ar: "خالد الزهراني", en: "Khalid Al-Zahrani" }, email: "khalid.zahrani@3mr.sa", role: "admin", lastLoginAt: "2026-07-29T07:45:00+03:00" },
  { id: "usr-002", name: { ar: "أحمد السالم", en: "Ahmed Al-Salem" }, email: "ahmed.salem@3mr.sa", role: "advisor", lastLoginAt: "2026-07-29T07:20:00+03:00" },
  { id: "usr-003", name: { ar: "نورة الدوسري", en: "Noura Al-Dosari" }, email: "noura.dosari@3mr.sa", role: "accountant", lastLoginAt: "2026-07-28T15:10:00+03:00" },
  { id: "usr-004", name: { ar: "محمد الجهني", en: "Mohammed Al-Juhani" }, email: "mohammed.juhani@3mr.sa", role: "manager", lastLoginAt: "2026-07-24T11:00:00+03:00" },
];

export const preferences: Preferences = {
  defaultLocale: "ar",
  currency: "SAR",
  timeZone: "Asia/Riyadh",
  dateFormat: "DD/MM/YYYY",
  weekStart: { ar: "السبت", en: "Saturday" },
};

export const notificationSettings: NotificationSetting[] = [
  { id: "ntf-001", label: { ar: "أمر تشغيل جديد", en: "New work order" }, channel: { ar: "داخل النظام", en: "In-app" }, enabled: true },
  { id: "ntf-002", label: { ar: "تذكير موعد", en: "Appointment reminder" }, channel: { ar: "رسالة نصية", en: "SMS" }, enabled: true },
  { id: "ntf-003", label: { ar: "فاتورة متأخرة", en: "Overdue invoice" }, channel: { ar: "بريد إلكتروني", en: "Email" }, enabled: true },
  { id: "ntf-004", label: { ar: "مخزون منخفض", en: "Low stock" }, channel: { ar: "داخل النظام", en: "In-app" }, enabled: false },
];
