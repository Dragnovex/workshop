import type { VehicleStatus } from "@/lib/domain/contracts";

export const vehicleStatusChip: Record<VehicleStatus, string> = {
  active: "bg-success-subtle text-success-text",
  inactive: "border border-border text-muted-foreground",
  sold: "bg-secondary text-muted-foreground",
};
