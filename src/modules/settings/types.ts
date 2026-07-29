import type { LocalizedText } from "@/lib/domain/contracts";

export type WorkshopProfile = {
  name: LocalizedText;
  companyName: LocalizedText;
  taxNumber: string;
  phone: string;
  email: string;
  address: LocalizedText;
  workingHours: LocalizedText;
};

export const systemUserRoles = ["admin", "manager", "advisor", "accountant"] as const;

export type SystemUserRole = (typeof systemUserRoles)[number];

export type SystemUser = {
  id: string;
  name: LocalizedText;
  email: string;
  role: SystemUserRole;
  lastLoginAt?: string;
};

export type Preferences = {
  defaultLocale: "ar" | "en";
  currency: string;
  timeZone: string;
  dateFormat: string;
  weekStart: LocalizedText;
};

export type NotificationSetting = {
  id: string;
  label: LocalizedText;
  channel: LocalizedText;
  enabled: boolean;
};
