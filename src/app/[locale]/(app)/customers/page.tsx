import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { CustomersView } from "@/modules/customers/components/customers-view";
import {
  createCustomerReadModels,
} from "@/modules/customers/read-models";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";

export const dynamic = "force-dynamic";

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
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  const joinedOrders = createWorkOrderReadModels(
    workOrders,
    customers,
    vehicles,
  );
  const models = createCustomerReadModels(customers, vehicles, joinedOrders);

  return <CustomersView customers={models} />;
}
