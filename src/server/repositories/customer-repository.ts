import type { Customer } from "@/lib/domain/contracts";

import type { CollectionRepository } from "./collection-repository";

/**
 * عقد الوصول لبيانات العملاء — يطابقه لاحقًا Repository حقيقي فوق
 * PostgreSQL/Supabase (انظر src/server/db/migrations/0001_customers_billing_fields.sql).
 *
 * `findById` يستقبل `string` لا `CustomerId` (موروثًا من العقد العام): المعرّف
 * يصل من مقطع المسار أو من قاعدة البيانات كنص عادي، والتضييق إلى
 * `customer-${string}` مسؤولية المحوِّل لا كل مُستدعٍ.
 */
export type CustomerRepository = CollectionRepository<Customer>;
