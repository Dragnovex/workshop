import { PrintDocument } from "@/components/patterns/print-document";
import { getDirection } from "@/i18n/routing";
import { companyProfile } from "@/lib/legal/company";
import { formatDate, formatWeekdayName } from "@/lib/format";
import type { DailyClosingReportTotals } from "@/lib/services/daily-closing-service";
import type { DailyClosing, DailyClosingEntry } from "../types";

const labels = {
  ar: {
    title: "تقفيل اليومية",
    branch: "الفرع",
    date: "التاريخ",
    weekday: "اليوم",
    entryNumber: "رقم القيد",
    cashAccount: "الصندوق / الحساب",
    openingBalance: "رصيد ما قبله (مرحّل)",
    expenses: "المصروفات",
    purchases: "المشتريات",
    reference: "المرجع",
    description: "البيان",
    paymentMethod: "طريقة الدفع",
    responsible: "المسؤول",
    amount: "المبلغ",
    noEntries: "لا توجد بنود",
    summary: "الحسابات النهائية",
    totalExpenses: "إجمالي المصروفات",
    totalPurchases: "إجمالي المشتريات",
    totalDailySales: "أوامر التشغيل اليومية",
    totalReceipts: "مجموع القبض",
    preliminaryNet: "الصافي الأولي",
    deductPurchases: "خصم المشتريات",
    deductExpenses: "خصم المصروفات",
    grossTotal: "الإجمالي الكلي",
    netDaily: "صافي اليومية",
    notes: "ملاحظات",
    signatures: "التوقيعات",
    branchManager: "مسؤول الفرع",
    accountant: "المحاسب",
    receiver: "المستلم",
    signature: "التوقيع",
    stamp: "الختم",
    currency: "ر.س",
    manualBadge: "تسوية يدوية",
    generatedBy: "مستند صادر آليًا من نظام إدارة ورشة النعماني",
  },
  en: {
    title: "Daily Closing Sheet",
    branch: "Branch",
    date: "Date",
    weekday: "Day",
    entryNumber: "Entry No.",
    cashAccount: "Cash / Account",
    openingBalance: "Carried-forward Balance",
    expenses: "Expenses",
    purchases: "Purchases",
    reference: "Reference",
    description: "Description",
    paymentMethod: "Payment Method",
    responsible: "Responsible",
    amount: "Amount",
    noEntries: "No entries",
    summary: "Final Calculations",
    totalExpenses: "Total Expenses",
    totalPurchases: "Total Purchases",
    totalDailySales: "Daily Work Orders",
    totalReceipts: "Total Receipts",
    preliminaryNet: "Preliminary Net",
    deductPurchases: "Less: Purchases",
    deductExpenses: "Less: Expenses",
    grossTotal: "Grand Total",
    netDaily: "Net Daily",
    notes: "Notes",
    signatures: "Signatures",
    branchManager: "Branch Manager",
    accountant: "Accountant",
    receiver: "Receiver",
    signature: "Signature",
    stamp: "Stamp",
    currency: "SAR",
    manualBadge: "Manual adjustment",
    generatedBy: "Automatically issued by Al-Numani Workshop Management System",
  },
} as const;

