import type { CustomerId, VehicleId } from "@/lib/domain/contracts";
import type { Estimate, EstimateItem } from "@/modules/estimates/types";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/modules/purchasing/types";
import type {
  TimelineEvent,
  WorkItem,
  WorkOrder,
  WorkPart,
} from "@/modules/work-orders/types";

import { num, opt, optText, text } from "./mappers";

/**
 * الكيانات ذات الجداول الأبناء.
 *
 * الأبناء تُجلب عبر التداخل في `select` لا باستعلام لكل صف — وإلا صار عرض
 * قائمة من ٥٠ أمر تشغيل ٢٠١ استعلامًا (مشكلة N+1). صيغة `select` المطلوبة
 * موثّقة فوق كل محوّل.
 *
 * الترتيب داخل الأبناء يعتمد `line_order` صراحةً: Postgres لا يضمن ترتيب
 * الصفوف بلا `order by`، وبند فاتورة يظهر في ترتيب مختلف كل تحميل خلل حقيقي.
 */

// ── أوامر التشغيل ──────────────────────────────────────────────────────

export type WorkOrderRow = {
  id: string;
  number: string;
  status: WorkOrder["status"];
  priority: WorkOrder["priority"];
  customer_id: string;
  vehicle_id: string;
  mileage_at_reception: number;
  complaint_ar: string;
  complaint_en: string;
  diagnosis_ar: string | null;
  diagnosis_en: string | null;
  technician_ar: string;
  technician_en: string;
  bay: number | null;
  received_at: string;
  estimated_delivery: string | null;
  delivered_at: string | null;
  discount: string | number;
  work_order_items: WorkOrderItemRow[] | null;
  work_order_parts: WorkOrderPartRow[] | null;
  work_order_timeline: WorkOrderTimelineRow[] | null;
};

type WorkOrderItemRow = {
  id: string;
  description_ar: string;
  description_en: string;
  hours: string | number;
  rate: string | number;
  done: boolean;
  line_order: number;
};

type WorkOrderPartRow = {
  id: string;
  name_ar: string;
  name_en: string;
  sku: string;
  qty: string | number;
  unit_price: string | number;
  install_status: WorkPart["installStatus"];
  line_order: number;
};

type WorkOrderTimelineRow = {
  id: string;
  status: WorkOrder["status"];
  occurred_at: string;
  actor_ar: string;
  actor_en: string;
  note_ar: string | null;
  note_en: string | null;
};

/** صيغة select المطابقة لهذا المحوّل. */
export const WORK_ORDER_SELECT = `
  *,
  work_order_items (*),
  work_order_parts (*),
  work_order_timeline (*)
`;

export function toWorkOrder(row: WorkOrderRow): WorkOrder {
  const items: WorkItem[] = (row.work_order_items ?? [])
    .slice()
    .sort((a, b) => a.line_order - b.line_order)
    .map((item) => ({
      id: item.id,
      description: text(item.description_ar, item.description_en),
      hours: num(item.hours, "work_order_items.hours"),
      rate: num(item.rate, "work_order_items.rate"),
      done: item.done,
    }));

  const parts: WorkPart[] = (row.work_order_parts ?? [])
    .slice()
    .sort((a, b) => a.line_order - b.line_order)
    .map((part) => ({
      id: part.id,
      name: text(part.name_ar, part.name_en),
      sku: part.sku,
      qty: num(part.qty, "work_order_parts.qty"),
      unitPrice: num(part.unit_price, "work_order_parts.unit_price"),
      installStatus: part.install_status,
    }));

  const timeline: TimelineEvent[] = (row.work_order_timeline ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
    .map((event) => ({
      id: event.id,
      status: event.status,
      timestamp: event.occurred_at,
      actor: text(event.actor_ar, event.actor_en),
      note: optText(event.note_ar, event.note_en),
    }));

  return {
    id: row.id,
    number: row.number,
    status: row.status,
    priority: row.priority,
    customerId: row.customer_id as CustomerId,
    vehicleId: row.vehicle_id as VehicleId,
    mileageAtReception: num(
      row.mileage_at_reception,
      "work_orders.mileage_at_reception",
    ),
    complaint: text(row.complaint_ar, row.complaint_en),
    diagnosis: optText(row.diagnosis_ar, row.diagnosis_en),
    technician: text(row.technician_ar, row.technician_en),
    bay: row.bay ?? undefined,
    receivedAt: row.received_at,
    estimatedDelivery: opt(row.estimated_delivery),
    deliveredAt: opt(row.delivered_at),
    discount: num(row.discount, "work_orders.discount"),
    items,
    parts,
    timeline,
  };
}

// ── التقديرات ──────────────────────────────────────────────────────────

export type EstimateRow = {
  id: string;
  number: string;
  customer_id: string;
  vehicle_id: string;
  status: Estimate["status"];
  created_at: string;
  valid_until: string;
  notes_ar: string | null;
  notes_en: string | null;
  linked_work_order_id: string | null;
  estimate_items: EstimateItemRow[] | null;
};

type EstimateItemRow = {
  id: string;
  description_ar: string;
  description_en: string;
  qty: string | number;
  unit_price: string | number;
  line_order: number;
};

export const ESTIMATE_SELECT = `*, estimate_items (*)`;

export function toEstimate(row: EstimateRow): Estimate {
  const items: EstimateItem[] = (row.estimate_items ?? [])
    .slice()
    .sort((a, b) => a.line_order - b.line_order)
    .map((item) => ({
      id: item.id,
      description: text(item.description_ar, item.description_en),
      qty: num(item.qty, "estimate_items.qty"),
      unitPrice: num(item.unit_price, "estimate_items.unit_price"),
    }));

  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id as CustomerId,
    vehicleId: row.vehicle_id as VehicleId,
    status: row.status,
    createdAt: row.created_at,
    validUntil: row.valid_until,
    items,
    notes: optText(row.notes_ar, row.notes_en),
    linkedWorkOrderId: opt(row.linked_work_order_id),
  };
}

// ── أوامر الشراء ───────────────────────────────────────────────────────

export type PurchaseOrderRow = {
  id: string;
  number: string;
  supplier_ar: string;
  supplier_en: string;
  status: PurchaseOrder["status"];
  ordered_at: string;
  expected_at: string;
  notes_ar: string | null;
  notes_en: string | null;
  purchase_order_items: PurchaseOrderItemRow[] | null;
};

type PurchaseOrderItemRow = {
  id: string;
  part_id: string | null;
  description_ar: string;
  description_en: string;
  sku: string;
  qty: string | number;
  unit_cost: string | number;
  line_order: number;
};

export const PURCHASE_ORDER_SELECT = `*, purchase_order_items (*)`;

export function toPurchaseOrder(row: PurchaseOrderRow): PurchaseOrder {
  const items: PurchaseOrderItem[] = (row.purchase_order_items ?? [])
    .slice()
    .sort((a, b) => a.line_order - b.line_order)
    .map((item) => ({
      id: item.id,
      partId: opt(item.part_id),
      description: text(item.description_ar, item.description_en),
      sku: item.sku,
      qty: num(item.qty, "purchase_order_items.qty"),
      unitCost: num(item.unit_cost, "purchase_order_items.unit_cost"),
    }));

  return {
    id: row.id,
    number: row.number,
    supplier: text(row.supplier_ar, row.supplier_en),
    status: row.status,
    orderedAt: row.ordered_at,
    expectedAt: row.expected_at,
    items,
    notes: optText(row.notes_ar, row.notes_en),
  };
}
