import type { LocalizedText } from "@/lib/domain/contracts";

export const partCategories = [
  "brakes",
  "engine",
  "electrical",
  "fluids",
  "filters",
  "tires",
  "bodyParts",
] as const;

export type PartCategory = (typeof partCategories)[number];

export type Part = {
  id: string;
  sku: string;
  name: LocalizedText;
  category: PartCategory;
  qtyOnHand: number;
  reorderLevel: number;
  unitPrice: number;
  location: string;
};
