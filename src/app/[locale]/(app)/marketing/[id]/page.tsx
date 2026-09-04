import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { CampaignDetailView } from "@/modules/marketing/components/campaign-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "marketing" });
  const campaign = await repositories.marketing.findById(id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: campaign?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const campaign = await repositories.marketing.findById(id);

  if (!campaign) notFound();
  return <CampaignDetailView campaign={campaign} />;
}
