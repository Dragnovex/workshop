"use client";

/**
 * تصدير CSV من جهة المتصفح — بلا خادم وبلا مكتبة.
 *
 * BOM (﻿) في أول الملف ليس زخرفة: بدونه يفتح Excel على ويندوز الملف
 * بترميز النظام المحلي فيظهر كل نص عربي مشوّهًا. هذا هو الفارق بين ملف
 * يقرأه المحاسب وملف يرميه.
 */
function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  // الاقتباس واجب متى وُجد فاصل أو سطر جديد أو علامة اقتباس داخل الخلية.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function toCsv(
  headers: string[],
  rows: (string | number)[][],
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

/** يعيد `true` عند بدء التنزيل فعليًا. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const blob = new Blob(["﻿", toCsv(headers, rows)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    // التحرير مؤجّل: الإلغاء الفوري يقطع التنزيل في بعض المتصفحات.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error("downloadCsv failed", error);
    return false;
  }
}
