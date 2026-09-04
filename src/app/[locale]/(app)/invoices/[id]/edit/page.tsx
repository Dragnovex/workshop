import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { EditInvoiceForm } from "@/modules/invoices/components/edit-invoice-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invoices" });
  return { title: t("edit.title") };
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // المسودة المطلوبة قد تكون في localStorage فقط — الخادم يمرّر البذرة
  // والعميل يدمج ويقرّر «غير موجودة».
  const invoices = await repositories.invoices.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <EditInvoiceForm
      id={id}
      seedInvoices={invoices}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
