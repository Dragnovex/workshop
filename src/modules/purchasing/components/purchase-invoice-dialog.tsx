"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { newLocalId } from "@/lib/client-store";
import { fromDateInputValue, toDateInputValue } from "@/lib/date-input";
import { formatMoney } from "@/lib/format";
import type { Supplier } from "@/modules/suppliers/types";

import {
  PURCHASE_VAT_RATE,
  purchaseOrderStatuses,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
} from "../types";

type DraftLine = {
  id: string;
  sku: string;
  description: string;
  qty: string;
  unitCost: string;
  discount: string;
  taxCategory: "standard" | "zero" | "exempt" | "outOfScope";
  exemptionReason: string;
};

function toDraftLines(order: PurchaseOrder | null): DraftLine[] {
  if (!order || order.items.length === 0) {
    return [{ id: "line-1", sku: "", description: "", qty: "1", unitCost: "", discount: "", taxCategory: "standard", exemptionReason: "" }];
  }
  return order.items.map((item) => ({
    id: item.id,
    sku: item.sku,
    description: item.description.ar,
    qty: String(item.qty),
    unitCost: String(item.unitCost),
    discount: item.discount ? String(item.discount) : "",
    taxCategory: item.taxCategory ?? "standard",
    exemptionReason: item.taxExemptionReason ?? "",
  }));
}

/**
 * فاتورة مشتريات — إنشاء وتعديل.
 *
 * ليست `EntityFormDialog`: البنود قائمة متغيّرة الطول بحقول مترابطة
 * (رمز، وصف، كمية، تكلفة) وإجمالي يُحسب لحظيًا، وهو ما لا يعبّر عنه
 * وصف حقول مسطّح.
 *
 * الضريبة تُشتق من المورّد لا تُفترض: مورّد بلا رقم ضريبي تُحفظ فاتورته
 * بنسبة صفر، فلا تُحتسب ضريبة مدخلات لا وجود لها.
 */
