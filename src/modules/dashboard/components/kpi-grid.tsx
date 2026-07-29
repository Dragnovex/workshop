import {
  Car,
  ClipboardList,
  Clock3,
  PackageMinus,
  Stamp,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { StatCard } from "@/components/patterns/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardKpis } from "../read-models";

export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  const t = useTranslations("dashboard.kpi");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label={t("openWorkOrders")}
        value={formatNumber(kpis.openWorkOrders, locale)}
        icon={ClipboardList}
      />
      <StatCard
        label={t("vehiclesInWorkshop")}
        value={formatNumber(kpis.vehiclesInWorkshop, locale)}
        icon={Car}
      />
      {/* المؤشّر الوحيد الذي يحمل نبرة الهوية — الأحمر يعني «انظر هنا أولًا» */}
      <StatCard
        label={t("todayRevenue")}
        value={formatCurrency(kpis.todayRevenue, locale)}
        unit={tCommon("currency")}
        icon={Wallet}
        tone="accent"
      />
      <StatCard
        label={t("pendingApprovals")}
        value={formatNumber(kpis.pendingApprovals, locale)}
        icon={Stamp}
      />
      <StatCard
        label={t("avgTurnaround")}
        value={formatNumber(Math.round(kpis.avgTurnaroundHours * 10) / 10, locale)}
        unit={t("hours")}
        icon={Clock3}
      />
      <StatCard
        label={t("partsBelowMin")}
        value={formatNumber(kpis.partsBelowMin, locale)}
        unit={t("items")}
        icon={PackageMinus}
      />
    </div>
  );
}
