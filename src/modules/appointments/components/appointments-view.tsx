"use client";

import { CalendarCheck, CalendarClock, CalendarDays, ClipboardList, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
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
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { appointmentStatuses, type AppointmentStatus } from "../types";
import type { AppointmentReadModel } from "../read-models";

type StatusFilter = "all" | AppointmentStatus;
type DateFilter = "all" | "today" | "upcoming" | "past";

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
  stats,
}: {
  appointments: AppointmentReadModel[];
  stats: { total: number; today: number; requested: number; confirmed: number };
}) {
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    return appointments
      .filter(({ appointment, customer, vehicle }) => {
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
      })
      .sort((a, b) => Date.parse(a.appointment.scheduledAt) - Date.parse(b.appointment.scheduledAt));
  }, [appointments, dateFilter, search, statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={CalendarDays} tone="accent" />
        <StatCard label={t("stats.today")} value={formatNumber(stats.today, locale)} icon={CalendarClock} />
        <StatCard label={t("stats.requested")} value={formatNumber(stats.requested, locale)} icon={ClipboardList} />
        <StatCard label={t("stats.confirmed")} value={formatNumber(stats.confirmed, locale)} icon={CalendarCheck} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="appointment-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="appointment-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
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
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
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
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.dateTime")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.service")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(({ appointment, customer, vehicle }) => (
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
                    <TableCell className="pe-4 text-end">
                      <AppointmentStatusBadge status={appointment.status} label={t(`status.${appointment.status}`)} />
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
