import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { TransactionDetailView } from "@/modules/accounting/components/transaction-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "accounting" });
  const transaction = await repositories.accounting.findById(id);
  return {
    title: transaction?.reference ?? t("detail.notFoundTitle"),
  };
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const transaction = await repositories.accounting.findById(id);

  if (!transaction) notFound();
  return <TransactionDetailView transaction={transaction} />;
}
