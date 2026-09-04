"use client";

import { Building2, ClipboardList, Search, UserRound, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { WhatsAppLink } from "@/components/patterns/whatsapp-link";
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
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { useLocalCollection } from "@/lib/use-local-collection";
import type { Customer } from "@/lib/domain/contracts";
import { customerStore, customerTombstones } from "../client-store";
import type { CustomerReadModel } from "../read-models";
import { EditCustomerDialog } from "./edit-customer-dialog";

type CustomerKindFilter = "all" | "individual" | "company";
type SortKey = "name" | "vehicles" | "orders" | "openOrders" | "lastVisit";

const PAGE_SIZE = 10;

export function CustomersView({
  customers,
}: {
  customers: CustomerReadModel[];
}) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<CustomerKindFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  // دمج العملاء المخزنين محليًا (من /customers/new) مع بذرة البيانات،
  // مع دعم التعديل والحذف الفعليين عبر نفس مفتاح التخزين.
  const {
    rows: storedCustomers,
    update: updateCustomer,
    remove: removeCustomer,
  } = useLocalCollection<Customer>({
    resource: "customers",
    seed: customers.map((model) => model.customer),
    store: customerStore,
    tombstones: customerTombstones,
  });

  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const allModels = useMemo(() => {
    // البذرة تُحمَّل من الخادم بعلاقاتها (مركبات/أوامر)، والمخزَّن محليًا
    // يحمل أحدث نسخة من بيانات العميل نفسه — فنأخذ العلاقات من الأولى
    // والحقول من الثاني، ولا نفقد أيًّا منهما.
    const seedById = new Map(customers.map((model) => [model.customer.id, model]));
    return storedCustomers.map((customer): CustomerReadModel => {
      const seedModel = seedById.get(customer.id);
      return seedModel
        ? { ...seedModel, customer }
        : { customer, vehicles: [], workOrders: [], openOrderCount: 0 };
    });
  }, [customers, storedCustomers]);

  // المؤشرات تُحسب من القائمة المعروضة نفسها لا من بذرة الخادم: الحذف
  // والتعديل يغيّران العدد فورًا، وبقاء رقم البذرة كان سيناقض الجدول تحته.
  const mergedStats = useMemo(() => {
    const individuals = allModels.filter(
      (model) => model.customer.kind === "individual",
    ).length;
    return {
      total: allModels.length,
      individuals,
      companies: allModels.length - individuals,
      openOrders: allModels.reduce((sum, model) => sum + model.openOrderCount, 0),
    };
  }, [allModels]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allModels.filter(({ customer }) => {
      if (kindFilter !== "all" && customer.kind !== kindFilter) return false;
      if (!query) return true;
      return (
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query)
      );
    });
  }, [allModels, kindFilter, search]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return factor * a.customer.displayName[lang].localeCompare(b.customer.displayName[lang]);
        case "vehicles":
          return factor * (a.vehicles.length - b.vehicles.length);
        case "orders":
          return factor * (a.workOrders.length - b.workOrders.length);
        case "openOrders":
          return factor * (a.openOrderCount - b.openOrderCount);
        case "lastVisit":
          return factor * ((a.lastVisitAt ? Date.parse(a.lastVisitAt) : 0) - (b.lastVisitAt ? Date.parse(b.lastVisitAt) : 0));
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
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(mergedStats.total, locale)} icon={Users} tone="accent" />
        <StatCard label={t("stats.individuals")} value={formatNumber(mergedStats.individuals, locale)} icon={UserRound} />
        <StatCard label={t("stats.companies")} value={formatNumber(mergedStats.companies, locale)} icon={Building2} />
        <StatCard label={t("stats.openOrders")} value={formatNumber(mergedStats.openOrders, locale)} icon={ClipboardList} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="customer-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="customer-search"
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
            setKindFilter(value as CustomerKindFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("kindFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("kind.all")}</SelectItem>
            <SelectItem value="individual">{t("kind.individual")}</SelectItem>
            <SelectItem value="company">{t("kind.company")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.customer")} sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.kind")}</TableHead>
                <SortableTableHead label={t("columns.vehicles")} sortKey="vehicles" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.orders")} sortKey="orders" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.openOrders")} sortKey="openOrders" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.lastVisit")} sortKey="lastVisit" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
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
                paged.map(({ customer, vehicles, workOrders, openOrderCount, lastVisitAt }) => (
                  <TableRow key={customer.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/customers/${customer.id}`}
                          aria-label={t("openCustomer", { name: customer.displayName[lang] })}
                          className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                        >
                          {customer.displayName[lang]}
                        </Link>
                        {/* z-10 يرفع الأيقونة فوق طبقة ::after التي تغطي الصف. */}
                        <WhatsAppLink
                          phone={customer.phone}
                          label={t("new.whatsapp")}
                          className="relative z-10"
                        />
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t(`kind.${customer.kind}`)}</Badge></TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(vehicles.length, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(workOrders.length, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatNumber(openOrderCount, locale)}</TableCell>
                    <TableCell data-numeric className="text-end text-xs whitespace-nowrap text-muted-foreground">
                      {lastVisitAt ? formatDate(lastVisitAt, locale) : t("neverVisited")}
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="customers"
                        label={customer.displayName[lang]}
                        onEdit={() => setEditing(customer)}
                        onDelete={() => setDeleting(customer)}
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

      <EditCustomerDialog
        customer={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={(next) => updateCustomer(next.id, () => next)}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting ? deleting.displayName[lang] : ""}
        onConfirm={() => {
          if (deleting && removeCustomer(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
