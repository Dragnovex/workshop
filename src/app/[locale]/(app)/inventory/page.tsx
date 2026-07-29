import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InventoryView } from "@/modules/inventory/components/inventory-view";
import { parts } from "@/modules/inventory/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  return { title: t("title") };
}

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <InventoryView parts={parts} />;
}
