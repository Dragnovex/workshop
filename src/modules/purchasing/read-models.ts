import type { PurchaseOrder } from "./types";

export function getPurchaseOrderTotal(order: PurchaseOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
}
