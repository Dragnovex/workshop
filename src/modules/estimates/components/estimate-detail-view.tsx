"use client";

import { ArrowRight, Car, FileWarning, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { loadStoredVehicles } from "@/modules/vehicles/client-store";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { EstimateStatusBadge } from "./estimate-status-badge";
import { QuotePrint } from "./quote-print";
import { estimateStore } from "../client-store";
import type { Estimate } from "../types";
import { getEstimateTotal, type EstimateReadModel } from "../read-models";

/**
 * تفاصيل عرض السعر.
 *
 * العرض قد يكون محفوظًا في localStorage فقط ولا يراه الخادم — لذلك
 * يستقبل المكوّن بذرة الخادم ويحلّ المعرّف على العميل بعد الدمج، بدل
 * أن تُرجع الصفحة 404 لعرض أنشأه المستخدم قبل دقيقة.
 */
export function EstimateDetailView({
  id,
  seedEstimates,
  customers,
  vehicles,
}: {
  id: string;
  seedEstimates: Estimate[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("estimates");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [estimates] = useState(() => estimateStore.load(seedEstimates));
  const [allCustomers] = useState(() => loadStoredCustomers(customers));
  const [allVehicles] = useState(() => loadStoredVehicles(vehicles));

  const model = useMemo((): EstimateReadModel | null => {
    const estimate = estimates.find((item) => item.id === id);
    if (!estimate) return null;
    const customer = allCustomers.find((item) => item.id === estimate.customerId);
    const vehicle = allVehicles.find((item) => item.id === estimate.vehicleId);
    if (!customer || !vehicle) return null;
    return { estimate, customer, vehicle, total: getEstimateTotal(estimate) };
  }, [allCustomers, allVehicles, estimates, id]);

  if (!model) {
    return <EmptyState icon={FileWarning} title={t("detail.notFoundTitle")} />;
  }

  const { estimate, customer, vehicle, total } = model;

  return (
    <>
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 print:hidden">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2" data-ltr>
            {estimate.number}
            <EstimateStatusBadge status={estimate.status} label={t(`status.${estimate.status}`)} />
          </span>
        }
        description={t("detail.subtitle", { date: formatDate(estimate.createdAt, locale) })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* رسالة واتساب تحمل المرجع والإجمالي: العميل يحتاجهما لا رابطًا. */}
            <DocumentActions
              phone={customer.phone}
              message={t("detail.whatsappMessage", {
                number: estimate.number,
                total: formatCurrency(total, locale),
                currency: tCommon("currency"),
              })}
            />
            <Button asChild variant="outline" size="sm" className="print:hidden">
              <Link href="/estimates">
                <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
                {t("detail.back")}
              </Link>
            </Button>
          </div>
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
              {estimate.items.map((item) => (
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
                <TableCell colSpan={3} className="ps-4 text-end text-sm font-semibold">
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

      {estimate.linkedWorkOrderId ? (
        <SectionCard title={t("detail.linkedWorkOrder")}>
          <Link href={`/work-orders/${estimate.linkedWorkOrderId}`} data-ltr className="text-sm font-medium hover:underline focus-visible:underline">
            {estimate.linkedWorkOrderId}
          </Link>
        </SectionCard>
      ) : null}

      {estimate.notes ? (
        <SectionCard title={t("detail.notes")}>
          <p className="text-sm text-muted-foreground">{estimate.notes[lang]}</p>
        </SectionCard>
      ) : null}
    </div>

    {/* نسخة الطباعة الرسمية — مخفية على الشاشة، تظهر عند الطباعة فقط. */}
    <QuotePrint model={model} locale={locale} />
    </>
  );
}
