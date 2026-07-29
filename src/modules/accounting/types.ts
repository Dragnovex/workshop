import type { LocalizedText } from "@/lib/domain/contracts";

export const transactionTypes = ["debit", "credit"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export const transactionCategories = [
  "serviceRevenue",
  "partsRevenue",
  "partsCost",
  "payroll",
  "rent",
  "utilities",
  "other",
] as const;

export type TransactionCategory = (typeof transactionCategories)[number];

export type AccountingTransaction = {
  id: string;
  reference: string;
  account: LocalizedText;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  linkedInvoiceId?: string;
  linkedPurchaseOrderId?: string;
  notes?: LocalizedText;
};
