import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { WorkOrderReadModel } from "@/modules/work-orders/read-models";

export type VehicleReadModel = {
  vehicle: Vehicle;
  customer: Customer;
  workOrders: WorkOrderReadModel[];
  activeOrder?: WorkOrderReadModel;
  lastVisitAt?: string;
  lastMileage?: number;
};

export function createVehicleReadModels(
  vehicles: Vehicle[],
  customers: Customer[],
  workOrders: WorkOrderReadModel[],
): VehicleReadModel[] {
  const customersById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  return vehicles.map((vehicle) => {
    const customer = customersById.get(vehicle.customerId);
    if (!customer) {
      throw new Error(`Missing customer for vehicle ${vehicle.id}`);
    }

    const vehicleOrders = workOrders
      .filter(({ order }) => order.vehicleId === vehicle.id)
      .sort(
        (left, right) =>
          Date.parse(right.order.receivedAt) -
          Date.parse(left.order.receivedAt),
      );

    return {
      vehicle,
      customer,
      workOrders: vehicleOrders,
      activeOrder: vehicleOrders.find(
        ({ order }) => order.status !== "delivered",
      ),
      lastVisitAt: vehicleOrders[0]?.order.receivedAt,
      lastMileage: vehicleOrders[0]?.order.mileageAtReception,
    };
  });
}

export function getVehicleStats(models: VehicleReadModel[]) {
  return {
    total: models.length,
    active: models.filter(({ activeOrder }) => activeOrder !== undefined).length,
    withVin: models.filter(({ vehicle }) => vehicle.vin !== undefined).length,
    customers: new Set(models.map(({ customer }) => customer.id)).size,
  };
}
