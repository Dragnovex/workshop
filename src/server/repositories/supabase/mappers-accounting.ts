import type { AuditLogEntry } from "@/lib/domain/audit";
import type { CustomerId, VehicleId } from "@/lib/domain/contracts";
import type { PaymentMethod } from "@/lib/domain/payment";
import type {
  DailyClosing,
  DailyClosingAuditEntry,
  DailyClosingEntry,
} from "@/modules/daily-closing/types";
import type {
  Invoice,
  InvoiceLineItem,
  PartySnapshot,
} from "@/modules/invoices/types";

import { num, opt, optText, text } from "./mappers";

/**
 * الفواتير وتقفيل اليومية — قلب النظام المحاسبي.
 *
 * كل مبلغ هنا يمرّ عبر `num()` التي ترفض `NaN` بدل تمريره. عمود numeric
 * يعود نصًا من Postgres، و`"1200.00"` يبدو سليمًا في السجلات بينما يفسد
 * أي جمع لاحق. هذه الدالة هي الحاجز الوحيد بين قاعدة البيانات والحسابات.
 */

// ── الفواتير ───────────────────────────────────────────────────────────

export type InvoiceRow = {
  id: string;
  document_type: Invoice["documentType"];
  kind: Invoice["kind"];
  number: string | null;
  sequence_number: string | number | null;
  uuid: string;
  status: Invoice["status"];
  issued_at: string | null;
  supply_date: string;
  due_at: string | null;
  customer_id: string;
  vehicle_id: string | null;
  linked_work_order_id: string | null;
  linked_estimate_id: string | null;
  seller_snapshot: PartySnapshot;
  buyer_snapshot: PartySnapshot;
  payment_method: PaymentMethod;
  paid_amount: string | number;
  notes_ar: string | null;
  notes_en: string | null;
  related_invoice_id: string | null;
  reason_for_note_ar: string | null;
  reason_for_note_en: string | null;
  invoice_line_items: InvoiceLineItemRow[] | null;
  invoice_audit_log: InvoiceAuditRow[] | null;
};

type InvoiceLineItemRow = {
  id: string;
  description_ar: string;
  description_en: string;
  qty: string | number;
  unit_price: string | number;
  discount: string | number;
  tax_category: InvoiceLineItem["taxCategory"];
  tax_rate: string | number;
  exemption_reason_ar: string | null;
  exemption_reason_en: string | null;
  line_order: number;
};

type InvoiceAuditRow = {
  id: string;
  logged_at: string;
  actor_ar: string;
  actor_en: string;
  action_ar: string;
  action_en: string;
  note_ar: string | null;
  note_en: string | null;
};

export const INVOICE_SELECT = `*, invoice_line_items (*), invoice_audit_log (*)`;

export function toInvoice(row: InvoiceRow): Invoice {
  const items: InvoiceLineItem[] = (row.invoice_line_items ?? [])
    .slice()
    .sort((a, b) => a.line_order - b.line_order)
    .map((item) => ({
      id: item.id,
      description: text(item.description_ar, item.description_en),
      qty: num(item.qty, "invoice_line_items.qty"),
      unitPrice: num(item.unit_price, "invoice_line_items.unit_price"),
      discount: num(item.discount, "invoice_line_items.discount"),
      taxCategory: item.tax_category,
      taxRate: num(item.tax_rate, "invoice_line_items.tax_rate"),
      exemptionReason: optText(
        item.exemption_reason_ar,
        item.exemption_reason_en,
      ),
    }));

  const auditLog: AuditLogEntry[] = (row.invoice_audit_log ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.logged_at) - Date.parse(b.logged_at))
    .map((entry) => ({
      id: entry.id,
      timestamp: entry.logged_at,
      actor: text(entry.actor_ar, entry.actor_en),
      action: text(entry.action_ar, entry.action_en),
      note: optText(entry.note_ar, entry.note_en),
    }));

  return {
    id: row.id,
    documentType: row.document_type,
    kind: row.kind,
    // مسودة لم تُصدَر بعد: لا رقم ولا تسلسل. الفراغ صريح لا مُلفَّق.
    number: row.number ?? "",
    sequenceNumber:
      row.sequence_number === null
        ? 0
        : num(row.sequence_number, "invoices.sequence_number"),
    uuid: row.uuid,
    status: row.status,
    issuedAt: opt(row.issued_at),
    supplyDate: row.supply_date,
    dueAt: opt(row.due_at),
    customerId: row.customer_id as CustomerId,
    vehicleId: (row.vehicle_id ?? undefined) as VehicleId | undefined,
    linkedWorkOrderId: opt(row.linked_work_order_id),
    linkedEstimateId: opt(row.linked_estimate_id),
    sellerSnapshot: row.seller_snapshot,
    buyerSnapshot: row.buyer_snapshot,
    items,
    paymentMethod: row.payment_method,
    paidAmount: num(row.paid_amount, "invoices.paid_amount"),
    notes: optText(row.notes_ar, row.notes_en),
    relatedInvoiceId: opt(row.related_invoice_id),
    reasonForNote: optText(row.reason_for_note_ar, row.reason_for_note_en),
    auditLog,
  };
}

