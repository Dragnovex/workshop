import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CampaignDetailView } from "@/modules/marketing/components/campaign-detail-view";
import { campaigns } from "@/modules/marketing/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "marketing" });
  const campaign = campaigns.find((item) => item.id === id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: campaign?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const campaign = campaigns.find((item) => item.id === id);

  if (!campaign) notFound();
  return <CampaignDetailView campaign={campaign} />;
}
