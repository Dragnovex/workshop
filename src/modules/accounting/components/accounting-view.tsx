"use client";

import { ArrowDownCircle, ArrowUpCircle, Scale, Search } from "lucide-react";
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
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { transactionCategories, type AccountingTransaction, type TransactionCategory, type TransactionType } from "../types";

type TypeFilter = "all" | TransactionType;
type CategoryFilter = "all" | TransactionCategory;

export function AccountingView({
  transactions,
  stats,
}: {
  transactions: AccountingTransaction[];
  stats: { totalDebit: number; totalCredit: number; net: number };
}) {
  const t = useTranslations("accounting");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;
        if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
        if (!query) return true;
        return (
          tx.reference.toLowerCase().includes(query) ||
          tx.account.ar.toLowerCase().includes(query) ||
          tx.account.en.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [categoryFilter, search, transactions, typeFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.totalCredit")} value={formatCurrency(stats.totalCredit, locale)} unit={tCommon("currency")} icon={ArrowUpCircle} />
        <StatCard label={t("stats.totalDebit")} value={formatCurrency(stats.totalDebit, locale)} unit={tCommon("currency")} icon={ArrowDownCircle} />
        <StatCard label={t("stats.net")} value={formatCurrency(stats.net, locale)} unit={tCommon("currency")} icon={Scale} tone="accent" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="tx-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="tx-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
          <SelectTrigger aria-label={t("typeFilterLabel")} className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="credit">{t("type.credit")}</SelectItem>
            <SelectItem value="debit">{t("type.debit")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
          <SelectTrigger aria-label={t("categoryFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllCategories")}</SelectItem>
            {transactionCategories.map((category) => (
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
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.reference")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.account")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.category")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.date")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tx) => (
                  <TableRow key={tx.id} className="relative cursor-pointer">
                    <TableCell data-ltr className="ps-4">
                      <Link
                        href={`/accounting/${tx.id}`}
                        aria-label={t("openTransaction", { reference: tx.reference })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {tx.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate text-sm">{tx.account[lang]}</TableCell>
                    <TableCell><Badge variant="secondary">{t(`category.${tx.category}`)}</Badge></TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date, locale)}
                    </TableCell>
                    <TableCell
                      data-numeric
                      className={`pe-4 text-end text-sm font-medium ${tx.type === "credit" ? "text-success-text" : "text-muted-foreground"}`}
                    >
                      {tx.type === "credit" ? "+" : "-"}{formatNumber(tx.amount, locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
