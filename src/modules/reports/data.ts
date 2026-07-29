import type { Report } from "./types";

export const reports: Report[] = [
  {
    id: "rpt-001",
    name: { ar: "تقرير أوامر التشغيل اليومي", en: "Daily work orders report" },
    category: "operations",
    description: { ar: "ملخّص أوامر التشغيل المفتوحة والمُسلَّمة خلال اليوم", en: "Summary of open and delivered work orders for the day" },
    frequency: "daily",
    lastGeneratedAt: "2026-07-29T07:00:00+03:00",
  },
  {
    id: "rpt-002",
    name: { ar: "تقرير الإيرادات الشهري", en: "Monthly revenue report" },
    category: "finance",
    description: { ar: "إجمالي الإيرادات والمصروفات مقارنة بالشهر السابق", en: "Total revenue and expenses compared to the previous month" },
    frequency: "monthly",
    lastGeneratedAt: "2026-07-01T08:00:00+03:00",
  },
  {
    id: "rpt-003",
    name: { ar: "تقرير المخزون المنخفض", en: "Low stock report" },
    category: "inventory",
    description: { ar: "قطع الغيار التي وصلت أو اقتربت من مستوى إعادة الطلب", en: "Parts that reached or are near their reorder level" },
    frequency: "weekly",
    lastGeneratedAt: "2026-07-27T06:00:00+03:00",
  },
  {
    id: "rpt-004",
    name: { ar: "تقرير رضا العملاء", en: "Customer satisfaction report" },
    category: "customers",
    description: { ar: "معدل تكرار الزيارات ومتوسط الفترة بين الزيارات", en: "Visit frequency and average time between visits" },
    frequency: "monthly",
    lastGeneratedAt: "2026-07-01T08:00:00+03:00",
  },
  {
    id: "rpt-005",
    name: { ar: "تقرير أداء الفنيين", en: "Technician performance report" },
    category: "operations",
    description: { ar: "عدد الأوامر المنجزة ومتوسط وقت الإصلاح لكل فني", en: "Completed order count and average repair time per technician" },
    frequency: "weekly",
    lastGeneratedAt: "2026-07-27T06:00:00+03:00",
  },
  {
    id: "rpt-006",
    name: { ar: "تقرير الفواتير المتأخرة", en: "Overdue invoices report" },
    category: "finance",
    description: { ar: "الفواتير المتأخرة السداد وقيمتها الإجمالية", en: "Overdue invoices and their total value" },
    frequency: "onDemand",
    lastGeneratedAt: "2026-07-24T09:00:00+03:00",
  },
];
