import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { SectionCard } from "@/components/patterns/section-card";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatRelativeMinutes } from "@/lib/format";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import type { getRecentOrders } from "../read-models";

export function RecentOrdersTable({
  orders,
}: {
  orders: ReturnType<typeof getRecentOrders>;
}) {
  const t = useTranslations("dashboard.recentOrders");
  const tStatus = useTranslations("workOrders.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <SectionCard
      title={t("title")}
      subtitle={t("subtitle")}
      contentClassName="p-0"
      action={
        <Button variant="ghost" size="sm" asChild className="h-7 gap-1 text-xs">
          <Link href="/work-orders">
            {tCommon("viewAll")}
            <ArrowLeft className="size-3.5 ltr:rotate-180" />
          </Link>
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-4 text-xs whitespace-nowrap">
                {t("columns.number")}
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">
                {t("columns.customer")}
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">
                {t("columns.vehicle")}
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">
                {t("columns.status")}
              </TableHead>
              <TableHead className="text-xs whitespace-nowrap">
                {t("columns.technician")}
              </TableHead>
              <TableHead className="text-end text-xs whitespace-nowrap">
                {t("columns.total")}
              </TableHead>
              <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                {t("columns.updated")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(({ order, customer, vehicle, totals, minutesAgo }) => (
              <TableRow key={order.id} className="group relative">
                <TableCell className="ps-4">
                  <Link
                    href={`/work-orders/${order.id}`}
                    data-ltr
                    className="font-mono text-xs font-medium whitespace-nowrap outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[12rem] truncate text-sm">
                  {customer.displayName[lang]}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span data-numeric className="max-w-[13rem] truncate text-sm">
                      {getVehicleDisplayName(vehicle, locale)}
                    </span>
                    <span data-ltr className="font-mono text-2xs text-muted-foreground">
                      {vehicle.plate}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={order.status}
                    label={tStatus(order.status)}
                  />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {order.technician[lang]}
                </TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  <span data-numeric className="text-sm font-medium">
                    {formatCurrency(totals.total, locale)}
                  </span>
                  <span className="ms-1 text-2xs text-muted-foreground">
                    {tCommon("currency")}
                  </span>
                </TableCell>
                <TableCell className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                  {formatRelativeMinutes(minutesAgo, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
