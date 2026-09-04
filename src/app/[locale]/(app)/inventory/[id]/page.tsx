import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { PartDetailView } from "@/modules/inventory/components/part-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  const part = await repositories.inventory.findById(id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: part?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function PartDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const part = await repositories.inventory.findById(id);

  if (!part) notFound();
  return <PartDetailView part={part} />;
}
