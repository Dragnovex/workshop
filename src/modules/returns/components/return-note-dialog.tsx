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
import { formatMoney } from "@/lib/format";
import { getInvoiceTotals } from "@/lib/services/invoice-service";
import {
  STANDARD_VAT_RATE,
  type Invoice,
  type InvoiceDocumentType,
  type InvoiceLineItem,
} from "@/modules/invoices/types";

type DraftLine = {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
};

function toDraftLines(note: Invoice | null): DraftLine[] {
  if (!note || note.items.length === 0) {
    return [{ id: "line-1", description: "", qty: "1", unitPrice: "" }];
  }
  return note.items.map((item) => ({
    id: item.id,
    description: item.description.ar,
    qty: String(item.qty),
    unitPrice: String(item.unitPrice),
  }));
}

/**
 * إشعار دائن أو مدين (مردود) — إنشاء وتعديل.
 *
 * الإشعار **مستند مستقل** لا تعديل على الفاتورة الأصلية: الفاتورة تُقفل
 * بعد إصدارها، والتصحيح الوحيد المسموح نظاميًا هو إصدار إشعار يشير إليها.
 * لهذا الفاتورة الأصلية حقل إلزامي هنا — إشعار بلا أصل لا معنى محاسبي له.
 *
 * دائن = ردّ للعميل (مرتجع أو خصم بعد البيع).
 * مدين = مطالبة إضافية عليه (نقص في فاتورة صدرت).
 */
