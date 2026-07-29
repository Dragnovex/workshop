import type { CustomerId, LocalizedText, VehicleId } from "@/lib/domain/contracts";

export const estimateStatuses = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
] as const;

export type EstimateStatus = (typeof estimateStatuses)[number];

export type EstimateItem = {
  id: string;
  description: LocalizedText;
  qty: number;
  unitPrice: number;
};

export type Estimate = {
  id: string;
  number: string;
  customerId: CustomerId;
  vehicleId: VehicleId;
  status: EstimateStatus;
  createdAt: string;
  validUntil: string;
  items: EstimateItem[];
  notes?: LocalizedText;
  linkedWorkOrderId?: string;
};
