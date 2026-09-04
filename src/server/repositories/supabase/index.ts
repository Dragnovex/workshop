import "server-only";

import { getSupabaseAdmin } from "@/server/db/supabase";

import type { DailyClosing } from "@/modules/daily-closing/types";
import type { Invoice } from "@/modules/invoices/types";

import type { Supplier } from "@/modules/suppliers/types";

import type {
  CollectionRepository,
  WritableCollectionRepository,
} from "../collection-repository";
import type { DailyClosingRepository } from "../daily-closing-repository";
import type { InvoiceRepository } from "../invoice-repository";
import {
  DAILY_CLOSING_SELECT,
  INVOICE_SELECT,
  toDailyClosing,
  toInvoice,
  type DailyClosingRow,
  type InvoiceRow,
} from "./mappers-accounting";
import {
  toAccountingTransaction,
  toAppointment,
  toCampaign,
  toCustomer,
  toEmployee,
  toPart,
  toReport,
  toSupplier,
  toSupplierRow,
  toVehicle,
  type SupplierRow,
} from "./mappers";
import {
  ESTIMATE_SELECT,
  PURCHASE_ORDER_SELECT,
  WORK_ORDER_SELECT,
  toEstimate,
  toPurchaseOrder,
  toWorkOrder,
} from "./mappers-nested";

/**
 * محوّل Supabase — يطابق شكل `localRepositories` بالضبط.
 *
 * ⚠️ لم يُشغَّل على قاعدة بيانات فعلية بعد. المخطط في
 * `src/server/db/migrations/` لم يُنفَّذ، ولا توجد مفاتيح. هذا الكود جاهز
 * للتفعيل لا مُتحقَّق منه — أول تشغيل حقيقي يجب أن يقارن مخرجاته ببيانات
 * البذرة صفًا بصف قبل الاعتماد عليه.
 */

