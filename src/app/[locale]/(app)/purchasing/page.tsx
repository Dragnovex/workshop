import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { PurchasingView } from "@/modules/purchasing/components/purchasing-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "purchasing" });
  return { title: t("title") };
}

export default async function PurchasingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const purchaseOrders = await repositories.purchasing.findAll();
  // الموردون لاختيار مورّد الفاتورة، والقطع لأن الاستلام يزيد كمياتها.
  const suppliers = await repositories.suppliers.findAll();
  const parts = await repositories.inventory.findAll();

  return (
    <PurchasingView
      orders={purchaseOrders}
      suppliers={suppliers}
      parts={parts}
    />
  );
}
