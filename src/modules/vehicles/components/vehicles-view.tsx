"use client";

import { Car, ClipboardList, Fingerprint, Plus, Search, Users } from "lucide-react";
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
import { StatusBadge } from "@/components/patterns/status-badge";
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
import { useCan } from "@/lib/auth/permission-context";
import { useLocalCollection } from "@/lib/use-local-collection";
import {
  vehicleStatuses,
  type Customer,
  type CustomerId,
  type Vehicle,
  type VehicleId,
  type VehicleStatus,
} from "@/lib/domain/contracts";
import { vehicleStore, vehicleTombstones } from "../client-store";
import { getVehicleDisplayName } from "../display";
import type { VehicleReadModel } from "../read-models";
import { vehicleStatusChip } from "../status-styles";

type ServiceFilter = "all" | "active" | "inactive";
type StatusFilter = "all" | VehicleStatus;
type SortKey = "vehicle" | "plate" | "mileage" | "lastVisit";

const PAGE_SIZE = 10;

export function VehiclesView({
  vehicles: seedModels,
  customers,
}: {
  vehicles: VehicleReadModel[];
  customers: Customer[];
}) {
  const t = useTranslations("vehicles");
  const tStatus = useTranslations("workOrders.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const {
    rows: storedVehicles,
    create: createVehicle,
    update: updateVehicle,
    remove: removeVehicle,
  } = useLocalCollection<Vehicle>({
    resource: "vehicles",
    seed: seedModels.map((model) => model.vehicle),
    store: vehicleStore,
    tombstones: vehicleTombstones,
  });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  // العلاقات (أوامر التشغيل، آخر زيارة) تأتي من بذرة الخادم، وبيانات
  // المركبة نفسها من التخزين المحلي — فلا يضيع أي طرف عند التعديل.
  const vehicles = useMemo(() => {
    const seedById = new Map(seedModels.map((model) => [model.vehicle.id, model]));
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    return storedVehicles.flatMap((vehicle): VehicleReadModel[] => {
      const seedModel = seedById.get(vehicle.id);
      if (seedModel) return [{ ...seedModel, vehicle }];
      const customer = customersById.get(vehicle.customerId);
      // مركبة بلا مالك معروف لا تُعرض بدل أن تُسقط الصفحة كلها.
      return customer ? [{ vehicle, customer, workOrders: [] }] : [];
    });
  }, [customers, seedModels, storedVehicles]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      active: vehicles.filter((model) => model.activeOrder !== undefined).length,
      withVin: vehicles.filter((model) => model.vehicle.vin !== undefined).length,
      customers: new Set(vehicles.map((model) => model.customer.id)).size,
    }),
    [vehicles],
  );

  const formFields = useMemo<FormFieldDef[]>(
    () => [
      {
        name: "customerId",
        label: t("columns.customer"),
        kind: "select",
        required: true,
        options: customers.map((customer) => ({
          value: customer.id,
          label: customer.displayName[lang],
        })),
      },
      { name: "plate", label: t("columns.plate"), kind: "text", required: true, ltr: true },
      { name: "make", label: t("form.make"), kind: "text", required: true },
      { name: "model", label: t("form.model"), kind: "text", required: true },
      { name: "year", label: t("form.year"), kind: "number", required: true },
      { name: "vin", label: t("form.vin"), kind: "text", ltr: true },
      { name: "mileage", label: t("columns.mileage"), kind: "number" },
      {
        name: "status",
        label: t("status.title"),
        kind: "select",
        required: true,
        options: vehicleStatuses.map((status) => ({
          value: status,
          label: t(`status.${status}`),
        })),
      },
    ],
    [customers, lang, t],
  );

  function toVehicle(values: FormValues, base?: Vehicle): Vehicle {
    const make = values.make.trim();
    const model = values.model.trim();
    const mileage = values.mileage.trim();
    const vin = values.vin.trim();
    return {
      ...base,
      id: base?.id ?? (newLocalId("vehicle") as VehicleId),
      customerId: values.customerId as CustomerId,
      make: { ar: make, en: make },
      model: { ar: model, en: model },
      year: Number(values.year),
      plate: values.plate.trim(),
      vin: vin || undefined,
      mileage: mileage === "" ? undefined : Number(mileage),
      status: values.status as VehicleStatus,
    };
  }

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter(({ vehicle, customer, activeOrder }) => {
      if (serviceFilter === "active" && !activeOrder) return false;
      if (serviceFilter === "inactive" && activeOrder) return false;
      if (statusFilter !== "all" && vehicle.status !== statusFilter) return false;
      if (!query) return true;
      return (
        getVehicleDisplayName(vehicle, "ar").toLowerCase().includes(query) ||
        getVehicleDisplayName(vehicle, "en").toLowerCase().includes(query) ||
        vehicle.plate.toLowerCase().includes(query) ||
        vehicle.vin?.toLowerCase().includes(query) ||
        customer.displayName.ar.toLowerCase().includes(query) ||
        customer.displayName.en.toLowerCase().includes(query)
      );
    });
  }, [search, serviceFilter, statusFilter, vehicles]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "vehicle":
          return factor * getVehicleDisplayName(a.vehicle, locale).localeCompare(getVehicleDisplayName(b.vehicle, locale));
        case "plate":
          return factor * a.vehicle.plate.localeCompare(b.vehicle.plate);
        case "mileage":
          return factor * ((a.lastMileage ?? a.vehicle.mileage ?? 0) - (b.lastMileage ?? b.vehicle.mileage ?? 0));
        case "lastVisit":
          return factor * ((a.lastVisitAt ? Date.parse(a.lastVisitAt) : 0) - (b.lastVisitAt ? Date.parse(b.lastVisitAt) : 0));
        default:
          return 0;
      }
    });
  }, [filtered, locale, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  function handleServiceFilterChange(value: string) {
    setServiceFilter(value as ServiceFilter);
    setPage(1);
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value as StatusFilter);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {can("vehicles:create") ? (
          <Button className="shrink-0 gap-2" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("newVehicle")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={formatNumber(stats.total, locale)} icon={Car} tone="accent" />
        <StatCard label={t("stats.active")} value={formatNumber(stats.active, locale)} icon={ClipboardList} />
        <StatCard label={t("stats.withVin")} value={formatNumber(stats.withVin, locale)} icon={Fingerprint} />
        <StatCard label={t("stats.customers")} value={formatNumber(stats.customers, locale)} icon={Users} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="vehicle-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="vehicle-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={serviceFilter} onValueChange={handleServiceFilterChange}>
          <SelectTrigger aria-label={t("serviceFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("serviceFilter.all")}</SelectItem>
            <SelectItem value="active">{t("serviceFilter.active")}</SelectItem>
            <SelectItem value="inactive">{t("serviceFilter.inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
            {vehicleStatuses.map((status) => (
              <SelectItem key={status} value={status}>{t(`status.${status}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.vehicle")} sortKey="vehicle" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <SortableTableHead label={t("columns.plate")} sortKey="plate" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.customer")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.service")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("status.title")}</TableHead>
                <SortableTableHead label={t("columns.mileage")} sortKey="mileage" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.lastVisit")} sortKey="lastVisit" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
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
                paged.map(({ vehicle, customer, activeOrder, lastMileage, lastVisitAt }) => (
                  <TableRow key={vehicle.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/vehicles/${vehicle.id}`}
                        aria-label={t("openVehicle", { name: getVehicleDisplayName(vehicle, locale) })}
                        data-numeric
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {getVehicleDisplayName(vehicle, locale)}
                      </Link>
                    </TableCell>
                    <TableCell data-ltr className="text-sm">{vehicle.plate}</TableCell>
                    <TableCell className="max-w-[13rem] truncate text-sm">{customer.displayName[lang]}</TableCell>
                    <TableCell>
                      {activeOrder ? (
                        <StatusBadge status={activeOrder.order.status} label={tStatus(activeOrder.order.status)} />
                      ) : (
                        <Badge variant="secondary">{t("noActiveOrder")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={vehicleStatusChip[vehicle.status]}>
                        {t(`status.${vehicle.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell data-numeric className="text-end text-sm whitespace-nowrap">
                      {lastMileage === undefined && vehicle.mileage === undefined
                        ? t("notAvailable")
                        : `${formatNumber(lastMileage ?? vehicle.mileage ?? 0, locale)} ${t("kilometers")}`}
                    </TableCell>
                    <TableCell data-numeric className="text-end text-xs whitespace-nowrap text-muted-foreground">
                      {lastVisitAt ? formatDate(lastVisitAt, locale) : t("neverVisited")}
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="vehicles"
                        label={getVehicleDisplayName(vehicle, locale)}
                        onEdit={() => setEditing(vehicle)}
                        onDelete={() => setDeleting(vehicle)}
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
        idPrefix="new-vehicle"
        open={creating}
        onOpenChange={setCreating}
        title={t("newVehicle")}
        description={t("form.description")}
        fields={formFields}
        initialValues={{
          customerId: customers[0]?.id ?? "",
          plate: "",
          make: "",
          model: "",
          year: String(new Date().getFullYear()),
          vin: "",
          mileage: "",
          status: "active",
        }}
        onSubmit={(values) => {
          const ok = createVehicle(toVehicle(values));
          if (ok) toast.success(tCommon("createdSuccess"));
          return ok;
        }}
      />

      <EntityFormDialog
        idPrefix="edit-vehicle"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("editVehicle")}
        description={t("form.description")}
        fields={formFields}
        initialValues={{
          customerId: editing?.customerId ?? "",
          plate: editing?.plate ?? "",
          make: editing?.make.ar ?? "",
          model: editing?.model.ar ?? "",
          year: String(editing?.year ?? new Date().getFullYear()),
          vin: editing?.vin ?? "",
          mileage: editing?.mileage === undefined ? "" : String(editing.mileage),
          status: editing?.status ?? "active",
        }}
        onSubmit={(values) => {
          if (!editing) return false;
          const ok = updateVehicle(editing.id, (vehicle) => toVehicle(values, vehicle));
          if (ok) toast.success(tCommon("saved"));
          return ok;
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting ? getVehicleDisplayName(deleting, locale) : ""}
        onConfirm={() => {
          if (deleting && removeVehicle(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
