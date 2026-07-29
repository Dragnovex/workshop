import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { Invoice } from "./types";

export type InvoiceReadModel = {
  invoice: Invoice;
  customer: Customer;
  vehicle: Vehicle;
  subtotal: number;
  vat: number;
  total: number;
  balanceDue: number;
};

export function getInvoiceTotals(invoice: Invoice) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const vat = subtotal * invoice.vatRate;
  const total = subtotal + vat;
  return { subtotal, vat, total, balanceDue: total - invoice.paidAmount };
}

export function createInvoiceReadModels(
  invoices: Invoice[],
  customers: Customer[],
  vehicles: Vehicle[],
): InvoiceReadModel[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return invoices.map((invoice) => {
    const customer = customersById.get(invoice.customerId);
    const vehicle = vehiclesById.get(invoice.vehicleId);

    if (!customer || !vehicle || vehicle.customerId !== customer.id) {
      throw new Error(`Invalid mock relationship for invoice ${invoice.id}`);
    }

    return { invoice, customer, vehicle, ...getInvoiceTotals(invoice) };
  });
}
