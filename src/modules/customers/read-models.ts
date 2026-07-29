import type { Customer, Vehicle } from "@/lib/domain/contracts";
import type { WorkOrderReadModel } from "@/modules/work-orders/read-models";

export type CustomerReadModel = {
  customer: Customer;
  vehicles: Vehicle[];
  workOrders: WorkOrderReadModel[];
  openOrderCount: number;
  lastVisitAt?: string;
};

export function createCustomerReadModels(
  customers: Customer[],
  vehicles: Vehicle[],
  workOrders: WorkOrderReadModel[],
): CustomerReadModel[] {
  return customers.map((customer) => {
    const customerVehicles = vehicles.filter(
      (vehicle) => vehicle.customerId === customer.id,
    );
    const customerOrders = workOrders
      .filter(({ order }) => order.customerId === customer.id)
      .sort(
        (left, right) =>
          Date.parse(right.order.receivedAt) -
          Date.parse(left.order.receivedAt),
      );

    return {
      customer,
      vehicles: customerVehicles,
      workOrders: customerOrders,
      openOrderCount: customerOrders.filter(
        ({ order }) => order.status !== "delivered",
      ).length,
      lastVisitAt: customerOrders[0]?.order.receivedAt,
    };
  });
}

export function getCustomerStats(models: CustomerReadModel[]) {
  return {
    total: models.length,
    individuals: models.filter(({ customer }) => customer.kind === "individual")
      .length,
    companies: models.filter(({ customer }) => customer.kind === "company")
      .length,
    openOrders: models.reduce(
      (sum, customer) => sum + customer.openOrderCount,
      0,
    ),
  };
}
