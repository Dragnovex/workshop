import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { ReportBuilder } from "@/modules/reports/components/report-builder";
import { ReportsView } from "@/modules/reports/components/reports-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("title") };
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const reports = await repositories.reports.findAll();

  // منشئ التقارير يقرأ من نفس المستودع: كل مصدر مربوط بمورد صلاحية،
  // والفلترة والتحقق يتمّان في المكوّن.
  const workOrders = await repositories.workOrders.findAll();
  const purchaseOrders = await repositories.purchasing.findAll();
  const invoices = await repositories.invoices.findAll();
  const estimates = await repositories.estimates.findAll();
  const dailyClosings = await repositories.dailyClosings.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
      <ReportsView reports={reports} />
      <ReportBuilder
        workOrders={workOrders}
        purchaseOrders={purchaseOrders}
        invoices={invoices}
        estimates={estimates}
        dailyClosings={dailyClosings}
        customers={customers}
        vehicles={vehicles}
      />
    </div>
  );
}
