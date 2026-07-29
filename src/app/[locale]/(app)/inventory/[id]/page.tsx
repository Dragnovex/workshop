import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PartDetailView } from "@/modules/inventory/components/part-detail-view";
import { parts } from "@/modules/inventory/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  const part = parts.find((item) => item.id === id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: part?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function PartDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const part = parts.find((item) => item.id === id);

  if (!part) notFound();
  return <PartDetailView part={part} />;
}