/** كل استعلام يمرّ من هنا: خطأ قاعدة البيانات يُرفع لا يُبتلع. */
function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T {
  if (result.error) {
    throw new Error(`فشل استعلام ${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`استعلام ${context} أعاد بيانات فارغة بلا خطأ`);
  }
  return result.data;
}

/**
 * مستودع فوق جدول Supabase.
 *
 * `orderBy` مطلوب لا اختياري: بلا `order by` صريح لا يضمن Postgres ترتيبًا
 * ثابتًا بين تحميلين، فتتبدّل صفوف الجدول أمام المستخدم بلا سبب ظاهر.
 */
function createSupabaseCollection<Row, T>({
  table,
  select = "*",
  orderBy,
  ascending = true,
  map,
}: {
  table: string;
  select?: string;
  orderBy: string;
  ascending?: boolean;
  map: (row: Row) => T;
}): CollectionRepository<T> {
  return {
    async findAll() {
      const result = await getSupabaseAdmin()
        .from(table)
        .select(select)
        .order(orderBy, { ascending });
      return (unwrap(result, `${table}.findAll`) as Row[]).map(map);
    },

    async findById(id: string) {
      // maybeSingle: عدم وجود صف ليس خطأً — يعيد null ليعرض الاستدعاء 404.
      const result = await getSupabaseAdmin()
        .from(table)
        .select(select)
        .eq("id", id)
        .maybeSingle();
      const row = unwrapNullable(result, `${table}.findById`);
      return row === null ? null : map(row as Row);
    },
  };
}

/**
 * مجموعة Supabase **قابلة للكتابة**.
 *
 * تُبنى فوق مجموعة القراءة وتضيف `toRow` — التحويل العكسي من النطاق إلى
 * أعمدة الجدول. لا يوجد اشتقاق آلي له: القراءة تدمج `name_ar`/`name_en`
 * في `LocalizedText` وتحوّل `null` إلى `undefined`، والكتابة تعكس ذلك.
 *
 * ⚠️ تُضاف لمجموعة **بعد** تحويل شاشاتها للكتابة عبر الخادم فعليًا. كتابة
 * أربعة عشر محوّلًا عكسيًا دفعةً واحدة بلا قاعدة بيانات تختبرها تعني
 * أربعة عشر ملفًا لا يعرف أحد إن كانت تعمل.
 */
function createWritableSupabaseCollection<Row, T extends { id: string }>(options: {
  table: string;
  select?: string;
  orderBy: string;
  ascending?: boolean;
  map: (row: Row) => T;
  toRow: (value: Partial<T>) => Record<string, unknown>;
}): WritableCollectionRepository<T> {
  const reader = createSupabaseCollection<Row, T>(options);
  const { table, select = "*", map, toRow } = options;

  return {
    ...reader,

    async create(value: T) {
      const result = await getSupabaseAdmin()
        .from(table)
        .insert(toRow(value))
        .select(select)
        .single();
      return map(unwrap(result, `${table}.create`) as Row);
    },

    async update(id: string, patch: Partial<T>) {
      const result = await getSupabaseAdmin()
        .from(table)
        .update(toRow(patch))
        .eq("id", id)
        .select(select)
        .single();
      // single() يفشل إذا لم يُطابق أي صف — وهو السلوك المطلوب: تحديث
      // سجل غير موجود خطأ لا عملية ناجحة بلا أثر.
      return map(unwrap(result, `${table}.update`) as Row);
    },

    async remove(id: string) {
      const result = await getSupabaseAdmin().from(table).delete().eq("id", id);
      if (result.error) {
        throw new Error(`فشل استعلام ${table}.remove: ${result.error.message}`);
      }
    },
  };
}

function unwrapNullable<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T | null {
  if (result.error) {
    throw new Error(`فشل استعلام ${context}: ${result.error.message}`);
  }
  return result.data;
}

/** الفواتير — العقد الموسَّع يضيف البحث بالعميل. */
const invoices: InvoiceRepository = {
  ...createSupabaseCollection<InvoiceRow, Invoice>({
    table: "invoices",
    select: INVOICE_SELECT,
    orderBy: "supply_date",
    ascending: false,
    map: toInvoice,
  }),

  async findByCustomerId(customerId: string) {
    const result = await getSupabaseAdmin()
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("customer_id", customerId)
      .order("supply_date", { ascending: false });
    return (unwrap(result, "invoices.findByCustomerId") as InvoiceRow[]).map(
      toInvoice,
    );
  },
};

/** تقفيل اليومية — العقد الموسَّع يضيف البحث بالتاريخ. */
const dailyClosings: DailyClosingRepository = {
  ...createSupabaseCollection<DailyClosingRow, DailyClosing>({
    table: "daily_closings",
    select: DAILY_CLOSING_SELECT,
    orderBy: "closing_date",
    ascending: false,
    map: toDailyClosing,
  }),

  async findByDate(date: string) {
    const result = await getSupabaseAdmin()
      .from("daily_closings")
      .select(DAILY_CLOSING_SELECT)
      .eq("closing_date", date)
      .maybeSingle();
    const row = unwrapNullable(result, "dailyClosings.findByDate");
    return row === null ? null : toDailyClosing(row as DailyClosingRow);
  },
};

export const supabaseRepositories = {
  invoices,
  dailyClosings,
  accounting: createSupabaseCollection({
    table: "accounting_transactions",
    orderBy: "transaction_date",
    ascending: false,
    map: toAccountingTransaction,
  }),
  appointments: createSupabaseCollection({
    table: "appointments",
    orderBy: "scheduled_at",
    map: toAppointment,
  }),
  customers: createSupabaseCollection({
    table: "customers",
    orderBy: "display_name_ar",
    map: toCustomer,
  }),
  employees: createSupabaseCollection({
    table: "employees",
    orderBy: "name_ar",
    map: toEmployee,
  }),
  estimates: createSupabaseCollection({
    table: "estimates",
    select: ESTIMATE_SELECT,
    orderBy: "created_at",
    ascending: false,
    map: toEstimate,
  }),
  inventory: createSupabaseCollection({
    table: "parts",
    orderBy: "sku",
    map: toPart,
  }),
  marketing: createSupabaseCollection({
    table: "campaigns",
    orderBy: "start_date",
    ascending: false,
    map: toCampaign,
  }),
  purchasing: createSupabaseCollection({
    table: "purchase_orders",
    select: PURCHASE_ORDER_SELECT,
    orderBy: "ordered_at",
    ascending: false,
    map: toPurchaseOrder,
  }),
  reports: createSupabaseCollection({
    table: "reports",
    orderBy: "name_ar",
    map: toReport,
  }),
  suppliers: createWritableSupabaseCollection<SupplierRow, Supplier>({
    table: "suppliers",
    orderBy: "name_ar",
    map: toSupplier,
    toRow: toSupplierRow,
  }),
  vehicles: createSupabaseCollection({
    table: "vehicles",
    orderBy: "plate",
    map: toVehicle,
  }),
  workOrders: createSupabaseCollection({
    table: "work_orders",
    select: WORK_ORDER_SELECT,
    orderBy: "received_at",
    ascending: false,
    map: toWorkOrder,
  }),
};
