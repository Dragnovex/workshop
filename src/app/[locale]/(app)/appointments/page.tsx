import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { AppointmentsView } from "@/modules/appointments/components/appointments-view";
import { createAppointmentReadModels } from "@/modules/appointments/read-models";

export const dynamic = "force-dynamic";

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
  const appointments = await repositories.appointments.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  const models = createAppointmentReadModels(appointments, customers, vehicles);
  return (
    <AppointmentsView
      appointments={models}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
