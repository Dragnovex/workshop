import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TransactionDetailView } from "@/modules/accounting/components/transaction-detail-view";
import { transactions } from "@/modules/accounting/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "accounting" });
  const transaction = transactions.find((item) => item.id === id);
  return {
    title: transaction?.reference ?? t("detail.notFoundTitle"),
  };
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) notFound();
  return <TransactionDetailView transaction={transaction} />;
}
