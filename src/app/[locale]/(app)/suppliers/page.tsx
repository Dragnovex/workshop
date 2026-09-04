import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SuppliersView } from "@/modules/suppliers/components/suppliers-view";
import { repositories } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "suppliers" });
  return { title: t("title") };
}

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const suppliers = await repositories.suppliers.findAll();

  return <SuppliersView suppliers={suppliers} />;
}
