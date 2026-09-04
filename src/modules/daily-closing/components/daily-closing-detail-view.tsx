"use client";

import { ArrowRight, Lock, Plus, Save, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { DocumentActions } from "@/components/patterns/document-actions";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatDate, formatDateTime, formatMoney, formatWeekdayName } from "@/lib/format";
import { getDailyClosingReportTotals, isDailyClosingLocked } from "@/lib/services/daily-closing-service";
import { loadStoredDailyClosings, saveStoredDailyClosings } from "../client-store";
import { DailyClosingPrint } from "./daily-closing-print";
import { DailyClosingStatusBadge } from "./daily-closing-status-badge";
import { paymentMethods, type DailyClosing, type DailyClosingEntry, type PaymentMethod } from "../types";

type DraftRow = {
  id: string;
  referenceNumber: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  responsible: string;
};

function toDraftRow(entry: DailyClosingEntry, lang: "ar" | "en"): DraftRow {
  return {
    id: entry.id,
    referenceNumber: entry.referenceNumber,
    description: entry.description[lang],
    amount: entry.amount,
    paymentMethod: entry.paymentMethod,
    responsible: entry.responsible[lang],
  };
}

function fromDraftRow(row: DraftRow, original?: DailyClosingEntry): DailyClosingEntry {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    description: { ar: row.description, en: row.description },
    amount: Number.isFinite(row.amount) ? row.amount : 0,
    paymentMethod: row.paymentMethod,
    responsible: { ar: row.responsible, en: row.responsible },
    source: original?.source ?? "manual",
    linkedInvoiceId: original?.linkedInvoiceId,
    linkedPurchaseOrderId: original?.linkedPurchaseOrderId,
    isManualAdjustment: original?.isManualAdjustment ?? true,
    time: original?.time ?? new Date().toISOString(),
  };
}

