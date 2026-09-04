import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { EstimateDetailView } from "@/modules/estimates/components/estimate-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const estimate = await repositories.estimates.findById(id);
  // قد يكون العرض محفوظًا في localStorage فقط (غير مرئي هنا) — نعرض
  // المعرّف كعنوان احتياطي بدل ادّعاء أنه غير موجود.
  return { title: estimate?.number ?? id };
}

export default async function EstimateDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // بذرة الخادم فقط؛ الدمج مع التخزين المحلي وقرار «غير موجود» على العميل.
  const customers = await repositories.customers.findAll();
  const estimates = await repositories.estimates.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <EstimateDetailView
      id={id}
      seedEstimates={estimates}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
