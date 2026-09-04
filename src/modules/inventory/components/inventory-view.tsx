"use client";

import { AlertTriangle, Package, Plus, Search, Warehouse } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import {
  EntityFormDialog,
  type FormFieldDef,
  type FormValues,
} from "@/components/patterns/entity-form-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { Button } from "@/components/ui/button";
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
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatNumber } from "@/lib/format";
import { newLocalId } from "@/lib/client-store";
import { useCan } from "@/lib/auth/permission-context";
import { useLocalCollection } from "@/lib/use-local-collection";
import { partStore, partTombstones } from "../client-store";
import { partCategories, type PartCategory } from "../types";
import type { Part } from "../types";

type CategoryFilter = "all" | PartCategory;
type StockFilter = "all" | "low" | "ok";
type SortKey = "sku" | "name" | "qty" | "unitPrice";

const PAGE_SIZE = 10;

export function InventoryView({ parts: seedParts }: { parts: Part[] }) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const {
    rows: parts,
    create: createPart,
    update: updatePart,
    remove: removePart,
  } = useLocalCollection<Part>({
    resource: "inventory",
    seed: seedParts,
    store: partStore,
    tombstones: partTombstones,
  });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [deleting, setDeleting] = useState<Part | null>(null);

  const formFields = useMemo<FormFieldDef[]>(
    () => [
      { name: "sku", label: t("columns.sku"), kind: "text", required: true, ltr: true },
      {
        name: "category",
        label: t("columns.category"),
        kind: "select",
        required: true,
        options: partCategories.map((category) => ({
          value: category,
          label: t(`category.${category}`),
        })),
      },
      { name: "nameAr", label: t("form.nameAr"), kind: "text", required: true },
      { name: "nameEn", label: t("form.nameEn"), kind: "text", ltr: true },
      { name: "qtyOnHand", label: t("columns.qty"), kind: "number", required: true },
      { name: "reorderLevel", label: t("form.reorderLevel"), kind: "number", required: true },
      { name: "unitPrice", label: t("columns.unitPrice"), kind: "number", required: true },
      { name: "location", label: t("columns.location"), kind: "text", ltr: true },
    ],
    [t],
  );

  function toPart(values: FormValues, base?: Part): Part {
    const nameAr = values.nameAr.trim();
    return {
      id: base?.id ?? newLocalId("part"),
      sku: values.sku.trim(),
      name: { ar: nameAr, en: values.nameEn.trim() || nameAr },
      category: values.category as PartCategory,
      qtyOnHand: Number(values.qtyOnHand),
      reorderLevel: Number(values.reorderLevel),
      unitPrice: Number(values.unitPrice),
      location: values.location.trim(),
    };
  }

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const lowStockCount = parts.filter((part) => part.qtyOnHand <= part.reorderLevel).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parts.filter((part) => {
      const isLow = part.qtyOnHand <= part.reorderLevel;
      if (categoryFilter !== "all" && part.category !== categoryFilter) return false;
      if (stockFilter === "low" && !isLow) return false;
      if (stockFilter === "ok" && isLow) return false;
      if (!query) return true;
      return (
        part.sku.toLowerCase().includes(query) ||
        part.name.ar.toLowerCase().includes(query) ||
        part.name.en.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, parts, search, stockFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "sku":
          return factor * a.sku.localeCompare(b.sku);
        case "name":
          return factor * a.name[lang].localeCompare(b.name[lang]);
        case "qty":
          return factor * (a.qtyOnHand - b.qtyOnHand);
        case "unitPrice":
          return factor * (a.unitPrice - b.unitPrice);
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
        {can("inventory:create") ? (
          <Button className="shrink-0 gap-2" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("newPart")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.total")} value={formatNumber(parts.length, locale)} icon={Package} tone="accent" />
        <StatCard label={t("stats.lowStock")} value={formatNumber(lowStockCount, locale)} icon={AlertTriangle} />
        <StatCard
          label={t("stats.value")}
          value={formatCurrency(
            parts.reduce((sum, part) => sum + part.qtyOnHand * part.unitPrice, 0),
            locale,
          )}
          unit={tCommon("currency")}
          icon={Warehouse}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="part-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="part-search"
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
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as CategoryFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("categoryFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {partCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`category.${category}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={stockFilter}
          onValueChange={(value) => {
            setStockFilter(value as StockFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("stockFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("stockFilter.all")}</SelectItem>
            <SelectItem value="low">{t("stockFilter.low")}</SelectItem>
            <SelectItem value="ok">{t("stockFilter.ok")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.sku")} sortKey="sku" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <SortableTableHead label={t("columns.name")} sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.category")}</TableHead>
                <SortableTableHead label={t("columns.qty")} sortKey="qty" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.unitPrice")} sortKey="unitPrice" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.location")}</TableHead>
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
                paged.map((part) => {
                  const isLow = part.qtyOnHand <= part.reorderLevel;
                  return (
                    <TableRow key={part.id} className="relative cursor-pointer">
                      <TableCell data-ltr className="ps-4">
                        <Link
                          href={`/inventory/${part.id}`}
                          aria-label={t("openPart", { name: part.name[lang] })}
                          className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                        >
                          {part.sku}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-sm">{part.name[lang]}</TableCell>
                      <TableCell><Badge variant="secondary">{t(`category.${part.category}`)}</Badge></TableCell>
                      <TableCell data-numeric className="text-end text-sm">
                        <span className={isLow ? "font-semibold text-warning-text" : undefined}>
                          {formatNumber(part.qtyOnHand, locale)}
                        </span>
                      </TableCell>
                      <TableCell data-numeric className="text-end text-sm">{formatCurrency(part.unitPrice, locale)}</TableCell>
                      <TableCell data-ltr className="text-xs text-muted-foreground">{part.location}</TableCell>
                      <TableCell className="pe-4">
                        <RowActions
                          resource="inventory"
                          label={part.name[lang]}
                          onEdit={() => setEditing(part)}
                          onDelete={() => setDeleting(part)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityFormDialog
        idPrefix="new-part"
        open={creating}
        onOpenChange={setCreating}
        title={t("newPart")}
        description={t("form.description")}
        fields={formFields}
        initialValues={{
          sku: "",
          category: "engine",
          nameAr: "",
          nameEn: "",
          qtyOnHand: "0",
          reorderLevel: "0",
          unitPrice: "0",
          location: "",
        }}
        onSubmit={(values) => {
          const ok = createPart(toPart(values));
          if (ok) toast.success(tCommon("createdSuccess"));
          return ok;
        }}
      />

      <EntityFormDialog
        idPrefix="edit-part"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("editPart")}
        description={t("form.description")}
        fields={formFields}
        initialValues={{
          sku: editing?.sku ?? "",
          category: editing?.category ?? "engine",
          nameAr: editing?.name.ar ?? "",
          nameEn: editing?.name.en ?? "",
          qtyOnHand: String(editing?.qtyOnHand ?? 0),
          reorderLevel: String(editing?.reorderLevel ?? 0),
          unitPrice: String(editing?.unitPrice ?? 0),
          location: editing?.location ?? "",
        }}
        onSubmit={(values) => {
          if (!editing) return false;
          const ok = updatePart(editing.id, (part) => toPart(values, part));
          if (ok) toast.success(tCommon("saved"));
          return ok;
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting ? deleting.name[lang] : ""}
        onConfirm={() => {
          if (deleting && removePart(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
