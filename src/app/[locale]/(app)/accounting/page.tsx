import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountingView } from "@/modules/accounting/components/accounting-view";
import { transactions } from "@/modules/accounting/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accounting" });
  return { title: t("title") };
}

export default async function AccountingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const totalCredit = transactions.filter((tx) => tx.type === "credit").reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebit = transactions.filter((tx) => tx.type === "debit").reduce((sum, tx) => sum + tx.amount, 0);
  const stats = { totalCredit, totalDebit, net: totalCredit - totalDebit };

  return <AccountingView transactions={transactions} stats={stats} />;
}
