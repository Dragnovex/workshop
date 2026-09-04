import type { Invoice } from "@/modules/invoices/types";

import type { CollectionRepository } from "./collection-repository";

/**
 * عقد الوصول لبيانات الفواتير — يطابقه لاحقًا Repository حقيقي فوق
 * PostgreSQL/Supabase (انظر src/server/db/migrations/0002_invoices.sql).
 */
export interface InvoiceRepository extends CollectionRepository<Invoice> {
  findByCustomerId(customerId: string): Promise<Invoice[]>;
}
