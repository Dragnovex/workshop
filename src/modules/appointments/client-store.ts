"use client";

import { createTombstoneStore, type ClientStore } from "@/lib/client-store";

import type { Appointment } from "./types";

/**
 * تخزين محلي بسيط جدًا للمواعيد — بلا باك-إند (نمط م2 لأوامر التشغيل).
 */
const STORAGE_KEY = "3mr-workshop-appointments-v1";

export function loadStoredAppointments(seed: Appointment[]): Appointment[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as Appointment[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    const storedIds = new Set(stored.map((appointment) => appointment.id));
    const freshSeed = seed.filter(
      (appointment) => !storedIds.has(appointment.id),
    );
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل. المستدعي يجب أن
 * يتحقق من القيمة قبل إخبار المستخدم أن الموعد حُفظ.
 */
export function saveStoredAppointments(appointments: Appointment[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    return true;
  } catch (error) {
    console.error("saveStoredAppointments failed", error);
    return false;
  }
}

/** نفس التخزين أعلاه بعقد `ClientStore` — يستهلكه `useLocalCollection`. */
export const appointmentStore: ClientStore<Appointment> = {
  load: loadStoredAppointments,
  save: saveStoredAppointments,
};

/** معرّفات مواعيد البذرة الملغاة نهائيًا — بدونها تعود عند كل تحميل. */
export const appointmentTombstones = createTombstoneStore(
  "3mr-workshop-appointments-deleted-v1",
);
