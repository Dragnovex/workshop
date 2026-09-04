import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ReturnsView } from "@/modules/returns/components/returns-view";
import { repositories } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "returns" });
  return { title: t("title") };
}

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // كل المستندات تُمرَّر: الشاشة تفصل الإشعارات عن الفواتير على العميل،
  // وتحتاج الفواتير نفسها كمصدر للربط عند إنشاء إشعار جديد.
  const invoices = await repositories.invoices.findAll();
  const customers = await repositories.customers.findAll();

  return <ReturnsView invoices={invoices} customers={customers} />;
}
