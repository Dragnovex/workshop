import { formatAddress } from "@/lib/domain/address";
import type { Customer } from "@/lib/domain/contracts";
import { companyProfile } from "@/lib/legal/company";
import { generateZatcaSimplifiedQrPayload } from "@/lib/zatca/qr";
import type { Invoice, InvoiceLineItem, PartySnapshot } from "@/modules/invoices/types";

export type InvoiceLineTotals = {
  taxableAmount: number;
  taxAmount: number;
  total: number;
};

export function getInvoiceLineTotals(item: InvoiceLineItem): InvoiceLineTotals {
  const gross = item.qty * item.unitPrice;
  const taxableAmount = Math.max(0, gross - item.discount);
  const taxAmount = item.taxCategory === "standard" ? round2(taxableAmount * item.taxRate) : 0;
  return { taxableAmount: round2(taxableAmount), taxAmount, total: round2(taxableAmount + taxAmount) };
}

export type InvoiceTotals = {
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  taxTotal: number;
  total: number;
  balanceDue: number;
};

export function getInvoiceTotals(invoice: Invoice): InvoiceTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableTotal = 0;
  let taxTotal = 0;

  for (const item of invoice.items) {
    subtotal += item.qty * item.unitPrice;
    discountTotal += item.discount;
    const lineTotals = getInvoiceLineTotals(item);
    taxableTotal += lineTotals.taxableAmount;
    taxTotal += lineTotals.taxAmount;
  }

  const total = round2(taxableTotal + taxTotal);
  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxableTotal: round2(taxableTotal),
    taxTotal: round2(taxTotal),
    total,
    balanceDue: round2(total - invoice.paidAmount),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** لقطة بيانات البائع من ملف الكيان القانوني — تُستخدم عند إصدار أي فاتورة. */
export function buildSellerSnapshot(): PartySnapshot {
  return {
    legalName: companyProfile.legalName,
    vatNumber: companyProfile.vatNumber,
    commercialRegistration: companyProfile.commercialRegistration,
    address: {
      buildingNo: companyProfile.nationalAddress.buildingNo,
      street: companyProfile.nationalAddress.street,
      secondaryNo: companyProfile.nationalAddress.secondaryNo,
      district: companyProfile.nationalAddress.district,
      city: companyProfile.nationalAddress.city,
      postalCode: companyProfile.nationalAddress.postalCode,
      country: companyProfile.nationalAddress.country,
      shortAddress: companyProfile.nationalAddress.shortAddress,
    },
  };
}

/** لقطة بيانات المشتري من سجل العميل وقت إصدار الفاتورة — لا تتغيّر لاحقًا. */
export function buildBuyerSnapshot(customer: Customer): PartySnapshot {
  return {
    legalName: customer.legalName ?? customer.displayName,
    vatNumber: customer.vatNumber,
    commercialRegistration: customer.commercialRegistration,
    address: customer.billingAddress ?? customer.nationalAddress,
    phone: customer.phone,
    email: customer.email,
  };
}

/** فاتورة ضريبية B2B تتطلب رقمًا ضريبيًا صالحًا للمشتري — وإلا يجب إصدارها كفاتورة مبسّطة. */
export function canIssueStandardInvoice(customer: Customer): boolean {
  return customer.kind === "company" && Boolean(customer.vatNumber);
}

/** فاتورة صادرة (issued فما بعدها) مقفلة — لا تعديل مباشر ولا حذف، فقط إشعار دائن/مدين. */
export function isInvoiceLocked(invoice: Invoice): boolean {
  return invoice.status !== "draft";
}

export function getSimplifiedQrPayload(invoice: Invoice, locale: string): string | null {
  if (invoice.kind !== "simplified" || !invoice.issuedAt) return null;
  const totals = getInvoiceTotals(invoice);
  const lang = locale === "en" ? "en" : "ar";
  return generateZatcaSimplifiedQrPayload({
    sellerName: invoice.sellerSnapshot.legalName[lang],
    vatNumber: invoice.sellerSnapshot.vatNumber ?? companyProfile.vatNumber,
    timestampIso: invoice.issuedAt,
    invoiceTotal: totals.total,
    vatTotal: totals.taxTotal,
  });
}

export function formatPartyAddress(snapshot: PartySnapshot, locale: string): string | undefined {
  return snapshot.address ? formatAddress(snapshot.address, locale) : undefined;
}
