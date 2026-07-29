import type { CustomerId, LocalizedText, VehicleId } from "@/lib/domain/contracts";

export const appointmentStatuses = [
  "requested",
  "confirmed",
  "checkedIn",
  "completed",
  "cancelled",
  "noShow",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type Appointment = {
  id: string;
  customerId: CustomerId;
  vehicleId: VehicleId;
  serviceType: LocalizedText;
  status: AppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  notes?: LocalizedText;
  linkedWorkOrderId?: string;
};
