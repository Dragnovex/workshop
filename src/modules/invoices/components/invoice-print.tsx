import { PrintDocument } from "@/components/patterns/print-document";
import { formatAddress } from "@/lib/domain/address";
import { formatDate, formatDateTime } from "@/lib/format";
import { getDirection } from "@/i18n/routing";
import type { InvoiceReadModel } from "../read-models";

const labels = {
  ar: {
    taxInvoice: "فاتورة ضريبية",
    simplifiedInvoice: "فاتورة ضريبية مبسّطة",
    creditNote: "إشعار دائن",
    debitNote: "إشعار مدين",
    invoiceNo: "رقم الفاتورة",
    uuid: "المعرّف الفريد",
    issueDate: "تاريخ الإصدار",
    supplyDate: "تاريخ التوريد",
    dueDate: "تاريخ الاستحقاق",
    seller: "بيانات البائع",
    buyer: "بيانات المشتري",
    vatNumber: "الرقم الضريبي",
    cr: "السجل التجاري",
    address: "العنوان",
    phone: "الجوال",
    description: "الوصف",
    qty: "الكمية",
    unitPrice: "سعر الوحدة",
    discount: "الخصم",
    taxable: "المبلغ الخاضع",
    taxRate: "نسبة الضريبة",
    tax: "قيمة الضريبة",
    lineTotal: "الإجمالي",
    subtotal: "الإجمالي قبل الخصم",
    discountTotal: "إجمالي الخصم",
    taxableTotal: "إجمالي المبلغ الخاضع",
    taxTotal: "إجمالي ضريبة القيمة المضافة",
    grandTotal: "الإجمالي شامل الضريبة",
    paid: "المسدَّد",
    balanceDue: "المتبقي",
    qrTitle: "حمل رمز الاستجابة السريعة (بيانات المرحلة الأولى)",
    relatedInvoice: "مرتبطة بالفاتورة",
    reason: "سبب الإشعار",
    currency: "ر.س",
    notes: "ملاحظات",
    generatedBy: "مستند صادر آليًا من نظام إدارة ورشة النعماني",
  },
  en: {
    taxInvoice: "Tax Invoice",
    simplifiedInvoice: "Simplified Tax Invoice",
    creditNote: "Credit Note",
    debitNote: "Debit Note",
    invoiceNo: "Invoice No.",
    uuid: "UUID",
    issueDate: "Issue Date",
    supplyDate: "Supply Date",
    dueDate: "Due Date",
    seller: "Seller",
    buyer: "Buyer",
    vatNumber: "VAT Number",
    cr: "CR Number",
    address: "Address",
    phone: "Phone",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    discount: "Discount",
    taxable: "Taxable Amount",
    taxRate: "Tax Rate",
    tax: "Tax Amount",
    lineTotal: "Total",
    subtotal: "Subtotal (before discount)",
    discountTotal: "Total Discount",
    taxableTotal: "Total Taxable Amount",
    taxTotal: "Total VAT",
    grandTotal: "Total incl. VAT",
    paid: "Paid",
    balanceDue: "Balance Due",
    qrTitle: "QR Payload (Phase 1 minimum fields)",
    relatedInvoice: "Related to Invoice",
    reason: "Note Reason",
    currency: "SAR",
    notes: "Notes",
    generatedBy: "Automatically issued by Al-Numani Workshop Management System",
  },
} as const;

function documentTitle(t: (typeof labels)[keyof typeof labels], model: InvoiceReadModel): string {
  if (model.invoice.documentType === "creditNote") return t.creditNote;
  if (model.invoice.documentType === "debitNote") return t.debitNote;
  return model.invoice.kind === "simplified" ? t.simplifiedInvoice : t.taxInvoice;
}

