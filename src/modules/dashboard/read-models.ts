import { customers } from "@/modules/customers/data";
import { parts } from "@/modules/inventory/data";
import { invoices } from "@/modules/invoices/data";
import { getInvoiceTotals } from "@/modules/invoices/read-models";
import { vehicles } from "@/modules/vehicles/data";
import { workOrders } from "@/modules/work-orders/data";
import { createWorkOrderReadModels, getWorkOrderTotals } from "@/modules/work-orders/read-models";
import { workOrderStatuses, type WorkOrderStatus } from "@/modules/work-orders/types";
import { technicianCapacity, totalBays, type Bilingual } from "./data";

const workOrderModels = createWorkOrderReadModels(workOrders, customers, vehicles);
const openOrders = workOrderModels.filter(({ order }) => order.status !== "delivered");

function isSameDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export type DashboardKpis = {
  openWorkOrders: number;
  vehiclesInWorkshop: number;
  todayRevenue: number;
  pendingApprovals: number;
  avgTurnaroundHours: number;
  partsBelowMin: number;
};

export function getDashboardKpis(now = new Date()): DashboardKpis {
  const deliveredOrders = workOrderModels.filter(({ order }) => order.deliveredAt);
  const turnaroundHours = deliveredOrders.map(
    ({ order }) => (Date.parse(order.deliveredAt!) - Date.parse(order.receivedAt)) / 3600000,
  );

  const todayInvoices = invoices.filter(
    (invoice) => invoice.status !== "cancelled" && isSameDay(invoice.issuedAt, now),
  );

  return {
    openWorkOrders: openOrders.length,
    vehiclesInWorkshop: new Set(openOrders.map(({ vehicle }) => vehicle.id)).size,
    todayRevenue: todayInvoices.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).total, 0),
    pendingApprovals: workOrderModels.filter(({ order }) => order.status === "awaitingApproval").length,
    avgTurnaroundHours:
      turnaroundHours.length === 0
        ? 0
        : turnaroundHours.reduce((sum, hours) => sum + hours, 0) / turnaroundHours.length,
    partsBelowMin: parts.filter((part) => part.qtyOnHand <= part.reorderLevel).length,
  };
}

export function getPipeline(): { status: WorkOrderStatus; count: number }[] {
  return workOrderStatuses.map((status) => ({
    status,
    count: workOrderModels.filter(({ order }) => order.status === status).length,
  }));
}

export function getRecentOrders(now = new Date(), limit = 6) {
  return [...workOrderModels]
    .sort((a, b) => Date.parse(b.order.receivedAt) - Date.parse(a.order.receivedAt))
    .slice(0, limit)
    .map((model) => ({
      ...model,
      totals: getWorkOrderTotals(model.order),
      minutesAgo: Math.max(0, Math.round((now.getTime() - Date.parse(model.order.receivedAt)) / 60000)),
    }));
}

export type TechnicianLoad = {
  name: Bilingual;
  initials: Bilingual;
  assigned: number;
  capacity: number;
};

export function getTechnicianLoad(): TechnicianLoad[] {
  return Object.entries(technicianCapacity).map(([nameAr, entry]) => ({
    name: entry.name,
    initials: entry.initials,
    capacity: entry.capacity,
    assigned: openOrders.filter(({ order }) => order.technician.ar === nameAr).length,
  }));
}

export type BayState = "busy" | "free";

export function getBays(): { id: number; state: BayState }[] {
  const occupied = new Set(openOrders.map(({ order }) => order.bay).filter((bay): bay is number => bay !== undefined));
  return Array.from({ length: totalBays }, (_, index) => {
    const id = index + 1;
    return { id, state: occupied.has(id) ? "busy" : "free" };
  });
}

export function getRevenueSeries(now = new Date(), days = 7) {
  const series = Array.from({ length: days }, (_, index) => {
    const dayOffset = index - (days - 1);
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    return { dayOffset, date, labor: 0, parts: 0 };
  });

  for (const { order } of workOrderModels) {
    const point = series.find((entry) => isSameDay(order.receivedAt, entry.date));
    if (!point) continue;
    const totals = getWorkOrderTotals(order);
    point.labor += totals.labor;
    point.parts += totals.parts;
  }

  return series.map(({ dayOffset, labor, parts: partsTotal }) => ({ dayOffset, labor, parts: partsTotal }));
}
