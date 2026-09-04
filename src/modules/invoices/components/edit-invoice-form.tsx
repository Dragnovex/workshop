"use client";

import { FileWarning, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/components/patterns/empty-state";
import type { Customer, Vehicle } from "@/lib/domain/contracts";

import { loadStoredInvoices } from "../client-store";
import type { Invoice } from "../types";
import { NewInvoiceForm } from "./new-invoice-form";

/**
 * غلاف تعديل الفاتورة.
 *
 * الفاتورة المطلوبة قد تكون محفوظة في localStorage فقط ولا يراها الخادم،
 * فالبحث عنها يتم هنا على العميل بعد دمج البذرة مع المخزَّن — نفس نمط
 * صفحة تفاصيل الفاتورة.
 */
export function EditInvoiceForm({
  id,
  seedInvoices,
  customers,
  vehicles,
}: {
  id: string;
  seedInvoices: Invoice[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("invoices");
  const [invoices] = useState(() => loadStoredInvoices(seedInvoices));
  const invoice = invoices.find((item) => item.id === id);

  if (!invoice) {
    return <EmptyState icon={FileWarning} title={t("detail.notFoundTitle")} />;
  }

  // المُصدَرة مقفلة: نشرح السبب بدل عرض نموذج يرفض الحفظ عند الضغط.
  if (invoice.status !== "draft") {
    return (
      <EmptyState
        icon={Lock}
        title={t("edit.locked")}
        description={t("edit.lockedError")}
      />
    );
  }

  return (
    <NewInvoiceForm
      seedInvoices={seedInvoices}
      customers={customers}
      vehicles={vehicles}
      invoice={invoice}
    />
  );
}
