"use client";

import { ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/patterns/page-header";
import { RolePreviewCard } from "./role-preview-card";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { NotificationSetting, Preferences, SystemUser, WorkshopProfile } from "../types";

export function SettingsView({
  profile,
  users,
  preferences,
  notifications,
}: {
  profile: WorkshopProfile;
  users: SystemUser[];
  preferences: Preferences;
  notifications: NotificationSetting[];
}) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* الدور الفعّال أولًا: كل ما تحته من إعدادات يخضع لصلاحياته. */}
      <RolePreviewCard />

      <SectionCard title={t("profile.title")} subtitle={t("profile.subtitle")} contentClassName="p-0">
        <dl className="divide-y divide-border">
          <DetailRow label={t("profile.name")} value={profile.name[lang]} />
          <DetailRow label={t("profile.companyName")} value={profile.companyName[lang]} />
          <DetailRow label={t("profile.taxNumber")} value={profile.taxNumber} ltr />
          <DetailRow label={t("profile.phone")} value={profile.phone} ltr />
          <DetailRow label={t("profile.email")} value={profile.email} ltr />
          <DetailRow label={t("profile.address")} value={profile.address[lang]} />
          <DetailRow label={t("profile.workingHours")} value={profile.workingHours[lang]} />
        </dl>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("preferences.title")} subtitle={t("preferences.subtitle")} contentClassName="p-0">
          <dl className="divide-y divide-border">
            <DetailRow label={t("preferences.defaultLocale")} value={t(`preferences.locale.${preferences.defaultLocale}`)} />
            <DetailRow label={t("preferences.currency")} value={preferences.currency} ltr />
            <DetailRow label={t("preferences.timeZone")} value={preferences.timeZone} ltr />
            <DetailRow label={t("preferences.dateFormat")} value={preferences.dateFormat} ltr />
            <DetailRow label={t("preferences.weekStart")} value={preferences.weekStart[lang]} />
          </dl>
        </SectionCard>

        <SectionCard title={t("notifications.title")} subtitle={t("notifications.subtitle")} contentClassName="p-0">
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <li key={notification.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{notification.label[lang]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.channel[lang]}</p>
                </div>
                <Switch checked={notification.enabled} disabled aria-label={notification.label[lang]} />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title={t("users.title")} subtitle={t("users.subtitle")} contentClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("users.columns.name")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("users.columns.email")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("users.columns.role")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("users.columns.lastLogin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-transparent">
                  <TableCell className="ps-4 text-sm font-medium">{user.name[lang]}</TableCell>
                  <TableCell data-ltr className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant="secondary">{t(`users.role.${user.role}`)}</Badge></TableCell>
                  <TableCell data-numeric className="pe-4 text-end text-xs whitespace-nowrap text-muted-foreground">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt, locale) : t("users.neverLoggedIn")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-subtle px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
        {t("readOnlyNotice")}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-ltr={ltr ? "" : undefined} className="text-end text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}
