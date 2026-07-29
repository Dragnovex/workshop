import type { CustomerId, LocalizedText, VehicleId } from "@/lib/domain/contracts";

export const workOrderStatuses = [
  "reception",
  "inspection",
  "awaitingApproval",
  "inProgress",
  "awaitingParts",
  "readyForDelivery",
  "delivered",
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export type WorkOrderPriority = "low" | "normal" | "high" | "urgent";

export type WorkItem = {
  id: string;
  description: LocalizedText;
  hours: number;
  rate: number;
  done: boolean;
};

export type WorkPart = {
  id: string;
  name: LocalizedText;
  sku: string;
  qty: number;
  unitPrice: number;
  installStatus: "installed" | "ordered" | "available";
};

export type TimelineEvent = {
  id: string;
  status: WorkOrderStatus;
  timestamp: string;
  actor: LocalizedText;
  note?: LocalizedText;
};

export type WorkOrder = {
  id: string;
  number: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  customerId: CustomerId;
  vehicleId: VehicleId;
  mileageAtReception: number;
  complaint: LocalizedText;
  diagnosis?: LocalizedText;
  technician: LocalizedText;
  bay?: number;
  receivedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  discount: number;
  items: WorkItem[];
  parts: WorkPart[];
  timeline: TimelineEvent[];
};
