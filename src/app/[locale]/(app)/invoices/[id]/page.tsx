import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { customers } from "@/modules/customers/data";
import { InvoiceDetailView } from "@/modules/invoices/components/invoice-detail-view";
import { invoices } from "@/modules/invoices/data";
import { createInvoiceReadModels } from "@/modules/invoices/read-models";
import { vehicles } from "@/modules/vehicles/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "invoices" });
  const invoice = invoices.find((item) => item.id === id);
  return {
    title: invoice?.number ?? t("detail.notFoundTitle"),
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const model = createInvoiceReadModels(invoices, customers, vehicles).find(
    ({ invoice }) => invoice.id === id,
  );

  if (!model) notFound();
  return <InvoiceDetailView model={model} />;
}
