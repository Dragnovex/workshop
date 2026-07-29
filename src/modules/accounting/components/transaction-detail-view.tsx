"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AccountingTransaction } from "../types";

export function TransactionDetailView({ transaction }: { transaction: AccountingTransaction }) {
  const t = useTranslations("accounting");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2" data-ltr>
            {transaction.reference}
            <Badge className={transaction.type === "credit" ? "bg-success-subtle text-success-text" : "bg-secondary text-muted-foreground"}>
              {t(`type.${transaction.type}`)}
            </Badge>
          </span>
        }
        description={transaction.account[lang]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/accounting">
              <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
              {t("detail.back")}
            </Link>
          </Button>
        }
      />

      <SectionCard title={t("detail.summary")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("columns.account")} value={transaction.account[lang]} />
          <DetailRow label={t("columns.category")} value={t(`category.${transaction.category}`)} />
          <DetailRow label={t("columns.date")} value={formatDate(transaction.date, locale)} numeric />
          <DetailRow
            label={t("columns.amount")}
            value={`${formatCurrency(transaction.amount, locale)} ${tCommon("currency")}`}
            numeric
          />
        </dl>
      </SectionCard>

      {transaction.linkedInvoiceId ? (
        <SectionCard title={t("detail.linkedInvoice")}>
          <Link href={`/invoices/${transaction.linkedInvoiceId}`} data-ltr className="text-sm font-medium hover:underline focus-visible:underline">
            {transaction.linkedInvoiceId}
          </Link>
        </SectionCard>
      ) : null}

      {transaction.linkedPurchaseOrderId ? (
        <SectionCard title={t("detail.linkedPurchaseOrder")}>
          <Link href={`/purchasing/${transaction.linkedPurchaseOrderId}`} data-ltr className="text-sm font-medium hover:underline focus-visible:underline">
            {transaction.linkedPurchaseOrderId}
          </Link>
        </SectionCard>
      ) : null}

      {transaction.notes ? (
        <SectionCard title={t("detail.notes")}>
          <p className="text-sm text-muted-foreground">{transaction.notes[lang]}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-numeric={numeric ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
