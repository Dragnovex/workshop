"use client";

import { createClientStore, createTombstoneStore } from "@/lib/client-store";

import type { Employee } from "./types";

/** الموظفون — لم تكن الوحدة تدعم أي إضافة أو تعديل قبل هذه المرحلة. */
export const employeeStore = createClientStore<Employee>(
  "3mr-workshop-employees-v1",
);

export const employeeTombstones = createTombstoneStore(
  "3mr-workshop-employees-deleted-v1",
);
