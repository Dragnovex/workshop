import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EstimatesView } from "@/modules/estimates/components/estimates-view";
import { estimates } from "@/modules/estimates/data";
import { createEstimateReadModels } from "@/modules/estimates/read-models";
import { customers } from "@/modules/customers/data";
import { vehicles } from "@/modules/vehicles/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "estimates" });
  return { title: t("title") };
}

export default async function EstimatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const models = createEstimateReadModels(estimates, customers, vehicles);
  const approved = models.filter(({ estimate }) => estimate.status === "approved");
  const stats = {
    total: models.length,
    sent: models.filter(({ estimate }) => estimate.status === "sent").length,
    approved: approved.length,
    approvedValue: approved.reduce((sum, { total }) => sum + total, 0),
  };

  return <EstimatesView estimates={models} stats={stats} />;
}
