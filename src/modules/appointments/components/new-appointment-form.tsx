"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Customer, CustomerId, Vehicle, VehicleId } from "@/lib/domain/contracts";
import { firstIssueMessage, newAppointmentSchema } from "@/lib/validation/forms";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { loadStoredCustomers } from "@/modules/customers/client-store";
import { loadStoredAppointments, saveStoredAppointments } from "../client-store";
import type { Appointment } from "../types";

/**
 * نموذج موعد جديد — يحفظ في localStorage (بلا باك-إند).
 * يُفتح من «إجراء سريع ← موعد جديد» أو من /appointments/new.
 */
export function NewAppointmentForm({
  seedAppointments,
  customers,
  vehicles,
}: {
  seedAppointments: Appointment[];
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [allCustomers] = useState(() => loadStoredCustomers(customers));
  const [customerId, setCustomerId] = useState<CustomerId | "">("");
  const [vehicleId, setVehicleId] = useState<VehicleId | "">("");
  const [serviceAr, setServiceAr] = useState("");
  const [serviceEn, setServiceEn] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [saving, setSaving] = useState(false);

  const customerVehicles = useMemo(
    () =>
      customerId
        ? vehicles.filter((vehicle) => vehicle.customerId === customerId)
        : [],
    [customerId, vehicles],
  );

  const schema = useMemo(
    () =>
      newAppointmentSchema({
        requiredCustomer: t("new.requiredCustomer"),
        requiredVehicle: t("new.requiredVehicle"),
        requiredService: t("new.requiredService"),
        requiredDate: t("new.requiredDate"),
        invalidDate: t("new.invalidDate"),
        invalidDuration: t("new.invalidDuration"),
      }),
    [t],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = schema.safeParse({
      customerId,
      vehicleId,
      serviceAr,
      serviceEn,
      scheduledAt,
      durationMinutes,
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }
    const input = parsed.data;

    const customer = allCustomers.find((item) => item.id === input.customerId);
    const vehicle = vehicles.find((item) => item.id === input.vehicleId);
    if (!customer || !vehicle) {
      toast.error(t("new.requiredCustomer"));
      return;
    }

    setSaving(true);
    try {
      const appointment: Appointment = {
        id: `appt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceType: {
          ar: input.serviceAr,
          en: input.serviceEn ?? input.serviceAr,
        },
        status: "requested",
        scheduledAt: new Date(input.scheduledAt).toISOString(),
        durationMinutes: input.durationMinutes,
      };

      const all = loadStoredAppointments(seedAppointments);
      const ok = saveStoredAppointments([...all, appointment]);
      if (!ok) {
        toast.error(tCommon("storageSaveFailed"));
        return;
      }
      toast.success(t("new.saved"));
      router.push("/appointments");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <PageHeader title={t("new.title")} description={t("new.subtitle")} />

      <SectionCard title={t("new.basicInfo")} contentClassName="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-customer">{t("new.customer")}</Label>
            <Select
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value as CustomerId);
                setVehicleId("");
              }}
            >
              <SelectTrigger id="new-appointment-customer" className="w-full">
                <SelectValue placeholder={t("new.selectCustomer")} />
              </SelectTrigger>
              <SelectContent>
                {allCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.displayName[locale === "ar" ? "ar" : "en"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-vehicle">{t("new.vehicle")}</Label>
            <Select
              value={vehicleId}
              onValueChange={(value) => setVehicleId(value as VehicleId)}
              disabled={!customerId || customerVehicles.length === 0}
            >
              <SelectTrigger id="new-appointment-vehicle" className="w-full">
                <SelectValue placeholder={t("new.selectVehicle")} />
              </SelectTrigger>
              <SelectContent>
                {customerVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {getVehicleDisplayName(vehicle, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-service-ar">{t("new.serviceAr")}</Label>
            <Input
              id="new-appointment-service-ar"
              value={serviceAr}
              onChange={(event) => setServiceAr(event.target.value)}
              placeholder={locale === "ar" ? "مثال: تغيير زيت" : "e.g. Oil change"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-service-en">{t("new.serviceEn")}</Label>
            <Input
              id="new-appointment-service-en"
              value={serviceEn}
              onChange={(event) => setServiceEn(event.target.value)}
              placeholder="e.g. Oil change"
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-date">{t("new.dateTime")}</Label>
            <Input
              id="new-appointment-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-appointment-duration">{t("new.durationMinutes")}</Label>
            <Input
              id="new-appointment-duration"
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" asChild>
            <Link href="/appointments">{tCommon("cancel")}</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? tCommon("loading") : t("new.save")}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
