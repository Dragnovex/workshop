import type { LocalizedText } from "@/lib/domain/contracts";

export const reportCategories = ["operations", "finance", "inventory", "customers"] as const;

export type ReportCategory = (typeof reportCategories)[number];

export const reportFrequencies = ["daily", "weekly", "monthly", "onDemand"] as const;

export type ReportFrequency = (typeof reportFrequencies)[number];

export type Report = {
  id: string;
  name: LocalizedText;
  category: ReportCategory;
  description: LocalizedText;
  frequency: ReportFrequency;
  lastGeneratedAt: string;
};
