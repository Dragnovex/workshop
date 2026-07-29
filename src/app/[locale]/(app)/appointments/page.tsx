import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppointmentsView } from "@/modules/appointments/components/appointments-view";
import { appointments } from "@/modules/appointments/data";
import { createAppointmentReadModels } from "@/modules/appointments/read-models";
import { customers } from "@/modules/customers/data";
import { vehicles } from "@/modules/vehicles/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "appointments" });
  return { title: t("title") };
}

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const models = createAppointmentReadModels(appointments, customers, vehicles);
  const now = new Date();
  const stats = {
    total: models.length,
    today: models.filter(({ appointment }) => {
      const date = new Date(appointment.scheduledAt);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }).length,
    requested: models.filter(({ appointment }) => appointment.status === "requested").length,
    confirmed: models.filter(({ appointment }) => appointment.status === "confirmed").length,
  };

  return <AppointmentsView appointments={models} stats={stats} />;
}
