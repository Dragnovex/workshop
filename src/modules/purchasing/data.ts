import type { PurchaseOrder } from "./types";

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001",
    number: "PO-0726-005",
    supplier: { ar: "مؤسسة قطع الرياض", en: "Riyadh Parts Est." },
    status: "ordered",
    orderedAt: "2026-07-27T09:00:00+03:00",
    expectedAt: "2026-07-31T09:00:00+03:00",
    items: [
      { id: "i1", partId: "part-001", description: { ar: "طقم فحمات فرامل أمامية", en: "Front brake pad set" }, sku: "BRK-PAD-F01", qty: 20, unitCost: 140 },
      { id: "i2", partId: "part-004", description: { ar: "فلتر زيت", en: "Oil filter" }, sku: "ENG-FLT-OIL", qty: 40, unitCost: 15 },
    ],
  },
  {
    id: "po-002",
    number: "PO-0726-004",
    supplier: { ar: "شركة الخليج لقطع الغيار", en: "Gulf Auto Parts Co." },
    status: "partiallyReceived",
    orderedAt: "2026-07-24T10:30:00+03:00",
    expectedAt: "2026-07-29T10:30:00+03:00",
    items: [
      { id: "i1", partId: "part-006", description: { ar: "بطارية 70 أمبير", en: "Battery 70A" }, sku: "ELC-BAT-70A", qty: 10, unitCost: 260 },
    ],
  },
  {
    id: "po-003",
    number: "PO-0726-003",
    supplier: { ar: "مؤسسة قطع الرياض", en: "Riyadh Parts Est." },
    status: "received",
    orderedAt: "2026-07-18T08:00:00+03:00",
    expectedAt: "2026-07-22T08:00:00+03:00",
    items: [
      { id: "i1", partId: "part-003", description: { ar: "زيت محرك 5W-30", en: "Engine oil 5W-30" }, sku: "ENG-OIL-5W30", qty: 60, unitCost: 26 },
      { id: "i2", partId: "part-008", description: { ar: "سائل تبريد", en: "Coolant" }, sku: "FLU-COOL-STD", qty: 24, unitCost: 32 },
    ],
  },
  {
    id: "po-004",
    number: "PO-0726-002",
    supplier: { ar: "تجارة الإطارات المتحدة", en: "United Tires Trading" },
    status: "draft",
    orderedAt: "2026-07-29T07:00:00+03:00",
    expectedAt: "2026-08-05T07:00:00+03:00",
    items: [
      { id: "i1", partId: "part-011", description: { ar: "إطار 265/65R17", en: "Tire 265/65R17" }, sku: "TIR-265-65R17", qty: 8, unitCost: 410 },
    ],
  },
  {
    id: "po-005",
    number: "PO-0726-001",
    supplier: { ar: "شركة الخليج لقطع الغيار", en: "Gulf Auto Parts Co." },
    status: "cancelled",
    orderedAt: "2026-07-15T09:00:00+03:00",
    expectedAt: "2026-07-20T09:00:00+03:00",
    items: [
      { id: "i1", partId: "part-014", description: { ar: "رديتر", en: "Radiator" }, sku: "ENG-RAD-STD", qty: 4, unitCost: 520 },
    ],
    notes: { ar: "أُلغي الطلب بسبب توفر الصنف من مورد آخر", en: "Cancelled — item became available from another supplier" },
  },
];