function formatMoney2(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ar-SA-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function EntryTable({
  title,
  entries,
  lang,
  locale,
  t,
}: {
  title: string;
  entries: DailyClosingEntry[];
  lang: "ar" | "en";
  locale: string;
  t: (typeof labels)[keyof typeof labels];
}) {
  return (
    <section className="mt-3">
      <h3 className="border-b border-black bg-black/5 px-1 py-1 text-[10px] font-bold">{title}</h3>
      {entries.length === 0 ? (
        <p className="px-1 py-2 text-[9px] opacity-70">{t.noEntries}</p>
      ) : (
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="border-b border-black/50">
              <th className="py-1 text-start font-bold">{t.reference}</th>
              <th className="py-1 text-start font-bold">{t.description}</th>
              <th className="py-1 text-start font-bold">{t.paymentMethod}</th>
              <th className="py-1 text-start font-bold">{t.responsible}</th>
              <th className="py-1 text-end font-bold">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-black/15">
                <td className="py-0.5" dir="ltr">{entry.referenceNumber}</td>
                <td className="py-0.5">
                  {entry.description[lang]}
                  {entry.isManualAdjustment ? ` — ${t.manualBadge}` : ""}
                </td>
                <td className="py-0.5">{entry.paymentMethod}</td>
                <td className="py-0.5">{entry.responsible[lang]}</td>
                <td className="py-0.5 text-end" dir="ltr">{formatMoney2(entry.amount, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function DailyClosingPrint({
  closing,
  totals,
  locale,
}: {
  closing: DailyClosing;
  totals: DailyClosingReportTotals;
  locale: string;
}) {
  const lang = locale === "en" ? "en" : "ar";
  const t = labels[lang];
  const dir = getDirection(locale) === "rtl" ? "rtl" : "ltr";

  return (
    <PrintDocument dir={dir}>
      {/* الشعار الأساسي */}
      <header className="flex flex-col items-center border-b-2 border-black pb-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- الطباعة تتطلب تحميلًا مباشرًا بلا كسل next/image */}
        <img src="/brand/logo.png" alt={companyProfile.tradeName[lang]} className="h-14 w-auto object-contain" />

        {/* أماكن مخصّصة لشعارات الوكالات — لا صور فعلية بعد */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {["Hyundai", "Honda", "Kia"].map((brand) => (
            <span
              key={brand}
              className="flex h-6 w-16 items-center justify-center border border-dashed border-black/40 text-[8px] text-black/50"
            >
              {brand}
            </span>
          ))}
        </div>

        <h1 className="mt-2 text-base font-bold">{t.title}</h1>
        <p className="text-[10px]">{companyProfile.tradeName[lang]}</p>
      </header>

      {/* بيانات الرأس */}
      <section className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-y border-black py-2 text-[10px]">
        <div className="flex justify-between">
          <span className="opacity-70">{t.branch}</span>
          <span className="font-medium">{closing.branch[lang]}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">{t.entryNumber}</span>
          <span dir="ltr" className="font-medium">{closing.entryNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">{t.date}</span>
          <span dir="ltr" className="font-medium">{formatDate(closing.date, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">{t.weekday}</span>
          <span className="font-medium">{formatWeekdayName(closing.date, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">{t.cashAccount}</span>
          <span className="font-medium">{closing.cashAccount[lang]}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">{t.openingBalance}</span>
          <span dir="ltr" className="font-medium">{formatMoney2(closing.openingBalance, locale)}</span>
        </div>
      </section>

      <EntryTable title={t.expenses} entries={closing.expenses} lang={lang} locale={locale} t={t} />
      <EntryTable title={t.purchases} entries={closing.purchases} lang={lang} locale={locale} t={t} />

      {/* الحسابات النهائية */}
      <section className="mt-4 flex justify-end">
        <table className="w-72 border border-black text-[10px]">
          <tbody>
            <tr className="border-b border-black/40">
              <td className="px-2 py-1 font-bold" colSpan={2}>{t.summary}</td>
            </tr>
            {/* نفس تسلسل النموذج الورقي — المطبوع والشاشة لا يختلفان أبدًا. */}
            <tr>
              <td className="px-2 py-0.5">{t.openingBalance}</td>
              <td className="px-2 py-0.5 text-end" dir="ltr">{formatMoney2(totals.openingBalance, locale)}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5">{t.totalDailySales}</td>
              <td className="px-2 py-0.5 text-end" dir="ltr">{formatMoney2(totals.totalDailySales, locale)}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5">{t.totalReceipts}</td>
              <td className="px-2 py-0.5 text-end" dir="ltr">{formatMoney2(totals.totalReceipts, locale)}</td>
            </tr>
            <tr className="border-t border-black">
              <td className="px-2 py-1 font-bold">{t.grossTotal}</td>
              <td className="px-2 py-1 text-end font-bold" dir="ltr">{formatMoney2(totals.grandTotal, locale)}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5">{t.deductPurchases}</td>
              <td className="px-2 py-0.5 text-end" dir="ltr">-{formatMoney2(totals.totalPurchases, locale)}</td>
            </tr>
            <tr className="border-t border-black">
              <td className="px-2 py-1 font-bold">{t.preliminaryNet}</td>
              <td className="px-2 py-1 text-end font-bold" dir="ltr">{formatMoney2(totals.preliminaryNet, locale)}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5">{t.deductExpenses}</td>
              <td className="px-2 py-0.5 text-end" dir="ltr">-{formatMoney2(totals.totalExpenses, locale)}</td>
            </tr>
            <tr className="border-t border-black bg-black/5">
              <td className="px-2 py-1 font-bold">{t.netDaily}</td>
              <td className="px-2 py-1 text-end font-bold" dir="ltr">{formatMoney2(totals.netDaily, locale)} {t.currency}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {closing.notes ? (
        <section className="mt-3 text-[9px]">
          <p className="font-bold">{t.notes}</p>
          <p className="mt-0.5">{closing.notes}</p>
        </section>
      ) : null}

      {/* التوقيعات */}
      <section className="mt-8 grid grid-cols-3 gap-6 text-[9px]">
        {[t.branchManager, t.accountant, t.receiver].map((label) => (
          <div key={label} className="space-y-4">
            <p className="font-bold">{label}</p>
            <p className="border-b border-black/60 pb-4">{t.signature}: ______________</p>
            <p className="border-b border-black/60 pb-4">{t.stamp}: ______________</p>
          </div>
        ))}
      </section>

      <footer className="mt-6 border-t border-black/30 pt-2 text-center text-[8px] opacity-70">
        {t.generatedBy}
      </footer>
    </PrintDocument>
  );
}
