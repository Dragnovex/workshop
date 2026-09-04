"use client";

import { Download, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/patterns/date-range-filter";
import { SectionCard } from "@/components/patterns/section-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { isWithinRange, type DateRange } from "@/lib/date-range";
import { downloadCsv } from "@/lib/export/csv";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getPurchaseTotals } from "@/lib/services/purchasing-service";
import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { PurchaseOrder } from "@/modules/purchasing/types";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { getWorkOrderTotals } from "@/modules/work-orders/read-models";
import type { WorkOrder } from "@/modules/work-orders/types";

const PAGE_SIZE = 15;

/**
 * سجلا المشتريات وأوامر التشغيل — نمط برنامج محاسبي لا لوحة مؤشرات:
 * بحث من تاريخ إلى تاريخ، إجمالي الفترة أسفل الجدول، وتصدير CSV لما
 * هو معروض بالضبط بعد الفلترة (لا كل البيانات).
 *
 * التصدير يشمل الصفوف المفلترة كلها لا الصفحة الحالية وحدها: المحاسب
 * يصدّر فترة كاملة، وتصدير عشرة صفوف من أصل مئة خطأ صامت في مطابقة.
 */
export function LedgersView({
  purchaseOrders,
  workOrders,
  customers,
  vehicles,
}: {
  purchaseOrders: PurchaseOrder[];
  workOrders: WorkOrder[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("accounting.ledgers");
  const tStatus = useTranslations("workOrders.status");
  const tPurchaseStatus = useTranslations("purchasing.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const [purchaseRange, setPurchaseRange] = useState<DateRange>({ from: "", to: "" });
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);

  const [orderRange, setOrderRange] = useState<DateRange>({ from: "", to: "" });
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  );

  // ── سجل المشتريات ───────────────────────────────────────────────────
  const purchaseRows = useMemo(() => {
    const query = purchaseSearch.trim().toLowerCase();
    return purchaseOrders
      .filter((order) => {
        // تاريخ الفاتورة هو المرجع المحاسبي؛ الأوامر القديمة بلا فاتورة
        // تُقاس بتاريخ الطلب.
        if (!isWithinRange(order.invoiceDate ?? order.orderedAt, purchaseRange)) {
          return false;
        }
        if (!query) return true;
        return (
          order.number.toLowerCase().includes(query) ||
          order.supplier.ar.toLowerCase().includes(query) ||
          order.supplier.en.toLowerCase().includes(query) ||
          (order.invoiceNumber?.toLowerCase().includes(query) ?? false)
        );
      })
      .sort(
        (a, b) =>
          Date.parse(b.invoiceDate ?? b.orderedAt) -
          Date.parse(a.invoiceDate ?? a.orderedAt),
      );
  }, [purchaseOrders, purchaseRange, purchaseSearch]);

  const purchaseTotals = useMemo(
    () =>
      purchaseRows.reduce(
        (sums, order) => {
          const totals = getPurchaseTotals(order);
          return {
            subtotal: sums.subtotal + totals.subtotal,
            vat: sums.vat + totals.vat,
            total: sums.total + totals.total,
          };
        },
        { subtotal: 0, vat: 0, total: 0 },
      ),
    [purchaseRows],
  );

  const purchasePageCount = Math.max(1, Math.ceil(purchaseRows.length / PAGE_SIZE));
  const purchaseCurrentPage = Math.min(purchasePage, purchasePageCount);
  const pagedPurchases = purchaseRows.slice(
    (purchaseCurrentPage - 1) * PAGE_SIZE,
    purchaseCurrentPage * PAGE_SIZE,
  );

  function exportPurchases() {
    const ok = downloadCsv(
      `purchases-ledger-${new Date().toISOString().slice(0, 10)}`,
      [
        t("purchases.columns.date"),
        t("purchases.columns.number"),
        t("purchases.columns.invoiceNumber"),
        t("purchases.columns.supplier"),
        t("purchases.columns.status"),
        t("purchases.columns.subtotal"),
        t("purchases.columns.vat"),
        t("purchases.columns.total"),
      ],
      purchaseRows.map((order) => {
        const totals = getPurchaseTotals(order);
        return [
          (order.invoiceDate ?? order.orderedAt).slice(0, 10),
          order.number,
          order.invoiceNumber ?? "",
          order.supplier[lang],
          tPurchaseStatus(order.status),
          totals.subtotal,
          totals.vat,
          totals.total,
        ];
      }),
    );
    toast[ok ? "success" : "error"](
      ok ? t("exported") : tCommon("storageSaveFailed"),
    );
  }

  // ── سجل أوامر التشغيل ───────────────────────────────────────────────
  const orderRows = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return workOrders
      .filter((order) => {
        if (!isWithinRange(order.receivedAt, orderRange)) return false;
        if (!query) return true;
        const customer = customersById.get(order.customerId);
        const vehicle = vehiclesById.get(order.vehicleId);
        return (
          order.number.toLowerCase().includes(query) ||
          (customer?.displayName.ar.toLowerCase().includes(query) ?? false) ||
          (customer?.displayName.en.toLowerCase().includes(query) ?? false) ||
          (vehicle?.plate.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));
  }, [customersById, orderRange, orderSearch, vehiclesById, workOrders]);

  const orderTotals = useMemo(
    () =>
      orderRows.reduce(
        (sums, order) => {
          const totals = getWorkOrderTotals(order);
          return {
            labor: sums.labor + totals.labor,
            parts: sums.parts + totals.parts,
            total: sums.total + totals.total,
          };
        },
        { labor: 0, parts: 0, total: 0 },
      ),
    [orderRows],
  );

  const orderPageCount = Math.max(1, Math.ceil(orderRows.length / PAGE_SIZE));
  const orderCurrentPage = Math.min(orderPage, orderPageCount);
  const pagedOrders = orderRows.slice(
    (orderCurrentPage - 1) * PAGE_SIZE,
    orderCurrentPage * PAGE_SIZE,
  );

  function exportOrders() {
    const ok = downloadCsv(
      `work-orders-ledger-${new Date().toISOString().slice(0, 10)}`,
      [
        t("workOrders.columns.date"),
        t("workOrders.columns.number"),
        t("workOrders.columns.customer"),
        t("workOrders.columns.vehicle"),
        t("workOrders.columns.status"),
        t("workOrders.columns.labor"),
        t("workOrders.columns.parts"),
        t("workOrders.columns.total"),
      ],
      orderRows.map((order) => {
        const totals = getWorkOrderTotals(order);
        const customer = customersById.get(order.customerId);
        const vehicle = vehiclesById.get(order.vehicleId);
        return [
          order.receivedAt.slice(0, 10),
          order.number,
          customer?.displayName[lang] ?? "",
          vehicle ? `${getVehicleDisplayName(vehicle, lang)} · ${vehicle.plate}` : "",
          tStatus(order.status),
          totals.labor,
          totals.parts,
          totals.total,
        ];
      }),
    );
    toast[ok ? "success" : "error"](
      ok ? t("exported") : tCommon("storageSaveFailed"),
    );
  }

  return (
    <Tabs defaultValue="purchases" className="w-full">
      <TabsList>
        <TabsTrigger value="purchases">{t("purchases.title")}</TabsTrigger>
        <TabsTrigger value="workOrders">{t("workOrders.title")}</TabsTrigger>
      </TabsList>

      {/* ── سجل المشتريات ── */}
      <TabsContent value="purchases" className="mt-4">
        <SectionCard
          title={t("purchases.title")}
          subtitle={t("purchases.subtitle")}
          contentClassName="flex flex-col gap-4 p-4"
          action={
            <Button variant="outline" size="sm" className="gap-2" onClick={exportPurchases}>
              <Download className="size-4" />
              {tCommon("exportCsv")}
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="purchases-ledger-search" className="sr-only">
                {t("purchases.searchLabel")}
              </label>
              <Input
                id="purchases-ledger-search"
                value={purchaseSearch}
                onChange={(event) => {
                  setPurchaseSearch(event.target.value);
                  setPurchasePage(1);
                }}
                placeholder={t("purchases.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <DateRangeFilter
              value={purchaseRange}
              onChange={(next) => {
                setPurchaseRange(next);
                setPurchasePage(1);
              }}
              idPrefix="purchases-ledger"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs whitespace-nowrap">{t("purchases.columns.date")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("purchases.columns.number")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("purchases.columns.invoiceNumber")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("purchases.columns.supplier")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("purchases.columns.status")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("purchases.columns.subtotal")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("purchases.columns.vat")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("purchases.columns.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPurchases.map((order) => {
                    const totals = getPurchaseTotals(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatDate(order.invoiceDate ?? order.orderedAt, locale)}
                        </TableCell>
                        <TableCell data-ltr className="text-xs">
                          <Link
                            href={`/purchasing/${order.id}`}
                            className="font-medium hover:underline focus-visible:underline"
                          >
                            {order.number}
                          </Link>
                        </TableCell>
                        <TableCell data-ltr className="text-xs text-muted-foreground">
                          {order.invoiceNumber ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[14rem] truncate text-sm">{order.supplier[lang]}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tPurchaseStatus(order.status)}</Badge>
                        </TableCell>
                        <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.subtotal, locale)}</TableCell>
                        <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.vat, locale)}</TableCell>
                        <TableCell data-numeric className="text-end text-sm font-medium">{formatMoney(totals.total, locale)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-sm font-semibold">
                    {t("periodTotal", { count: formatNumber(purchaseRows.length, locale) })}
                  </TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(purchaseTotals.subtotal, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(purchaseTotals.vat, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(purchaseTotals.total, locale)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <TablePagination
            page={purchaseCurrentPage}
            pageCount={purchasePageCount}
            totalItems={purchaseRows.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPurchasePage}
          />
        </SectionCard>
      </TabsContent>

      {/* ── سجل أوامر التشغيل ── */}
      <TabsContent value="workOrders" className="mt-4">
        <SectionCard
          title={t("workOrders.title")}
          subtitle={t("workOrders.subtitle")}
          contentClassName="flex flex-col gap-4 p-4"
          action={
            <Button variant="outline" size="sm" className="gap-2" onClick={exportOrders}>
              <Download className="size-4" />
              {tCommon("exportCsv")}
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="orders-ledger-search" className="sr-only">
                {t("workOrders.searchLabel")}
              </label>
              <Input
                id="orders-ledger-search"
                value={orderSearch}
                onChange={(event) => {
                  setOrderSearch(event.target.value);
                  setOrderPage(1);
                }}
                placeholder={t("workOrders.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <DateRangeFilter
              value={orderRange}
              onChange={(next) => {
                setOrderRange(next);
                setOrderPage(1);
              }}
              idPrefix="orders-ledger"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs whitespace-nowrap">{t("workOrders.columns.date")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("workOrders.columns.number")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("workOrders.columns.customer")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("workOrders.columns.vehicle")}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{t("workOrders.columns.status")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("workOrders.columns.labor")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("workOrders.columns.parts")}</TableHead>
                  <TableHead className="text-end text-xs whitespace-nowrap">{t("workOrders.columns.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedOrders.map((order) => {
                    const totals = getWorkOrderTotals(order);
                    const customer = customersById.get(order.customerId);
                    const vehicle = vehiclesById.get(order.vehicleId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatDate(order.receivedAt, locale)}
                        </TableCell>
                        <TableCell data-ltr className="text-xs">
                          <Link
                            href={`/work-orders/${order.id}`}
                            className="font-medium hover:underline focus-visible:underline"
                          >
                            {order.number}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate text-sm">
                          {customer?.displayName[lang] ?? "—"}
                        </TableCell>
                        <TableCell data-numeric className="max-w-[12rem] truncate text-sm">
                          {vehicle ? getVehicleDisplayName(vehicle, locale) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tStatus(order.status)}</Badge>
                        </TableCell>
                        <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.labor, locale)}</TableCell>
                        <TableCell data-numeric className="text-end text-sm">{formatMoney(totals.parts, locale)}</TableCell>
                        <TableCell data-numeric className="text-end text-sm font-medium">{formatMoney(totals.total, locale)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-sm font-semibold">
                    {t("periodTotal", { count: formatNumber(orderRows.length, locale) })}
                  </TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(orderTotals.labor, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(orderTotals.parts, locale)}</TableCell>
                  <TableCell data-numeric className="text-end text-sm font-semibold">{formatMoney(orderTotals.total, locale)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <TablePagination
            page={orderCurrentPage}
            pageCount={orderPageCount}
            totalItems={orderRows.length}
            pageSize={PAGE_SIZE}
            onPageChange={setOrderPage}
          />
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
