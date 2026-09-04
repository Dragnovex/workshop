import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { NewCustomerForm } from "@/modules/customers/components/new-customer-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "customers" });
  return { title: t("new.title") };
}

export default async function NewCustomerPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const customers = await repositories.customers.findAll();

  return <NewCustomerForm seedCustomers={customers} />;
}
