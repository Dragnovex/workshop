"use client";

import { createTombstoneStore, type ClientStore } from "@/lib/client-store";
import type { Vehicle } from "@/lib/domain/contracts";

/**
 * تخزين محلي بسيط جدًا للمركبات — بلا باك-إند (نفس نمط العملاء وأوامر التشغيل).
 * أول زيارة: يعرض بيانات البذرة. أي مركبة جديدة تُحفظ في localStorage
 * وتبقى بعد إغلاق المتصفح.
 */
const STORAGE_KEY = "3mr-workshop-vehicles-v1";

export function loadStoredVehicles(seed: Vehicle[]): Vehicle[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as Vehicle[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    const storedIds = new Set(stored.map((vehicle) => vehicle.id));
    const freshSeed = seed.filter((vehicle) => !storedIds.has(vehicle.id));
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل. المستدعي يجب أن
 * يتحقق من القيمة قبل إخبار المستخدم أن المركبة حُفظت.
 */
export function saveStoredVehicles(vehicles: Vehicle[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    return true;
  } catch (error) {
    console.error("saveStoredVehicles failed", error);
    return false;
  }
}

/** نفس التخزين أعلاه بعقد `ClientStore` — يستهلكه `useLocalCollection`. */
export const vehicleStore: ClientStore<Vehicle> = {
  load: loadStoredVehicles,
  save: saveStoredVehicles,
};

/** معرّفات مركبات البذرة المحذوفة — بدونها تعود عند كل تحميل. */
export const vehicleTombstones = createTombstoneStore(
  "3mr-workshop-vehicles-deleted-v1",
);