// ── تقفيل اليومية ──────────────────────────────────────────────────────

export type DailyClosingRow = {
  id: string;
  entry_number: string;
  closing_date: string;
  branch_ar: string;
  branch_en: string;
  cash_account_ar: string;
  cash_account_en: string;
  opening_balance: string | number;
  notes: string | null;
  status: DailyClosing["status"];
  closed_by_ar: string | null;
  closed_by_en: string | null;
  closed_at: string | null;
  reviewed_by_accountant_ar: string | null;
  reviewed_by_accountant_en: string | null;
  reviewed_at: string | null;
  daily_closing_entries: DailyClosingEntryRow[] | null;
  daily_closing_audit_log: DailyClosingAuditRow[] | null;
};

type DailyClosingEntryRow = {
  id: string;
  entry_type: "sale" | "receipt" | "expense" | "purchase";
  reference_number: string;
  description_ar: string;
  description_en: string;
  amount: string | number;
  payment_method: PaymentMethod;
  responsible_ar: string;
  responsible_en: string;
  source: DailyClosingEntry["source"];
  linked_invoice_id: string | null;
  linked_purchase_order_id: string | null;
  is_manual_adjustment: boolean;
  entry_time: string;
};

type DailyClosingAuditRow = {
  id: string;
  logged_at: string;
  actor_ar: string;
  actor_en: string;
  action_ar: string;
  action_en: string;
  note_ar: string | null;
  note_en: string | null;
  is_manual_adjustment: boolean;
};

export const DAILY_CLOSING_SELECT = `*, daily_closing_entries (*), daily_closing_audit_log (*)`;

function toClosingEntry(row: DailyClosingEntryRow): DailyClosingEntry {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    description: text(row.description_ar, row.description_en),
    amount: num(row.amount, "daily_closing_entries.amount"),
    paymentMethod: row.payment_method,
    responsible: text(row.responsible_ar, row.responsible_en),
    source: row.source,
    linkedInvoiceId: opt(row.linked_invoice_id),
    linkedPurchaseOrderId: opt(row.linked_purchase_order_id),
    isManualAdjustment: row.is_manual_adjustment,
    time: row.entry_time,
  };
}

export function toDailyClosing(row: DailyClosingRow): DailyClosing {
  const entries = (row.daily_closing_entries ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.entry_time) - Date.parse(b.entry_time));

  // جدول واحد بعمود entry_type يُقسَّم إلى القوائم الأربع التي تتوقعها الواجهة.
  const byType = (type: DailyClosingEntryRow["entry_type"]) =>
    entries.filter((entry) => entry.entry_type === type).map(toClosingEntry);

  const auditLog: DailyClosingAuditEntry[] = (row.daily_closing_audit_log ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.logged_at) - Date.parse(b.logged_at))
    .map((entry) => ({
      id: entry.id,
      timestamp: entry.logged_at,
      actor: text(entry.actor_ar, entry.actor_en),
      action: text(entry.action_ar, entry.action_en),
      note: optText(entry.note_ar, entry.note_en),
      isManualAdjustment: entry.is_manual_adjustment,
    }));

  return {
    id: row.id,
    entryNumber: row.entry_number,
    date: row.closing_date,
    branch: text(row.branch_ar, row.branch_en),
    cashAccount: text(row.cash_account_ar, row.cash_account_en),
    openingBalance: num(row.opening_balance, "daily_closings.opening_balance"),
    receipts: byType("receipt"),
    expenses: byType("expense"),
    purchases: byType("purchase"),
    sales: byType("sale"),
    notes: opt(row.notes),
    status: row.status,
    closedBy: optText(row.closed_by_ar, row.closed_by_en),
    closedAt: opt(row.closed_at),
    reviewedByAccountant: optText(
      row.reviewed_by_accountant_ar,
      row.reviewed_by_accountant_en,
    ),
    reviewedAt: opt(row.reviewed_at),
    auditLog,
  };
}
