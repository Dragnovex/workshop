import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PurchasingView } from "@/modules/purchasing/components/purchasing-view";
import { purchaseOrders } from "@/modules/purchasing/data";
import { getPurchaseOrderTotal } from "@/modules/purchasing/read-models";

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

  const pending = purchaseOrders.filter(
    (order) => order.status === "ordered" || order.status === "partiallyReceived",
  );
  const stats = {
    total: purchaseOrders.length,
    ordered: purchaseOrders.filter((order) => order.status === "ordered").length,
    partiallyReceived: purchaseOrders.filter((order) => order.status === "partiallyReceived").length,
    pendingValue: pending.reduce((sum, order) => sum + getPurchaseOrderTotal(order), 0),
  };

  return <PurchasingView orders={purchaseOrders} stats={stats} />;
}
