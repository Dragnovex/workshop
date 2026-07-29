"use client";

import { ArrowRight, Car, UserRound } from "lucide-react";
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
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { InvoiceReadModel } from "../read-models";

export function InvoiceDetailView({ model }: { model: InvoiceReadModel }) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const { invoice, customer, vehicle, subtotal, vat, total, balanceDue } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2" data-ltr>
            {invoice.number}
            <InvoiceStatusBadge status={invoice.status} label={t(`status.${invoice.status}`)} />
          </span>
        }
        description={t("detail.subtitle", { date: formatDate(invoice.issuedAt, locale) })}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/invoices">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("detail.customer")} contentClassName="p-0">
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <Link href={`/customers/${customer.id}`} className="font-medium hover:underline focus-visible:underline">
                {customer.displayName[lang]}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(`customerKind.${customer.kind}`)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("detail.vehicle")} contentClassName="p-0">
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Car aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <Link href={`/vehicles/${vehicle.id}`} data-numeric className="font-medium hover:underline focus-visible:underline">
                {getVehicleDisplayName(vehicle, locale)}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground" data-ltr>{vehicle.plate}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("detail.items")} contentClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("detail.columns.description")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.qty")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.unitPrice")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("detail.columns.lineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id} className="hover:bg-transparent">
                  <TableCell className="ps-4 text-sm">{item.description[lang]}</TableCell>
                  <TableCell data-numeric className="text-end text-sm">{formatNumber(item.qty, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm">{formatCurrency(item.unitPrice, locale)}</TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm font-medium">
                    {formatCurrency(item.qty * item.unitPrice, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="ps-4 text-end text-sm text-muted-foreground">{t("detail.subtotal")}</TableCell>
                <TableCell data-numeric className="pe-4 text-end text-sm">{formatCurrency(subtotal, locale)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="ps-4 text-end text-sm text-muted-foreground">
                  {t("detail.vat", { rate: Math.round(invoice.vatRate * 100) })}
                </TableCell>
                <TableCell data-numeric className="pe-4 text-end text-sm">{formatCurrency(vat, locale)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="ps-4 text-end text-sm font-semibold">{t("detail.total")}</TableCell>
                <TableCell data-numeric className="pe-4 text-end text-sm font-semibold">
                  {formatCurrency(total, locale)} {tCommon("currency")}
                </TableCell>
              </TableRow>
              {balanceDue > 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="ps-4 text-end text-sm font-semibold text-warning-text">
                    {t("detail.balanceDue")}
                  </TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm font-semibold text-warning-text">
                    {formatCurrency(balanceDue, locale)} {tCommon("currency")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableFooter>
          </Table>
        </div>
      </SectionCard>

      {invoice.linkedWorkOrderId ? (
        <SectionCard title={t("detail.linkedWorkOrder")}>
          <Link href={`/work-orders/${invoice.linkedWorkOrderId}`} data-ltr className="text-sm font-medium hover:underline focus-visible:underline">
            {invoice.linkedWorkOrderId}
          </Link>
        </SectionCard>
      ) : null}
    </div>
  );
}
