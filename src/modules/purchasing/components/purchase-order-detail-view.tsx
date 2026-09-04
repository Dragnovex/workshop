"use client";

import { ArrowRight, FileWarning } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { DocumentActions } from "@/components/patterns/document-actions";
import { EmptyState } from "@/components/patterns/empty-state";
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
import { formatCurrency, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getPurchaseTotals } from "@/lib/services/purchasing-service";
import type { Supplier } from "@/modules/suppliers/types";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { purchaseOrderStore } from "../client-store";
import type { PurchaseOrder } from "../types";

/**
 * تفاصيل فاتورة/أمر الشراء.
 *
 * الفاتورة قد تكون مُنشأة من الواجهة ومحفوظة محليًا فقط — لذلك يستقبل
 * المكوّن بذرة الخادم ويحلّ المعرّف على العميل بعد الدمج.
 */
export function PurchaseOrderDetailView({
  id,
  seedOrders,
  suppliers,
}: {
  id: string;
  seedOrders: PurchaseOrder[];
  suppliers: Supplier[];
}) {
  const t = useTranslations("purchasing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [orders] = useState(() => purchaseOrderStore.load(seedOrders));
  const order = orders.find((item) => item.id === id);

  if (!order) {
    return <EmptyState icon={FileWarning} title={t("detail.notFoundTitle")} />;
  }

  const totals = getPurchaseTotals(order);
  const total = totals.total;
  const supplier = suppliers.find((item) => item.id === order.supplierId);

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
          <div className="flex flex-wrap items-center gap-2">
            <DocumentActions
              phone={supplier?.phone}
              message={t("detail.whatsappMessage", {
                number: order.invoiceNumber ?? order.number,
                total: formatMoney(total, locale),
                currency: tCommon("currency"),
              })}
            />
            <Button asChild variant="outline" size="sm" className="print:hidden">
              <Link href="/purchasing">
                <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
                {t("detail.back")}
              </Link>
            </Button>
          </div>
        }
      />

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("columns.supplier")} value={order.supplier[lang]} />
          <DetailRow label={t("detail.orderedAt")} value={formatDate(order.orderedAt, locale)} numeric />
          <DetailRow label={t("columns.expected")} value={formatDate(order.expectedAt, locale)} numeric />
          {order.invoiceNumber ? (
            <DetailRow label={t("columns.invoiceNumber")} value={order.invoiceNumber} />
          ) : null}
          {order.invoiceDate ? (
            <DetailRow label={t("columns.invoiceDate")} value={formatDate(order.invoiceDate, locale)} numeric />
          ) : null}
          {order.reference ? (
            <DetailRow label={t("columns.reference")} value={order.reference} />
          ) : null}
          {order.receivedAt ? (
            <DetailRow label={t("detail.receivedAt")} value={formatDate(order.receivedAt, locale)} numeric />
          ) : null}
          <DetailRow label={t("form.subtotal")} value={formatMoney(totals.subtotal, locale)} numeric />
          <DetailRow
            label={order.vatRate === 0 ? t("form.vatExempt") : t("form.vat")}
            value={formatMoney(totals.vat, locale)}
            numeric
          />
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
