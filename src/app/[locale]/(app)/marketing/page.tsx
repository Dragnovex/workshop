import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { campaigns } from "@/modules/marketing/data";
import { MarketingView } from "@/modules/marketing/components/marketing-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing" });
  return { title: t("title") };
}

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MarketingView campaigns={campaigns} />;
}
