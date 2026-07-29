import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PurchaseOrderDetailView } from "@/modules/purchasing/components/purchase-order-detail-view";
import { purchaseOrders } from "@/modules/purchasing/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "purchasing" });
  const order = purchaseOrders.find((item) => item.id === id);
  return {
    title: order?.number ?? t("detail.notFoundTitle"),
  };
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const order = purchaseOrders.find((item) => item.id === id);

  if (!order) notFound();
  return <PurchaseOrderDetailView order={order} />;
}
