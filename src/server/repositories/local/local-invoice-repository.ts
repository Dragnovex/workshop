import { invoices } from "@/modules/invoices/data";
import type { Invoice } from "@/modules/invoices/types";
import type { InvoiceRepository } from "../invoice-repository";

/**
 * محوّل محلي (in-memory) فوق بيانات Mock الثابتة — للتطوير والعرض فقط.
 * لا يتصل بأي قاعدة بيانات حقيقية. يطابق واجهة InvoiceRepository التي
 * سينفّذها لاحقًا محوّل PostgreSQL/Supabase حقيقي دون تغيير طبقة العرض.
 */
export class LocalInvoiceRepository implements InvoiceRepository {
  async findAll(): Promise<Invoice[]> {
    return invoices;
  }

  async findById(id: string): Promise<Invoice | null> {
    return invoices.find((invoice) => invoice.id === id) ?? null;
  }

  async findByCustomerId(customerId: string): Promise<Invoice[]> {
    return invoices.filter((invoice) => invoice.customerId === customerId);
  }
}

export const invoiceRepository: InvoiceRepository = new LocalInvoiceRepository();
