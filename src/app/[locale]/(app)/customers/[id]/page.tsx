import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CustomerDetailView } from "@/modules/customers/components/customer-detail-view";
import { customers } from "@/modules/customers/data";
import { createCustomerReadModels } from "@/modules/customers/read-models";
import { workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { vehicles } from "@/modules/vehicles/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "customers" });
  const customer = customers.find((item) => item.id === id);
  return {
    title: customer?.displayName[locale === "en" ? "en" : "ar"] ?? t("detail.notFoundTitle"),
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const joinedOrders = createWorkOrderReadModels(workOrders, customers, vehicles);
  const model = createCustomerReadModels(customers, vehicles, joinedOrders).find(
    ({ customer }) => customer.id === id,
  );

  if (!model) notFound();
  return <CustomerDetailView model={model} />;
}
