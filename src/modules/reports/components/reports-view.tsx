"use client";

import { BarChart3, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
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
import { formatDateTime, formatNumber } from "@/lib/format";
import { reportCategories, type Report, type ReportCategory } from "../types";

type CategoryFilter = "all" | ReportCategory;
type SortKey = "name" | "lastGenerated";

const PAGE_SIZE = 10;

export function ReportsView({ reports }: { reports: Report[] }) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (categoryFilter !== "all" && report.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        report.name.ar.toLowerCase().includes(query) ||
        report.name.en.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, reports, search]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return factor * a.name[lang].localeCompare(b.name[lang]);
        case "lastGenerated":
          return factor * (Date.parse(a.lastGeneratedAt) - Date.parse(b.lastGeneratedAt));
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
        <StatCard label={t("stats.total")} value={formatNumber(reports.length, locale)} icon={BarChart3} tone="accent" />
        {reportCategories.map((category) => (
          <StatCard
            key={category}
            label={t(`category.${category}`)}
            value={formatNumber(reports.filter((report) => report.category === category).length, locale)}
            icon={BarChart3}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="report-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="report-search"
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
            {reportCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`category.${category}`)}
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
                <SortableTableHead label={t("columns.name")} sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.category")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.frequency")}</TableHead>
                <SortableTableHead label={t("columns.lastGenerated")} sortKey="lastGenerated" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" className="pe-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((report) => (
                  <TableRow key={report.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/reports/${report.id}`}
                        aria-label={t("openReport", { name: report.name[lang] })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {report.name[lang]}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t(`category.${report.category}`)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t(`frequency.${report.frequency}`)}</TableCell>
                    <TableCell data-numeric className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(report.lastGeneratedAt, locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
