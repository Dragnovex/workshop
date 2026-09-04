"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Printer, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
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
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Customer, CustomerId, Vehicle, VehicleId } from "@/lib/domain/contracts";
import {
  buildBuyerSnapshot,
  buildSellerSnapshot,
  canIssueStandardInvoice,
  getInvoiceLineTotals,
} from "@/lib/services/invoice-service";
import { useGuard } from "@/lib/auth/permission-context";
import { firstIssueMessage, newInvoiceSchema } from "@/lib/validation/forms";
import { getVehicleDisplayName } from "@/modules/vehicles/display";
import { loadStoredCustomers, saveStoredCustomers } from "@/modules/customers/client-store";
import { normalizeSaudiPhone } from "@/lib/validation/saudi";
import { loadStoredVehicles, saveStoredVehicles } from "@/modules/vehicles/client-store";
import { loadStoredInvoices, saveStoredInvoices } from "../client-store";
import { paymentMethods, type Invoice, type InvoiceLineItem, type PaymentMethod } from "../types";
import { WALK_IN_CUSTOMER_ID } from "../walk-in-customer";

type DraftLine = {
  id: string;
  descriptionAr: string;
  qty: string;
  unitPrice: string;
  discount: string;
};

/** نسبة ضريبة القيمة المضافة السعودية للفئة القياسية. */
const STANDARD_VAT_RATE = 0.15;

/** بنود فاتورة قائمة → صفوف النموذج القابلة للتحرير. */
function toDraftLines(invoice: Invoice | undefined): DraftLine[] {
  if (!invoice || invoice.items.length === 0) {
    return [{ id: "line-1", descriptionAr: "", qty: "1", unitPrice: "", discount: "" }];
  }
  return invoice.items.map((item) => ({
    id: item.id,
    descriptionAr: item.description.ar,
    qty: String(item.qty),
    unitPrice: String(item.unitPrice),
    discount: item.discount ? String(item.discount) : "",
  }));
}

/**
 * نموذج الفاتورة — إنشاء مسودة جديدة، أو **تعديل** مسودة قائمة عند تمرير
 * `invoice`. نموذج واحد للحالتين عمدًا: نسخة ثانية للتعديل كانت ستنحرف
 * عن قواعد الضريبة والتقريب في النسخة الأولى بعد أول تغيير.
 *
 * التعديل مقصور على المسودات: الفاتورة المُصدَرة مقفلة نظاميًا، وتصحيحها
 * يكون بإشعار دائن/مدين لا بتغييرها في مكانها (انظر وحدة المردود).
 */
