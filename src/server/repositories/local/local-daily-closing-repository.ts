import { dailyClosings } from "@/modules/daily-closing/data";
import type { DailyClosing } from "@/modules/daily-closing/types";
import type { DailyClosingRepository } from "../daily-closing-repository";

/** محوّل محلي (in-memory) — للتطوير والعرض فقط، بلا اتصال بقاعدة بيانات حقيقية. */
export class LocalDailyClosingRepository implements DailyClosingRepository {
  async findAll(): Promise<DailyClosing[]> {
    return dailyClosings;
  }

  async findById(id: string): Promise<DailyClosing | null> {
    return dailyClosings.find((closing) => closing.id === id) ?? null;
  }

  async findByDate(date: string): Promise<DailyClosing | null> {
    return dailyClosings.find((closing) => closing.date === date) ?? null;
  }
}

export const dailyClosingRepository: DailyClosingRepository = new LocalDailyClosingRepository();
