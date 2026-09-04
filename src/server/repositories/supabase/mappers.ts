import type {
  Address,
  Customer,
  CustomerId,
  LocalizedText,
  Vehicle,
  VehicleId,
} from "@/lib/domain/contracts";
import type { AccountingTransaction } from "@/modules/accounting/types";
import type { Appointment } from "@/modules/appointments/types";
import type { Campaign } from "@/modules/marketing/types";
import type { Employee } from "@/modules/employees/types";
import type { Part } from "@/modules/inventory/types";
import type { Report } from "@/modules/reports/types";
import type { Supplier } from "@/modules/suppliers/types";

/**
 * تحويل صفوف Postgres إلى أنواع النطاق.
 *
 * قاعدتان تحكمان كل دالة هنا:
 *
 * 1. **الأعمدة الرقمية تعود نصًا.** مكتبة postgres-js تُرجع `numeric` كسلسلة
 *    نصية للحفاظ على الدقة الكاملة، وليس رقمًا. `Number(row.amount)` صريح في
 *    كل موضع — لأن `"12.50" + 1` في جافاسكربت يعطي `"12.501"` لا `13.5`،
 *    وهذا بالضبط نوع الخطأ الذي يفسد فاتورة أو تقفيل يومية بصمت.
 *
 * 2. **`null` من قاعدة البيانات يصير `undefined`** في النطاق: الأنواع
 *    الاختيارية معرّفة بـ `?:` لا بـ `| null`.
 */

/** رقم من عمود numeric — يفشل بوضوح بدل أن يمرّر NaN إلى حساب مالي. */
function num(value: unknown, column: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`قيمة رقمية غير صالحة في العمود ${column}: ${String(value)}`);
  }
  return parsed;
}

/** رقم اختياري — `null` يبقى `undefined`. */
function optNum(value: unknown, column: string): number | undefined {
  return value === null || value === undefined ? undefined : num(value, column);
}

function opt(value: string | null): string | undefined {
  return value ?? undefined;
}

function text(ar: string, en: string): LocalizedText {
  return { ar, en };
}

/** نص ثنائي اللغة اختياري — يظهر فقط إذا وُجد أحد الطرفين على الأقل. */
function optText(
  ar: string | null,
  en: string | null,
): LocalizedText | undefined {
  if (ar === null && en === null) return undefined;
  return { ar: ar ?? en ?? "", en: en ?? ar ?? "" };
}

// ── العملاء ────────────────────────────────────────────────────────────

export type CustomerRow = {
  id: string;
  kind: "individual" | "company";
  display_name_ar: string;
  display_name_en: string;
  legal_name_ar: string | null;
  legal_name_en: string | null;
  phone: string | null;
  email: string | null;
  vat_number: string | null;
  commercial_registration: string | null;
  national_address: Address | null;
  billing_address: Address | null;
};

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id as CustomerId,
    kind: row.kind,
    displayName: text(row.display_name_ar, row.display_name_en),
    legalName: optText(row.legal_name_ar, row.legal_name_en),
    phone: opt(row.phone),
    email: opt(row.email),
    vatNumber: opt(row.vat_number),
    commercialRegistration: opt(row.commercial_registration),
    nationalAddress: row.national_address ?? undefined,
    billingAddress: row.billing_address ?? undefined,
  };
}

// ── المركبات ───────────────────────────────────────────────────────────

export type VehicleRow = {
  id: string;
  customer_id: string;
  make_ar: string;
  make_en: string;
  model_ar: string;
  model_en: string;
  year: number;
  plate: string;
  vin: string | null;
  image_url: string | null;
  color_ar: string | null;
  color_en: string | null;
  fuel_type: Vehicle["fuelType"] | null;
  status: Vehicle["status"];
  mileage: number | null;
};

export function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id as VehicleId,
    customerId: row.customer_id as CustomerId,
    make: text(row.make_ar, row.make_en),
    model: text(row.model_ar, row.model_en),
    year: num(row.year, "vehicles.year"),
    plate: row.plate,
    vin: opt(row.vin),
    imageUrl: opt(row.image_url),
    color: optText(row.color_ar, row.color_en),
    fuelType: row.fuel_type ?? undefined,
    status: row.status,
    mileage: optNum(row.mileage, "vehicles.mileage"),
  };
}

// ── المواعيد ───────────────────────────────────────────────────────────

export type AppointmentRow = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  service_type_ar: string;
  service_type_en: string;
  status: Appointment["status"];
  scheduled_at: string;
  duration_minutes: number;
  notes_ar: string | null;
  notes_en: string | null;
  linked_work_order_id: string | null;
};

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    customerId: row.customer_id as CustomerId,
    vehicleId: row.vehicle_id as VehicleId,
    serviceType: text(row.service_type_ar, row.service_type_en),
    status: row.status,
    scheduledAt: row.scheduled_at,
    durationMinutes: num(row.duration_minutes, "appointments.duration_minutes"),
    notes: optText(row.notes_ar, row.notes_en),
    linkedWorkOrderId: opt(row.linked_work_order_id),
  };
}

// ── قطع الغيار ─────────────────────────────────────────────────────────

export type PartRow = {
  id: string;
  sku: string;
  name_ar: string;
  name_en: string;
  category: Part["category"];
  qty_on_hand: string | number;
  reorder_level: string | number;
  unit_price: string | number;
  location: string;
};

