import type { Customer, Vehicle } from "@/lib/domain/contracts";
import {
  getInvoiceTotals,
  getSimplifiedQrPayload,
  isInvoiceLocked,
  type InvoiceTotals,
} from "@/lib/services/invoice-service";
import type { Invoice } from "./types";
import { isWalkInCustomerId, walkInCustomer } from "./walk-in-customer";

export { getInvoiceTotals, getInvoiceLineTotals } from "@/lib/services/invoice-service";
export type { InvoiceTotals } from "@/lib/services/invoice-service";

export type InvoiceReadModel = {
  invoice: Invoice;
  customer: Customer;
  vehicle?: Vehicle;
  totals: InvoiceTotals;
  locked: boolean;
  /** محسوبة مسبقًا للّغة الحالية — لا دوال داخل الكائن (يعبر حدود Server/Client Components). */
  qrPayload: string | null;
};

export function createInvoiceReadModels(
  invoiceList: Invoice[],
  customers: Customer[],
  vehicles: Vehicle[],
  locale: string,
): InvoiceReadModel[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return invoiceList.map((invoice) => {
    const customer = customersById.get(invoice.customerId);
    if (!customer) {
      throw new Error(`Invalid mock relationship for invoice ${invoice.id}`);
    }
    const vehicle = invoice.vehicleId ? vehiclesById.get(invoice.vehicleId) : undefined;

    return {
      invoice,
      customer,
      vehicle,
      totals: getInvoiceTotals(invoice),
      locked: isInvoiceLocked(invoice),
      qrPayload: getSimplifiedQrPayload(invoice, locale),
    };
  });
}

/**
 * نسخة آمنة للعميل من `createInvoiceReadModels` لفاتورة واحدة — لا تفترض
 * سلامة بيانات البذرة (`throw`)، بل تتعامل مع فاتورة أُنشئت في المتصفح:
 * تعرف العميل النقدي (walk-in)، وتعيد `null` بدل الانهيار إن تعذّر الربط
 * فعليًا (بيانات تالفة)، ليعرض المستدعي حالة "غير موجودة" بدل شاشة بيضاء.
 */
export function createLocalInvoiceReadModel(
  invoice: Invoice,
  customers: Customer[],
  vehicles: Vehicle[],
  locale: string,
): InvoiceReadModel | null {
  const customer =
    customers.find((item) => item.id === invoice.customerId) ??
    (isWalkInCustomerId(invoice.customerId) ? walkInCustomer : undefined);
  if (!customer) return null;

  const vehicle = invoice.vehicleId
    ? vehicles.find((item) => item.id === invoice.vehicleId)
    : undefined;

  return {
    invoice,
    customer,
    vehicle,
    totals: getInvoiceTotals(invoice),
    // الفواتير المخزَّنة محليًا مسودات دائمًا في هذه المرحلة — لا حالة "صادرة" بعد.
    locked: isInvoiceLocked(invoice),
    qrPayload: getSimplifiedQrPayload(invoice, locale),
  };
}
