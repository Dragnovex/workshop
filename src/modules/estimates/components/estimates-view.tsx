"use client";

import { CheckCircle2, FileText, Plus, Search, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { Button } from "@/components/ui/button";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
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
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useCan } from "@/lib/auth/permission-context";
import { useLocalCollection } from "@/lib/use-local-collection";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { loadStoredVehicles } from "@/modules/vehicles/client-store";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { EstimateStatusBadge } from "./estimate-status-badge";
import { QuoteDialog } from "./quote-dialog";
import { estimateStore, estimateTombstones, nextQuoteNumber } from "../client-store";
import { estimateStatuses, type Estimate, type EstimateStatus } from "../types";
import { getEstimateTotal, type EstimateReadModel } from "../read-models";

type StatusFilter = "all" | EstimateStatus;
type SortKey = "number" | "customer" | "total" | "validUntil";

const PAGE_SIZE = 10;

export function EstimatesView({
  estimates: seedModels,
  customers,
  vehicles,
}: {
  estimates: EstimateReadModel[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("estimates");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const {
    rows: storedEstimates,
    create,
    update,
    remove,
  } = useLocalCollection<Estimate>({
    resource: "estimates",
    seed: seedModels.map((model) => model.estimate),
    store: estimateStore,
    tombstones: estimateTombstones,
  });

  // العملاء والمركبات من التخزين المحلي أيضًا: عرض سعر لعميل أُنشئ من
  // الواجهة يجب أن يجد صاحبه.
  const [allCustomers] = useState(() => loadStoredCustomers(customers));
  const [allVehicles] = useState(() => loadStoredVehicles(vehicles));

  const [dialogEstimate, setDialogEstimate] = useState<Estimate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Estimate | null>(null);

  const estimates = useMemo(() => {
    const customersById = new Map(allCustomers.map((item) => [item.id, item]));
    const vehiclesById = new Map(allVehicles.map((item) => [item.id, item]));
    return storedEstimates.flatMap((estimate): EstimateReadModel[] => {
      const customer = customersById.get(estimate.customerId);
      const vehicle = vehiclesById.get(estimate.vehicleId);
      // عرض بلا عميل أو مركبة معروفَين لا يُعرض بدل إسقاط الصفحة كلها.
      if (!customer || !vehicle) return [];
      return [{ estimate, customer, vehicle, total: getEstimateTotal(estimate) }];
    });
  }, [allCustomers, allVehicles, storedEstimates]);

  const stats = useMemo(
    () => ({
      total: estimates.length,
      sent: estimates.filter(({ estimate }) => estimate.status === "sent").length,
      approved: estimates.filter(({ estimate }) => estimate.status === "approved").length,
      approvedValue: estimates
        .filter(({ estimate }) => estimate.status === "approved")
        .reduce((sum, model) => sum + model.total, 0),
    }),
    [estimates],
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("validUntil");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return estimates.filter(({ estimate, customer, vehicle }) => {
      if (statusFilter !== "all" && estimate.status !== statusFilter) return false;
      if (!query) return true;
      return (
        estimate.number.toLowerCase().includes(query) ||
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query) ||
        vehicle.plate.toLowerCase().includes(query)
      );
    });
  }, [estimates, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return factor * a.estimate.number.localeCompare(b.estimate.number);
        case "customer":
          return factor * a.customer.displayName[lang].localeCompare(b.customer.displayName[lang]);
        case "total":
          return factor * (a.total - b.total);
        case "validUntil":
          return factor * (Date.parse(a.estimate.validUntil) - Date.parse(b.estimate.validUntil));
        default:
          return 0;
      }
    });
  }, [filtered, lang, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {can("estimates:create") ? (
          <Button
            className="shrink-0 gap-2"
            onClick={() => {
              setDialogEstimate(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("newQuote")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={FileText} tone="accent" />
        <StatCard label={t("stats.sent")} value={formatNumber(stats.sent, locale)} icon={Send} />
        <StatCard label={t("stats.approved")} value={formatNumber(stats.approved, locale)} icon={CheckCircle2} />
        <StatCard
          label={t("stats.approvedValue")}
          value={formatCurrency(stats.approvedValue, locale)}
          unit={tCommon("currency")}
          icon={FileText}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="estimate-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="estimate-search"
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
            {estimateStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
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
                <SortableTableHead label={t("columns.customer")} sortKey="customer" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <SortableTableHead label={t("columns.total")} sortKey="total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.validUntil")} sortKey="validUntil" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(({ estimate, customer, vehicle, total }) => (
                  <TableRow key={estimate.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/estimates/${estimate.id}`}
                        aria-label={t("openEstimate", { number: estimate.number })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {estimate.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell data-numeric className="text-sm">{getVehicleDisplayName(vehicle, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatCurrency(total, locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(estimate.validUntil, locale)}
                    </TableCell>
                    <TableCell className="text-end">
                      <EstimateStatusBadge status={estimate.status} label={t(`status.${estimate.status}`)} />
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="estimates"
                        label={estimate.number}
                        onEdit={() => {
                          setDialogEstimate(estimate);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeleting(estimate)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <QuoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDialogEstimate(null);
        }}
        estimate={dialogEstimate}
        customers={allCustomers}
        vehicles={allVehicles}
        nextNumber={nextQuoteNumber(storedEstimates)}
        onSubmit={(next) => {
          const ok = dialogEstimate
            ? update(dialogEstimate.id, () => next)
            : create(next);
          if (ok) {
            toast.success(dialogEstimate ? tCommon("saved") : tCommon("createdSuccess"));
          }
          return ok;
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting?.number ?? ""}
        onConfirm={() => {
          if (deleting && remove(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
