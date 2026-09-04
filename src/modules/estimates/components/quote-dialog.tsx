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
import type {
  Customer,
  CustomerId,
  Vehicle,
  VehicleId,
} from "@/lib/domain/contracts";
import { getVehicleDisplayName } from "@/modules/vehicles/display";

import {
  estimateStatuses,
  type Estimate,
  type EstimateItem,
  type EstimateStatus,
} from "../types";

type DraftLine = {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
};

function toDraftLines(estimate: Estimate | null): DraftLine[] {
  if (!estimate || estimate.items.length === 0) {
    return [{ id: "line-1", description: "", qty: "1", unitPrice: "" }];
  }
  return estimate.items.map((item) => ({
    id: item.id,
    description: item.description.ar,
    qty: String(item.qty),
    unitPrice: String(item.unitPrice),
  }));
}

/** صلاحية العرض الافتراضية: أسبوعان — مدة معقولة لثبات سعر قطعة. */
function defaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return toDateInputValue(date.toISOString());
}

/**
 * عرض سعر (تسعير) — إنشاء وتعديل.
 *
 * المركبة مقيّدة بمركبات العميل المختار: عرض سعر لمركبة لا يملكها العميل
 * خطأ إدخال صامت ينتهي بفاتورة على الطرف الخطأ.
 */
export function QuoteDialog({
  open,
  onOpenChange,
  estimate,
  customers,
  vehicles,
  nextNumber,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** موجود = تعديل، `null` = إنشاء. */
  estimate: Estimate | null;
  customers: Customer[];
  vehicles: Vehicle[];
  /** المرجع الفريد للعرض الجديد — يُحسب في القائمة من كل العروض. */
  nextNumber: string;
  onSubmit: (estimate: Estimate) => boolean;
}) {
  const t = useTranslations("estimates");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [customerId, setCustomerId] = useState(estimate?.customerId ?? "");
  const [vehicleId, setVehicleId] = useState(estimate?.vehicleId ?? "");
  const [status, setStatus] = useState<EstimateStatus>(estimate?.status ?? "draft");
  const [validUntil, setValidUntil] = useState(
    toDateInputValue(estimate?.validUntil) || defaultValidUntil(),
  );
  const [notes, setNotes] = useState(estimate?.notes?.ar ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => toDraftLines(estimate));

  // إعادة التعبئة أثناء الرسم عند تبديل السجل — لا داخل Effect.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = open ? (estimate?.id ?? "new") : null;
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey);
    if (open) {
      setCustomerId(estimate?.customerId ?? "");
      setVehicleId(estimate?.vehicleId ?? "");
      setStatus(estimate?.status ?? "draft");
      setValidUntil(toDateInputValue(estimate?.validUntil) || defaultValidUntil());
      setNotes(estimate?.notes?.ar ?? "");
      setLines(toDraftLines(estimate));
    }
  }

  const customerVehicles = vehicles.filter(
    (vehicle) => vehicle.customerId === customerId,
  );

  const total = lines.reduce((sum, line) => {
    const qty = Number(line.qty.trim());
    const price = Number(line.unitPrice.trim());
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) {
      return sum;
    }
    return sum + qty * price;
  }, 0);

  function updateLine(id: string, field: keyof DraftLine, value: string) {
    setLines((previous) =>
      previous.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  }

  function handleSubmit() {
    if (!customerId) {
      toast.error(t("form.requiredCustomer"));
      return;
    }
    if (!vehicleId) {
      toast.error(t("form.requiredVehicle"));
      return;
    }
    const validUntilIso = fromDateInputValue(validUntil);
    if (!validUntilIso) {
      toast.error(t("form.invalidValidUntil"));
      return;
    }

    const items: EstimateItem[] = [];
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
      });
    }

    if (items.length === 0) {
      toast.error(t("form.requiredLine"));
      return;
    }

    const next: Estimate = {
      ...estimate,
      id: estimate?.id ?? newLocalId("estimate"),
      // المرجع يُخصَّص مرة واحدة عند الإنشاء ولا يتغيّر بالتعديل: العميل
      // يحمل ورقة تحمل هذا الرقم.
      number: estimate?.number ?? nextNumber,
      customerId: customerId as CustomerId,
      vehicleId: vehicleId as VehicleId,
      status,
      createdAt: estimate?.createdAt ?? new Date().toISOString(),
      validUntil: validUntilIso,
      items,
      notes: notes.trim() ? { ar: notes.trim(), en: notes.trim() } : undefined,
    };

    if (!onSubmit(next)) return;
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{estimate ? t("editQuote") : t("newQuote")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="quote-customer">{t("columns.customer")}</Label>
            <Select
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value);
                setVehicleId("");
              }}
            >
              <SelectTrigger id="quote-customer" className="w-full">
                <SelectValue placeholder={t("form.customerPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.displayName[locale === "en" ? "en" : "ar"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-vehicle">{t("columns.vehicle")}</Label>
            <Select
              value={vehicleId}
              onValueChange={setVehicleId}
              disabled={!customerId || customerVehicles.length === 0}
            >
              <SelectTrigger id="quote-vehicle" className="w-full">
                <SelectValue
                  placeholder={
                    customerVehicles.length === 0
                      ? t("form.noVehicles")
                      : t("form.vehiclePlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {customerVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {getVehicleDisplayName(vehicle, locale)} · {vehicle.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-status">{t("columns.status")}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as EstimateStatus)}>
              <SelectTrigger id="quote-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estimateStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`status.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-valid">{t("columns.validUntil")}</Label>
            <Input
              id="quote-valid"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="quote-notes">{t("detail.notes")}</Label>
            <Textarea
              id="quote-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("detail.items")}</p>
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

          <div className="hidden grid-cols-[1fr_4.5rem_6.5rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t("detail.columns.description")}</span>
            <span className="text-end">{t("detail.columns.qty")}</span>
            <span className="text-end">{t("detail.columns.unitPrice")}</span>
            <span />
          </div>

          {lines.map((line) => (
            <div key={line.id} className="grid grid-cols-[1fr_4.5rem_6.5rem_2rem] items-center gap-2">
              <Input
                value={line.description}
                onChange={(event) => updateLine(line.id, "description", event.target.value)}
                aria-label={t("detail.columns.description")}
              />
              <Input
                type="number"
                min={1}
                value={line.qty}
                onChange={(event) => updateLine(line.id, "qty", event.target.value)}
                aria-label={t("detail.columns.qty")}
                dir="ltr"
                className="text-end"
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unitPrice}
                onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
                aria-label={t("detail.columns.unitPrice")}
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
            <span className="text-sm font-medium">{t("detail.total")}</span>
            <span data-numeric className="text-lg font-semibold">
              {formatMoney(total, locale)} {tCommon("currency")}
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
