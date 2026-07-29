import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CustomersView } from "@/modules/customers/components/customers-view";
import { customers } from "@/modules/customers/data";
import {
  createCustomerReadModels,
  getCustomerStats,
} from "@/modules/customers/read-models";
import { workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { vehicles } from "@/modules/vehicles/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "customers" });
  return { title: t("title") };
}

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const joinedOrders = createWorkOrderReadModels(
    workOrders,
    customers,
    vehicles,
  );
  const models = createCustomerReadModels(customers, vehicles, joinedOrders);

  return <CustomersView customers={models} stats={getCustomerStats(models)} />;
}
