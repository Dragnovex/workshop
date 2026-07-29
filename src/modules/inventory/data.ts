import type { Part } from "./types";

export const parts: Part[] = [
  { id: "part-001", sku: "BRK-PAD-F01", name: { ar: "طقم فحمات فرامل أمامية", en: "Front brake pad set" }, category: "brakes", qtyOnHand: 6, reorderLevel: 8, unitPrice: 180, location: "A1-03" },
  { id: "part-002", sku: "BRK-DSC-F01", name: { ar: "قرص فرامل أمامي", en: "Front brake disc" }, category: "brakes", qtyOnHand: 14, reorderLevel: 6, unitPrice: 210, location: "A1-04" },
  { id: "part-003", sku: "ENG-OIL-5W30", name: { ar: "زيت محرك 5W-30", en: "Engine oil 5W-30" }, category: "fluids", qtyOnHand: 42, reorderLevel: 20, unitPrice: 35, location: "B2-01" },
  { id: "part-004", sku: "ENG-FLT-OIL", name: { ar: "فلتر زيت", en: "Oil filter" }, category: "filters", qtyOnHand: 5, reorderLevel: 15, unitPrice: 22, location: "B2-05" },
  { id: "part-005", sku: "ENG-FLT-AIR", name: { ar: "فلتر هواء", en: "Air filter" }, category: "filters", qtyOnHand: 9, reorderLevel: 10, unitPrice: 45, location: "B2-06" },
  { id: "part-006", sku: "ELC-BAT-70A", name: { ar: "بطارية 70 أمبير", en: "Battery 70A" }, category: "electrical", qtyOnHand: 3, reorderLevel: 5, unitPrice: 320, location: "C1-02" },
  { id: "part-007", sku: "ELC-SPK-STD", name: { ar: "بواجي إشعال", en: "Spark plugs" }, category: "electrical", qtyOnHand: 26, reorderLevel: 12, unitPrice: 18, location: "C1-05" },
  { id: "part-008", sku: "FLU-COOL-STD", name: { ar: "سائل تبريد", en: "Coolant" }, category: "fluids", qtyOnHand: 18, reorderLevel: 10, unitPrice: 45, location: "B2-02" },
  { id: "part-009", sku: "FLU-BRK-DOT4", name: { ar: "سائل فرامل DOT4", en: "Brake fluid DOT4" }, category: "fluids", qtyOnHand: 7, reorderLevel: 8, unitPrice: 28, location: "B2-03" },
  { id: "part-010", sku: "TIR-205-55R16", name: { ar: "إطار 205/55R16", en: "Tire 205/55R16" }, category: "tires", qtyOnHand: 12, reorderLevel: 8, unitPrice: 350, location: "D1-01" },
  { id: "part-011", sku: "TIR-265-65R17", name: { ar: "إطار 265/65R17", en: "Tire 265/65R17" }, category: "tires", qtyOnHand: 4, reorderLevel: 6, unitPrice: 480, location: "D1-02" },
  { id: "part-012", sku: "BDY-MIR-L", name: { ar: "مرآة جانبية يسار", en: "Left side mirror" }, category: "bodyParts", qtyOnHand: 2, reorderLevel: 3, unitPrice: 260, location: "E1-01" },
  { id: "part-013", sku: "ENG-BLT-TIM", name: { ar: "سير كاتينة", en: "Timing belt" }, category: "engine", qtyOnHand: 8, reorderLevel: 5, unitPrice: 165, location: "B1-04" },
  { id: "part-014", sku: "ENG-RAD-STD", name: { ar: "رديتر", en: "Radiator" }, category: "engine", qtyOnHand: 3, reorderLevel: 4, unitPrice: 640, location: "B1-06" },
  { id: "part-015", sku: "ELC-BLB-H7", name: { ar: "لمبة هالوجين H7", en: "Halogen bulb H7" }, category: "electrical", qtyOnHand: 30, reorderLevel: 15, unitPrice: 15, location: "C1-08" },
];
