import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { EstimatesView } from "@/modules/estimates/components/estimates-view";
import { createEstimateReadModels } from "@/modules/estimates/read-models";

export const dynamic = "force-dynamic";

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
  const customers = await repositories.customers.findAll();
  const estimates = await repositories.estimates.findAll();
  const vehicles = await repositories.vehicles.findAll();

  const models = createEstimateReadModels(estimates, customers, vehicles);

  // العملاء والمركبات تُمرَّر أيضًا: نموذج التسعير يختار منهما، وقائمة
  // العروض تعيد الربط على العميل لتشمل ما أُنشئ محليًا.
  return (
    <EstimatesView estimates={models} customers={customers} vehicles={vehicles} />
  );
}