function formatMoney2(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ar-SA-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function InvoicePrint({ model, locale }: { model: InvoiceReadModel; locale: string }) {
  const lang = locale === "en" ? "en" : "ar";
  const t = labels[lang];
  const dir = getDirection(locale) === "rtl" ? "rtl" : "ltr";
  const { invoice, totals } = model;
  const sellerAddress = invoice.sellerSnapshot.address ? formatAddress(invoice.sellerSnapshot.address, locale) : undefined;
  const buyerAddress = invoice.buyerSnapshot.address ? formatAddress(invoice.buyerSnapshot.address, locale) : undefined;
  const qr = model.qrPayload;

  return (
    <PrintDocument dir={dir}>
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="text-lg font-bold">{invoice.sellerSnapshot.legalName[lang]}</h1>
          {sellerAddress ? <p className="mt-1 text-[10px]">{sellerAddress}</p> : null}
          {invoice.sellerSnapshot.vatNumber ? (
            <p className="mt-1 text-[10px]" dir="ltr">
              {t.vatNumber}: {invoice.sellerSnapshot.vatNumber}
            </p>
          ) : null}
        </div>
        <div className="text-end">
          <h2 className="text-base font-bold">{documentTitle(t, model)}</h2>
          <p className="mt-1 text-[10px]" dir="ltr">{invoice.number}</p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-1 text-[11px] font-bold">{t.seller}</h3>
          <dl className="space-y-0.5 text-[10px]">
            <div>{invoice.sellerSnapshot.legalName[lang]}</div>
            {invoice.sellerSnapshot.commercialRegistration ? (
              <div dir="ltr">{t.cr}: {invoice.sellerSnapshot.commercialRegistration}</div>
            ) : null}
            {sellerAddress ? <div>{sellerAddress}</div> : null}
          </dl>
        </div>
        <div>
          <h3 className="mb-1 text-[11px] font-bold">{t.buyer}</h3>
          <dl className="space-y-0.5 text-[10px]">
            <div>{invoice.buyerSnapshot.legalName[lang]}</div>
            {invoice.buyerSnapshot.vatNumber ? (
              <div dir="ltr">{t.vatNumber}: {invoice.buyerSnapshot.vatNumber}</div>
            ) : null}
            {invoice.buyerSnapshot.commercialRegistration ? (
              <div dir="ltr">{t.cr}: {invoice.buyerSnapshot.commercialRegistration}</div>
            ) : null}
            {buyerAddress ? <div>{buyerAddress}</div> : null}
            {invoice.buyerSnapshot.phone ? <div dir="ltr">{t.phone}: {invoice.buyerSnapshot.phone}</div> : null}
          </dl>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-4 gap-3 border-y border-black py-2 text-[10px]">
        <div>
          <dt className="text-[9px] opacity-70">{t.invoiceNo}</dt>
          <dd dir="ltr" className="font-medium">{invoice.number}</dd>
        </div>
        <div>
          <dt className="text-[9px] opacity-70">{t.issueDate}</dt>
          <dd>{invoice.issuedAt ? formatDateTime(invoice.issuedAt, locale) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[9px] opacity-70">{t.supplyDate}</dt>
          <dd>{formatDate(invoice.supplyDate, locale)}</dd>
        </div>
        <div>
          <dt className="text-[9px] opacity-70">{t.uuid}</dt>
          <dd dir="ltr" className="truncate text-[8px]">{invoice.uuid}</dd>
        </div>
      </section>

      {invoice.relatedInvoiceId ? (
        <p className="mt-2 text-[10px]">
          {t.relatedInvoice}: <span dir="ltr">{invoice.relatedInvoiceId}</span>
          {invoice.reasonForNote ? ` — ${t.reason}: ${invoice.reasonForNote[lang]}` : null}
        </p>
      ) : null}

      <table className="mt-3 w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-y border-black">
            <th className="py-1 text-start font-bold">{t.description}</th>
            <th className="py-1 text-end font-bold">{t.qty}</th>
            <th className="py-1 text-end font-bold">{t.unitPrice}</th>
            <th className="py-1 text-end font-bold">{t.discount}</th>
            <th className="py-1 text-end font-bold">{t.taxRate}</th>
            <th className="py-1 text-end font-bold">{t.tax}</th>
            <th className="py-1 text-end font-bold">{t.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => {
            const gross = item.qty * item.unitPrice;
            const taxableAmount = gross - item.discount;
            const taxAmount = item.taxCategory === "standard" ? taxableAmount * item.taxRate : 0;
            return (
              <tr key={item.id} className="border-b border-black/20">
                <td className="py-1">{item.description[lang]}</td>
                <td className="py-1 text-end" dir="ltr">{item.qty}</td>
                <td className="py-1 text-end" dir="ltr">{formatMoney2(item.unitPrice, locale)}</td>
                <td className="py-1 text-end" dir="ltr">{formatMoney2(item.discount, locale)}</td>
                <td className="py-1 text-end" dir="ltr">{(item.taxRate * 100).toFixed(0)}%</td>
                <td className="py-1 text-end" dir="ltr">{formatMoney2(taxAmount, locale)}</td>
                <td className="py-1 text-end font-medium" dir="ltr">{formatMoney2(taxableAmount + taxAmount, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="mt-3 flex justify-end">
        <table className="w-64 text-[10px]">
          <tbody>
            <tr>
              <td className="py-0.5">{t.subtotal}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(totals.subtotal, locale)}</td>
            </tr>
            <tr>
              <td className="py-0.5">{t.discountTotal}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(totals.discountTotal, locale)}</td>
            </tr>
            <tr>
              <td className="py-0.5">{t.taxableTotal}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(totals.taxableTotal, locale)}</td>
            </tr>
            <tr>
              <td className="py-0.5">{t.taxTotal}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(totals.taxTotal, locale)}</td>
            </tr>
            <tr className="border-t border-black font-bold">
              <td className="py-1">{t.grandTotal}</td>
              <td className="py-1 text-end" dir="ltr">{formatMoney2(totals.total, locale)} {t.currency}</td>
            </tr>
            <tr>
              <td className="py-0.5">{t.paid}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(invoice.paidAmount, locale)}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-0.5">{t.balanceDue}</td>
              <td className="py-0.5 text-end" dir="ltr">{formatMoney2(totals.balanceDue, locale)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {invoice.notes ? (
        <p className="mt-3 text-[10px]">
          <span className="font-bold">{t.notes}: </span>
          {invoice.notes[lang]}
        </p>
      ) : null}

      {qr ? (
        <section className="mt-3 border border-black/40 p-2">
          <p className="text-[9px] font-bold">{t.qrTitle}</p>
          <p className="mt-1 break-all font-mono text-[8px]" dir="ltr">{qr}</p>
        </section>
      ) : null}

      <footer className="mt-6 border-t border-black/30 pt-2 text-center text-[8px] opacity-70">
        {t.generatedBy}
      </footer>
    </PrintDocument>
  );
}
