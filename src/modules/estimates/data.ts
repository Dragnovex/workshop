import type { Estimate } from "./types";

export const estimates: Estimate[] = [
  {
    id: "est-001",
    number: "EST-0726-014",
    customerId: "customer-004",
    vehicleId: "vehicle-004",
    status: "sent",
    createdAt: "2026-07-27T10:00:00+03:00",
    validUntil: "2026-08-03T10:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "استبدال طقم فحمات فرامل أمامية", en: "Front brake pad set replacement" }, qty: 1, unitPrice: 320 },
      { id: "i2", description: { ar: "أجرة عمل", en: "Labor" }, qty: 1.5, unitPrice: 90 },
    ],
  },
  {
    id: "est-002",
    number: "EST-0726-013",
    customerId: "customer-005",
    vehicleId: "vehicle-005",
    status: "approved",
    createdAt: "2026-07-26T09:30:00+03:00",
    validUntil: "2026-08-02T09:30:00+03:00",
    items: [
      { id: "i1", description: { ar: "فحص وتعبئة غاز تكييف", en: "AC gas check and recharge" }, qty: 1, unitPrice: 180 },
    ],
    linkedWorkOrderId: "wo-005",
  },
  {
    id: "est-003",
    number: "EST-0726-012",
    customerId: "customer-007",
    vehicleId: "vehicle-007",
    status: "draft",
    createdAt: "2026-07-28T12:00:00+03:00",
    validUntil: "2026-08-04T12:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "فحص شامل قبل الشراء", en: "Full pre-purchase inspection" }, qty: 1, unitPrice: 250 },
    ],
  },
  {
    id: "est-004",
    number: "EST-0726-011",
    customerId: "customer-009",
    vehicleId: "vehicle-009",
    status: "rejected",
    createdAt: "2026-07-24T08:00:00+03:00",
    validUntil: "2026-07-31T08:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "استبدال رديتر", en: "Radiator replacement" }, qty: 1, unitPrice: 640 },
      { id: "i2", description: { ar: "سائل تبريد", en: "Coolant" }, qty: 2, unitPrice: 45 },
    ],
    notes: { ar: "رفض العميل السعر وطلب عرضًا بديلًا", en: "Customer declined the price and asked for an alternative quote" },
  },
  {
    id: "est-005",
    number: "EST-0726-010",
    customerId: "customer-011",
    vehicleId: "vehicle-011",
    status: "expired",
    createdAt: "2026-07-10T08:00:00+03:00",
    validUntil: "2026-07-17T08:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "صيانة دورية أسطول", en: "Fleet routine maintenance" }, qty: 3, unitPrice: 220 },
    ],
  },
  {
    id: "est-006",
    number: "EST-0726-009",
    customerId: "customer-014",
    vehicleId: "vehicle-015",
    status: "sent",
    createdAt: "2026-07-28T14:00:00+03:00",
    validUntil: "2026-08-05T14:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "فحص فرامل ودركسون", en: "Brake and steering inspection" }, qty: 1, unitPrice: 210 },
      { id: "i2", description: { ar: "تبديل زيت فرامل", en: "Brake fluid replacement" }, qty: 1, unitPrice: 95 },
    ],
  },
];
