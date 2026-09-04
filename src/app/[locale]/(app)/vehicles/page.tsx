import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { VehiclesView } from "@/modules/vehicles/components/vehicles-view";
import {
  createVehicleReadModels,
} from "@/modules/vehicles/read-models";

export const dynamic = "force-dynamic";

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
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  const joinedOrders = createWorkOrderReadModels(
    workOrders,
    customers,
    vehicles,
  );
  const models = createVehicleReadModels(vehicles, customers, joinedOrders);

  // العملاء يُمرَّرون أيضًا: نموذج «مركبة جديدة» يحتاج قائمة المالكين،
  // ومركبة بلا مالك سجل يتيم لا معنى له في هذا النظام.
  return (
    <VehiclesView
      vehicles={models}
      customers={customers}
    />
  );
}
