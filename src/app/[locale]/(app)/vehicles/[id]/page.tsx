import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { VehicleDetailView } from "@/modules/vehicles/components/vehicle-detail-view";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { createVehicleReadModels } from "@/modules/vehicles/read-models";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "vehicles" });
  const vehicle = await repositories.vehicles.findById(id);
  return {
    title: vehicle ? getVehicleDisplayName(vehicle, locale) : t("detail.notFoundTitle"),
  };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  const joinedOrders = createWorkOrderReadModels(workOrders, customers, vehicles);
  const model = createVehicleReadModels(vehicles, customers, joinedOrders).find(
    ({ vehicle }) => vehicle.id === id,
  );

  if (!model) notFound();
  return <VehicleDetailView model={model} />;
}
