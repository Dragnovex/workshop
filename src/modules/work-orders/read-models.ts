import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { WorkOrder } from "./types";

export type WorkOrderReadModel = {
  order: WorkOrder;
  customer: Customer;
  vehicle: Vehicle;
};

export type WorkOrderTotals = {
  labor: number;
  parts: number;
  discount: number;
  total: number;
};

export function getWorkOrderTotals(order: WorkOrder): WorkOrderTotals {
  const labor = order.items.reduce(
    (sum, item) => sum + item.hours * item.rate,
    0,
  );
  const parts = order.parts.reduce(
    (sum, part) => sum + part.qty * part.unitPrice,
    0,
  );

  return {
    labor,
    parts,
    discount: order.discount,
    total: labor + parts - order.discount,
  };
}

export function createWorkOrderReadModels(
  orders: WorkOrder[],
  customers: Customer[],
  vehicles: Vehicle[],
): WorkOrderReadModel[] {
  validateMockOperations(orders);

  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return orders.map((order) => {
    const customer = customersById.get(order.customerId);
    const vehicle = vehiclesById.get(order.vehicleId);

    if (!customer || !vehicle || vehicle.customerId !== customer.id) {
      throw new Error(`Invalid mock relationship for work order ${order.id}`);
    }

    return { order, customer, vehicle };
  });
}

function validateMockOperations(orders: WorkOrder[]) {
  const openVehicles = new Map<string, string>();
  const occupiedBays = new Map<number, string>();
  const mileageByVehicle = new Map<string, number>();

  for (const order of [...orders].sort(
    (left, right) => Date.parse(left.receivedAt) - Date.parse(right.receivedAt),
  )) {
    const previousMileage = mileageByVehicle.get(order.vehicleId);
    if (
      previousMileage !== undefined &&
      order.mileageAtReception < previousMileage
    ) {
      throw new Error(`Decreasing mock mileage for vehicle ${order.vehicleId}`);
    }
    mileageByVehicle.set(order.vehicleId, order.mileageAtReception);

    if (order.status === "delivered") continue;

    const existingOrder = openVehicles.get(order.vehicleId);
    if (existingOrder) {
      throw new Error(
        `Vehicle ${order.vehicleId} is open in ${existingOrder} and ${order.id}`,
      );
    }
    openVehicles.set(order.vehicleId, order.id);

    if (order.bay === undefined) continue;
    const occupyingOrder = occupiedBays.get(order.bay);
    if (occupyingOrder) {
      throw new Error(
        `Bay ${order.bay} is occupied by ${occupyingOrder} and ${order.id}`,
      );
    }
    occupiedBays.set(order.bay, order.id);
  }
}

