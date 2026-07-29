import type { CustomerId, LocalizedText, VehicleId } from "@/lib/domain/contracts";

export const invoiceStatuses = [
  "unpaid",
  "partiallyPaid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export type InvoiceItem = {
  id: string;
  description: LocalizedText;
  qty: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  number: string;
  customerId: CustomerId;
  vehicleId: VehicleId;
  linkedWorkOrderId?: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  vatRate: number;
  paidAmount: number;
  items: InvoiceItem[];
};
