"use client";

import { createClientStore, createTombstoneStore } from "@/lib/client-store";

import type { PurchaseOrder } from "./types";

/** فواتير الشراء وأوامرها — لم يكن للمشتريات أي تعديل محلي قبل هذه المرحلة. */
export const purchaseOrderStore = createClientStore<PurchaseOrder>(
  "3mr-workshop-purchase-orders-v1",
);

export const purchaseOrderTombstones = createTombstoneStore(
  "3mr-workshop-purchase-orders-deleted-v1",
);