export function PurchaseInvoiceDialog({
  open,
  onOpenChange,
  order,
  suppliers,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** موجود = تعديل، `null` = إنشاء. */
  order: PurchaseOrder | null;
  suppliers: Supplier[];
  /** يعيد `true` عند نجاح الحفظ فعليًا — الحوار لا يُغلق قبل ذلك. */
  onSubmit: (order: PurchaseOrder) => boolean;
}) {
  const t = useTranslations("purchasing");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [supplierId, setSupplierId] = useState(order?.supplierId ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(order?.invoiceNumber ?? "");
  const [invoiceDate, setInvoiceDate] = useState(
    toDateInputValue(order?.invoiceDate ?? order?.orderedAt),
  );
  const [invoiceTime, setInvoiceTime] = useState(order?.invoiceTime ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bankTransfer" | "credit">(
    order?.paymentMethod ?? "cash",
  );
  const [expectedAt, setExpectedAt] = useState(toDateInputValue(order?.expectedAt));
  const [status, setStatus] = useState<PurchaseOrderStatus>(order?.status ?? "draft");
  const [reference, setReference] = useState(order?.reference ?? "");
  const [notes, setNotes] = useState(order?.notes?.ar ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => toDraftLines(order));

  // إعادة التعبئة أثناء الرسم عند تبديل السجل — لا داخل Effect يرسم
  // إطارًا كاملًا ببيانات الفاتورة السابقة قبل أن يصحّحها.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = open ? (order?.id ?? "new") : null;
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey);
    if (open) {
      setSupplierId(order?.supplierId ?? "");
      setInvoiceNumber(order?.invoiceNumber ?? "");
      setInvoiceDate(toDateInputValue(order?.invoiceDate ?? order?.orderedAt) || toDateInputValue(new Date().toISOString()));
      setInvoiceTime(order?.invoiceTime ?? "");
      setPaymentMethod(order?.paymentMethod ?? "cash");
      setExpectedAt(toDateInputValue(order?.expectedAt) || toDateInputValue(new Date().toISOString()));
      setStatus(order?.status ?? "draft");
      setReference(order?.reference ?? "");
      setNotes(order?.notes?.ar ?? "");
      setLines(toDraftLines(order));
    }
  }

  const supplier = suppliers.find((item) => item.id === supplierId);

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.qty.trim());
    const cost = Number(line.unitCost.trim());
    const discount = Number(line.discount.trim() || "0");
    if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
      return sum;
    }
    return sum + Math.max(0, qty * cost - discount);
  }, 0);
  const vat = lines.reduce((sum, line) => {
    const qty = Number(line.qty.trim());
    const cost = Number(line.unitCost.trim());
    const discount = Number(line.discount.trim() || "0");
    if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) return sum;
    const taxable = Math.round((Math.max(0, qty * cost - discount) + Number.EPSILON) * 100) / 100;
    const rate = line.taxCategory === "standard" ? PURCHASE_VAT_RATE : 0;
    return sum + Math.round((taxable * rate + Number.EPSILON) * 100) / 100;
  }, 0);
  const total = Math.round((subtotal + vat + Number.EPSILON) * 100) / 100;

  function updateLine(id: string, field: keyof DraftLine, value: string) {
    setLines((previous) =>
      previous.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  }

  function handleSubmit() {
    if (!supplierId) {
      toast.error(t("form.requiredSupplier"));
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error(t("form.requiredInvoiceNumber"));
      return;
    }
    const invoiceIso = fromDateInputValue(invoiceDate);
    const expectedIso = fromDateInputValue(expectedAt);
    if (!invoiceIso) {
      toast.error(t("form.requiredInvoiceDate"));
      return;
    }
    if (lines.some((line) => line.taxCategory === "standard") && !supplier?.vatNumber) {
      toast.error(locale === "ar" ? "لا يمكن تسجيل ضريبة مدخلات قياسية دون رقم ضريبي للمورد" : "Standard input VAT requires a VAT-registered supplier");
      return;
    }

    const items: PurchaseOrderItem[] = [];
    for (const line of lines) {
      const description = line.description.trim();
      const qty = Number(line.qty.trim());
      const unitCost = Number(line.unitCost.trim());
      const discount = Number(line.discount.trim() || "0");
      if (!description) continue;
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(t("form.invalidQty"));
        return;
      }
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        toast.error(t("form.invalidCost"));
        return;
      }
      if (!Number.isFinite(discount) || discount < 0 || discount > qty * unitCost) {
        toast.error(locale === "ar" ? "خصم البند غير صالح" : "Invalid line discount");
        return;
      }
      if (line.taxCategory !== "standard" && !line.exemptionReason.trim()) {
        toast.error(locale === "ar" ? "سبب الضريبة الصفرية أو الإعفاء مطلوب" : "Tax exemption reason is required");
        return;
      }
      items.push({
        id: line.id,
        partId: order?.items.find((item) => item.id === line.id)?.partId,
        description: { ar: description, en: description },
        sku: line.sku.trim(),
        qty,
        unitCost,
        discount,
        taxCategory: line.taxCategory,
        taxRate: line.taxCategory === "standard" ? PURCHASE_VAT_RATE : 0,
        taxExemptionReason: line.taxCategory === "standard" ? undefined : line.exemptionReason.trim(),
        unitCode: "PCE",
      });
    }

    if (items.length === 0) {
      toast.error(t("form.requiredLine"));
      return;
    }

    const supplierName = supplier?.name ?? order?.supplier ?? { ar: "", en: "" };
    const next: PurchaseOrder = {
      ...order,
      id: order?.id ?? newLocalId("po"),
      number: order?.number ?? `PI-${Date.now().toString(36).toUpperCase()}`,
      supplier: supplierName,
      supplierId,
      status,
      orderedAt: order?.orderedAt ?? invoiceIso,
      expectedAt: expectedIso ?? invoiceIso,
      items,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceIso,
      invoiceTime: invoiceTime || undefined,
      supplyDate: invoiceIso,
      currency: "SAR",
      paymentMethod,
      supplierSnapshot: supplier
        ? {
            legalName: supplier.name,
            vatNumber: supplier.vatNumber,
            commercialRegistration: supplier.commercialRegistration,
            nationalAddress: supplier.nationalAddress,
          }
        : undefined,
      paymentTerms: supplier?.paymentTerms,
      reference: reference.trim() || undefined,
      vatRate: supplier?.vatNumber ? PURCHASE_VAT_RATE : 0,
      notes: notes.trim() ? { ar: notes.trim(), en: notes.trim() } : undefined,
    };

    if (!onSubmit(next)) return;
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{order ? t("editInvoice") : t("newInvoice")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="pi-supplier">{t("columns.supplier")}</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="pi-supplier" className="w-full">
                <SelectValue placeholder={t("form.supplierPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name[locale === "en" ? "en" : "ar"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-number">{t("columns.invoiceNumber")}</Label>
            <Input
              id="pi-number"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-date">{t("columns.invoiceDate")} *</Label>
            <Input
              id="pi-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-time">{locale === "ar" ? "وقت إصدار الفاتورة" : "Invoice issue time"}</Label>
            <Input id="pi-time" type="time" value={invoiceTime} onChange={(event) => setInvoiceTime(event.target.value)} dir="ltr" className="text-end" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-payment">{locale === "ar" ? "طريقة الدفع" : "Payment method"}</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
              <SelectTrigger id="pi-payment" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{locale === "ar" ? "نقدًا" : "Cash"}</SelectItem>
                <SelectItem value="card">{locale === "ar" ? "بطاقة" : "Card"}</SelectItem>
                <SelectItem value="bankTransfer">{locale === "ar" ? "تحويل بنكي" : "Bank transfer"}</SelectItem>
                <SelectItem value="credit">{locale === "ar" ? "آجل" : "Credit"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-expected">{t("columns.expected")}</Label>
            <Input
              id="pi-expected"
              type="date"
              value={expectedAt}
              onChange={(event) => setExpectedAt(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-status">{t("columns.status")}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PurchaseOrderStatus)}>
              <SelectTrigger id="pi-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrderStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`status.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pi-reference">{t("columns.reference")}</Label>
            <Input
              id="pi-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="pi-notes">{t("form.notes")}</Label>
            <Textarea
              id="pi-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        {supplier ? (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-3">
            <div><span className="text-xs text-muted-foreground">{locale === "ar" ? "الاسم القانوني" : "Legal name"}</span><p className="mt-1 font-medium">{supplier.name[locale === "en" ? "en" : "ar"]}</p></div>
            <div><span className="text-xs text-muted-foreground">{locale === "ar" ? "الرقم الضريبي" : "VAT number"}</span><p className="mt-1 font-medium" dir="ltr">{supplier.vatNumber || (locale === "ar" ? "غير مسجل" : "Not registered")}</p></div>
            <div><span className="text-xs text-muted-foreground">{locale === "ar" ? "السجل التجاري" : "Commercial registration"}</span><p className="mt-1 font-medium" dir="ltr">{supplier.commercialRegistration || "-"}</p></div>
          </div>
        ) : null}

        <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          {locale === "ar" ? "قيد محاسبي لفاتورة صادرة من المورد. استرداد ضريبة المدخلات يتطلب فاتورة ضريبية صحيحة من مورد مسجل، ولا يكفي إدخال الضريبة يدويًا." : "Accounting record for a supplier-issued invoice. Input VAT recovery requires a valid tax invoice from a registered supplier."}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("form.lines")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                setLines((previous) => [
                  ...previous,
                  { id: newLocalId("line"), sku: "", description: "", qty: "1", unitCost: "", discount: "", taxCategory: "standard", exemptionReason: "" },
                ])
              }
            >
              <Plus className="size-4" />
              {t("form.addLine")}
            </Button>
          </div>

          <div className="hidden grid-cols-[6rem_1fr_4rem_6rem_5rem_8rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t("form.lineSku")}</span>
            <span>{t("form.lineDescription")}</span>
            <span className="text-end">{t("form.lineQty")}</span>
            <span className="text-end">{t("form.lineCost")}</span>
            <span className="text-end">{locale === "ar" ? "الخصم" : "Discount"}</span>
            <span>{locale === "ar" ? "فئة الضريبة" : "VAT category"}</span>
            <span />
          </div>

          {lines.map((line) => (
            <div key={line.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2 sm:grid-cols-[6rem_1fr_4rem_6rem_5rem_8rem_2rem] sm:items-center sm:border-0 sm:p-0">
              <Input value={line.sku} onChange={(event) => updateLine(line.id, "sku", event.target.value)} aria-label={t("form.lineSku")} placeholder={locale === "ar" ? "الرمز" : "SKU"} dir="ltr" className="text-end" />
              <Input value={line.description} onChange={(event) => updateLine(line.id, "description", event.target.value)} aria-label={t("form.lineDescription")} placeholder={locale === "ar" ? "وصف السلعة أو الخدمة" : "Item or service"} />
              <Input type="number" min={0.001} step="any" value={line.qty} onChange={(event) => updateLine(line.id, "qty", event.target.value)} aria-label={t("form.lineQty")} dir="ltr" className="text-end" />
              <Input type="number" min={0} step={0.01} value={line.unitCost} onChange={(event) => updateLine(line.id, "unitCost", event.target.value)} aria-label={t("form.lineCost")} dir="ltr" className="text-end" />
              <Input type="number" min={0} step={0.01} value={line.discount} onChange={(event) => updateLine(line.id, "discount", event.target.value)} aria-label={locale === "ar" ? "خصم البند" : "Line discount"} placeholder="0" dir="ltr" className="text-end" />
              <Select value={line.taxCategory} onValueChange={(value) => updateLine(line.id, "taxCategory", value)}>
                <SelectTrigger aria-label={locale === "ar" ? "فئة الضريبة" : "VAT category"} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">{locale === "ar" ? "قياسية 15%" : "Standard 15%"}</SelectItem>
                  <SelectItem value="zero">{locale === "ar" ? "صفرية 0%" : "Zero 0%"}</SelectItem>
                  <SelectItem value="exempt">{locale === "ar" ? "معفاة" : "Exempt"}</SelectItem>
                  <SelectItem value="outOfScope">{locale === "ar" ? "خارج النطاق" : "Out of scope"}</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={t("form.removeLine")} onClick={() => setLines((previous) => previous.length > 1 ? previous.filter((item) => item.id !== line.id) : previous)}><Trash2 className="size-4" /></Button>
              {line.taxCategory !== "standard" ? (
                <Input value={line.exemptionReason} onChange={(event) => updateLine(line.id, "exemptionReason", event.target.value)} placeholder={locale === "ar" ? "سبب ورمز الضريبة الصفرية أو الإعفاء *" : "Exemption reason and code *"} className="sm:col-span-7" />
              ) : null}
            </div>
          ))}

          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("form.subtotal")}</span>
              <span data-numeric className="text-sm">
                {formatMoney(subtotal, locale)} {tCommon("currency")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {locale === "ar" ? "إجمالي ضريبة القيمة المضافة" : "Total VAT"}
              </span>
              <span data-numeric className="text-sm">
                {formatMoney(vat, locale)} {tCommon("currency")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("form.total")}</span>
              <span data-numeric className="text-lg font-semibold">
                {formatMoney(total, locale)} {tCommon("currency")}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
