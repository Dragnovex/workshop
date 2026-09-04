"use client";

import { Download, FileBarChart, Play, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/patterns/date-range-filter";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCan, useGuard } from "@/lib/auth/permission-context";
import { isWithinRange, type DateRange } from "@/lib/date-range";
import { downloadCsv } from "@/lib/export/csv";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getDailyClosingTotals } from "@/lib/services/daily-closing-service";
import { getInvoiceTotals } from "@/lib/services/invoice-service";
import { getPurchaseTotals } from "@/lib/services/purchasing-service";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { DailyClosing } from "@/modules/daily-closing/types";
import type { Estimate } from "@/modules/estimates/types";
import { getEstimateTotal } from "@/modules/estimates/read-models";
import type { Invoice } from "@/modules/invoices/types";
import type { PurchaseOrder } from "@/modules/purchasing/types";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { getWorkOrderTotals } from "@/modules/work-orders/read-models";
import type { WorkOrder } from "@/modules/work-orders/types";

import {
  reportSourceResource,
  reportSources,
  type ReportResult,
  type ReportSource,
} from "../builder";

/**
 * منشئ التقارير.
 *
 * الصلاحية تُفحص **مرتين**: عند بناء قائمة المصادر (فلا يظهر ما لا يُقرأ)،
 * وعند التوليد نفسه عبر `guard` — الأولى راحة استخدام والثانية هي المنع.
 * فحص واحد عند العرض كان سيسقط مع أول تغيير دور بعد اختيار المصدر.
 *
 * التقرير يُبنى على البيانات الممرَّرة من الخادم فقط: لا يقرأ localStorage
 * هنا عمدًا، فالتقرير مستند يُطبع ويُصدَّر ويجب أن يعكس مصدر البيانات
 * الرسمي لا مسودات جهاز واحد.
 */
