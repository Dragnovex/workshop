import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SettingsView } from "@/modules/settings/components/settings-view";
import { notificationSettings, preferences, systemUsers, workshopProfile } from "@/modules/settings/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title") };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SettingsView
      profile={workshopProfile}
      users={systemUsers}
      preferences={preferences}
      notifications={notificationSettings}
    />
  );
}
