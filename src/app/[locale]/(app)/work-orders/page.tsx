import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { WorkOrdersView } from "@/modules/work-orders/components/work-orders-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workOrders" });
  return { title: t("title") };
}

export default async function WorkOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  return (
    <WorkOrdersView
      initialOrders={workOrders}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
