"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { getPurchaseOrderTotal } from "../read-models";
import type { PurchaseOrder } from "../types";

export function PurchaseOrderDetailView({ order }: { order: PurchaseOrder }) {
  const t = useTranslations("purchasing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const total = getPurchaseOrderTotal(order);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2" data-ltr>
            {order.number}
            <PurchaseOrderStatusBadge status={order.status} label={t(`status.${order.status}`)} />
          </span>
        }
        description={order.supplier[lang]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/purchasing">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("columns.supplier")} value={order.supplier[lang]} />
          <DetailRow label={t("detail.orderedAt")} value={formatDate(order.orderedAt, locale)} numeric />
          <DetailRow label={t("columns.expected")} value={formatDate(order.expectedAt, locale)} numeric />
        </dl>
      </SectionCard>

      <SectionCard title={t("detail.items")} contentClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("detail.columns.description")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("detail.columns.sku")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.qty")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.unitCost")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("detail.columns.lineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id} className="hover:bg-transparent">
                  <TableCell className="ps-4 text-sm">
                    {item.partId ? (
                      <Link href={`/inventory/${item.partId}`} className="hover:underline focus-visible:underline">
                        {item.description[lang]}
                      </Link>
                    ) : (
                      item.description[lang]
                    )}
                  </TableCell>
                  <TableCell data-ltr className="text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell data-numeric className="text-end text-sm">{formatNumber(item.qty, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm">{formatCurrency(item.unitCost, locale)}</TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm font-medium">
                    {formatCurrency(item.qty * item.unitCost, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="ps-4 text-end text-sm font-semibold">
                  {t("detail.total")}
                </TableCell>
                <TableCell data-numeric className="pe-4 text-end text-sm font-semibold">
                  {formatCurrency(total, locale)} {tCommon("currency")}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </SectionCard>

      {order.notes ? (
        <SectionCard title={t("detail.notes")}>
          <p className="text-sm text-muted-foreground">{order.notes[lang]}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
