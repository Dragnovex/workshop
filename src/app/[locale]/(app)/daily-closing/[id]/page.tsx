import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { DailyClosingDetailView } from "@/modules/daily-closing/components/daily-closing-detail-view";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "dailyClosing" });
  const closing = await repositories.dailyClosings.findById(id);
  return {
    title: closing ? formatDate(closing.date, locale) : t("detail.notFoundTitle"),
  };
}

export default async function DailyClosingDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const closing = await repositories.dailyClosings.findById(id);
  if (!closing) notFound();

  return <DailyClosingDetailView closing={closing} />;
}