export function DailyClosingDetailView({ closing: seedClosing }: { closing: DailyClosing }) {
  const t = useTranslations("dailyClosing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const idPrefix = useId();

  /**
   * تعديل سابق محفوظ محليًا لهذه اليومية بالذات (إن وُجد) يحل محل نسخة
   * البذرة التي يمرّرها الخادم — وإلا فتعديلات المستخدم تختفي عند أي
   * تحديث للصفحة رغم ظهور رسالة "تم الحفظ" السابقة.
   */
  const [closing] = useState<DailyClosing>(() => {
    const merged = loadStoredDailyClosings([seedClosing]);
    return merged.find((item) => item.id === seedClosing.id) ?? seedClosing;
  });

  const locked = isDailyClosingLocked(closing);

  const [entryNumber, setEntryNumber] = useState(closing.entryNumber);
  const [branch, setBranch] = useState(closing.branch[lang]);
  const [cashAccount, setCashAccount] = useState(closing.cashAccount[lang]);
  const [openingBalance, setOpeningBalance] = useState(closing.openingBalance);
  const [notes, setNotes] = useState(closing.notes ?? "");
  const [expenses, setExpenses] = useState<DraftRow[]>(closing.expenses.map((entry) => toDraftRow(entry, lang)));
  const [purchases, setPurchases] = useState<DraftRow[]>(closing.purchases.map((entry) => toDraftRow(entry, lang)));
  const [dirty, setDirty] = useState(false);

  const originalById = useMemo(() => {
    const map = new Map<string, DailyClosingEntry>();
    for (const entry of [...closing.expenses, ...closing.purchases]) map.set(entry.id, entry);
    return map;
  }, [closing.expenses, closing.purchases]);

  const liveClosing: DailyClosing = useMemo(
    () => ({
      ...closing,
      entryNumber,
      branch: { ar: branch, en: branch },
      cashAccount: { ar: cashAccount, en: cashAccount },
      openingBalance,
      notes: notes.trim() ? notes : undefined,
      expenses: expenses.map((row) => fromDraftRow(row, originalById.get(row.id))),
      purchases: purchases.map((row) => fromDraftRow(row, originalById.get(row.id))),
    }),
    [branch, cashAccount, closing, entryNumber, expenses, notes, openingBalance, originalById, purchases],
  );

  const totals = getDailyClosingReportTotals(liveClosing);

  function markDirty() {
    if (!locked) setDirty(true);
  }

  function addRow(setter: React.Dispatch<React.SetStateAction<DraftRow[]>>, prefix: string) {
    setter((rows) => [
      ...rows,
      {
        id: `${idPrefix}-${prefix}-${rows.length}-${Date.now()}`,
        referenceNumber: "",
        description: "",
        amount: 0,
        paymentMethod: "cash",
        responsible: "",
      },
    ]);
    markDirty();
  }

  function removeRow(setter: React.Dispatch<React.SetStateAction<DraftRow[]>>, id: string) {
    setter((rows) => rows.filter((row) => row.id !== id));
    markDirty();
  }

  function updateRow(
    setter: React.Dispatch<React.SetStateAction<DraftRow[]>>,
    id: string,
    patch: Partial<DraftRow>,
  ) {
    setter((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    markDirty();
  }

  function handleSave() {
    // مبلغ سالب في مصروف أو مشترى لا معنى محاسبي له — يُرفض صراحةً بدل
    // قبوله بصمت ثم إفساد سلسلة الحساب (الإجمالي الكلي، الصافي الأولي...).
    const negativeRow = [...expenses, ...purchases].find(
      (row) => !Number.isFinite(row.amount) || row.amount < 0,
    );
    if (negativeRow) {
      toast.error(
        t("detail.negativeAmount", {
          description: negativeRow.description.trim() || t("detail.emptyDescription"),
        }),
      );
      return;
    }

    const all = loadStoredDailyClosings([seedClosing]).filter(
      (item) => item.id !== closing.id,
    );
    const ok = saveStoredDailyClosings([...all, liveClosing]);
    if (!ok) {
      toast.error(tCommon("storageSaveFailed"));
      return;
    }

    setDirty(false);
    toast.success(t("detail.savedLocally"));
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 print:hidden">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t("title")}
              <DailyClosingStatusBadge status={closing.status} label={t(`status.${closing.status}`)} />
              {locked ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock aria-hidden="true" className="size-3" />
                  {t("detail.locked")}
                </span>
              ) : dirty ? (
                <Badge variant="secondary" className="bg-warning-subtle text-warning-text">
                  {t("detail.unsavedChanges")}
                </Badge>
              ) : null}
            </span>
          }
          description={t("detail.entrySubtitle")}
          actions={
            <div className="flex items-center gap-2">
              {!locked ? (
                <Button size="sm" onClick={handleSave} disabled={!dirty}>
                  <Save aria-hidden="true" className="size-4" />
                  {t("detail.save")}
                </Button>
              ) : null}
              {/* تقفيل اليومية مستند داخلي: لا مستلم خارجي، فزر واتساب
                  يظهر معطَّلًا بسبب واضح بدل إخفائه بلا تفسير. */}
              <DocumentActions message={t("detail.whatsappMessage", { entry: closing.entryNumber })} />
              <Button asChild variant="outline" size="sm">
                <Link href="/daily-closing">
                  <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
                  {t("detail.back")}
                </Link>
              </Button>
            </div>
          }
        />

        <SectionCard title={t("detail.entryHeader")} contentClassName="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* اليوم والتاريخ متجاوران كما في رأس النموذج الورقي. */}
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-weekday`}>{t("detail.weekday")}</Label>
            <Input
              id={`${idPrefix}-weekday`}
              value={formatWeekdayName(closing.date, locale)}
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-date`}>{t("columns.date")}</Label>
            <Input id={`${idPrefix}-date`} value={formatDate(closing.date, locale)} disabled data-numeric />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-entry-number`}>{t("entryNumber")}</Label>
            <Input
              id={`${idPrefix}-entry-number`}
              value={entryNumber}
              disabled={locked}
              dir="ltr"
              onChange={(event) => {
                setEntryNumber(event.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-branch`}>{t("branch")}</Label>
            <Input
              id={`${idPrefix}-branch`}
              value={branch}
              disabled={locked}
              onChange={(event) => {
                setBranch(event.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-cash-account`}>{t("cashAccount")}</Label>
            <Input
              id={`${idPrefix}-cash-account`}
              value={cashAccount}
              disabled={locked}
              onChange={(event) => {
                setCashAccount(event.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-opening-balance`}>{t("totals.opening")}</Label>
            <Input
              id={`${idPrefix}-opening-balance`}
              type="number"
              inputMode="decimal"
              data-numeric
              dir="ltr"
              value={openingBalance}
              disabled={locked}
              onChange={(event) => {
                setOpeningBalance(Number(event.target.value));
                markDirty();
              }}
            />
          </div>
        </SectionCard>

        {/*
          تخطيط عمودين مطابق للنموذج الورقي:
          عمود البنود (مصروفات فوق بعض، ثم مشتريات فوق بعض) وبجانبه سلسلة
          الحساب. على الجوال ينهار العمودان إلى واحد بنفس الترتيب.
        */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="flex flex-col gap-4">
            <EditableEntryTable
              title={t("sections.expenses")}
              rows={expenses}
              locked={locked}
              onAdd={() => addRow(setExpenses, "exp")}
              onRemove={(id) => removeRow(setExpenses, id)}
              onChange={(id, patch) => updateRow(setExpenses, id, patch)}
              total={totals.totalExpenses}
              totalLabel={t("detail.totalExpenses")}
              locale={locale}
              t={t}
            />

            <EditableEntryTable
              title={t("sections.purchases")}
              rows={purchases}
              locked={locked}
              onAdd={() => addRow(setPurchases, "pur")}
              onRemove={(id) => removeRow(setPurchases, id)}
              onChange={(id, patch) => updateRow(setPurchases, id, patch)}
              total={totals.totalPurchases}
              totalLabel={t("detail.totalPurchases")}
              locale={locale}
              t={t}
            />
          </div>

          <SectionCard
            title={t("detail.finalCalculations")}
            contentClassName="p-0"
            className="lg:sticky lg:top-20"
          >
            {/*
              الترتيب مطابق لنموذج اليومية الورقي حرفيًا، بخطوتي طرح لا خطوة واحدة:
              مرحّل + أوامر تشغيل + قبض = إجمالي كلي → −مشتريات = صافي أولي → −مصروفات = صافي اليومية.
            */}
            <dl className="divide-y divide-border">
              <SummaryRow label={t("totals.opening")} value={formatMoney(totals.openingBalance, locale)} />
              <SummaryRow label={t("detail.totalDailySales")} value={formatMoney(totals.totalDailySales, locale)} />
              <SummaryRow label={t("detail.totalReceipts")} value={formatMoney(totals.totalReceipts, locale)} />
              <SummaryRow label={t("detail.grossTotal")} value={formatMoney(totals.grandTotal, locale)} bold />
              <SummaryRow label={t("detail.deductPurchases")} value={`-${formatMoney(totals.totalPurchases, locale)}`} />
              <SummaryRow label={t("detail.preliminaryNet")} value={formatMoney(totals.preliminaryNet, locale)} bold />
              <SummaryRow label={t("detail.deductExpenses")} value={`-${formatMoney(totals.totalExpenses, locale)}`} />
              <SummaryRow
                label={t("detail.netDaily")}
                value={`${formatMoney(totals.netDaily, locale)} ${tCommon("currency")}`}
                bold
                accent
              />
            </dl>
          </SectionCard>
        </div>

        <SectionCard title={t("detail.notesTitle")}>
          <Label htmlFor={`${idPrefix}-notes`} className="sr-only">{t("detail.notesTitle")}</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={notes}
            disabled={locked}
            placeholder={t("detail.notesPlaceholder")}
            onChange={(event) => {
              setNotes(event.target.value);
              markDirty();
            }}
            rows={3}
          />
        </SectionCard>

        {(closing.sales.length > 0 || closing.receipts.length > 0) ? (
          <SectionCard title={t("detail.autoLinkedTitle")} subtitle={t("detail.autoLinkedSubtitle")} contentClassName="p-0">
            <ReadOnlyEntryTable entries={[...closing.sales, ...closing.receipts]} lang={lang} locale={locale} t={t} />
          </SectionCard>
        ) : null}

        {(closing.closedBy || closing.reviewedByAccountant) ? (
          <SectionCard title={t("detail.closure")} contentClassName="p-0">
            <dl className="divide-y divide-border">
              {closing.closedBy ? (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t("detail.closedBy")}</dt>
                  <dd className="text-end text-sm font-medium">
                    {closing.closedBy[lang]}
                    {closing.closedAt ? (
                      <span className="ms-2 text-xs font-normal text-muted-foreground" data-numeric>
                        {formatDateTime(closing.closedAt, locale)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {closing.reviewedByAccountant ? (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{t("detail.reviewedBy")}</dt>
                  <dd className="text-end text-sm font-medium">
                    {closing.reviewedByAccountant[lang]}
                    {closing.reviewedAt ? (
                      <span className="ms-2 text-xs font-normal text-muted-foreground" data-numeric>
                        {formatDateTime(closing.reviewedAt, locale)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </SectionCard>
        ) : null}

        <SectionCard title={t("detail.auditLog")} contentClassName="p-0">
          <ul className="divide-y divide-border">
            {closing.auditLog.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    {entry.action[lang]}
                    {entry.isManualAdjustment ? (
                      <Badge variant="secondary" className="ms-2 bg-warning-subtle text-warning-text">
                        {t("detail.manualAdjustment")}
                      </Badge>
                    ) : null}
                  </p>
                  {entry.note ? <p className="mt-0.5 text-xs text-muted-foreground">{entry.note[lang]}</p> : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.actor[lang]}</p>
                </div>
                <span data-numeric className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                  {formatDateTime(entry.timestamp, locale)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <DailyClosingPrint closing={liveClosing} totals={totals} locale={locale} />
    </>
  );
}

function EditableEntryTable({
  title,
  rows,
  locked,
  onAdd,
  onRemove,
  onChange,
  total,
  totalLabel,
  locale,
  t,
}: {
  title: string;
  rows: DraftRow[];
  locked: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<DraftRow>) => void;
  /** مجموع القسم — يظهر أسفل الجدول كما في النموذج الورقي. */
  total: number;
  totalLabel: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <SectionCard
      title={title}
      contentClassName="p-0"
      action={
        !locked ? (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus aria-hidden="true" className="size-4" />
            {t("detail.addRow")}
          </Button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("detail.noEntries")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("entryColumns.reference")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.description")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.paymentMethod")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.responsible")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("entryColumns.amount")}</TableHead>
                {!locked ? <TableHead className="pe-4 w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-transparent">
                  <TableCell className="ps-4">
                    <Input
                      value={row.referenceNumber}
                      disabled={locked}
                      dir="ltr"
                      className="h-8 text-xs"
                      onChange={(event) => onChange(row.id, { referenceNumber: event.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.description}
                      disabled={locked}
                      className="h-8 text-sm"
                      onChange={(event) => onChange(row.id, { description: event.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.paymentMethod}
                      onValueChange={(value) => onChange(row.id, { paymentMethod: value as PaymentMethod })}
                      disabled={locked}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>{t(`paymentMethod.${method}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.responsible}
                      disabled={locked}
                      className="h-8 text-sm"
                      onChange={(event) => onChange(row.id, { responsible: event.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      data-numeric
                      dir="ltr"
                      value={row.amount}
                      disabled={locked}
                      className="h-8 text-end text-sm"
                      onChange={(event) => onChange(row.id, { amount: Number(event.target.value) })}
                    />
                  </TableCell>
                  {!locked ? (
                    <TableCell className="pe-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-danger-text"
                        aria-label={t("detail.removeRow")}
                        onClick={() => onRemove(row.id)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* مجموع القسم — سطر موجود في النموذج الورقي وكان ناقصًا في الشاشة. */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="text-sm font-medium">{totalLabel}</span>
        <span className="text-sm font-semibold tabular-nums" data-numeric>
          {formatMoney(total, locale)}
        </span>
      </div>
    </SectionCard>
  );
}

function ReadOnlyEntryTable({
  entries,
  lang,
  locale,
  t,
}: {
  entries: DailyClosingEntry[];
  lang: "ar" | "en";
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="ps-4 text-xs whitespace-nowrap">{t("entryColumns.reference")}</TableHead>
            <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.description")}</TableHead>
            <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.paymentMethod")}</TableHead>
            <TableHead className="text-xs whitespace-nowrap">{t("entryColumns.responsible")}</TableHead>
            <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("entryColumns.amount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-transparent">
              <TableCell data-ltr className="ps-4 text-xs">
                {entry.linkedInvoiceId ? (
                  <Link href={`/invoices/${entry.linkedInvoiceId}`} className="hover:underline focus-visible:underline">
                    {entry.referenceNumber}
                  </Link>
                ) : (
                  entry.referenceNumber
                )}
              </TableCell>
              <TableCell className="max-w-[16rem] truncate text-sm">{entry.description[lang]}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{t(`paymentMethod.${entry.paymentMethod}`)}</TableCell>
              <TableCell className="text-sm">{entry.responsible[lang]}</TableCell>
              <TableCell data-numeric className="pe-4 text-end text-sm font-medium">{formatMoney(entry.amount, locale)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
  accent = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className={`text-xs ${bold ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</dt>
      <dd
        data-numeric
        className={`text-end text-sm ${bold ? "font-semibold" : "font-medium"} ${accent ? "text-primary-text" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
