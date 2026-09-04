import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { AccountingView } from "@/modules/accounting/components/accounting-view";
import { LedgersView } from "@/modules/accounting/components/ledgers-view";

export const dynamic = "force-dynamic";

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
  const transactions = await repositories.accounting.findAll();

  const totalCredit = transactions.filter((tx) => tx.type === "credit").reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebit = transactions.filter((tx) => tx.type === "debit").reduce((sum, tx) => sum + tx.amount, 0);
  const stats = { totalCredit, totalDebit, net: totalCredit - totalDebit };

  // السجلات المحاسبية (مشتريات وأوامر تشغيل) تُقرأ من نفس المستودع:
  // شاشة المحاسبة هي مكان البحث بالتاريخ والتصدير، لا شاشة كل وحدة.
  const purchaseOrders = await repositories.purchasing.findAll();
  const workOrders = await repositories.workOrders.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
      <AccountingView transactions={transactions} stats={stats} />
      <LedgersView
        purchaseOrders={purchaseOrders}
        workOrders={workOrders}
        customers={customers}
        vehicles={vehicles}
      />
    </div>
  );
}