export function ReturnNoteDialog({
  open,
  onOpenChange,
  note,
  invoices,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** موجود = تعديل، `null` = إنشاء. */
  note: Invoice | null;
  /** الفواتير الأصلية المتاحة للربط — المُصدَرة فقط. */
  invoices: Invoice[];
  onSubmit: (note: Invoice) => boolean;
}) {
  const t = useTranslations("returns");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [documentType, setDocumentType] = useState<InvoiceDocumentType>(
    note?.documentType === "debitNote" ? "debitNote" : "creditNote",
  );
  const [relatedInvoiceId, setRelatedInvoiceId] = useState(note?.relatedInvoiceId ?? "");
  const [reason, setReason] = useState(note?.reasonForNote?.ar ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => toDraftLines(note));

  // إعادة التعبئة أثناء الرسم عند تبديل السجل — لا داخل Effect.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = open ? (note?.id ?? "new") : null;
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey);
    if (open) {
      setDocumentType(note?.documentType === "debitNote" ? "debitNote" : "creditNote");
      setRelatedInvoiceId(note?.relatedInvoiceId ?? "");
      setReason(note?.reasonForNote?.ar ?? "");
      setLines(toDraftLines(note));
    }
  }

  const relatedInvoice = invoices.find((item) => item.id === relatedInvoiceId);

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.qty.trim());
    const price = Number(line.unitPrice.trim());
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) {
      return sum;
    }
    return sum + qty * price;
  }, 0);
  const vat = Math.round((subtotal * STANDARD_VAT_RATE + Number.EPSILON) * 100) / 100;

  function updateLine(id: string, field: keyof DraftLine, value: string) {
    setLines((previous) =>
      previous.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  }

  function handleSubmit() {
    if (!relatedInvoice) {
      toast.error(t("form.requiredInvoice"));
      return;
    }
    if (!reason.trim()) {
      toast.error(t("form.requiredReason"));
      return;
    }

    const items: InvoiceLineItem[] = [];
    for (const line of lines) {
      const description = line.description.trim();
      if (!description) continue;
      const qty = Number(line.qty.trim());
      const unitPrice = Number(line.unitPrice.trim());
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(t("form.invalidQty"));
        return;
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        toast.error(t("form.invalidPrice"));
        return;
      }
      items.push({
        id: line.id,
        description: { ar: description, en: description },
        qty,
        unitPrice,
        discount: 0,
        taxCategory: "standard",
        taxRate: STANDARD_VAT_RATE,
      });
    }

    if (items.length === 0) {
      toast.error(t("form.requiredLine"));
      return;
    }

    // قيمة الإشعار لا تتجاوز الفاتورة الأصلية: ردّ أكثر مما دُفع يعني
    // رصيدًا سالبًا في دفتر العميل، وهو خطأ لا تصحيح.
    const originalTotal = getInvoiceTotals(relatedInvoice).total;
    if (Math.round((subtotal + vat) * 100) > Math.round(originalTotal * 100)) {
      toast.error(t("form.exceedsOriginal"));
      return;
    }

    const now = new Date().toISOString();
    const next: Invoice = {
      ...note,
      id: note?.id ?? newLocalId("note"),
      documentType,
      // الإشعار يرث نوع الفاتورة الأصلية (ضريبية/مبسّطة) ولقطتَي الطرفين
      // منها: بياناتها وقت الإصدار هي المرجع لا بيانات العميل اليوم.
      kind: relatedInvoice.kind,
      number:
        note?.number ??
        `${documentType === "creditNote" ? "CN" : "DN"}-${Date.now().toString(36).toUpperCase()}`,
      sequenceNumber: note?.sequenceNumber ?? 0,
      uuid: note?.uuid ?? crypto.randomUUID(),
      status: note?.status ?? "draft",
      supplyDate: note?.supplyDate ?? now.slice(0, 10),
      customerId: relatedInvoice.customerId,
      vehicleId: relatedInvoice.vehicleId,
      sellerSnapshot: relatedInvoice.sellerSnapshot,
      buyerSnapshot: relatedInvoice.buyerSnapshot,
      paymentMethod: relatedInvoice.paymentMethod,
      paidAmount: 0,
      items,
      relatedInvoiceId: relatedInvoice.id,
      reasonForNote: { ar: reason.trim(), en: reason.trim() },
      auditLog: [
        ...(note?.auditLog ?? []),
        {
          id: newLocalId("a"),
          timestamp: now,
          actor: { ar: "النظام", en: "System" },
          action: note
            ? { ar: "تعديل إشعار", en: "Note edited" }
            : { ar: "إنشاء إشعار", en: "Note created" },
        },
      ],
    };

    if (!onSubmit(next)) return;
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{note ? t("editNote") : t("newNote")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="note-type">{t("columns.type")}</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as InvoiceDocumentType)}
            >
              <SelectTrigger id="note-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creditNote">{t("type.creditNote")}</SelectItem>
                <SelectItem value="debitNote">{t("type.debitNote")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note-invoice">{t("columns.relatedInvoice")}</Label>
            <Select value={relatedInvoiceId} onValueChange={setRelatedInvoiceId}>
              <SelectTrigger id="note-invoice" className="w-full">
                <SelectValue placeholder={t("form.invoicePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.number} · {formatMoney(getInvoiceTotals(invoice).total, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="note-reason">{t("columns.reason")}</Label>
            <Textarea
              id="note-reason"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("form.reasonPlaceholder")}
            />
          </div>
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
                  { id: newLocalId("line"), description: "", qty: "1", unitPrice: "" },
                ])
              }
            >
              <Plus className="size-4" />
              {t("form.addLine")}
            </Button>
          </div>

          {lines.map((line) => (
            <div key={line.id} className="grid grid-cols-[1fr_4.5rem_6.5rem_2rem] items-center gap-2">
              <Input
                value={line.description}
                onChange={(event) => updateLine(line.id, "description", event.target.value)}
                aria-label={t("form.lineDescription")}
                placeholder={t("form.lineDescription")}
              />
              <Input
                type="number"
                min={1}
                value={line.qty}
                onChange={(event) => updateLine(line.id, "qty", event.target.value)}
                aria-label={t("form.lineQty")}
                dir="ltr"
                className="text-end"
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unitPrice}
                onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
                aria-label={t("form.linePrice")}
                dir="ltr"
                className="text-end"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={t("form.removeLine")}
                onClick={() =>
                  setLines((previous) =>
                    previous.length > 1
                      ? previous.filter((item) => item.id !== line.id)
                      : previous,
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium">{t("form.total")}</span>
            <span data-numeric className="text-lg font-semibold">
              {formatMoney(subtotal + vat, locale)} {tCommon("currency")}
            </span>
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