export function toPart(row: PartRow): Part {
  return {
    id: row.id,
    sku: row.sku,
    name: text(row.name_ar, row.name_en),
    category: row.category,
    qtyOnHand: num(row.qty_on_hand, "parts.qty_on_hand"),
    reorderLevel: num(row.reorder_level, "parts.reorder_level"),
    unitPrice: num(row.unit_price, "parts.unit_price"),
    location: row.location,
  };
}

// ── الموظفون ───────────────────────────────────────────────────────────

export type EmployeeRow = {
  id: string;
  name_ar: string;
  name_en: string;
  role_ar: string;
  role_en: string;
  department: Employee["department"];
  phone: string;
  email: string;
  hire_date: string;
  status: Employee["status"];
};

export function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: text(row.name_ar, row.name_en),
    role: text(row.role_ar, row.role_en),
    department: row.department,
    phone: row.phone,
    email: row.email,
    hireDate: row.hire_date,
    status: row.status,
  };
}

// ── الحملات التسويقية ──────────────────────────────────────────────────

export type CampaignRow = {
  id: string;
  name_ar: string;
  name_en: string;
  channel: Campaign["channel"];
  status: Campaign["status"];
  target_segment_ar: string;
  target_segment_en: string;
  start_date: string;
  end_date: string;
  budget: string | number;
  reach: number;
  notes_ar: string | null;
  notes_en: string | null;
};

export function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: text(row.name_ar, row.name_en),
    channel: row.channel,
    status: row.status,
    targetSegment: text(row.target_segment_ar, row.target_segment_en),
    startDate: row.start_date,
    endDate: row.end_date,
    budget: num(row.budget, "campaigns.budget"),
    reach: num(row.reach, "campaigns.reach"),
    notes: optText(row.notes_ar, row.notes_en),
  };
}

// ── التقارير ───────────────────────────────────────────────────────────

export type ReportRow = {
  id: string;
  name_ar: string;
  name_en: string;
  category: Report["category"];
  description_ar: string;
  description_en: string;
  frequency: Report["frequency"];
  last_generated_at: string | null;
};

export function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    name: text(row.name_ar, row.name_en),
    category: row.category,
    description: text(row.description_ar, row.description_en),
    frequency: row.frequency,
    lastGeneratedAt: row.last_generated_at ?? "",
  };
}

// ── القيود المحاسبية ───────────────────────────────────────────────────

export type AccountingTransactionRow = {
  id: string;
  reference: string;
  account_ar: string;
  account_en: string;
  type: AccountingTransaction["type"];
  category: AccountingTransaction["category"];
  amount: string | number;
  transaction_date: string;
  linked_invoice_id: string | null;
  linked_purchase_order_id: string | null;
  notes_ar: string | null;
  notes_en: string | null;
};

export function toAccountingTransaction(
  row: AccountingTransactionRow,
): AccountingTransaction {
  return {
    id: row.id,
    reference: row.reference,
    account: text(row.account_ar, row.account_en),
    type: row.type,
    category: row.category,
    amount: num(row.amount, "accounting_transactions.amount"),
    date: row.transaction_date,
    linkedInvoiceId: opt(row.linked_invoice_id),
    linkedPurchaseOrderId: opt(row.linked_purchase_order_id),
    notes: optText(row.notes_ar, row.notes_en),
  };
}

// ── الموردون ───────────────────────────────────────────────────────────

export type SupplierRow = {
  id: string;
  name_ar: string;
  name_en: string;
  vat_number: string | null;
  commercial_registration: string | null;
  national_address: Address | null;
  phone: string | null;
  email: string | null;
  payment_terms: Supplier["paymentTerms"];
  reference: string | null;
  notes_ar: string | null;
  notes_en: string | null;
};

export function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: text(row.name_ar, row.name_en),
    vatNumber: opt(row.vat_number),
    commercialRegistration: opt(row.commercial_registration),
    nationalAddress: row.national_address ?? undefined,
    phone: opt(row.phone),
    email: opt(row.email),
    paymentTerms: row.payment_terms,
    reference: opt(row.reference),
    notes: optText(row.notes_ar, row.notes_en),
  };
}

/**
 * التحويل العكسي: مورّد ← صف.
 *
 * `Partial` لأن `update` ترسل الحقول المتغيّرة وحدها — إرسال الكائن كاملًا
 * في كل تحديث يعني الكتابة فوق أعمدة لم يلمسها المستخدم.
 * `undefined` تصير `null` صراحةً: تركها `undefined` يحذفها من الطلب فلا
 * يُمسح العمود أبدًا، فيبقى رقم ضريبي قديم بعد أن أفرغه المستخدم.
 */
export function toSupplierRow(
  supplier: Partial<Supplier>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (supplier.id !== undefined) row.id = supplier.id;
  if (supplier.name !== undefined) {
    row.name_ar = supplier.name.ar;
    row.name_en = supplier.name.en;
  }
  if ("vatNumber" in supplier) row.vat_number = supplier.vatNumber ?? null;
  if ("commercialRegistration" in supplier) {
    row.commercial_registration = supplier.commercialRegistration ?? null;
  }
  if ("nationalAddress" in supplier) {
    row.national_address = supplier.nationalAddress ?? null;
  }
  if ("phone" in supplier) row.phone = supplier.phone ?? null;
  if ("email" in supplier) row.email = supplier.email ?? null;
  if (supplier.paymentTerms !== undefined) {
    row.payment_terms = supplier.paymentTerms;
  }
  if ("reference" in supplier) row.reference = supplier.reference ?? null;
  if ("notes" in supplier) {
    row.notes_ar = supplier.notes?.ar ?? null;
    row.notes_en = supplier.notes?.en ?? null;
  }
  return row;
}

export { num, optNum, opt, text, optText };
