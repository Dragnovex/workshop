"use client";

import { ClipboardCheck, ClipboardList, Plus, Search, Timer, UserPlus, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import {
  EntityFormDialog,
  type FormFieldDef,
} from "@/components/patterns/entity-form-dialog";
import { RowActions } from "@/components/patterns/row-actions";
import { SortableTableHead, nextSortState, type SortDirection } from "@/components/patterns/sortable-table-head";
import { workOrderStatuses } from "@/components/patterns/status-badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { firstIssueMessage, newWorkOrderSchema } from "@/lib/validation/forms";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import {
  getWorkOrderTotals,
  type WorkOrderReadModel,
} from "../read-models";
import { useLocalCollection } from "@/lib/use-local-collection";
import { nextWorkOrderNumber, workOrderStore, workOrderTombstones } from "../client-store";
import { loadStoredCustomers, saveStoredCustomers } from "@/modules/customers/client-store";
import { loadStoredVehicles, saveStoredVehicles } from "@/modules/vehicles/client-store";
import type { CustomerId, VehicleId } from "@/lib/domain/contracts";
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus } from "../types";

const PRIORITY_STYLES = {
  low: "text-muted-foreground text-xs",
  normal: "text-muted-foreground text-xs",
  high: "text-warning-text text-xs font-medium",
  urgent: "text-danger-text text-xs font-semibold",
} as const;

type SortKey = "number" | "customer" | "total" | "received";

const PAGE_SIZE = 10;

/** ربط خفيف بلا تحقق — الأوامر الجديدة لا تمر عبر مدقّق البذرة. */
function joinReadModels(
  orders: WorkOrder[],
  customers: Customer[],
  vehicles: Vehicle[],
): WorkOrderReadModel[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  return orders.flatMap((order) => {
    const customer = customersById.get(order.customerId);
    const vehicle = vehiclesById.get(order.vehicleId);
    return customer && vehicle ? [{ order, customer, vehicle }] : [];
  });
}

