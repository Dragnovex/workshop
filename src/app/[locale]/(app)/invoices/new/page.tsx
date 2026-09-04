import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { NewInvoiceForm } from "@/modules/invoices/components/new-invoice-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invoices" });
  return { title: t("new.title") };
}

export default async function NewInvoicePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const invoices = await repositories.invoices.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <NewInvoiceForm
      seedInvoices={invoices}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
