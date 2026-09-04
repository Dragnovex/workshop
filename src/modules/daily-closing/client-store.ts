"use client";

import type { DailyClosing } from "./types";

/**
 * تخزين محلي بسيط جدًا لتقفيل اليومية — بلا باك-إند (نفس نمط باقي الوحدات).
 *
 * كان `handleSave` في شاشة التفاصيل زخرفيًا بالكامل: يعرض رسالة نجاح
 * ويصفّر علامة "تغييرات غير محفوظة" بلا أي كتابة فعلية — فأي تعديل يضيع
 * فور تحديث الصفحة. هذا الملف هو الحفظ الحقيقي.
 */
const STORAGE_KEY = "3mr-workshop-daily-closings-v1";

export function loadStoredDailyClosings(seed: DailyClosing[]): DailyClosing[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as DailyClosing[];
    if (!Array.isArray(stored) || stored.length === 0) return seed;
    // التعديلات المحفوظة تحل محل نسخة البذرة لنفس اليومية — لا تكرار.
    const storedIds = new Set(stored.map((closing) => closing.id));
    const freshSeed = seed.filter((closing) => !storedIds.has(closing.id));
    return [...freshSeed, ...stored];
  } catch {
    return seed;
  }
}

/**
 * تعيد `true` عند نجاح الحفظ فعليًا و`false` عند الفشل. المستدعي يجب أن
 * يتحقق من القيمة قبل إخبار المستخدم أن التقفيل حُفظ.
 */
export function saveStoredDailyClosings(closings: DailyClosing[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(closings));
    return true;
  } catch (error) {
    console.error("saveStoredDailyClosings failed", error);
    return false;
  }
}
