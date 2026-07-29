import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppointmentDetailView } from "@/modules/appointments/components/appointment-detail-view";
import { appointments } from "@/modules/appointments/data";
import { createAppointmentReadModels } from "@/modules/appointments/read-models";
import { customers } from "@/modules/customers/data";
import { vehicles } from "@/modules/vehicles/data";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "appointments" });
  const appointment = appointments.find((item) => item.id === id);
  const lang = locale === "en" ? "en" : "ar";
  return {
    title: appointment?.serviceType[lang] ?? t("detail.notFoundTitle"),
  };
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const model = createAppointmentReadModels(appointments, customers, vehicles).find(
    ({ appointment }) => appointment.id === id,
  );

  if (!model) notFound();
  return <AppointmentDetailView model={model} />;
}
