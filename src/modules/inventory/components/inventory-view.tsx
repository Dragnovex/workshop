"use client";

import { AlertTriangle, Package, Search, Warehouse } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
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
import { partCategories, type PartCategory } from "../types";
import type { Part } from "../types";

type CategoryFilter = "all" | PartCategory;
type StockFilter = "all" | "low" | "ok";

export function InventoryView({ parts }: { parts: Part[] }) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

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

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

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
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
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
        <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
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
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.sku")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.name")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.category")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.qty")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.unitPrice")}</TableHead>
                <TableHead className="pe-4 text-xs whitespace-nowrap">{t("columns.location")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((part) => {
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
                      <TableCell data-ltr className="pe-4 text-xs text-muted-foreground">{part.location}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