export function WorkOrdersView({
  initialOrders,
  customers: seedCustomers,
  vehicles: seedVehicles,
}: {
  initialOrders: WorkOrder[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("workOrders");
  const tCreate = useTranslations("workOrders.create");
  const tStatus = useTranslations("workOrders.status");
  const tPriority = useTranslations("workOrders.priority");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  // الإنشاء والتعديل والحذف كلها تمرّ بمحرّك واحد يتحقق من الصلاحية
  // ومن نجاح الكتابة قبل تحديث الشاشة (كان الحفظ سابقًا في Effect يعمل
  // بعد تحديث الحالة، فيظهر الأمر ثم يختفي عند فشل التخزين).
  const {
    rows: orders,
    create: createOrder,
    update: updateOrder,
    remove: removeOrder,
  } = useLocalCollection<WorkOrder>({
    resource: "workOrders",
    seed: initialOrders,
    store: workOrderStore,
    tombstones: workOrderTombstones,
  });

  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [deleting, setDeleting] = useState<WorkOrder | null>(null);

  // عملاء ومركبات الواجهة (المُنشأون من صفحاتهم أو من حوار عميل جديد
  // سريع هنا) يعيشون في localStorage — بدون هذا الدمج لا يظهرون في
  // قائمة الاختيار لأمر تشغيل جديد.
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers(seedCustomers));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadStoredVehicles(seedVehicles));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const searchParams = useSearchParams();

  // ─── نموذج الأمر الجديد ───
  // يُفتح تلقائيًا عند الوصول عبر «إجراء سريع» (رابط ?new=1) — قيمة ابتدائية
  // فقط عبر lazy initializer، بلا Effect يستدعي setState (تجنّبًا لإعادة رسم متتالية).
  const [dialogOpen, setDialogOpen] = useState(() => searchParams.get("new") === "1");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newVehicleId, setNewVehicleId] = useState("");
  const [newComplaint, setNewComplaint] = useState("");
  const [newRequest, setNewRequest] = useState("");
  const [newPriority, setNewPriority] = useState<WorkOrderPriority>("normal");

  // ─── نموذج «عميل جديد» السريع — عرض بديل داخل نفس الحوار، لا حوار Radix
  // متداخل منفصل. حوارا Radix متزامنان (إغلاق أحدهما وفتح الآخر) يتركان
  // body.style.pointerEvents="none" عالقًا وحركة الدخول عالقة عند opacity:0
  // (خلل داخلي معروف) — التبديل بين محتويين داخل حوار واحد يتجنّبه كليًا.
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickVehicleType, setQuickVehicleType] = useState("");
  const [quickPlate, setQuickPlate] = useState("");

  function handleQuickCustomerCreate() {
    const name = quickName.trim();
    const vehicleType = quickVehicleType.trim();
    const plate = quickPlate.trim();
    if (!name) {
      toast.error(tCreate("quickCustomerRequiredName"));
      return;
    }
    if (!vehicleType) {
      toast.error(tCreate("quickCustomerRequiredVehicleType"));
      return;
    }
    if (!plate) {
      toast.error(tCreate("quickCustomerRequiredPlate"));
      return;
    }

    const customerId: CustomerId = `customer-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const customer: Customer = {
      id: customerId,
      kind: "individual",
      displayName: { ar: name, en: name },
      phone: quickPhone.trim() || undefined,
    };

    // «نوع السيارة» حقل واحد كما طُلب — أول كلمة ماركة والباقي موديل،
    // وإلا فالكلمة الوحيدة تُستخدم للاثنين معًا حتى لا يظهر عرض ناقص.
    const [make, ...rest] = vehicleType.split(/\s+/);
    const model = rest.join(" ") || make;
    const vehicleId: VehicleId = `vehicle-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const vehicle: Vehicle = {
      id: vehicleId,
      customerId,
      make: { ar: make, en: make },
      model: { ar: model, en: model },
      year: new Date().getFullYear(),
      plate,
      status: "active",
    };

    const nextCustomers = [...customers, customer];
    const nextVehicles = [...vehicles, vehicle];
    const customersOk = saveStoredCustomers(nextCustomers);
    const vehiclesOk = saveStoredVehicles(nextVehicles);
    if (!customersOk || !vehiclesOk) {
      toast.error(tCommon("storageSaveFailed"));
      return;
    }

    setCustomers(nextCustomers);
    setVehicles(nextVehicles);
    setNewCustomerId(customerId);
    setNewVehicleId(vehicleId);

    setQuickName("");
    setQuickPhone("");
    setQuickVehicleType("");
    setQuickPlate("");
    setQuickCustomerOpen(false);
    toast.success(tCreate("quickCustomerCreated"));
  }

  const editFields = useMemo<FormFieldDef[]>(
    () => [
      {
        name: "status",
        label: t("columns.status"),
        kind: "select",
        required: true,
        options: workOrderStatuses.map((status) => ({
          value: status,
          label: tStatus(status),
        })),
      },
      {
        name: "priority",
        label: tCreate("priority"),
        kind: "select",
        required: true,
        options: (["low", "normal", "high", "urgent"] as WorkOrderPriority[]).map(
          (priority) => ({ value: priority, label: tPriority(priority) }),
        ),
      },
      { name: "technician", label: t("columns.technician"), kind: "text" },
      { name: "mileage", label: t("edit.mileage"), kind: "number" },
      { name: "complaint", label: tCreate("complaint"), kind: "textarea", required: true, wide: true },
      { name: "request", label: tCreate("request"), kind: "textarea", wide: true },
    ],
    [t, tCreate, tPriority, tStatus],
  );

  const createSchema = useMemo(
    () =>
      newWorkOrderSchema({
        requiredCustomer: tCreate("requiredCustomer"),
        requiredVehicle: tCreate("requiredVehicle"),
        requiredComplaint: tCreate("requiredComplaint"),
      }),
    [tCreate],
  );

  const readModels = useMemo(
    () => joinReadModels(orders, customers, vehicles),
    [orders, customers, vehicles],
  );

  const stats = useMemo(
    () => ({
      open: orders.filter((order) => order.status !== "delivered").length,
      awaitingApproval: orders.filter((order) => order.status === "awaitingApproval").length,
      inProgress: orders.filter((order) => order.status === "inProgress").length,
      readyForDelivery: orders.filter((order) => order.status === "readyForDelivery").length,
    }),
    [orders],
  );

  const customerVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.customerId === newCustomerId),
    [vehicles, newCustomerId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return readModels.filter(({ order, customer, vehicle }) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        order.number.toLowerCase().includes(q) ||
        customer.displayName.ar.toLowerCase().includes(q) ||
        customer.displayName.en.toLowerCase().includes(q) ||
        vehicle.plate.toLowerCase().includes(q) ||
        getVehicleDisplayName(vehicle, "ar").toLowerCase().includes(q) ||
        getVehicleDisplayName(vehicle, "en").toLowerCase().includes(q)
      );
    });
  }, [readModels, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return factor * a.order.number.localeCompare(b.order.number);
        case "customer":
          return factor * a.customer.displayName[lang].localeCompare(b.customer.displayName[lang]);
        case "total":
          return factor * (getWorkOrderTotals(a.order).total - getWorkOrderTotals(b.order).total);
        case "received":
          return factor * (Date.parse(a.order.receivedAt) - Date.parse(b.order.receivedAt));
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

  function handleCreate() {
    const parsed = createSchema.safeParse({
      customerId: newCustomerId,
      vehicleId: newVehicleId,
      complaint: newComplaint,
      request: newRequest,
      priority: newPriority,
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }
    const input = parsed.data;

    const now = new Date().toISOString();
    const order: WorkOrder = {
      id: `wo-${Date.now()}`,
      number: nextWorkOrderNumber(orders),
      status: "reception",
      priority: input.priority,
      customerId: input.customerId as CustomerId,
      vehicleId: input.vehicleId as VehicleId,
      mileageAtReception: 0,
      complaint: { ar: input.complaint, en: input.complaint },
      // المطلوب يُخزَّن في diagnosis — الحقل القائم لما تقرّره الورشة تنفيذه.
      diagnosis: input.request
        ? { ar: input.request, en: input.request }
        : undefined,
      technician: { ar: "—", en: "—" },
      receivedAt: now,
      discount: 0,
      items: [],
      parts: [],
      timeline: [
        {
          id: `t-${Date.now()}`,
          status: "reception",
          timestamp: now,
          actor: { ar: "مكتب الاستقبال", en: "Reception desk" },
        },
      ],
    };

    // لا نغلق الحوار ولا ندّعي نجاحًا قبل أن تُكتب البيانات فعليًا.
    if (!createOrder(order)) return;
    setDialogOpen(false);
    setNewCustomerId("");
    setNewVehicleId("");
    setNewComplaint("");
    setNewPriority("normal");
    toast.success(tCreate("created"), { description: order.number });
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            // إغلاق الحوار بالكامل (لا فقط الرجوع من نموذج العميل السريع)
            // يعيده لعرض أمر التشغيل في المرة القادمة.
            if (!open) setQuickCustomerOpen(false);
          }}
        >
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="size-4" />
              {t("new")}
            </Button>
          </DialogTrigger>
          {/* نموذج «عميل جديد» عرض بديل داخل نفس الحوار — لا حوار Radix متداخل
              منفصل، لتفادي خلل معروف: فتح/إغلاق حوارين متزامنين يترك
              body.style.pointerEvents="none" عالقًا وحركة الدخول عالقة عند
              opacity:0، فيُجمّد الصفحة بصمت. */}
          {quickCustomerOpen ? (
            /* data-[state=open]:opacity-100! تجاوز صريح لخلل حركة animate-in المعروف: تبديل
               محتوى الحوار (بدل فتح/إغلاق حوار Radix منفصل) لا يُشغّل حركة
               الدخول بشكل صحيح فتبقى شفافة (opacity:0) دائمًا. */
            <DialogContent className="data-[state=open]:opacity-100!">
              <DialogHeader>
                <DialogTitle>{tCreate("quickCustomerTitle")}</DialogTitle>
                <DialogDescription>{tCreate("quickCustomerDescription")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="quick-customer-name">{tCreate("quickCustomerName")}</Label>
                  <Input
                    id="quick-customer-name"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder={tCreate("quickCustomerNamePlaceholder")}
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quick-customer-phone">{tCreate("quickCustomerPhone")}</Label>
                  <Input
                    id="quick-customer-phone"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    placeholder="+9665xxxxxxxx"
                    dir="ltr"
                    className="text-end"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quick-vehicle-type">{tCreate("quickVehicleType")}</Label>
                  <Input
                    id="quick-vehicle-type"
                    value={quickVehicleType}
                    onChange={(e) => setQuickVehicleType(e.target.value)}
                    placeholder={tCreate("quickVehicleTypePlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quick-vehicle-plate">{tCreate("quickVehiclePlate")}</Label>
                  <Input
                    id="quick-vehicle-plate"
                    value={quickPlate}
                    onChange={(e) => setQuickPlate(e.target.value)}
                    dir="ltr"
                    className="text-end"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setQuickCustomerOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="button" onClick={handleQuickCustomerCreate}>
                  {tCreate("quickCustomerSave")}
                </Button>
              </DialogFooter>
            </DialogContent>
          ) : (
            <DialogContent className="data-[state=open]:opacity-100!">
              <DialogHeader>
                <DialogTitle>{t("new")}</DialogTitle>
                <DialogDescription>{tCreate("description")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="wo-customer">{tCreate("customer")}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => setQuickCustomerOpen(true)}
                    >
                      <UserPlus className="size-3.5" />
                      {tCreate("newCustomer")}
                    </Button>
                  </div>
                  <Select
                    value={newCustomerId}
                    onValueChange={(value) => {
                      setNewCustomerId(value);
                      setNewVehicleId("");
                    }}
                  >
                    <SelectTrigger id="wo-customer">
                      <SelectValue placeholder={tCreate("customerPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.displayName[lang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wo-vehicle">{tCreate("vehicle")}</Label>
                  <Select
                    value={newVehicleId}
                    onValueChange={setNewVehicleId}
                    disabled={!newCustomerId || customerVehicles.length === 0}
                  >
                    <SelectTrigger id="wo-vehicle">
                      <SelectValue
                        placeholder={
                          customerVehicles.length === 0
                            ? tCreate("noVehicles")
                            : tCreate("vehiclePlaceholder")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customerVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {getVehicleDisplayName(vehicle, locale)} · {vehicle.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* الشكوى والمطلوب حقلان منفصلان: الأولى ما يشكو منه العميل،
                    والثاني ما تقرّر الورشة تنفيذه (إصلاح أو قطعة). */}
                <div className="grid gap-2">
                  <Label htmlFor="wo-complaint">{tCreate("complaint")}</Label>
                  <Textarea
                    id="wo-complaint"
                    value={newComplaint}
                    onChange={(e) => setNewComplaint(e.target.value)}
                    placeholder={tCreate("complaintPlaceholder")}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wo-request">{tCreate("request")}</Label>
                  <Textarea
                    id="wo-request"
                    value={newRequest}
                    onChange={(e) => setNewRequest(e.target.value)}
                    placeholder={tCreate("requestPlaceholder")}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{tCreate("priority")}</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as WorkOrderPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "normal", "high", "urgent"] as WorkOrderPriority[]).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {tPriority(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                {/* الزر ليس معطَّلًا عمدًا: التحقق يعرض سبب المنع بدل صمت زر مطفأ. */}
                <Button type="button" onClick={handleCreate}>
                  {tCreate("submit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {/* بطاقات المؤشرات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("stats.open")}
          value={formatNumber(stats.open, locale)}
          icon={ClipboardList}
          tone="neutral"
        />
        <StatCard
          label={t("stats.awaitingApproval")}
          value={formatNumber(stats.awaitingApproval, locale)}
          icon={Timer}
          tone="neutral"
        />
        <StatCard
          label={t("stats.inProgress")}
          value={formatNumber(stats.inProgress, locale)}
          icon={Wrench}
          tone="accent"
        />
        <StatCard
          label={t("stats.readyForDelivery")}
          value={formatNumber(stats.readyForDelivery, locale)}
          icon={ClipboardCheck}
          tone="neutral"
        />
      </div>

      {/* شريط البحث والفلتر */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as WorkOrderStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {workOrderStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الجدول */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.number")} sortKey="number" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <SortableTableHead label={t("columns.customer")} sortKey="customer" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vehicle")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">
                  {t("columns.technician")}
                </TableHead>
                <SortableTableHead label={t("columns.total")} sortKey="total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <SortableTableHead label={t("columns.received")} sortKey="received" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="end" />
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(({ order: wo, customer, vehicle }) => {
                  const { total } = getWorkOrderTotals(wo);
                  return (
                    <TableRow key={wo.id} className="relative cursor-pointer">
                      <TableCell className="ps-4">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/work-orders/${wo.id}`}
                            aria-label={t("openOrder", { number: wo.number })}
                            data-ltr
                            className="font-mono text-xs font-medium whitespace-nowrap outline-none after:absolute after:inset-0 focus-visible:underline"
                          >
                            {wo.number}
                          </Link>
                          <span className={PRIORITY_STYLES[wo.priority]}>
                            {tPriority(wo.priority)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[13rem] truncate text-sm">
                        {customer.displayName[lang]}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span data-numeric className="max-w-[14rem] truncate text-sm">
                            {getVehicleDisplayName(vehicle, locale)}
                          </span>
                          <span data-ltr className="text-2xs text-muted-foreground">
                            {vehicle.plate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={wo.status} label={tStatus(wo.status)} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {wo.technician[lang]}
                      </TableCell>
                      <TableCell className="text-end whitespace-nowrap">
                        {total > 0 ? (
                          <>
                            <span data-numeric className="text-sm font-medium">
                              {formatCurrency(total, locale)}
                            </span>
                            <span className="ms-1 text-2xs text-muted-foreground">
                              {tCommon("currency")}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-end text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(wo.receivedAt, locale)}
                      </TableCell>
                      <TableCell className="pe-4">
                        <RowActions
                          resource="workOrders"
                          label={wo.number}
                          onEdit={() => setEditing(wo)}
                          onDelete={() => setDeleting(wo)}
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
        idPrefix="edit-work-order"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("edit.title")}
        description={t("edit.description")}
        fields={editFields}
        initialValues={{
          status: editing?.status ?? "reception",
          priority: editing?.priority ?? "normal",
          technician: editing?.technician[lang] ?? "",
          mileage: String(editing?.mileageAtReception ?? 0),
          complaint: editing?.complaint[lang] ?? "",
          request: editing?.diagnosis?.[lang] ?? "",
        }}
        onSubmit={(values) => {
          if (!editing) return false;
          const status = values.status as WorkOrderStatus;
          const technician = values.technician.trim() || "—";
          const complaint = values.complaint.trim();
          const request = values.request.trim();

          const ok = updateOrder(editing.id, (order) => ({
            ...order,
            status,
            priority: values.priority as WorkOrderPriority,
            technician: { ar: technician, en: technician },
            mileageAtReception: Number(values.mileage),
            complaint: { ar: complaint, en: complaint },
            diagnosis: request ? { ar: request, en: request } : undefined,
            // تغيير الحالة يُسجَّل في الخط الزمني: سجل أمر التشغيل هو
            // مرجع النزاع مع العميل، وقفزة حالة بلا أثر تُفقده قيمته.
            timeline:
              status === order.status
                ? order.timeline
                : [
                    ...order.timeline,
                    {
                      id: `t-${Date.now().toString(36)}`,
                      status,
                      timestamp: new Date().toISOString(),
                      actor: { ar: technician, en: technician },
                    },
                  ],
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
        name={deleting?.number ?? ""}
        onConfirm={() => {
          if (deleting && removeOrder(deleting.id)) {
            toast.success(tCommon("deleted"));
          }
        }}
      />
    </div>
  );
}
