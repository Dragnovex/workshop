import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { WorkOrderDetailView } from "@/modules/work-orders/components/work-order-detail-view";
import { getWorkOrderRelations } from "@/modules/work-orders/read-models";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await repositories.workOrders.findById(id);

  // قد يكون الأمر محفوظًا في localStorage فقط — العنوان الحقيقي "غير
  // موجود" يُقرَّر على العميل بعد الدمج، فلا نستبقه هنا.
  return { title: order?.number ?? id };
}

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  // العلاقات تُحسب فقط لأوامر البذرة — الأوامر الجديدة بلا ارتباطات.
  const seedOrder = await repositories.workOrders.findById(id);
  const relations = seedOrder
    ? getWorkOrderRelations(seedOrder.id)
    : { appointmentId: undefined, estimateId: undefined, invoiceId: undefined };

  return (
    <WorkOrderDetailView
      id={id}
      initialOrders={workOrders}
      customers={customers}
      vehicles={vehicles}
      initialRelations={relations}
    />
  );
}
