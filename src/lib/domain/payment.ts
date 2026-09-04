export const paymentMethods = ["cash", "card", "bankTransfer", "credit"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
