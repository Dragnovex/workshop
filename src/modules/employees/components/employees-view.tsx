"use client";

import { Search, UserCheck, UserRoundCog, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { employeeDepartments, type Employee, type EmployeeDepartment } from "../types";

type DepartmentFilter = "all" | EmployeeDepartment;

export function EmployeesView({ employees }: { employees: Employee[] }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");

  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const technicianCount = employees.filter((employee) => employee.department === "technicians").length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (departmentFilter !== "all" && employee.department !== departmentFilter) return false;
      if (!query) return true;
      return (
        employee.name.ar.toLowerCase().includes(query) ||
        employee.name.en.toLowerCase().includes(query) ||
        employee.role.ar.toLowerCase().includes(query) ||
        employee.role.en.toLowerCase().includes(query) ||
        employee.phone.toLowerCase().includes(query)
      );
    });
  }, [departmentFilter, employees, search]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.total")} value={formatNumber(employees.length, locale)} icon={Users} tone="accent" />
        <StatCard label={t("stats.active")} value={formatNumber(activeCount, locale)} icon={UserCheck} />
        <StatCard label={t("stats.technicians")} value={formatNumber(technicianCount, locale)} icon={UserRoundCog} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="employee-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="employee-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as DepartmentFilter)}>
          <SelectTrigger aria-label={t("departmentFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {employeeDepartments.map((department) => (
              <SelectItem key={department} value={department}>
                {t(`department.${department}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.name")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.role")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.department")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.phone")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.hireDate")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((employee) => (
                  <TableRow key={employee.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/employees/${employee.id}`}
                        aria-label={t("openEmployee", { name: employee.name[lang] })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {employee.name[lang]}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{employee.role[lang]}</TableCell>
                    <TableCell><Badge variant="secondary">{t(`department.${employee.department}`)}</Badge></TableCell>
                    <TableCell data-ltr className="text-sm">{employee.phone}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(employee.hireDate, locale)}
                    </TableCell>
                    <TableCell className="pe-4 text-end">
                      <EmployeeStatusBadge status={employee.status} label={t(`status.${employee.status}`)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