export function NewInvoiceForm({
  seedInvoices,
  customers,
  vehicles,
  invoice: editingInvoice,
}: {
  seedInvoices: Invoice[];
  customers: Customer[];
  vehicles: Vehicle[];
  /** موجودة = وضع التعديل. */
  invoice?: Invoice;
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const guard = useGuard();

  const isEditing = editingInvoice !== undefined;

  type CustomerKind = "individual" | "institution" | "company";
  const [allCustomers, setAllCustomers] = useState(() => loadStoredCustomers(customers));
  const [allVehicles, setAllVehicles] = useState(() => loadStoredVehicles(vehicles));
  const [customerId, setCustomerId] = useState<CustomerId | "">(
    editingInvoice?.customerId ?? "",
  );
  const [vehicleId, setVehicleId] = useState<VehicleId | "">(
    editingInvoice?.vehicleId ?? "",
  );
  const [lines, setLines] = useState<DraftLine[]>(() => toDraftLines(editingInvoice));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingInvoice?.paymentMethod ?? "cash",
  );
  const [saving, setSaving] = useState(false);
  const [customerKind, setCustomerKind] = useState<CustomerKind>("individual");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  /** يحدّده الزر المضغوط: حفظ فقط، أم حفظ ثم فتح صفحة الفاتورة للطباعة. */
  const [printAfterSave, setPrintAfterSave] = useState(false);

  const customerVehicles = allVehicles.filter(
    (vehicle) => vehicle.customerId === customerId,
  );
  const selectedCustomer = allCustomers.find((customer) => customer.id === customerId);
  const isBusinessCustomer = customerKind !== "individual";
  const canSaveInlineCustomer = isBusinessCustomer
    ? customerName.trim().length > 0 && /^3\d{13}3$/.test(vatNumber.trim())
    : customerName.trim().length > 0;

  /**
   * الإجماليات المعروضة تُحسب بنفس دالة الخدمة التي تُحسب بها الفاتورة المخزَّنة
   * (تقريب لكل بند على حدة — مطابق لمنهج هيئة الزكاة والضريبة)، حتى لا يختلف
   * الرقم المعروض عن الرقم المحفوظ. البنود غير المكتملة تُستثنى من الحساب.
   */
  const totals = useMemo(() => {
    let taxableTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const line of lines) {
      const qty = Number(line.qty.trim());
      const unitPrice = Number(line.unitPrice.trim());
      if (
        line.qty.trim() === "" ||
        line.unitPrice.trim() === "" ||
        !Number.isFinite(qty) ||
        !Number.isFinite(unitPrice) ||
        qty <= 0 ||
        unitPrice < 0
      ) {
        continue;
      }

      // خصم غير صالح أو يتجاوز قيمة البند يُعامَل كصفر في العرض فقط؛
      // التحقق عند الحفظ يرفضه برسالة صريحة.
      const rawDiscount = Number(line.discount.trim());
      const discount =
        line.discount.trim() === "" ||
        !Number.isFinite(rawDiscount) ||
        rawDiscount < 0 ||
        rawDiscount > qty * unitPrice
          ? 0
          : rawDiscount;
      discountTotal += discount;

      const lineTotals = getInvoiceLineTotals({
        id: line.id,
        description: { ar: line.descriptionAr, en: line.descriptionAr },
        qty,
        unitPrice,
        discount,
        taxCategory: "standard",
        taxRate: STANDARD_VAT_RATE,
      });
      taxableTotal += lineTotals.taxableAmount;
      taxTotal += lineTotals.taxAmount;
    }

    const round2 = (value: number) =>
      Math.round((value + Number.EPSILON) * 100) / 100;
    return {
      discount: round2(discountTotal),
      subtotal: round2(taxableTotal),
      tax: round2(taxTotal),
      grandTotal: round2(taxableTotal + taxTotal),
    };
  }, [lines]);

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  function updateLine(id: string, field: keyof DraftLine, value: string) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: `line-${Date.now().toString(36)}`, descriptionAr: "", qty: "1", unitPrice: "", discount: "" },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((line) => line.id !== id) : prev,
    );
  }

  function saveInlineCustomer() {
    if (!canSaveInlineCustomer) return;

    const id = `customer-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` as CustomerId;
    const hasAddress = Boolean(buildingNo || street || district || city || postalCode);
    const customer: Customer = {
      id,
      kind: customerKind === "individual" ? "individual" : "company",
      displayName: { ar: customerName.trim(), en: customerName.trim() },
      legalName: isBusinessCustomer
        ? { ar: customerName.trim(), en: customerName.trim() }
        : undefined,
      phone: customerPhone.trim() ? normalizeSaudiPhone(customerPhone) : undefined,
      vatNumber: isBusinessCustomer ? vatNumber.trim() : undefined,
      commercialRegistration: isBusinessCustomer
        ? commercialRegistration.trim() || undefined
        : undefined,
      nationalAddress: isBusinessCustomer && hasAddress
        ? {
            buildingNo: buildingNo.trim() || undefined,
            street: { ar: street.trim(), en: street.trim() },
            district: { ar: district.trim(), en: district.trim() },
            city: { ar: city.trim(), en: city.trim() },
            postalCode: postalCode.trim() || undefined,
            country: { ar: "السعودية", en: "Saudi Arabia" },
          }
        : undefined,
    };

    const nextCustomers = [...allCustomers, customer];
    if (!saveStoredCustomers(nextCustomers)) {
      toast.error(tCommon("storageSaveFailed"));
      return;
    }

    let nextVehicleId: VehicleId | "" = "";
    if (vehicleName.trim() || vehicleModel.trim() || vehiclePlate.trim()) {
      nextVehicleId = `vehicle-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` as VehicleId;
      const vehicle: Vehicle = {
        id: nextVehicleId,
        customerId: id,
        make: { ar: vehicleName.trim(), en: vehicleName.trim() },
        model: { ar: vehicleModel.trim(), en: vehicleModel.trim() },
        year: new Date().getFullYear(),
        plate: vehiclePlate.trim(),
        status: "active",
      };
      const nextVehicles = [...allVehicles, vehicle];
      if (saveStoredVehicles(nextVehicles)) setAllVehicles(nextVehicles);
    }

    setAllCustomers(nextCustomers);
    setCustomerId(id);
    setVehicleId(nextVehicleId);
    setShowNewCustomer(false);
    toast.success(locale === "ar" ? "تم حفظ العميل واختياره للفاتورة" : "Customer saved and selected");
  }

  const schema = useMemo(
    () =>
      newInvoiceSchema({
        requiredCustomer: t("new.requiredCustomer"),
        requiredLine: t("new.requiredLine"),
        invalidQty: t("new.invalidQty"),
        invalidPrice: t("new.invalidPrice"),
        invalidDiscount: t("new.invalidDiscount"),
      }),
    [t],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // الحارس أولًا: لا نبني مستندًا ولا نلمس التخزين قبل التأكد من الصلاحية.
    if (!guard(isEditing ? "invoices:update" : "invoices:create")) return;

    // الفاتورة المُصدَرة مقفلة نظاميًا — لا تُعدَّل ولو وصل المستخدم للمسار
    // مباشرةً بعد إصدارها في تبويب آخر.
    if (editingInvoice && editingInvoice.status !== "draft") {
      toast.error(t("edit.lockedError"));
      return;
    }

    const parsed = schema.safeParse({
      customerId,
      vehicleId,
      paymentMethod,
      lines,
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }
    const input = parsed.data;

    // العميل اختياري: بلا عميل مسجّل تُصدر الفاتورة لعميل نقدي (walk-in).
    const customer = input.customerId
      ? allCustomers.find((item) => item.id === input.customerId)
      : undefined;

    const items: InvoiceLineItem[] = input.lines.map((line, index) => ({
      id: `item-${index + 1}`,
      description: {
        ar: line.descriptionAr,
        en: line.descriptionAr,
      },
      qty: line.qty,
      unitPrice: line.unitPrice,
      discount: line.discount,
      taxCategory: "standard",
      taxRate: STANDARD_VAT_RATE,
    }));

    // الفاتورة الضريبية (B2B) تتطلب عميلًا مسجَّلًا برقم ضريبي صالح (شركة/مؤسسة)
    // — انظر canIssueStandardInvoice. غير ذلك تُصدر مبسّطة (B2C)، وهذا يشمل
    // العميل النقدي دائمًا لأنه بلا سجل يُستقى منه رقم ضريبي.
    const kind = customer && canIssueStandardInvoice(customer) ? "standard" : "simplified";

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (editingInvoice) {
        const updated: Invoice = {
          ...editingInvoice,
          // المعرّف والرقم والتسلسل وuuid لا تُمسّ: هويّة المستند ثابتة
          // منذ إنشائه، والتعديل يغيّر محتواه لا هويّته.
          kind,
          customerId: (customer?.id ?? WALK_IN_CUSTOMER_ID) as Invoice["customerId"],
          vehicleId: (input.vehicleId as Invoice["vehicleId"]) || undefined,
          buyerSnapshot: customer
            ? buildBuyerSnapshot(customer)
            : { legalName: { ar: t("new.walkInCustomer"), en: "Walk-in customer" } },
          paymentMethod: input.paymentMethod,
          items,
          auditLog: [
            ...editingInvoice.auditLog,
            {
              id: `a-${Date.now().toString(36)}`,
              timestamp: now,
              actor: { ar: "النظام", en: "System" },
              action: { ar: "تعديل مسودة", en: "Draft edited" },
            },
          ],
        };

        const all = loadStoredInvoices(seedInvoices);
        const next = all.some((item) => item.id === updated.id)
          ? all.map((item) => (item.id === updated.id ? updated : item))
          : [...all, updated];
        if (!saveStoredInvoices(next)) {
          toast.error(tCommon("storageSaveFailed"));
          return;
        }
        toast.success(tCommon("saved"));
        router.push(`/invoices/${updated.id}`);
        router.refresh();
        return;
      }

      const invoice: Invoice = {
        id: `inv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        documentType: "invoice",
        kind,
        number: `DRAFT-${Date.now().toString(36).toUpperCase()}`,
        sequenceNumber: 0,
        uuid: crypto.randomUUID(),
        status: "draft",
        supplyDate: new Date().toISOString().slice(0, 10),
        customerId: (customer?.id ?? WALK_IN_CUSTOMER_ID) as Invoice["customerId"],
        vehicleId: (input.vehicleId as Invoice["vehicleId"]) || undefined,
        // لقطتان كاملتان (اسم قانوني + رقم ضريبي + سجل تجاري + عنوان) من
        // دالتي الخدمة الموحّدتين — لا بناء يدوي جزئي يخالف ما تعرضه الفاتورة
        // الرسمية بعد الإصدار.
        sellerSnapshot: buildSellerSnapshot(),
        buyerSnapshot: customer
          ? buildBuyerSnapshot(customer)
          : { legalName: { ar: t("new.walkInCustomer"), en: "Walk-in customer" } },
        paymentMethod: input.paymentMethod,
        paidAmount: 0,
        items,
        auditLog: [
          {
            id: `a-${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            actor: { ar: "النظام", en: "System" },
            action: { ar: "إنشاء مسودة", en: "Draft created" },
          },
        ],
      };

      const all = loadStoredInvoices(seedInvoices);
      const ok = saveStoredInvoices([...all, invoice]);
      if (!ok) {
        toast.error(tCommon("storageSaveFailed"));
        return;
      }
      toast.success(t("new.saved"));
      // «حفظ وطباعة» يفتح صفحة الفاتورة نفسها — هناك نسخة الطباعة الرسمية.
      router.push(printAfterSave ? `/invoices/${invoice.id}` : "/invoices");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <PageHeader
        title={isEditing ? t("edit.title") : t("new.title")}
        description={isEditing ? t("edit.subtitle") : t("new.subtitle")}
      />

      <SectionCard title={t("new.basicInfo")} contentClassName="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-invoice-customer-kind">{locale === "ar" ? "نوع العميل" : "Customer type"}</Label>
            <Select value={customerKind} onValueChange={(value) => setCustomerKind(value as CustomerKind)}>
              <SelectTrigger id="new-invoice-customer-kind" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{locale === "ar" ? "عميل" : "Customer"}</SelectItem>
                <SelectItem value="institution">{locale === "ar" ? "مؤسسة" : "Institution"}</SelectItem>
                <SelectItem value="company">{locale === "ar" ? "شركة" : "Company"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-invoice-payment">{t("new.paymentMethod")} *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger id="new-invoice-payment" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>{t(`paymentMethodOptions.${method}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="new-invoice-customer">{t("new.customerOptional")}</Label>
            <Select
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value as CustomerId);
                setVehicleId("");
                setShowNewCustomer(false);
              }}
            >
              <SelectTrigger id="new-invoice-customer" className="w-full"><SelectValue placeholder={t("new.walkInCustomer")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={WALK_IN_CUSTOMER_ID}>{t("new.walkInCustomer")}</SelectItem>
                {allCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.displayName[locale === "ar" ? "ar" : "en"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={() => { setShowNewCustomer((value) => !value); setCustomerId(""); setVehicleId(""); }}>
            <Plus className="size-4" />
            {locale === "ar" ? "إضافة عميل" : "Add customer"}
          </Button>
        </div>

        {selectedCustomer ? (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">{locale === "ar" ? "الاسم" : "Name"}</p><p className="mt-1 text-sm font-medium">{selectedCustomer.displayName[locale === "ar" ? "ar" : "en"]}</p></div>
            <div><p className="text-xs text-muted-foreground">{locale === "ar" ? "رقم الجوال" : "Mobile"}</p><p className="mt-1 text-sm font-medium" dir="ltr">{selectedCustomer.phone || (locale === "ar" ? "غير مسجل" : "Not provided")}</p></div>
          </div>
        ) : null}

        {showNewCustomer ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="inline-customer-name">{isBusinessCustomer ? (locale === "ar" ? "اسم المؤسسة أو الشركة *" : "Business name *") : (locale === "ar" ? "اسم العميل" : "Customer name")}</Label><Input id="inline-customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="inline-customer-phone">{locale === "ar" ? "رقم الجوال" : "Mobile"}</Label><Input id="inline-customer-phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} dir="ltr" className="text-end" placeholder="+9665xxxxxxxx" /></div>
            </div>

            {isBusinessCustomer ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="inline-vat">{locale === "ar" ? "الرقم الضريبي *" : "VAT number *"}</Label><Input id="inline-vat" value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} inputMode="numeric" dir="ltr" className="text-end" placeholder="3XXXXXXXXXXXXX3" /></div>
                  <div className="space-y-1.5"><Label htmlFor="inline-cr">{locale === "ar" ? "السجل التجاري" : "Commercial registration"}</Label><Input id="inline-cr" value={commercialRegistration} onChange={(event) => setCommercialRegistration(event.target.value)} inputMode="numeric" dir="ltr" className="text-end" /></div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">{locale === "ar" ? "العنوان الوطني (اختياري)" : "National address (optional)"}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input value={buildingNo} onChange={(event) => setBuildingNo(event.target.value)} placeholder={locale === "ar" ? "رقم المبنى" : "Building no."} />
                    <Input value={street} onChange={(event) => setStreet(event.target.value)} placeholder={locale === "ar" ? "الشارع" : "Street"} />
                    <Input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder={locale === "ar" ? "الحي" : "District"} />
                    <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder={locale === "ar" ? "المدينة" : "City"} />
                    <Input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder={locale === "ar" ? "الرمز البريدي" : "Postal code"} />
                  </div>
                </div>
              </>
            ) : null}

            <div>
              <p className="mb-3 text-sm font-medium">{locale === "ar" ? "المركبة (اختياري)" : "Vehicle (optional)"}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input value={vehicleName} onChange={(event) => setVehicleName(event.target.value)} placeholder={locale === "ar" ? "اسم المركبة" : "Vehicle name"} />
                <Input value={vehicleModel} onChange={(event) => setVehicleModel(event.target.value)} placeholder={locale === "ar" ? "الموديل" : "Model"} />
                <Input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} placeholder={locale === "ar" ? "رقم اللوحة" : "Plate number"} />
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" variant={canSaveInlineCustomer ? "destructive" : "outline"} disabled={!canSaveInlineCustomer} onClick={saveInlineCustomer}>
                {locale === "ar" ? (isBusinessCustomer ? "حفظ المنشأة" : "حفظ العميل") : "Save customer"}
              </Button>
            </div>
          </div>
        ) : null}

        {selectedCustomer ? (
          <div className="space-y-1.5">
            <Label htmlFor="new-invoice-vehicle">{t("new.vehicle")}</Label>
            <Select value={vehicleId} onValueChange={(value) => setVehicleId(value as VehicleId)} disabled={customerVehicles.length === 0}>
              <SelectTrigger id="new-invoice-vehicle" className="w-full"><SelectValue placeholder={t("new.vehicleOptional")} /></SelectTrigger>
              <SelectContent>
                {customerVehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{getVehicleDisplayName(vehicle, locale)}{vehicle.plate ? ` - ${vehicle.plate}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t("new.lineItems")}
        action={
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="size-4" />
            {t("new.addLine")}
          </Button>
        }
        contentClassName="flex flex-col gap-3 p-4"
      >
        <div className="hidden grid-cols-[1fr_4.5rem_6.5rem_6.5rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("new.lineDescription")}</span>
          <span className="text-end">{t("new.lineQty")}</span>
          <span className="text-end">{t("new.linePrice")}</span>
          <span className="text-end">{t("new.lineDiscount")}</span>
          <span />
        </div>

        {lines.map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-[1fr_4.5rem_6.5rem_6.5rem_2rem] items-center gap-2"
          >
            <Input
              value={line.descriptionAr}
              onChange={(event) => updateLine(line.id, "descriptionAr", event.target.value)}
              placeholder={locale === "ar" ? "مثال: تغيير زيت وفلاتر" : "e.g. Oil and filters change"}
            />
            <Input
              type="number"
              min={1}
              value={line.qty}
              onChange={(event) => updateLine(line.id, "qty", event.target.value)}
              className="text-end"
              dir="ltr"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={line.unitPrice}
              onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
              className="text-end"
              dir="ltr"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={line.discount}
              onChange={(event) => updateLine(line.id, "discount", event.target.value)}
              placeholder="0"
              aria-label={t("new.lineDiscount")}
              className="text-end"
              dir="ltr"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeLine(line.id)}
              aria-label={t("new.removeLine")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          {totals.discount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("new.discountTotal")}
              </span>
              <span className="text-sm tabular-nums" data-numeric>
                −{amountFormatter.format(totals.discount)} {tCommon("currency")}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("detail.subtotal")}
            </span>
            <span className="text-sm tabular-nums" data-numeric>
              {amountFormatter.format(totals.subtotal)} {tCommon("currency")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("detail.taxTotal")}
            </span>
            <span className="text-sm tabular-nums" data-numeric>
              {amountFormatter.format(totals.tax)} {tCommon("currency")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("new.total")}</span>
            <span className="text-lg font-semibold tabular-nums" data-numeric>
              {amountFormatter.format(totals.grandTotal)} {tCommon("currency")}
            </span>
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/invoices">{tCommon("cancel")}</Link>
        </Button>
        {/*
          الطباعة قبل الحفظ تطبع الشاشة لا مستندًا ضريبيًا — لذلك الزر
          يحفظ أولًا ثم يفتح صفحة الفاتورة حيث توجد نسخة الطباعة الرسمية
          برقم المستند ورمز QR.
        */}
        <Button
          type="submit"
          name="intent"
          value="print"
          variant="outline"
          disabled={saving}
          onClick={() => setPrintAfterSave(true)}
        >
          <Printer aria-hidden="true" className="size-4" />
          {t("new.saveAndPrint")}
        </Button>
        <Button type="submit" disabled={saving} onClick={() => setPrintAfterSave(false)}>
          {saving ? tCommon("loading") : t("new.save")}
        </Button>
      </div>
    </form>
  );
}
