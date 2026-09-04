"use client";

import { createClientStore, createTombstoneStore } from "@/lib/client-store";

import type { Supplier } from "./types";

export const supplierStore = createClientStore<Supplier>(
  "3mr-workshop-suppliers-v1",
);

export const supplierTombstones = createTombstoneStore(
  "3mr-workshop-suppliers-deleted-v1",
);
