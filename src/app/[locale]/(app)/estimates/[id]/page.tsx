import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EstimateDetailView } from "@/modules/estimates/components/estimate-detail-view";
import { estimates } from "@/modules/estimates/data";
import { createEstimateReadModels } from "@/modules/estimates/read-models";
import { customers } from "@/modules/customers/data";
import { vehicles } from "@/modules/vehicles/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "estimates" });
  const estimate = estimates.find((item) => item.id === id);
  return {
    title: estimate?.number ?? t("detail.notFoundTitle"),
  };
}

export default async function EstimateDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const model = createEstimateReadModels(estimates, customers, vehicles).find(
    ({ estimate }) => estimate.id === id,
  );

  if (!model) notFound();
  return <EstimateDetailView model={model} />;
}
