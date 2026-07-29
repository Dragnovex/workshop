import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { customers } from "@/modules/customers/data";
import { InvoicesView } from "@/modules/invoices/components/invoices-view";
import { invoices } from "@/modules/invoices/data";
import { createInvoiceReadModels } from "@/modules/invoices/read-models";
import { vehicles } from "@/modules/vehicles/data";

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

  const models = createInvoiceReadModels(invoices, customers, vehicles);
  const stats = {
    total: models.length,
    overdue: models.filter(({ invoice }) => invoice.status === "overdue").length,
    paid: models.filter(({ invoice }) => invoice.status === "paid").length,
    outstandingValue: models.reduce((sum, { balanceDue, invoice }) => {
      return invoice.status === "cancelled" ? sum : sum + balanceDue;
    }, 0),
  };

  return <InvoicesView invoices={models} stats={stats} />;
}
