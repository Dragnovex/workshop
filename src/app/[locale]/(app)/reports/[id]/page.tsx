import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { ReportDetailView } from "@/modules/reports/components/report-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  const report = await repositories.reports.findById(id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: report?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const report = await repositories.reports.findById(id);

  if (!report) notFound();
  return <ReportDetailView report={report} />;
}
