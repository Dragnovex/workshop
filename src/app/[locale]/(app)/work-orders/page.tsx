import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { customers } from "@/modules/customers/data";
import { WorkOrdersView } from "@/modules/work-orders/components/work-orders-view";
import { getWorkOrderStats, workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { vehicles } from "@/modules/vehicles/data";

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

  return (
    <WorkOrdersView
      workOrders={createWorkOrderReadModels(workOrders, customers, vehicles)}
      stats={getWorkOrderStats()}
    />
  );
}