export function ReportBuilder({
  workOrders,
  purchaseOrders,
  invoices,
  estimates,
  dailyClosings,
  customers,
  vehicles,
}: {
  workOrders: WorkOrder[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  estimates: Estimate[];
  dailyClosings: DailyClosing[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("reports.builder");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();
  const guard = useGuard();

  const availableSources = reportSources.filter((source) =>
    can(`${reportSourceResource[source]}:read`),
  );

  const [source, setSource] = useState<ReportSource>(availableSources[0] ?? "workOrders");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [result, setResult] = useState<ReportResult | null>(null);

  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  function build(selected: ReportSource): ReportResult {
    switch (selected) {
      case "workOrders": {
        const rows = workOrders
          .filter((order) => isWithinRange(order.receivedAt, range))
          .map((order) => {
            const totals = getWorkOrderTotals(order);
            const vehicle = vehiclesById.get(order.vehicleId);
            return [
              order.receivedAt.slice(0, 10),
              order.number,
              customersById.get(order.customerId)?.displayName[lang] ?? "",
              vehicle ? getVehicleDisplayName(vehicle, lang) : "",
              totals.labor,
              totals.parts,
              totals.total,
            ];
          });
        return {
          columns: [
            { key: "date", label: t("columns.date") },
            { key: "number", label: t("columns.number") },
            { key: "customer", label: t("columns.customer") },
            { key: "vehicle", label: t("columns.vehicle") },
            { key: "labor", label: t("columns.labor"), numeric: true },
            { key: "parts", label: t("columns.parts"), numeric: true },
            { key: "total", label: t("columns.total"), numeric: true },
          ],
          rows,
          totals: sumColumns(rows, [4, 5, 6], ["labor", "parts", "total"]),
        };
      }

      case "purchases": {
        const rows = purchaseOrders
          .filter((order) => isWithinRange(order.invoiceDate ?? order.orderedAt, range))
          .map((order) => {
            const totals = getPurchaseTotals(order);
            return [
              (order.invoiceDate ?? order.orderedAt).slice(0, 10),
              order.number,
              order.invoiceNumber ?? "",
              order.supplier[lang],
              totals.subtotal,
              totals.vat,
              totals.total,
            ];
          });
        return {
          columns: [
            { key: "date", label: t("columns.date") },
            { key: "number", label: t("columns.number") },
            { key: "invoiceNumber", label: t("columns.invoiceNumber") },
            { key: "supplier", label: t("columns.supplier") },
            { key: "subtotal", label: t("columns.subtotal"), numeric: true },
            { key: "vat", label: t("columns.vat"), numeric: true },
            { key: "total", label: t("columns.total"), numeric: true },
          ],
          rows,
          totals: sumColumns(rows, [4, 5, 6], ["subtotal", "vat", "total"]),
        };
      }

      case "returns": {
        const numberById = new Map(invoices.map((item) => [item.id, item.number]));
        const rows = invoices
          .filter(
            (invoice) =>
              invoice.documentType !== "invoice" &&
              isWithinRange(invoice.supplyDate, range),
          )
          .map((note) => [
            note.supplyDate.slice(0, 10),
            note.number,
            t(`noteType.${note.documentType}`),
            note.relatedInvoiceId ? (numberById.get(note.relatedInvoiceId) ?? "") : "",
            note.reasonForNote?.[lang] ?? "",
            getInvoiceTotals(note).total,
          ]);
        return {
          columns: [
            { key: "date", label: t("columns.date") },
            { key: "number", label: t("columns.number") },
            { key: "type", label: t("columns.type") },
            { key: "relatedInvoice", label: t("columns.relatedInvoice") },
            { key: "reason", label: t("columns.reason") },
            { key: "total", label: t("columns.total"), numeric: true },
          ],
          rows,
          totals: sumColumns(rows, [5], ["total"]),
        };
      }

      case "quotes": {
        const rows = estimates
          .filter((estimate) => isWithinRange(estimate.createdAt, range))
          .map((estimate) => [
            estimate.createdAt.slice(0, 10),
            estimate.number,
            customersById.get(estimate.customerId)?.displayName[lang] ?? "",
            t(`quoteStatus.${estimate.status}`),
            estimate.validUntil.slice(0, 10),
            getEstimateTotal(estimate),
          ]);
        return {
          columns: [
            { key: "date", label: t("columns.date") },
            { key: "number", label: t("columns.number") },
            { key: "customer", label: t("columns.customer") },
            { key: "status", label: t("columns.status") },
            { key: "validUntil", label: t("columns.validUntil") },
            { key: "total", label: t("columns.total"), numeric: true },
          ],
          rows,
          totals: sumColumns(rows, [5], ["total"]),
        };
      }

      case "dailyClosing": {
        const rows = dailyClosings
          .filter((closing) => isWithinRange(closing.date, range))
          .map((closing) => {
            const totals = getDailyClosingTotals(closing);
            return [
              closing.date.slice(0, 10),
              closing.entryNumber,
              closing.openingBalance,
              totals.inflow,
              totals.outflow,
              totals.dailyNet,
              totals.closingBalance,
            ];
          });
        return {
          columns: [
            { key: "date", label: t("columns.date") },
            { key: "entryNumber", label: t("columns.entryNumber") },
            { key: "opening", label: t("columns.opening"), numeric: true },
            { key: "inflow", label: t("columns.inflow"), numeric: true },
            { key: "outflow", label: t("columns.outflow"), numeric: true },
            { key: "net", label: t("columns.net"), numeric: true },
            { key: "closing", label: t("columns.closing"), numeric: true },
          ],
          rows,
          // الرصيد الافتتاحي والختامي **لا يُجمعان**: أرصدة لحظية لا
          // تدفّقات، وجمعها ينتج رقمًا بلا أي معنى محاسبي.
          totals: sumColumns(rows, [3, 4, 5], ["inflow", "outflow", "net"]),
        };
      }

      default:
        return { columns: [], rows: [], totals: {} };
    }
  }

  function handleGenerate() {
    // الحارس الفعلي: يرفض التوليد لا يخفي زرًا فقط.
    if (!guard(`${reportSourceResource[source]}:read`)) return;
    const built = build(source);
    setResult(built);
    if (built.rows.length === 0) toast.info(t("emptyResult"));
  }

  function handleExport() {
    if (!result) return;
    const ok = downloadCsv(
      `${source}-report-${new Date().toISOString().slice(0, 10)}`,
      result.columns.map((column) => column.label),
      result.rows,
    );
    toast[ok ? "success" : "error"](ok ? t("exported") : tCommon("storageSaveFailed"));
  }

  if (availableSources.length === 0) {
    return (
      <SectionCard title={t("title")} subtitle={t("noSources")} contentClassName="p-4">
        <p className="text-sm text-muted-foreground">{t("noSourcesBody")}</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <FileBarChart aria-hidden="true" className="size-4" />
          {t("title")}
        </span>
      }
      subtitle={t("subtitle")}
      contentClassName="flex flex-col gap-4 p-4"
      action={
        result ? (
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="size-4" />
              {tCommon("exportCsv")}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="size-4" />
              {tCommon("print")}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end print:hidden">
        <div className="grid gap-1.5">
          <Label htmlFor="report-source" className="text-xs">
            {t("source")}
          </Label>
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value as ReportSource);
              // النتيجة القديمة تُمسح عند تبديل المصدر: جدول مصدرٍ سابق
              // تحت عنوان مصدرٍ جديد قراءة خاطئة مضمونة.
              setResult(null);
            }}
          >
            <SelectTrigger id="report-source" className="w-full sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSources.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`sources.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateRangeFilter value={range} onChange={setRange} idPrefix="report" />

        <Button className="gap-2" onClick={handleGenerate}>
          <Play className="size-4" />
          {t("generate")}
        </Button>
      </div>

      {result ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {result.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`text-xs whitespace-nowrap ${column.numeric ? "text-end" : ""}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={result.columns.length}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                result.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => {
                      const column = result.columns[cellIndex];
                      return (
                        <TableCell
                          key={column.key}
                          data-numeric={column.numeric ? "" : undefined}
                          className={`text-sm ${column.numeric ? "text-end" : ""}`}
                        >
                          {column.numeric
                            ? formatMoney(Number(cell), locale)
                            : column.key === "date" || column.key === "validUntil"
                              ? formatDate(String(cell), locale)
                              : String(cell)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
            {result.rows.length > 0 ? (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  {result.columns.map((column, index) => {
                    if (index === 0) {
                      return (
                        <TableCell key={column.key} className="text-sm font-semibold">
                          {t("total", { count: formatNumber(result.rows.length, locale) })}
                        </TableCell>
                      );
                    }
                    const value = result.totals[column.key];
                    return (
                      <TableCell
                        key={column.key}
                        data-numeric={column.numeric ? "" : undefined}
                        className={`text-sm font-semibold ${column.numeric ? "text-end" : ""}`}
                      >
                        {value === undefined ? "" : formatMoney(value, locale)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      ) : null}
    </SectionCard>
  );
}

/** جمع أعمدة رقمية بمواضعها — يُستدعى مرة لكل مصدر. */
function sumColumns(
  rows: (string | number)[][],
  indexes: number[],
  keys: string[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  indexes.forEach((columnIndex, position) => {
    totals[keys[position]] = rows.reduce(
      (sum, row) => sum + Number(row[columnIndex] ?? 0),
      0,
    );
  });
  return totals;
}
