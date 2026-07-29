import type { LocalizedText } from "@/lib/domain/contracts";

export const purchaseOrderStatuses = [
  "draft",
  "ordered",
  "partiallyReceived",
  "received",
  "cancelled",
] as const;

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export type PurchaseOrderItem = {
  id: string;
  partId?: string;
  description: LocalizedText;
  sku: string;
  qty: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplier: LocalizedText;
  status: PurchaseOrderStatus;
  orderedAt: string;
  expectedAt: string;
  items: PurchaseOrderItem[];
  notes?: LocalizedText;
};
