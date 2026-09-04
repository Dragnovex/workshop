import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { NewAppointmentForm } from "@/modules/appointments/components/new-appointment-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "appointments" });
  return { title: t("new.title") };
}

export default async function NewAppointmentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const appointments = await repositories.appointments.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <NewAppointmentForm
      seedAppointments={appointments}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
