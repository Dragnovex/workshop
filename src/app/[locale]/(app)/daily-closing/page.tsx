import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { DailyClosingView } from "@/modules/daily-closing/components/daily-closing-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dailyClosing" });
  return { title: t("title") };
}

export default async function DailyClosingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const closings = await repositories.dailyClosings.findAll();
  return <DailyClosingView closings={closings} />;
}
