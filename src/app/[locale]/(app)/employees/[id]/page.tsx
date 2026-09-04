import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { EmployeeDetailView } from "@/modules/employees/components/employee-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "employees" });
  const employee = await repositories.employees.findById(id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: employee?.name[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const employee = await repositories.employees.findById(id);

  if (!employee) notFound();
  return <EmployeeDetailView employee={employee} />;
}
