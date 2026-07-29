import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { Estimate } from "./types";

export type EstimateReadModel = {
  estimate: Estimate;
  customer: Customer;
  vehicle: Vehicle;
  total: number;
};

export function getEstimateTotal(estimate: Estimate): number {
  return estimate.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

export function createEstimateReadModels(
  estimates: Estimate[],
  customers: Customer[],
  vehicles: Vehicle[],
): EstimateReadModel[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return estimates.map((estimate) => {
    const customer = customersById.get(estimate.customerId);
    const vehicle = vehiclesById.get(estimate.vehicleId);

    if (!customer || !vehicle || vehicle.customerId !== customer.id) {
      throw new Error(`Invalid mock relationship for estimate ${estimate.id}`);
    }

    return { estimate, customer, vehicle, total: getEstimateTotal(estimate) };
  });
}
