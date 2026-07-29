import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { customers } from "@/modules/customers/data";
import { workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { VehiclesView } from "@/modules/vehicles/components/vehicles-view";
import { vehicles } from "@/modules/vehicles/data";
import {
  createVehicleReadModels,
  getVehicleStats,
} from "@/modules/vehicles/read-models";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vehicles" });
  return { title: t("title") };
}

export default async function VehiclesPage({
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
  const models = createVehicleReadModels(vehicles, customers, joinedOrders);

  return <VehiclesView vehicles={models} stats={getVehicleStats(models)} />;
}
