export type LocalizedText = {
  ar: string;
  en: string;
};

export type CustomerId = `customer-${string}`;
export type VehicleId = `vehicle-${string}`;

export type Customer = {
  id: CustomerId;
  kind: "individual" | "company";
  displayName: LocalizedText;
};

export type Vehicle = {
  id: VehicleId;
  customerId: CustomerId;
  make: LocalizedText;
  model: LocalizedText;
  year: number;
  plate: string;
  vin?: string;
  imageUrl?: string;
};
