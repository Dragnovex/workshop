import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { BayGrid } from "@/modules/dashboard/components/bay-grid";
import { KpiGrid } from "@/modules/dashboard/components/kpi-grid";
import { PipelineBoard } from "@/modules/dashboard/components/pipeline-board";
import { RecentOrdersTable } from "@/modules/dashboard/components/recent-orders-table";
import { RevenueChart } from "@/modules/dashboard/components/revenue-chart";
import { TechnicianLoad } from "@/modules/dashboard/components/technician-load";
import {
  getBays,
  getDashboardKpis,
  getPipeline,
  getRecentOrders,
  getRevenueSeries,
  getTechnicianLoad,
} from "@/modules/dashboard/read-models";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const now = new Date();
  const kpis = getDashboardKpis(now);
  const pipeline = getPipeline();
  const revenueSeries = getRevenueSeries(now);
  const recentOrders = getRecentOrders(now);
  const technicians = getTechnicianLoad();
  const bays = getBays();

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title={t("revenue.title")}
          subtitle={t("revenue.subtitle")}
          className="xl:col-span-2"
        >
          <RevenueChart series={revenueSeries} />
        </SectionCard>
        <PipelineBoard pipeline={pipeline} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={recentOrders} />
        </div>
        <div className="flex flex-col gap-4">
          <TechnicianLoad technicians={technicians} />
          <BayGrid bays={bays} />
        </div>
      </div>
    </div>
  );
}
