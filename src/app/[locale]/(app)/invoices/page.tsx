import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { InvoicesView } from "@/modules/invoices/components/invoices-view";
import { createInvoiceReadModels } from "@/modules/invoices/read-models";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invoices" });
  return { title: t("title") };
}

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  const invoices = await repositories.invoices.findAll();
  const models = createInvoiceReadModels(invoices, customers, vehicles, locale).filter(
    ({ invoice }) => invoice.documentType === "invoice",
  );
  return (
    <InvoicesView
      invoices={models}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
