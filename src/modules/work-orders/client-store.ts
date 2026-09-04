"use client";

import { createTombstoneStore, type ClientStore } from "@/lib/client-store";

import type { WorkOrder, WorkOrderStatus } from "./types";

/**
 * تخزين محلي بسيط جدًا لأوامر التشغيل — بلا باك-إند.
 * أول زيارة: يعرض بيانات البذرة. أي إنشاء/تغيير حالة يُحفظ في localStorage
 * ويبقى بعد إغلاق المتصفح. عند إضافة أوامر جديدة للبذرة لاحقًا تظهر أيضًا.
 */
const STORAGE_KEY = "3mr-workshop-workorders-v1";

export const WORK_ORDER_FLOW: WorkOrderStatus[] = [
  "reception",
  "inspection",
  "awaitingApproval",
  "inProgress",
  "awaitingParts",
  "readyForDelivery",
  "delivered",
];

/** الحالة التالية في دورة حياة الأمر — أو null إذا كان الأمر مُسلَّمًا. */
export function nextStatusOf(status: WorkOrderStatus): WorkOrderStatus | null {
  const index = WORK_ORDER_FLOW.indexOf(status);
  if (index < 0 || index >= WORK_ORDER_FLOW.length - 1) return null;
  return WORK_ORDER_FLOW[index + 1];
}

export function loadStoredOrders(seed: WorkOrder[]): WorkOrder[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as WorkOrder[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    const storedIds = new Set(stored.map((order) => order.id));
    const freshSeed = seed.filter((order) => !storedIds.has(order.id));
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل. المستدعي يجب أن
 * يتحقق من القيمة قبل إخبار المستخدم أن أمر التشغيل حُفظ.
 */
export function saveStoredOrders(orders: WorkOrder[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("saveStoredOrders failed", error);
    return false;
  }
}

/** نفس التخزين أعلاه بعقد `ClientStore` — يستهلكه `useLocalCollection`. */
export const workOrderStore: ClientStore<WorkOrder> = {
  load: loadStoredOrders,
  save: saveStoredOrders,
};

/** معرّفات أوامر البذرة المحذوفة — بدونها تعود عند كل تحميل. */
export const workOrderTombstones = createTombstoneStore(
  "3mr-workshop-workorders-deleted-v1",
);

/** ينشئ رقم أمر بصيغة WO-0726-135 — يزيد تلقائيًا عن أعلى رقم موجود. */
export function nextWorkOrderNumber(orders: WorkOrder[]): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(2);
  const prefix = `WO-${mm}${yy}-`;
  let max = 0;
  for (const order of orders) {
    if (order.number.startsWith(prefix)) {
      const seq = Number.parseInt(order.number.slice(prefix.length), 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${max + 1}`;
}
