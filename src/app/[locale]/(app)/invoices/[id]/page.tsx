import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { InvoiceDetailView } from "@/modules/invoices/components/invoice-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const invoice = await repositories.invoices.findById(id);
  // قد تكون الفاتورة محفوظة في localStorage فقط (غير مرئية هنا) — العنوان
  // الحقيقي "غير موجودة" يُقرَّر على العميل بعد الدمج، فلا نستبقه هنا.
  return {
    title: invoice?.number ?? id,
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // الفواتير المُنشأة من الواجهة تعيش في localStorage فقط — لا يراها الخادم.
  // نمرّر بذرة الخادم كما هي؛ الدمج مع التخزين المحلي وحالة "غير موجودة"
  // الحقيقية تتم على العميل (نفس نمط أوامر التشغيل).
  const invoices = await repositories.invoices.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <InvoiceDetailView
      id={id}
      initialInvoices={invoices}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
