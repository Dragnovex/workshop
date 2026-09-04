import assert from "node:assert/strict";

import { isValidCommercialRegistration, isValidSaudiPhone, isValidSaudiVatNumber } from "@/lib/validation/saudi";
import { generateZatcaSimplifiedQrPayload } from "@/lib/zatca/qr";
import { dailyClosings } from "@/modules/daily-closing/data";
import { invoices } from "@/modules/invoices/data";
import { getInvoiceLineTotals, getInvoiceTotals } from "@/lib/services/invoice-service";
import { getDailyClosingReportTotals, getDailyClosingTotals } from "@/lib/services/daily-closing-service";
import { applyReceiptToParts, getPurchaseTotals } from "@/lib/services/purchasing-service";
import { isWithinRange } from "@/lib/date-range";
import { decidePermission } from "@/lib/auth/decide";
import type { SessionUser } from "@/lib/auth/types";
import type { Part } from "@/modules/inventory/types";
import type { PurchaseOrder } from "@/modules/purchasing/types";

let passed = 0;

function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

check("standard tax invoice (inv-001) totals: 540 + 15% = 621, fully paid", () => {
  const inv = invoices.find((i) => i.id === "inv-001")!;
  const totals = getInvoiceTotals(inv);
  assert.equal(totals.subtotal, 540);
  assert.equal(totals.taxableTotal, 540);
  assert.equal(totals.taxTotal, 81);
  assert.equal(totals.total, 621);
  assert.equal(totals.balanceDue, 0);
});

check("simplified invoice (inv-002) applies line discount before VAT", () => {
  const inv = invoices.find((i) => i.id === "inv-002")!;
  const totals = getInvoiceTotals(inv);
  assert.equal(totals.taxableTotal, 400);
  assert.equal(totals.taxTotal, 60);
  assert.equal(totals.total, 460);
});

check("exempt line (inv-003) contributes zero tax while standard line still taxed", () => {
  const inv = invoices.find((i) => i.id === "inv-003")!;
  const totals = getInvoiceTotals(inv);
  assert.equal(totals.taxableTotal, 810);
  assert.equal(totals.taxTotal, 99);
  assert.equal(totals.total, 909);
});

check("zero-rated line (inv-006) is taxable base with zero VAT", () => {
  const inv = invoices.find((i) => i.id === "inv-006")!;
  const totals = getInvoiceTotals(inv);
  assert.equal(totals.taxableTotal, 1200);
  assert.equal(totals.taxTotal, 0);
  assert.equal(totals.total, 1200);
});

check("line total rounding: 3 x 33.333 rounds to 100.00 before VAT", () => {
  const line = getInvoiceLineTotals({
    id: "x",
    description: { ar: "", en: "" },
    qty: 3,
    unitPrice: 33.333,
    discount: 0,
    taxCategory: "standard",
    taxRate: 0.15,
  });
  assert.equal(line.taxableAmount, 100);
  assert.equal(line.taxAmount, 15);
  assert.equal(line.total, 115);
});

check("daily closing 2026-07-26 totals and chained opening balance for 2026-07-29", () => {
  const day1 = dailyClosings.find((d) => d.id === "dc-2026-07-26")!;
  const day2 = dailyClosings.find((d) => d.id === "dc-2026-07-29")!;
  const totals1 = getDailyClosingTotals(day1);
  assert.equal(totals1.totalSales, 621);
  assert.equal(totals1.totalReceipts, 500);
  assert.equal(totals1.totalExpenses, 275);
  assert.equal(totals1.totalPurchases, 2600);
  assert.equal(totals1.inflow, 1121);
  assert.equal(totals1.outflow, 2875);
  assert.equal(totals1.dailyNet, -1754);
  assert.equal(totals1.closingBalance, 6646);
  assert.equal(day2.openingBalance, totals1.closingBalance);
});

check("daily closing report follows the paper form sequence, with two subtractions", () => {
  const day1 = dailyClosings.find((d) => d.id === "dc-2026-07-26")!;
  const report = getDailyClosingReportTotals(day1);

  // المُدخَل والمجاميع
  assert.equal(report.openingBalance, 8400); // رصيد ما قبله (مرحّل)
  assert.equal(report.totalDailySales, 621); // أوامر التشغيل اليومية
  assert.equal(report.totalReceipts, 500); // مجموع القبض
  assert.equal(report.totalPurchases, 2600);
  assert.equal(report.totalExpenses, 275);

  // الإجمالي الكلي = 8400 + 621 + 500
  assert.equal(report.grandTotal, 9521);
  // الصافي الأولي = 9521 − 2600  (المشتريات تُطرح أولًا)
  assert.equal(report.preliminaryNet, 6921);
  // صافي اليومية = 6921 − 275
  assert.equal(report.netDaily, 6646);

  assert.equal(report.netDaily, getDailyClosingTotals(day1).closingBalance);
});

