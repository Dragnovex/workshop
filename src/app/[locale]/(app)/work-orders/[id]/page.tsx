import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { customers } from "@/modules/customers/data";
import { WorkOrderDetailView } from "@/modules/work-orders/components/work-order-detail-view";
import { workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels } from "@/modules/work-orders/read-models";
import { vehicles } from "@/modules/vehicles/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "workOrders" });
  const order = workOrders.find((item) => item.id === id);

  return { title: order?.number ?? t("detail.notFoundTitle") };
}

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const model = createWorkOrderReadModels(
    workOrders,
    customers,
    vehicles,
  ).find(({ order }) => order.id === id);

  if (!model) {
    notFound();
  }

  return <WorkOrderDetailView model={model} />;
}
