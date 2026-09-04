"use client";

import { createClientStore, createTombstoneStore } from "@/lib/client-store";

import type { Part } from "./types";

/**
 * تخزين محلي للقطع — لم يكن للمخزون أي تعديل محلي قبل هذه المرحلة
 * (قراءة فقط من البذرة). الآن يُنشئ ويُعدّل ويُحذف، ويستقبل الكميات
 * الواردة من استلام أوامر الشراء.
 */
export const partStore = createClientStore<Part>("3mr-workshop-parts-v1");

export const partTombstones = createTombstoneStore(
  "3mr-workshop-parts-deleted-v1",
);
