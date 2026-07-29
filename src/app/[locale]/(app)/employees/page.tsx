import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmployeesView } from "@/modules/employees/components/employees-view";
import { employees } from "@/modules/employees/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employees" });
  return { title: t("title") };
}

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EmployeesView employees={employees} />;
}
