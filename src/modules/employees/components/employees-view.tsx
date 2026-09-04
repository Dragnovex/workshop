"use client";

import { Plus, Search, UserCheck, UserRoundCog, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import {
  EntityFormDialog,
  type FormFieldDef,
  type FormValues,
} from "@/components/patterns/entity-form-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { Button } from "@/components/ui/button";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
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
import { newLocalId } from "@/lib/client-store";
import { fromDateInputValue, toDateInputValue } from "@/lib/date-input";
import { useCan } from "@/lib/auth/permission-context";
import { useLocalCollection } from "@/lib/use-local-collection";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { employeeStore, employeeTombstones } from "../client-store";
import {
  employeeDepartments,
  employeeStatuses,
  type Employee,
  type EmployeeDepartment,
  type EmployeeStatus,
} from "../types";

type DepartmentFilter = "all" | EmployeeDepartment;
type SortKey = "name" | "department" | "hireDate";

const PAGE_SIZE = 10;

export function EmployeesView({ employees: seed }: { employees: Employee[] }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const { rows: employees, create, update, remove } = useLocalCollection<Employee>({
    resource: "employees",
    seed,
    store: employeeStore,
    tombstones: employeeTombstones,
  });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

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

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return factor * a.name[lang].localeCompare(b.name[lang]);
        case "department":
          return factor * a.department.localeCompare(b.department);
        case "hireDate":
          return factor * (Date.parse(a.hireDate) - Date.parse(b.hireDate));
        default:
          return 0;
      }
    });
  }, [filtered, lang, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  const formFields: FormFieldDef[] = [
    { name: "nameAr", label: t("form.nameAr"), kind: "text", required: true },
    { name: "nameEn", label: t("form.nameEn"), kind: "text", ltr: true },
    { name: "roleAr", label: t("columns.role"), kind: "text", required: true },
    {
      name: "department",
      label: t("columns.department"),
      kind: "select",
      required: true,
      options: employeeDepartments.map((department) => ({
        value: department,
        label: t(`department.${department}`),
      })),
    },
    { name: "phone", label: t("columns.phone"), kind: "text", required: true, ltr: true, placeholder: "+9665xxxxxxxx" },
    { name: "email", label: t("form.email"), kind: "text", ltr: true },
    { name: "nationality", label: t("columns.nationality"), kind: "text" },
    {
      name: "residencyNumber",
      label: t("form.residencyNumber"),
      kind: "text",
      ltr: true,
      hint: t("form.residencyHint"),
    },
    { name: "hireDate", label: t("columns.hireDate"), kind: "date", required: true },
    { name: "startDate", label: t("form.startDate"), kind: "date", hint: t("form.startDateHint") },
    { name: "weeklyHours", label: t("form.weeklyHours"), kind: "number" },
    {
      name: "status",
      label: t("columns.status"),
      kind: "select",
      required: true,
      options: employeeStatuses.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
  ];

  /**
   * رقم الإقامة/الهوية عشرة أرقام. اختياري (سجلات قديمة قد لا تحمله)،
   * لكن رقم مشوّه أسوأ من غيابه: يُنسخ إلى نماذج التأمينات كما هو.
   */
  function validate(values: FormValues): string | null {
    const residency = values.residencyNumber.trim();
    if (residency && !/^\d{10}$/.test(residency)) {
      return t("form.residencyInvalid");
    }
    return null;
  }

  function toEmployee(values: FormValues, base?: Employee): Employee {
    const nameAr = values.nameAr.trim();
    const roleAr = values.roleAr.trim();
    const nationality = values.nationality.trim();
    const weeklyHours = values.weeklyHours.trim();
    const startDate = fromDateInputValue(values.startDate);

    return {
      ...base,
      id: base?.id ?? newLocalId("employee"),
      name: { ar: nameAr, en: values.nameEn.trim() || nameAr },
      role: { ar: roleAr, en: roleAr },
      department: values.department as EmployeeDepartment,
      phone: values.phone.trim(),
      email: values.email.trim(),
      // التاريخ يُخزَّن ISO كامل كبقية السجلات، والحقل يعرض اليوم فقط.
      hireDate: fromDateInputValue(values.hireDate) ?? new Date().toISOString(),
      status: values.status as EmployeeStatus,
      nationality: nationality ? { ar: nationality, en: nationality } : undefined,
      residencyNumber: values.residencyNumber.trim() || undefined,
      startDate: startDate ?? undefined,
      weeklyHours: weeklyHours === "" ? undefined : Number(weeklyHours),
    };
  }

  function valuesOf(employee: Employee | null): FormValues {
    return {
      nameAr: employee?.name.ar ?? "",
      nameEn: employee?.name.en ?? "",
      roleAr: employee?.role.ar ?? "",
      department: employee?.department ?? "technicians",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
      nationality: employee?.nationality?.ar ?? "",
      residencyNumber: employee?.residencyNumber ?? "",
      hireDate: toDateInputValue(employee?.hireDate) || toDateInputValue(new Date().toISOString()),
      startDate: toDateInputValue(employee?.startDate),
      weeklyHours: employee?.weeklyHours === undefined ? "" : String(employee.weeklyHours),
      status: employee?.status ?? "active",
    };
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {can("employees:create") ? (
          <Button className="shrink-0 gap-2" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("newEmployee")}
          </Button>
        ) : null}
      </div>

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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={departmentFilter}
          onValueChange={(value) => {
            setDepartmentFilter(value as DepartmentFilter);
            setPage(1);
          }}
        >
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
                <SortableTableHead label={t("columns.name")} sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.role")}</TableHead>
                <SortableTableHead label={t("columns.department")} sortKey="department" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.phone")}</TableHead>
                <SortableTableHead label={t("columns.hireDate")} sortKey="hireDate" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.nationality")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((employee) => (
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
                    <TableCell className="text-xs text-muted-foreground">
                      {employee.nationality?.[lang] ?? "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <EmployeeStatusBadge status={employee.status} label={t(`status.${employee.status}`)} />
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="employees"
                        label={employee.name[lang]}
                        onEdit={() => setEditing(employee)}
                        onDelete={() => setDeleting(employee)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityFormDialog
        idPrefix="new-employee"
        open={creating}
        onOpenChange={setCreating}
        title={t("newEmployee")}
        description={t("form.description")}
        fields={formFields}
        initialValues={valuesOf(null)}
        validate={validate}
        onSubmit={(values) => {
          const ok = create(toEmployee(values));
          if (ok) toast.success(tCommon("createdSuccess"));
          return ok;
        }}
      />

      <EntityFormDialog
        idPrefix="edit-employee"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("editEmployee")}
        description={t("form.description")}
        fields={formFields}
        initialValues={valuesOf(editing)}
        validate={validate}
        onSubmit={(values) => {
          if (!editing) return false;
          const ok = update(editing.id, (employee) => toEmployee(values, employee));
          if (ok) toast.success(tCommon("saved"));
          return ok;
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting ? deleting.name[lang] : ""}
        onConfirm={() => {
          if (deleting && remove(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
