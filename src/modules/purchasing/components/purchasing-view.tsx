"use client";

import { CheckCircle2, PackageCheck, PackageSearch, Plus, Search, Truck } from "lucide-react";
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
import { newLocalId } from "@/lib/client-store";
import { useCan, useGuard } from "@/lib/auth/permission-context";
import { useLocalCollection } from "@/lib/use-local-collection";
import { applyReceiptToParts, getPurchaseTotals } from "@/lib/services/purchasing-service";
import type { Part } from "@/modules/inventory/types";
import { partStore, partTombstones } from "@/modules/inventory/client-store";
import type { Supplier } from "@/modules/suppliers/types";
import { PurchaseInvoiceDialog } from "./purchase-invoice-dialog";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { purchaseOrderStore, purchaseOrderTombstones } from "../client-store";
import { purchaseOrderStatuses, type PurchaseOrder, type PurchaseOrderStatus } from "../types";

type StatusFilter = "all" | PurchaseOrderStatus;
type SortKey = "number" | "supplier" | "total" | "expected";

const PAGE_SIZE = 10;

export function PurchasingView({
  orders: seedOrders,
  suppliers,
  parts: seedParts,
}: {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  parts: Part[];
}) {
  const t = useTranslations("purchasing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();
  const guard = useGuard();

  const {
    rows: orders,
    create: createOrder,
    update: updateOrder,
    remove: removeOrder,
  } = useLocalCollection<PurchaseOrder>({
    resource: "purchasing",
    seed: seedOrders,
    store: purchaseOrderStore,
    tombstones: purchaseOrderTombstones,
  });

  // المخزون يُحمَّل هنا أيضًا: استلام فاتورة شراء يزيد الكميات فعليًا،
  // وهو الرابط الذي كان مفقودًا بين المشتريات والمخزون.
  const { rows: parts, replaceAll: replaceParts } = useLocalCollection<Part>({
    resource: "inventory",
    seed: seedParts,
    store: partStore,
    tombstones: partTombstones,
  });

  const [dialogOrder, setDialogOrder] = useState<PurchaseOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<PurchaseOrder | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => order.status === "ordered" || order.status === "partiallyReceived",
    );
    return {
      total: orders.length,
      ordered: orders.filter((order) => order.status === "ordered").length,
      partiallyReceived: orders.filter(
        (order) => order.status === "partiallyReceived",
      ).length,
      pendingValue: pending.reduce(
        (sum, order) => sum + getPurchaseTotals(order).total,
        0,
      ),
    };
  }, [orders]);

  /**
   * استلام الفاتورة: يزيد كميات المخزون **مرة واحدة فقط**.
   * `receivedAt` هو الحارس — بدونه كان ضغط الزر مرتين يضاعف المخزون.
   */
  function handleReceive(order: PurchaseOrder) {
    if (!guard("inventory:update")) return;
    if (order.receivedAt) {
      toast.error(t("receive.alreadyReceived"));
      return;
    }

    const result = applyReceiptToParts(order, parts, newLocalId);

    // كتابة واحدة لكل القطع: تحديثها واحدة واحدة كان يجعل كل نداء يكتب
    // فوق سابقه (كلها تُغلِق على نفس لقطة الحالة) فلا تزيد الكميات فعليًا
    // بينما تُعلَّم الفاتورة مستلَمة — خلل حقيقي رُصد في فحص حي.
    if (!replaceParts(result.parts)) return;

    // المخزون أولًا ثم ختم الاستلام: لو فشلت كتابة المخزون تبقى الفاتورة
    // غير مستلَمة ويمكن إعادة المحاولة، والعكس كان سيفقد الكميات نهائيًا.
    const ok = updateOrder(order.id, (item) => ({
      ...item,
      status: "received",
      receivedAt: new Date().toISOString(),
    }));
    if (!ok) return;

    toast.success(
      t("receive.done", { created: result.created, updated: result.updated }),
    );
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("expected");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!query) return true;
      return (
        order.number.toLowerCase().includes(query) ||
        order.supplier.ar.toLowerCase().includes(query) ||
        order.supplier.en.toLowerCase().includes(query) ||
        (order.invoiceNumber?.toLowerCase().includes(query) ?? false) ||
        (order.reference?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [orders, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return factor * a.number.localeCompare(b.number);
        case "supplier":
          return factor * a.supplier[lang].localeCompare(b.supplier[lang]);
        case "total":
          return factor * (getPurchaseTotals(a).total - getPurchaseTotals(b).total);
        case "expected":
          return factor * (Date.parse(a.expectedAt) - Date.parse(b.expectedAt));
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
        {can("purchasing:create") ? (
          <Button
            className="shrink-0 gap-2"
            onClick={() => {
              setDialogOrder(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("newInvoice")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={PackageSearch} tone="accent" />
        <StatCard label={t("stats.ordered")} value={formatNumber(stats.ordered, locale)} icon={Truck} />
        <StatCard label={t("stats.partiallyReceived")} value={formatNumber(stats.partiallyReceived, locale)} icon={CheckCircle2} />
        <StatCard
          label={t("stats.pendingValue")}
          value={formatCurrency(stats.pendingValue, locale)}
          unit={tCommon("currency")}
          icon={PackageSearch}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="po-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="po-search"
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
            {purchaseOrderStatuses.map((status) => (
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
                <SortableTableHead label={t("columns.supplier")} sortKey="supplier" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <SortableTableHead label={t("columns.total")} sortKey="total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.expected")} sortKey="expected" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.invoiceNumber")}</TableHead>
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
                paged.map((order) => (
                  <TableRow key={order.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/purchasing/${order.id}`}
                        aria-label={t("openOrder", { number: order.number })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-sm">{order.supplier[lang]}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatCurrency(getPurchaseTotals(order).total, locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(order.expectedAt, locale)}
                    </TableCell>
                    <TableCell data-ltr className="text-xs text-muted-foreground">
                      {order.invoiceNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <PurchaseOrderStatusBadge status={order.status} label={t(`status.${order.status}`)} />
                    </TableCell>
                    <TableCell className="pe-4">
                      <div className="relative z-10 flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                        {/* الاستلام يُدخل القطع للمخزون فعليًا — يظهر مرة واحدة
                            لكل فاتورة ويختفي بعدها. */}
                        {!order.receivedAt && can("inventory:update") ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`${t("receive.action")} — ${order.number}`}
                            title={t("receive.action")}
                            onClick={() => setReceiving(order)}
                          >
                            <PackageCheck className="size-4" />
                          </Button>
                        ) : null}
                        <RowActions
                          resource="purchasing"
                          label={order.number}
                          onEdit={() => {
                            setDialogOrder(order);
                            setDialogOpen(true);
                          }}
                          onDelete={() => setDeleting(order)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <PurchaseInvoiceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDialogOrder(null);
        }}
        order={dialogOrder}
        suppliers={suppliers}
        onSubmit={(next) => {
          const ok = dialogOrder
            ? updateOrder(dialogOrder.id, () => next)
            : createOrder(next);
          if (ok) {
            toast.success(dialogOrder ? tCommon("saved") : tCommon("createdSuccess"));
          }
          return ok;
        }}
      />

      {/* الاستلام غير قابل للتراجع (يزيد كميات المخزون) — لذلك تأكيد صريح
          يسمّي الفاتورة، بنفس نمط تأكيد الحذف. */}
      <ConfirmDeleteDialog
        open={receiving !== null}
        onOpenChange={(open) => {
          if (!open) setReceiving(null);
        }}
        name={receiving?.number ?? ""}
        title={t("receive.action")}
        confirmLabel={t("receive.confirmButton")}
        description={
          receiving
            ? t("receive.confirm", {
                number: receiving.number,
                count: receiving.items.length,
              })
            : undefined
        }
        onConfirm={() => {
          if (receiving) handleReceive(receiving);
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting?.number ?? ""}
        onConfirm={() => {
          if (deleting && removeOrder(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