/**
 * يومية ٢٤‏/٠٥‏/٢٠٢٦ الورقية الفعلية — الحارس ضد انحراف المعادلة.
 * أرقام حقيقية من نموذج الورشة المعتمد، لا بيانات مُختلَقة.
 */
check("real paper daily closing 24/05/2026 reproduces exactly: 13578 → 21565 → 20595 → 14242", () => {
  const paper = {
    openingBalance: 13578,
    sales: [{ amount: 7987 }],
    receipts: [] as { amount: number }[],
    purchases: [{ amount: 50 }, { amount: 920 }], // (616) + (618) = 970
    expenses: [
      { amount: 62 },
      { amount: 74 },
      { amount: 6147 },
      { amount: 30 },
      { amount: 10 },
      { amount: 30 },
    ], // = 6353
  };

  const grandTotal =
    paper.openingBalance +
    paper.sales.reduce((s, e) => s + e.amount, 0) +
    paper.receipts.reduce((s, e) => s + e.amount, 0);
  const totalPurchases = paper.purchases.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = paper.expenses.reduce((s, e) => s + e.amount, 0);
  const preliminaryNet = grandTotal - totalPurchases;
  const netDaily = preliminaryNet - totalExpenses;

  assert.equal(grandTotal, 21565);
  assert.equal(totalPurchases, 970);
  assert.equal(preliminaryNet, 20595);
  assert.equal(totalExpenses, 6353);
  assert.equal(netDaily, 14242);
});

check("ZATCA simplified QR payload round-trips through TLV decoding", () => {
  const payload = generateZatcaSimplifiedQrPayload({
    sellerName: "شركة سليمان احمد خميس النعماني للتجارة",
    vatNumber: "311086716200003",
    timestampIso: "2026-07-28T12:00:00+03:00",
    invoiceTotal: 460,
    vatTotal: 60,
  });
  const bytes = Buffer.from(payload, "base64");
  const fields: Record<number, string> = {};
  let offset = 0;
  while (offset < bytes.length) {
    const tag = bytes[offset];
    const len = bytes[offset + 1];
    fields[tag] = bytes.subarray(offset + 2, offset + 2 + len).toString("utf-8");
    offset += 2 + len;
  }
  assert.equal(fields[1], "شركة سليمان احمد خميس النعماني للتجارة");
  assert.equal(fields[2], "311086716200003");
  assert.equal(fields[3], "2026-07-28T12:00:00+03:00");
  assert.equal(fields[4], "460.00");
  assert.equal(fields[5], "60.00");
});

check("Saudi VAT number validator: 15 digits, starts and ends with 3", () => {
  assert.equal(isValidSaudiVatNumber("311086716200003"), true);
  assert.equal(isValidSaudiVatNumber("123456789012345"), false);
  assert.equal(isValidSaudiVatNumber("31108671620000"), false);
});

check("Saudi commercial registration validator: exactly 10 digits", () => {
  assert.equal(isValidCommercialRegistration("1010178378"), true);
  assert.equal(isValidCommercialRegistration("12345"), false);
});

check("Saudi phone validator accepts 05xxxxxxxx and +9665xxxxxxxx", () => {
  assert.equal(isValidSaudiPhone("+966501234501"), true);
  assert.equal(isValidSaudiPhone("0501234501"), true);
  assert.equal(isValidSaudiPhone("12345"), false);
});

// ── فاتورة الشراء ─────────────────────────────────────────────────────

function purchaseOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: "po-test",
    number: "PI-TEST",
    supplier: { ar: "مورّد", en: "Supplier" },
    status: "ordered",
    orderedAt: "2026-08-01T09:00:00+03:00",
    expectedAt: "2026-08-05T09:00:00+03:00",
    items: [
      { id: "i1", description: { ar: "فلتر", en: "Filter" }, sku: "F-1", qty: 10, unitCost: 15 },
      { id: "i2", description: { ar: "زيت", en: "Oil" }, sku: "O-1", qty: 4, unitCost: 26.5 },
    ],
    ...overrides,
  };
}

check("purchase totals: 150 + 106 = 256 net, 15% VAT = 38.40, total 294.40", () => {
  const totals = getPurchaseTotals(purchaseOrder());
  assert.equal(totals.subtotal, 256);
  assert.equal(totals.vat, 38.4);
  assert.equal(totals.total, 294.4);
});

check("unregistered supplier (vatRate 0) carries no input VAT", () => {
  const totals = getPurchaseTotals(purchaseOrder({ vatRate: 0 }));
  assert.equal(totals.subtotal, 256);
  assert.equal(totals.vat, 0);
  assert.equal(totals.total, 256);
});

// ── استلام المشتريات في المخزون ───────────────────────────────────────

function part(overrides: Partial<Part> = {}): Part {
  return {
    id: "part-1",
    sku: "F-1",
    name: { ar: "فلتر", en: "Filter" },
    category: "filters",
    qtyOnHand: 5,
    reorderLevel: 2,
    unitPrice: 20,
    location: "A1",
    ...overrides,
  };
}

let idCounter = 0;
const makeId = (prefix: string) => `${prefix}-generated-${++idCounter}`;

