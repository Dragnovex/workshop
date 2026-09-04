"use client";

import { ArrowRight, Car, Lock, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DocumentActions } from "@/components/patterns/document-actions";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
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
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { formatAddress } from "@/lib/domain/address";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { loadStoredInvoices } from "../client-store";
import { InvoicePrint } from "./invoice-print";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { createLocalInvoiceReadModel } from "../read-models";
import type { Invoice } from "../types";

/**
 * الفواتير التي يُنشئها المستخدم تُحفظ في localStorage (لا باك-إند بعد)،
 * والصفحة الخادمية لا تراها أبدًا. لذلك — بنفس نمط أوامر التشغيل — يستقبل
 * هذا المكوّن بذرة الخادم فقط ويؤدّي الدمج مع التخزين المحلي على العميل،
 * مع حالة "غير موجودة" حقيقية بدل الاعتماد على notFound() في الخادم
 * (الذي كان يُخفي كل فاتورة أُنشئت من الواجهة، بما فيها فواتير العميل النقدي).
 */
export function InvoiceDetailView({
  id,
  initialInvoices,
  customers,
  vehicles,
}: {
  id: string;
  initialInvoices: Invoice[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [invoices] = useState<Invoice[]>(() => loadStoredInvoices(initialInvoices));
  const [storedCustomers] = useState<Customer[]>(() => loadStoredCustomers(customers));

  const model = useMemo(() => {
    const invoice = invoices.find((item) => item.id === id);
    if (!invoice) return null;
    return createLocalInvoiceReadModel(
      invoice,
      [...customers, ...storedCustomers],
      vehicles,
      locale,
    );
  }, [invoices, customers, storedCustomers, vehicles, id, locale]);

  if (!model) {
    return (
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">{t("detail.notFoundTitle")}</h1>
        <div>
          <Button asChild variant="outline">
            <Link href="/invoices">
              <ArrowRight className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { invoice, customer, vehicle, totals, locked } = model;
  const qr = model.qrPayload;

  const sellerAddress = invoice.sellerSnapshot.address ? formatAddress(invoice.sellerSnapshot.address, locale) : undefined;
  const buyerAddress = invoice.buyerSnapshot.address ? formatAddress(invoice.buyerSnapshot.address, locale) : undefined;

  return (
    <>
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 print:hidden">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2" data-ltr>
              {invoice.number}
              <InvoiceStatusBadge status={invoice.status} label={t(`status.${invoice.status}`)} />
              <Badge variant="secondary">{t(`kind.${invoice.kind}`)}</Badge>
              {locked ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock aria-hidden="true" className="size-3" />
                  {t("detail.locked")}
                </span>
              ) : null}
            </span>
          }
          description={t("detail.subtitle", { date: formatDate(invoice.supplyDate, locale) })}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* طباعة + تصدير PDF + إرسال واتساب — مجموعة واحدة لكل مستند رسمي. */}
              <DocumentActions
                phone={customer.phone}
                message={t("detail.whatsappMessage", {
                  number: invoice.number,
                  total: formatMoney(totals.total, locale),
                  currency: tCommon("currency"),
                })}
              />
              <Button asChild variant="outline" size="sm">
                <Link href="/invoices">
                  <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
                  {t("detail.back")}
                </Link>
              </Button>
            </div>
          }
        />

        {invoice.relatedInvoiceId ? (
          <SectionCard title={t("detail.noteInfo")}>
            <p className="text-sm text-muted-foreground">
              {t("detail.relatedInvoice")}{" "}
              <Link href={`/invoices/${invoice.relatedInvoiceId}`} data-ltr className="font-medium text-foreground hover:underline focus-visible:underline">
                {invoice.relatedInvoiceId}
              </Link>
            </p>
            {invoice.reasonForNote ? (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t("detail.reason")}: </span>
                {invoice.reasonForNote[lang]}
              </p>
            ) : null}
          </SectionCard>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard title={t("detail.seller")} contentClassName="p-0">
            <dl className="divide-y divide-border">
              <DetailRow label={t("detail.legalName")} value={invoice.sellerSnapshot.legalName[lang]} />
              {invoice.sellerSnapshot.vatNumber ? (
                <DetailRow label={t("detail.vatNumber")} value={invoice.sellerSnapshot.vatNumber} ltr numeric />
              ) : null}
              {invoice.sellerSnapshot.commercialRegistration ? (
                <DetailRow label={t("detail.commercialRegistration")} value={invoice.sellerSnapshot.commercialRegistration} ltr numeric />
              ) : null}
              {sellerAddress ? <DetailRow label={t("detail.address")} value={sellerAddress} /> : null}
            </dl>
          </SectionCard>

          <SectionCard title={t("detail.buyer")} contentClassName="p-0">
            <div className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <Link href={`/customers/${customer.id}`} className="font-medium hover:underline focus-visible:underline">
                  {invoice.buyerSnapshot.legalName[lang]}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`customerKind.${customer.kind}`)}</p>
              </div>
            </div>
            <dl className="divide-y divide-border border-t border-border">
              {invoice.buyerSnapshot.vatNumber ? (
                <DetailRow label={t("detail.vatNumber")} value={invoice.buyerSnapshot.vatNumber} ltr numeric />
              ) : null}
              {invoice.buyerSnapshot.commercialRegistration ? (
                <DetailRow label={t("detail.commercialRegistration")} value={invoice.buyerSnapshot.commercialRegistration} ltr numeric />
              ) : null}
              {buyerAddress ? <DetailRow label={t("detail.address")} value={buyerAddress} /> : null}
              {vehicle ? (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Car aria-hidden="true" className="size-3.5" />
                    {t("detail.vehicle")}
                  </dt>
                  <dd className="text-end text-sm font-medium">
                    <Link href={`/vehicles/${vehicle.id}`} data-numeric className="hover:underline focus-visible:underline">
                      {getVehicleDisplayName(vehicle, locale)}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
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
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.discount")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("detail.columns.taxCategory")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("detail.columns.tax")}</TableHead>
                  <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("detail.columns.lineTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => {
                  const gross = item.qty * item.unitPrice;
                  const taxableAmount = gross - item.discount;
                  const taxAmount = item.taxCategory === "standard" ? taxableAmount * item.taxRate : 0;
                  return (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell className="ps-4 text-sm">
                        <div>{item.description[lang]}</div>
                        {item.exemptionReason ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.exemptionReason[lang]}</p>
                        ) : null}
                      </TableCell>
                      <TableCell data-numeric className="text-end text-sm">{item.qty}</TableCell>
                      <TableCell data-numeric className="text-end text-sm">{formatMoney(item.unitPrice, locale)}</TableCell>
                      <TableCell data-numeric className="text-end text-sm">{formatMoney(item.discount, locale)}</TableCell>
                      <TableCell><Badge variant="secondary">{t(`taxCategory.${item.taxCategory}`)}</Badge></TableCell>
                      <TableCell data-numeric className="text-end text-sm">{formatMoney(taxAmount, locale)}</TableCell>
                      <TableCell data-numeric className="pe-4 text-end text-sm font-medium">
                        {formatMoney(taxableAmount + taxAmount, locale)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="ps-4 text-end text-sm text-muted-foreground">{t("detail.subtotal")}</TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm">{formatMoney(totals.subtotal, locale)}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="ps-4 text-end text-sm text-muted-foreground">{t("detail.taxTotal")}</TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm">{formatMoney(totals.taxTotal, locale)}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="ps-4 text-end text-sm font-semibold">{t("detail.grandTotal")}</TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-sm font-semibold">
                    {formatMoney(totals.total, locale)} {tCommon("currency")}
                  </TableCell>
                </TableRow>
                {totals.balanceDue > 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="ps-4 text-end text-sm font-semibold text-warning-text">{t("detail.balanceDue")}</TableCell>
                    <TableCell data-numeric className="pe-4 text-end text-sm font-semibold text-warning-text">
                      {formatMoney(totals.balanceDue, locale)} {tCommon("currency")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableFooter>
            </Table>
          </div>
        </SectionCard>

        {qr ? (
          <SectionCard title={t("detail.qrTitle")} subtitle={t("detail.qrSubtitle")}>
            <p dir="ltr" className="break-all rounded-md bg-surface-subtle p-3 font-mono text-xs">{qr}</p>
          </SectionCard>
        ) : null}

        {(invoice.linkedWorkOrderId || invoice.linkedEstimateId) ? (
          <SectionCard title={t("detail.links")}>
            <div className="flex flex-wrap gap-4 text-sm">
              {invoice.linkedWorkOrderId ? (
                <Link href={`/work-orders/${invoice.linkedWorkOrderId}`} data-ltr className="font-medium hover:underline focus-visible:underline">
                  {t("detail.linkedWorkOrder")}: {invoice.linkedWorkOrderId}
                </Link>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        <SectionCard title={t("detail.auditLog")} contentClassName="p-0">
          <ul className="divide-y divide-border">
            {invoice.auditLog.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    {entry.action[lang]}
                    {entry.isManualAdjustment ? (
                      <Badge variant="secondary" className="ms-2 bg-warning-subtle text-warning-text">
                        {t("detail.manualAdjustment")}
                      </Badge>
                    ) : null}
                  </p>
                  {entry.note ? <p className="mt-0.5 text-xs text-muted-foreground">{entry.note[lang]}</p> : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.actor[lang]}</p>
                </div>
                <span data-numeric className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                  {formatDateTime(entry.timestamp, locale)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <InvoicePrint model={model} locale={locale} />
    </>
  );
}

function DetailRow({
  label,
  value,
  ltr = false,
  numeric = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-ltr={ltr ? "" : undefined} data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
