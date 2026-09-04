"use client";

import { FileMinus, FilePlus, Plus, RotateCcw, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import { DateRangeFilter } from "@/components/patterns/date-range-filter";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import {
  SortableTableHead,
  nextSortState,
  type SortDirection,
} from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useCan } from "@/lib/auth/permission-context";
import { isWithinRange, type DateRange } from "@/lib/date-range";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getInvoiceTotals } from "@/lib/services/invoice-service";
import { useLocalCollection } from "@/lib/use-local-collection";
import type { Customer } from "@/lib/domain/contracts";
import { invoiceStore, invoiceTombstones } from "@/modules/invoices/client-store";
import { isWalkInCustomerId, walkInCustomer } from "@/modules/invoices/walk-in-customer";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import type { Invoice, InvoiceDocumentType } from "@/modules/invoices/types";

import { ReturnNoteDialog } from "./return-note-dialog";

type TypeFilter = "all" | InvoiceDocumentType;
type SortKey = "number" | "date" | "total";

const PAGE_SIZE = 10;

/**
 * سجل المردود — إشعارات دائنة ومدينة.
 *
 * الإشعارات تعيش في **نفس مجموعة الفواتير** لأنها مستندات ضريبية من نفس
 * النوع (`documentType`)، لا في جدول موازٍ: فصلها كان سيعني ترقيمًا
 * وتسلسلًا ولقطات أطراف مكرّرة تنحرف عن الأصل.
 * قائمة الفواتير تعرض `documentType === "invoice"` فقط، وهذه الشاشة تعرض
 * الباقي — فلا ازدواج في العرض.
 */
export function ReturnsView({
  invoices: seedInvoices,
  customers,
}: {
  invoices: Invoice[];
  customers: Customer[];
}) {
  const t = useTranslations("returns");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const {
    rows: allDocuments,
    create,
    update,
    remove,
  } = useLocalCollection<Invoice>({
    resource: "returns",
    seed: seedInvoices,
    store: invoiceStore,
    tombstones: invoiceTombstones,
  });

  const [allCustomers] = useState(() => loadStoredCustomers(customers));

  const [dialogNote, setDialogNote] = useState<Invoice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [sortKey, setSortKey] = useState<SortKey | null>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  /** الفواتير الأصلية القابلة للربط: المُصدَرة فقط، لا المسودات. */
  const sourceInvoices = useMemo(
    () =>
      allDocuments.filter(
        (item) => item.documentType === "invoice" && item.status !== "draft",
      ),
    [allDocuments],
  );

  const notes = useMemo(
    () => allDocuments.filter((item) => item.documentType !== "invoice"),
    [allDocuments],
  );

  const customerName = useMemo(() => {
    const byId = new Map(allCustomers.map((customer) => [customer.id, customer]));
    return (invoice: Invoice) => {
      const customer = byId.get(invoice.customerId);
      if (customer) return customer.displayName[lang];
      // العميل النقدي ليس في السجل — اسمه من لقطة المستند نفسه.
      if (isWalkInCustomerId(invoice.customerId)) return walkInCustomer.displayName[lang];
      return invoice.buyerSnapshot.legalName[lang];
    };
  }, [allCustomers, lang]);

  const invoiceNumberById = useMemo(() => {
    const byId = new Map(allDocuments.map((item) => [item.id, item.number]));
    return (id: string | undefined) => (id ? (byId.get(id) ?? id) : "—");
  }, [allDocuments]);

  const stats = useMemo(() => {
    const credit = notes.filter((note) => note.documentType === "creditNote");
    const debit = notes.filter((note) => note.documentType === "debitNote");
    return {
      total: notes.length,
      creditCount: credit.length,
      debitCount: debit.length,
      creditValue: credit.reduce((sum, note) => sum + getInvoiceTotals(note).total, 0),
    };
  }, [notes]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      if (typeFilter !== "all" && note.documentType !== typeFilter) return false;
      if (!isWithinRange(note.supplyDate, range)) return false;
      if (!query) return true;
      return (
        note.number.toLowerCase().includes(query) ||
        invoiceNumberById(note.relatedInvoiceId).toLowerCase().includes(query) ||
        customerName(note).toLowerCase().includes(query) ||
        (note.reasonForNote?.ar.toLowerCase().includes(query) ?? false) ||
        (note.reasonForNote?.en.toLowerCase().includes(query) ?? false)
      );
    });
  }, [customerName, invoiceNumberById, notes, range, search, typeFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return factor * a.number.localeCompare(b.number);
        case "date":
          return factor * (Date.parse(a.supplyDate) - Date.parse(b.supplyDate));
        case "total":
          return factor * (getInvoiceTotals(a).total - getInvoiceTotals(b).total);
        default:
          return 0;
      }
    });
  }, [filtered, sortDirection, sortKey]);

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
        {can("returns:create") ? (
          <Button
            className="shrink-0 gap-2"
            onClick={() => {
              setDialogNote(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("newNote")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={RotateCcw} tone="accent" />
        <StatCard label={t("stats.credit")} value={formatNumber(stats.creditCount, locale)} icon={FileMinus} />
        <StatCard label={t("stats.debit")} value={formatNumber(stats.debitCount, locale)} icon={FilePlus} />
        <StatCard
          label={t("stats.creditValue")}
          value={formatMoney(stats.creditValue, locale)}
          unit={tCommon("currency")}
          icon={FileMinus}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="returns-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="returns-search"
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
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as TypeFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("typeFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="creditNote">{t("type.creditNote")}</SelectItem>
            <SelectItem value="debitNote">{t("type.debitNote")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DateRangeFilter
        value={range}
        onChange={(next) => {
          setRange(next);
          setPage(1);
        }}
        idPrefix="returns"
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.number")} sortKey="number" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.type")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.relatedInvoice")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.reason")}</TableHead>
                <SortableTableHead label={t("columns.total")} sortKey="total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.date")} sortKey="date" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
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
                paged.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell data-ltr className="ps-4 font-medium">{note.number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`type.${note.documentType}`)}</Badge>
                    </TableCell>
                    <TableCell data-ltr className="text-xs">
                      {note.relatedInvoiceId ? (
                        <Link
                          href={`/invoices/${note.relatedInvoiceId}`}
                          className="hover:underline focus-visible:underline"
                        >
                          {invoiceNumberById(note.relatedInvoiceId)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm">{customerName(note)}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-xs text-muted-foreground">
                      {note.reasonForNote?.[lang] ?? "—"}
                    </TableCell>
                    <TableCell data-numeric className="text-end text-sm">
                      {formatMoney(getInvoiceTotals(note).total, locale)}
                    </TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(note.supplyDate, locale)}
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="returns"
                        label={note.number}
                        onEdit={() => {
                          setDialogNote(note);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeleting(note)}
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

      <ReturnNoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDialogNote(null);
        }}
        note={dialogNote}
        invoices={sourceInvoices}
        onSubmit={(next) => {
          const ok = dialogNote ? update(dialogNote.id, () => next) : create(next);
          if (ok) {
            toast.success(dialogNote ? tCommon("saved") : tCommon("createdSuccess"));
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
