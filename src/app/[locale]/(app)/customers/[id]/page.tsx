import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { CustomerDetailView } from "@/modules/customers/components/customer-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const customer = await repositories.customers.findById(id);
  // قد يكون العميل محفوظًا في localStorage فقط — العنوان الحقيقي "غير
  // موجود" يُقرَّر على العميل بعد الدمج، فلا نستبقه هنا.
  return {
    title: customer?.displayName[locale === "en" ? "en" : "ar"] ?? id,
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // عملاء الواجهة (من /customers/new) يعيشون في localStorage فقط ولا يراهم
  // الخادم. نمرّر بذرة الخادم كما هي؛ الدمج مع التخزين المحلي وحالة
  // "غير موجود" الحقيقية تتم على العميل (نفس نمط أوامر التشغيل والفواتير).
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();
  const workOrders = await repositories.workOrders.findAll();

  return (
    <CustomerDetailView
      id={id}
      initialCustomers={customers}
      vehicles={vehicles}
      workOrders={workOrders}
    />
  );
}
