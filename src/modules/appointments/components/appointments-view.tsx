"use client";

import { CalendarCheck, CalendarClock, CalendarDays, ClipboardList, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import {
  EntityFormDialog,
  type FormFieldDef,
} from "@/components/patterns/entity-form-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
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
import { formatDateTime, formatNumber } from "@/lib/format";
import { fromDateInputValue, toDateTimeInputValue } from "@/lib/date-input";
import { useLocalCollection } from "@/lib/use-local-collection";
import type {
  Customer,
  CustomerId,
  Vehicle,
  VehicleId,
} from "@/lib/domain/contracts";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { loadStoredVehicles } from "@/modules/vehicles/client-store";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { appointmentStore, appointmentTombstones } from "../client-store";
import {
  appointmentStatuses,
  type Appointment,
  type AppointmentStatus,
} from "../types";
import type { AppointmentReadModel } from "../read-models";

type StatusFilter = "all" | AppointmentStatus;
type DateFilter = "all" | "today" | "upcoming" | "past";
type SortKey = "dateTime" | "customer" | "service";

const PAGE_SIZE = 10;

function isSameDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function AppointmentsView({
  appointments,
  customers,
  vehicles,
}: {
  appointments: AppointmentReadModel[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("dateTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  // المواعيد المخزنة محليًا (من /appointments/new أو من تعديل هنا) مدموجة
  // مع بذرة البيانات، مع دعم التعديل والحذف الفعليين.
  const {
    rows: storedAppointments,
    update: updateAppointment,
    remove: removeAppointment,
  } = useLocalCollection<Appointment>({
    resource: "appointments",
    seed: appointments.map((model) => model.appointment),
    store: appointmentStore,
    tombstones: appointmentTombstones,
  });

  // قراءة localStorage تتم مرة واحدة في مُهيّئ الحالة، لا داخل جسم الرندر:
  // القراءة داخل useMemo تعيد قيمة تختلف عن رندر الخادم عند كل إعادة حساب.
  const [storedCustomers] = useState(() => loadStoredCustomers(customers));
  const [storedVehicles] = useState(() => loadStoredVehicles(vehicles));

  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<AppointmentReadModel | null>(null);

  const allModels = useMemo(() => {
    const customersById = new Map(
      storedCustomers.map((customer) => [customer.id, customer]),
    );
    const vehiclesById = new Map(
      storedVehicles.map((vehicle) => [vehicle.id, vehicle]),
    );
    return storedAppointments.flatMap((appointment): AppointmentReadModel[] => {
      const customer = customersById.get(appointment.customerId);
      const vehicle = vehiclesById.get(appointment.vehicleId);
      // موعد بلا عميل أو مركبة معروفَين لا يُعرض بدل إسقاط الصفحة كلها.
      if (!customer || !vehicle) return [];
      return [{ appointment, customer, vehicle }];
    });
  }, [storedAppointments, storedCustomers, storedVehicles]);

  const formFields = useMemo<FormFieldDef[]>(
    () => [
      {
        name: "customerId",
        label: t("columns.customer"),
        kind: "select",
        required: true,
        options: storedCustomers.map((customer) => ({
          value: customer.id,
          label: customer.displayName[lang],
        })),
      },
      {
        name: "vehicleId",
        label: t("columns.vehicle"),
        kind: "select",
        required: true,
        options: storedVehicles.map((vehicle) => ({
          value: vehicle.id,
          label: `${getVehicleDisplayName(vehicle, locale)} · ${vehicle.plate}`,
        })),
      },
      { name: "service", label: t("columns.service"), kind: "text", required: true, wide: true },
      { name: "scheduledAt", label: t("columns.dateTime"), kind: "datetime", required: true },
      { name: "durationMinutes", label: t("edit.duration"), kind: "number", required: true },
      {
        name: "status",
        label: t("columns.status"),
        kind: "select",
        required: true,
        options: appointmentStatuses.map((status) => ({
          value: status,
          label: t(`status.${status}`),
        })),
      },
      { name: "notes", label: t("edit.notes"), kind: "textarea", wide: true },
    ],
    [lang, locale, storedCustomers, storedVehicles, t],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    return allModels.filter(({ appointment, customer, vehicle }) => {
      if (statusFilter !== "all" && appointment.status !== statusFilter) return false;
      if (dateFilter === "today" && !isSameDay(appointment.scheduledAt, now)) return false;
      if (dateFilter === "upcoming" && Date.parse(appointment.scheduledAt) < now.getTime()) return false;
      if (dateFilter === "past" && Date.parse(appointment.scheduledAt) >= now.getTime()) return false;
      if (!query) return true;
      return (
        appointment.serviceType.ar.toLowerCase().includes(query) ||
        appointment.serviceType.en.toLowerCase().includes(query) ||
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query) ||
        vehicle.plate.toLowerCase().includes(query)
      );
    });
  }, [allModels, dateFilter, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "dateTime":
          return factor * (Date.parse(a.appointment.scheduledAt) - Date.parse(b.appointment.scheduledAt));
        case "customer":
          return factor * a.customer.displayName[lang].localeCompare(b.customer.displayName[lang]);
        case "service":
          return factor * a.appointment.serviceType[lang].localeCompare(b.appointment.serviceType[lang]);
        default:
          return 0;
      }
    });
  }, [filtered, lang, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // المؤشرات تُحسب من القائمة المعروضة نفسها: التعديل والحذف يغيّران
  // الأرقام فورًا بدل بقاء رقم بذرة يناقض الجدول تحته.
  const mergedStats = useMemo(() => {
    const now = new Date();
    return {
      total: allModels.length,
      today: allModels.filter(({ appointment }) =>
        isSameDay(appointment.scheduledAt, now),
      ).length,
      requested: allModels.filter(
        ({ appointment }) => appointment.status === "requested",
      ).length,
      confirmed: allModels.filter(
        ({ appointment }) => appointment.status === "confirmed",
      ).length,
    };
  }, [allModels]);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(mergedStats.total, locale)} icon={CalendarDays} tone="accent" />
        <StatCard label={t("stats.today")} value={formatNumber(mergedStats.today, locale)} icon={CalendarClock} />
        <StatCard label={t("stats.requested")} value={formatNumber(mergedStats.requested, locale)} icon={ClipboardList} />
        <StatCard label={t("stats.confirmed")} value={formatNumber(mergedStats.confirmed, locale)} icon={CalendarCheck} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="appointment-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="appointment-search"
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
          value={dateFilter}
          onValueChange={(value) => {
            setDateFilter(value as DateFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("dateFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dateFilter.all")}</SelectItem>
            <SelectItem value="today">{t("dateFilter.today")}</SelectItem>
            <SelectItem value="upcoming">{t("dateFilter.upcoming")}</SelectItem>
            <SelectItem value="past">{t("dateFilter.past")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {appointmentStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
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
                <SortableTableHead label={t("columns.dateTime")} sortKey="dateTime" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <SortableTableHead label={t("columns.customer")} sortKey="customer" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <SortableTableHead label={t("columns.service")} sortKey="service" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((model) => {
                  const { appointment, customer, vehicle } = model;
                  return (
                  <TableRow key={appointment.id} className="relative cursor-pointer">
                    <TableCell data-numeric className="ps-4 text-sm whitespace-nowrap">
                      <Link
                        href={`/appointments/${appointment.id}`}
                        aria-label={t("openAppointment", { name: customer.displayName[lang] })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {formatDateTime(appointment.scheduledAt, locale)}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell data-numeric className="text-sm">{getVehicleDisplayName(vehicle, locale)}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-sm">{appointment.serviceType[lang]}</TableCell>
                    <TableCell className="text-end">
                      <AppointmentStatusBadge status={appointment.status} label={t(`status.${appointment.status}`)} />
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="appointments"
                        label={`${customer.displayName[lang]} — ${formatDateTime(appointment.scheduledAt, locale)}`}
                        onEdit={() => setEditing(appointment)}
                        onDelete={() => setDeleting(model)}
                      />
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityFormDialog
        idPrefix="edit-appointment"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("edit.title")}
        description={t("edit.description")}
        fields={formFields}
        initialValues={{
          customerId: editing?.customerId ?? "",
          vehicleId: editing?.vehicleId ?? "",
          service: editing?.serviceType[lang] ?? "",
          scheduledAt: toDateTimeInputValue(editing?.scheduledAt),
          durationMinutes: String(editing?.durationMinutes ?? 60),
          status: editing?.status ?? "requested",
          notes: editing?.notes?.[lang] ?? "",
        }}
        validate={(values) =>
          fromDateInputValue(values.scheduledAt) === null
            ? t("new.invalidDate")
            : null
        }
        onSubmit={(values) => {
          if (!editing) return false;
          const scheduledAt = fromDateInputValue(values.scheduledAt);
          if (!scheduledAt) return false;
          const service = values.service.trim();
          const notes = values.notes.trim();
          const ok = updateAppointment(editing.id, (appointment) => ({
            ...appointment,
            customerId: values.customerId as CustomerId,
            vehicleId: values.vehicleId as VehicleId,
            serviceType: { ar: service, en: service },
            scheduledAt,
            durationMinutes: Number(values.durationMinutes),
            status: values.status as AppointmentStatus,
            notes: notes ? { ar: notes, en: notes } : undefined,
          }));
          if (ok) toast.success(tCommon("saved"));
          return ok;
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={
          deleting
            ? `${deleting.customer.displayName[lang]} — ${formatDateTime(deleting.appointment.scheduledAt, locale)}`
            : ""
        }
        onConfirm={() => {
          if (deleting && removeAppointment(deleting.appointment.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
