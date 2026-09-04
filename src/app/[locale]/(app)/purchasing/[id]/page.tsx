import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { PurchaseOrderDetailView } from "@/modules/purchasing/components/purchase-order-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await repositories.purchasing.findById(id);
  // الفاتورة قد تكون محفوظة في localStorage فقط (غير مرئية هنا) — نعرض
  // المعرّف كعنوان احتياطي بدل ادّعاء أنها غير موجودة.
  return { title: order?.number ?? id };
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // بذرة الخادم فقط؛ الدمج مع التخزين المحلي وقرار «غير موجود» على العميل.
  const orders = await repositories.purchasing.findAll();
  const suppliers = await repositories.suppliers.findAll();

  return (
    <PurchaseOrderDetailView id={id} seedOrders={orders} suppliers={suppliers} />
  );
}
