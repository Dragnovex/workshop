import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmployeeDetailView } from "@/modules/employees/components/employee-detail-view";
import { employees } from "@/modules/employees/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "employees" });
  const employee = employees.find((item) => item.id === id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: employee?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const employee = employees.find((item) => item.id === id);

  if (!employee) notFound();
  return <EmployeeDetailView employee={employee} />;
}
