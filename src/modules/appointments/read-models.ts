import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { Appointment } from "./types";

export type AppointmentReadModel = {
  appointment: Appointment;
  customer: Customer;
  vehicle: Vehicle;
};

export function createAppointmentReadModels(
  appointments: Appointment[],
  customers: Customer[],
  vehicles: Vehicle[],
): AppointmentReadModel[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return appointments.map((appointment) => {
    const customer = customersById.get(appointment.customerId);
    const vehicle = vehiclesById.get(appointment.vehicleId);

    if (!customer || !vehicle || vehicle.customerId !== customer.id) {
      throw new Error(`Invalid mock relationship for appointment ${appointment.id}`);
    }

    return { appointment, customer, vehicle };
  });
}
