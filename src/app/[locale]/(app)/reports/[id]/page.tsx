import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ReportDetailView } from "@/modules/reports/components/report-detail-view";
import { reports } from "@/modules/reports/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  const report = reports.find((item) => item.id === id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: report?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const report = reports.find((item) => item.id === id);

  if (!report) notFound();
  return <ReportDetailView report={report} />;
}
