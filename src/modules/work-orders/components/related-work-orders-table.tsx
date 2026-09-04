"use client";

import { ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import {
  getWorkOrderTotals,
  type WorkOrderReadModel,
} from "../read-models";

export function RelatedWorkOrdersTable({
  workOrders,
  showVehicle = false,
}: {
  workOrders: WorkOrderReadModel[];
  /** يُفعَّل من صفحة العميل حيث قد ترتبط الأوامر بأكثر من مركبة — غير مطلوب من صفحة المركبة. */
  showVehicle?: boolean;
}) {
  const t = useTranslations("workOrders");
  const tStatus = useTranslations("workOrders.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  if (workOrders.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t("relatedEmpty")}
        description={t("relatedEmptyDescription")}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="ps-4 text-xs whitespace-nowrap">
              {t("columns.number")}
            </TableHead>
            <TableHead className="text-xs whitespace-nowrap">
              {t("columns.status")}
            </TableHead>
            {showVehicle ? (
              <TableHead className="text-xs whitespace-nowrap">
                {t("columns.vehicle")}
              </TableHead>
            ) : null}
            <TableHead className="text-end text-xs whitespace-nowrap">
              {t("columns.total")}
            </TableHead>
            <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
              {t("columns.received")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map(({ order, vehicle }) => {
            const { total } = getWorkOrderTotals(order);
            return (
              <TableRow key={order.id} className="relative">
                <TableCell className="ps-4">
                  <Link
                    href={`/work-orders/${order.id}`}
                    aria-label={t("openOrder", { number: order.number })}
                    data-ltr
                    className="font-mono text-xs font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={order.status}
                    label={tStatus(order.status)}
                  />
                </TableCell>
                {showVehicle ? (
                  <TableCell data-numeric className="text-sm text-muted-foreground">
                    {getVehicleDisplayName(vehicle, locale)}
                  </TableCell>
                ) : null}
                <TableCell className="text-end whitespace-nowrap">
                  <span data-numeric className="text-sm font-medium">
                    {formatCurrency(total, locale)}
                  </span>
                  <span className="ms-1 text-2xs text-muted-foreground">
                    {tCommon("currency")}
                  </span>
                </TableCell>
                <TableCell data-numeric className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                  {formatDate(order.receivedAt, locale)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