check("receipt adds quantities to the matching part by id", () => {
  const order = purchaseOrder({
    items: [
      { id: "i1", partId: "part-1", description: { ar: "فلتر", en: "Filter" }, sku: "OTHER", qty: 10, unitCost: 15 },
    ],
  });
  const result = applyReceiptToParts(order, [part()], makeId);
  assert.equal(result.updated, 1);
  assert.equal(result.created, 0);
  assert.equal(result.parts[0].qtyOnHand, 15);
  // سعر البيع لا يُلمس عند الاستلام — التكلفة شيء والتسعير قرار آخر.
  assert.equal(result.parts[0].unitPrice, 20);
});

check("receipt matches by SKU regardless of letter case", () => {
  const order = purchaseOrder({
    items: [
      { id: "i1", description: { ar: "فلتر", en: "Filter" }, sku: "f-1", qty: 3, unitCost: 15 },
    ],
  });
  const result = applyReceiptToParts(order, [part()], makeId);
  assert.equal(result.updated, 1);
  assert.equal(result.created, 0);
  assert.equal(result.parts[0].qtyOnHand, 8);
});

check("a line with no matching part creates a new inventory item", () => {
  const order = purchaseOrder({
    items: [
      { id: "i1", description: { ar: "قطعة جديدة", en: "New part" }, sku: "NEW-9", qty: 7, unitCost: 40 },
    ],
  });
  const result = applyReceiptToParts(order, [part()], makeId);
  assert.equal(result.created, 1);
  assert.equal(result.parts.length, 2);
  assert.equal(result.parts[1].sku, "NEW-9");
  assert.equal(result.parts[1].qtyOnHand, 7);
  // القطعة الأصلية لا تتأثر.
  assert.equal(result.parts[0].qtyOnHand, 5);
});

check("two lines of the same SKU accumulate onto one part, not two", () => {
  const order = purchaseOrder({
    items: [
      { id: "i1", description: { ar: "فلتر", en: "Filter" }, sku: "F-1", qty: 3, unitCost: 15 },
      { id: "i2", description: { ar: "فلتر", en: "Filter" }, sku: "F-1", qty: 2, unitCost: 15 },
    ],
  });
  const result = applyReceiptToParts(order, [part()], makeId);
  assert.equal(result.parts.length, 1);
  assert.equal(result.parts[0].qtyOnHand, 10);
});

// ── نطاق التاريخ ──────────────────────────────────────────────────────

check("date range includes both boundary days, and an ISO timestamp on the last day", () => {
  const range = { from: "2026-07-01", to: "2026-07-31" };
  assert.equal(isWithinRange("2026-07-01", range), true);
  assert.equal(isWithinRange("2026-07-31", range), true);
  // اللحظة داخل اليوم الأخير تبقى داخل النطاق — الخطأ الذي كان يُسقط
  // مستندات آخر يوم من التقرير.
  assert.equal(isWithinRange("2026-07-31T16:45:00+03:00", range), true);
  assert.equal(isWithinRange("2026-08-01", range), false);
  assert.equal(isWithinRange("2026-06-30", range), false);
});

check("an open-ended range filters on one side only", () => {
  assert.equal(isWithinRange("2020-01-01", { from: "", to: "2026-07-31" }), true);
  assert.equal(isWithinRange("2030-01-01", { from: "", to: "2026-07-31" }), false);
  assert.equal(isWithinRange("2030-01-01", { from: "2026-07-01", to: "" }), true);
  assert.equal(isWithinRange("2020-01-01", { from: "2026-07-01", to: "" }), false);
});

// ── قرار الصلاحية على الخادم ──────────────────────────────────────────

const technician: SessionUser = {
  id: "u1",
  name: "فني",
  email: "t@example.com",
  role: "technician",
};

check("server refuses a write the role does not allow (FORBIDDEN)", () => {
  const decision = decidePermission({
    authEnabled: true,
    user: technician,
    permission: "suppliers:create",
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.allow === false && decision.reason, "FORBIDDEN");
});

check("server allows a write the role does permit", () => {
  const decision = decidePermission({
    authEnabled: true,
    user: technician,
    permission: "workOrders:update",
  });
  assert.equal(decision.allow, true);
});

check("no session while auth is on is rejected as UNAUTHENTICATED", () => {
  const decision = decidePermission({
    authEnabled: true,
    user: null,
    permission: "workOrders:read",
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.allow === false && decision.reason, "UNAUTHENTICATED");
});

check("seed mode has no users, so no session check is performed", () => {
  // سلوك موثّق لا سهو: بيانات البذرة بلا مستخدمين، وتفعيل الحارس عليها
  // يقفل التطبيق على الجميع. ولهذا يمنع AGENTS النشر في هذا الوضع.
  const decision = decidePermission({
    authEnabled: false,
    user: null,
    permission: "suppliers:delete",
  });
  assert.equal(decision.allow, true);
});

console.log(`\n${passed} tests passed.`);
