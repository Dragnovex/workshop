import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { repositories } from "@/server/repositories";

import { AppointmentDetailView } from "@/modules/appointments/components/appointment-detail-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const appointment = await repositories.appointments.findById(id);
  const lang = locale === "en" ? "en" : "ar";
  // قد يكون الموعد محفوظًا في localStorage فقط — العنوان الحقيقي "غير
  // موجود" يُقرَّر على العميل بعد الدمج، فلا نستبقه هنا.
  return {
    title: appointment?.serviceType[lang] ?? id,
  };
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // المواعيد المُنشأة من الواجهة تعيش في localStorage فقط ولا يراها الخادم.
  // نمرّر بذرة الخادم كما هي؛ الدمج مع التخزين المحلي وحالة "غير موجود"
  // الحقيقية تتم على العميل (نفس نمط أوامر التشغيل والفواتير والعملاء).
  const appointments = await repositories.appointments.findAll();
  const customers = await repositories.customers.findAll();
  const vehicles = await repositories.vehicles.findAll();

  return (
    <AppointmentDetailView
      id={id}
      initialAppointments={appointments}
      customers={customers}
      vehicles={vehicles}
    />
  );
}
