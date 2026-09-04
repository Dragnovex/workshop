import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { ContentStudio } from "@/modules/marketing/components/content-studio";
import { MarketingView } from "@/modules/marketing/components/marketing-view";

export const dynamic = "force-dynamic";

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
  const campaigns = await repositories.marketing.findAll();

  // الحملات فوق (سجل)، واستوديو المحتوى تحتها (أداة عمل يومية).
  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
      <MarketingView campaigns={campaigns} />
      <ContentStudio />
    </div>
  );
}
