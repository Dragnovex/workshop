"use client";

import { AlertCircle, CheckCircle2, Receipt, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocalCollection } from "@/lib/use-local-collection";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { getInvoiceTotals } from "@/lib/services/invoice-service";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { invoiceStore, invoiceTombstones } from "../client-store";
import { isWalkInCustomerId, walkInCustomer } from "../walk-in-customer";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import {
  invoiceKinds,
  invoiceStatuses,
  type Invoice,
  type InvoiceKind,
  type InvoiceStatus,
} from "../types";
import type { InvoiceReadModel } from "../read-models";

type StatusFilter = "all" | InvoiceStatus;
type KindFilter = "all" | InvoiceKind;
type SortKey = "number" | "customer" | "total" | "supplyDate";

const PAGE_SIZE = 10;

export function InvoicesView({
  invoices,
  customers,
  vehicles,
}: {
  invoices: InvoiceReadModel[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("supplyDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const router = useRouter();

  // الفواتير المخزنة محليًا (مسودات من /invoices/new أو من التعديل) مدموجة
  // مع بذرة البيانات، مع حذف فعلي للمسودات.
  const { rows: storedInvoices, remove: removeInvoice } =
    useLocalCollection<Invoice>({
      resource: "invoices",
      seed: invoices.map((model) => model.invoice),
      store: invoiceStore,
      tombstones: invoiceTombstones,
    });

  // قراءة localStorage تتم مرة واحدة في مُهيّئ الحالة، لا داخل جسم الرندر:
  // القراءة داخل useMemo تعيد قيمة تختلف عن رندر الخادم عند كل إعادة حساب.
  const [storedCustomers] = useState(() => loadStoredCustomers(customers));

  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const allModels = useMemo(() => {
    const seedById = new Map(invoices.map((model) => [model.invoice.id, model]));
    const customersById = new Map(
      storedCustomers.map((customer) => [customer.id, customer]),
    );
    const vehiclesById = new Map(
      vehicles.map((vehicle) => [vehicle.id, vehicle]),
    );
    return storedInvoices.flatMap((invoice): InvoiceReadModel[] => {
      // بذرة الخادم تحمل القفل ورمز QR المحسوبين هناك — نأخذهما منها
      // ونستبدل جسم الفاتورة بأحدث نسخة محلية.
      const seedModel = seedById.get(invoice.id);
      if (seedModel) {
        return [{ ...seedModel, invoice, totals: getInvoiceTotals(invoice) }];
      }
      // العميل النقدي (walk-in) يبقى في القائمة بدل أن يُسقَط بصمت —
      // إسقاطه يعني اختفاء فاتورة صادرة فعليًا من كل شاشات النظام.
      // فاتورة بمعرّف عميل غير معروف إطلاقًا (تلف بيانات) تبقى مُستثناة.
      const customer =
        customersById.get(invoice.customerId) ??
        (isWalkInCustomerId(invoice.customerId) ? walkInCustomer : undefined);
      if (!customer) return [];
      return [
        {
          invoice,
          customer,
          vehicle: invoice.vehicleId
            ? vehiclesById.get(invoice.vehicleId)
            : undefined,
          totals: getInvoiceTotals(invoice),
          locked: false,
          qrPayload: null,
        },
      ];
    });
  }, [invoices, storedInvoices, storedCustomers, vehicles]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allModels.filter(({ invoice, customer, vehicle }) => {
      if (invoice.documentType !== "invoice") return false;
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      if (kindFilter !== "all" && invoice.kind !== kindFilter) return false;
      if (!query) return true;
      return (
        invoice.number.toLowerCase().includes(query) ||
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query) ||
        (vehicle?.plate.toLowerCase().includes(query) ?? false)
      );
    });
  }, [allModels, kindFilter, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return factor * a.invoice.number.localeCompare(b.invoice.number);
        case "customer":
          return factor * a.customer.displayName[lang].localeCompare(b.customer.displayName[lang]);
        case "total":
          return factor * (a.totals.total - b.totals.total);
        case "supplyDate":
          return factor * (Date.parse(a.invoice.supplyDate) - Date.parse(b.invoice.supplyDate));
        default:
          return 0;
      }
    });
  }, [filtered, lang, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // المؤشرات تُحسب من القائمة المعروضة نفسها حتى لا يبقى رقم بذرة يناقض
  // الجدول بعد حذف مسودة أو تعديلها.
  const mergedStats = useMemo(
    () => ({
      total: allModels.length,
      overdue: allModels.filter(({ invoice }) => invoice.status === "overdue").length,
      paid: allModels.filter(({ invoice }) => invoice.status === "paid").length,
      outstandingValue: allModels.reduce(
        (sum, { totals, invoice }) =>
          invoice.status === "cancelled" ? sum : sum + totals.balanceDue,
        0,
      ),
    }),
    [allModels],
  );

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(mergedStats.total, locale)} icon={Receipt} tone="accent" />
        <StatCard label={t("stats.overdue")} value={formatNumber(mergedStats.overdue, locale)} icon={AlertCircle} />
        <StatCard label={t("stats.paid")} value={formatNumber(mergedStats.paid, locale)} icon={CheckCircle2} />
        <StatCard
          label={t("stats.outstandingValue")}
          value={formatMoney(mergedStats.outstandingValue, locale)}
          unit={tCommon("currency")}
          icon={Receipt}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="invoice-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="invoice-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={kindFilter}
          onValueChange={(value) => {
            setKindFilter(value as KindFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("kindFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllKinds")}</SelectItem>
            {invoiceKinds.map((kind) => (
              <SelectItem key={kind} value={kind}>{t(`kind.${kind}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {invoiceStatuses.map((status) => (
              <SelectItem key={status} value={status}>{t(`status.${status}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.number")} sortKey="number" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.kind")}</TableHead>
                <SortableTableHead label={t("columns.customer")} sortKey="customer" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <SortableTableHead label={t("columns.total")} sortKey="total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.supplyDate")} sortKey="supplyDate" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(({ invoice, customer, vehicle, totals }) => (
                  <TableRow key={invoice.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        aria-label={t("openInvoice", { number: invoice.number })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t(`kind.${invoice.kind}`)}</Badge></TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell data-numeric className="text-sm">{vehicle ? getVehicleDisplayName(vehicle, locale) : "—"}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.total, locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(invoice.supplyDate, locale)}
                    </TableCell>
                    <TableCell className="text-end">
                      <InvoiceStatusBadge status={invoice.status} label={t(`status.${invoice.status}`)} />
                    </TableCell>
                    <TableCell className="pe-4">
                      {/*
                        المسودة وحدها تُعدَّل وتُحذف. الفاتورة المُصدَرة مقفلة
                        نظاميًا — تصحيحها بإشعار دائن/مدين لا بتغييرها.
                      */}
                      {invoice.status === "draft" ? (
                        <RowActions
                          resource="invoices"
                          label={invoice.number}
                          onEdit={() => router.push(`/invoices/${invoice.id}/edit`)}
                          onDelete={() => setDeleting(invoice)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting?.number ?? ""}
        onConfirm={() => {
          if (deleting && removeInvoice(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
