import type { DailyClosing } from "@/modules/daily-closing/types";

import type { CollectionRepository } from "./collection-repository";

/**
 * عقد الوصول لبيانات تقفيل اليومية — يطابقه لاحقًا Repository حقيقي فوق
 * PostgreSQL/Supabase (انظر src/server/db/migrations/0003_daily_closing.sql).
 */
export interface DailyClosingRepository extends CollectionRepository<DailyClosing> {
  findByDate(date: string): Promise<DailyClosing | null>;
}
