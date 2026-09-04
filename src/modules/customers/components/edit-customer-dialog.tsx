"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import type { Customer } from "@/lib/domain/contracts";
import { firstIssueMessage, newCustomerSchema } from "@/lib/validation/forms";
import { normalizeSaudiPhone } from "@/lib/validation/saudi";

/**
 * تعديل عميل — نفس مخطّط التحقق المستخدم في الإنشاء
 * (`newCustomerSchema`) لا نسخة ثانية منه: قاعدة «الرقم الضريبي إلزامي
 * للشركات والمؤسسات» يجب أن تسري على التعديل تمامًا كما تسري على الإنشاء،
 * وإلا صار التعديل بابًا خلفيًا لإنشاء سجل مخالف.
 */
export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onSave,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** يعيد `true` عند نجاح الحفظ فعليًا — الحوار لا يُغلق قبل ذلك. */
  onSave: (next: Customer) => boolean;
}) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");

  const [kind, setKind] = useState<"individual" | "company">("individual");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [legalName, setLegalName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");

  // إعادة تعبئة الحقول عند تبديل السجل المعروض. بلا هذا يفتح الحوار
  // على بيانات العميل السابق — خطأ تعديل صامت على السجل الخطأ.
  //
  // التعبئة أثناء الرسم لا داخل Effect: الأخير يرسم إطارًا كاملًا ببيانات
  // العميل السابق قبل أن يصحّحها — وميض مرئي على سجل حسّاس.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (customer && customer.id !== loadedId) {
    setLoadedId(customer.id);
    setKind(customer.kind);
    setNameAr(customer.displayName.ar);
    setNameEn(customer.displayName.en);
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setLegalName(customer.legalName?.ar ?? "");
    setVatNumber(customer.vatNumber ?? "");
    setCommercialRegistration(customer.commercialRegistration ?? "");
  }

  const schema = useMemo(
    () =>
      newCustomerSchema({
        nameRequired: t("new.nameRequired"),
        phoneInvalid: t("new.phoneInvalid"),
        emailInvalid: t("new.emailInvalid"),
        vatRequired: t("new.vatRequired"),
        vatInvalid: t("new.vatInvalid"),
        crInvalid: t("new.crInvalid"),
      }),
    [t],
  );

  const isBusiness = kind !== "individual";

  function handleSubmit() {
    if (!customer) return;
    const parsed = schema.safeParse({
      kind,
      nameAr,
      nameEn,
      phone,
      email,
      legalName: isBusiness ? legalName : "",
      vatNumber: isBusiness ? vatNumber : "",
      commercialRegistration: isBusiness ? commercialRegistration : "",
      buildingNo: "",
      street: "",
      district: "",
      city: "",
      postalCode: "",
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }
    const input = parsed.data;

    const next: Customer = {
      ...customer,
      kind: input.kind === "individual" ? "individual" : "company",
      displayName: { ar: input.nameAr, en: input.nameEn ?? input.nameAr },
      legalName: input.legalName
        ? { ar: input.legalName, en: input.legalName }
        : undefined,
      phone: input.phone ? normalizeSaudiPhone(input.phone) : undefined,
      email: input.email,
      vatNumber: input.vatNumber,
      commercialRegistration: input.commercialRegistration,
      // العنوان الوطني لا يُلمس هنا: الحوار لا يعرضه، وتمرير قيم فارغة
      // كان سيمحوه بصمت.
    };

    if (!onSave(next)) return;
    toast.success(tCommon("saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:opacity-100! max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-customer-kind">{t("new.kind")}</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
              <SelectTrigger id="edit-customer-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{t("kind.individual")}</SelectItem>
                <SelectItem value="company">{t("kind.company")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-customer-phone">{t("new.phone")}</Label>
            <Input
              id="edit-customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+9665xxxxxxxx"
              dir="ltr"
              className="text-end"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-customer-name-ar">{t("new.nameAr")}</Label>
            <Input
              id="edit-customer-name-ar"
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-customer-name-en">{t("new.nameEn")}</Label>
            <Input
              id="edit-customer-name-en"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="edit-customer-email">{t("new.email")}</Label>
            <Input
              id="edit-customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          {isBusiness ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-customer-legal-name">{t("new.legalName")}</Label>
                <Input
                  id="edit-customer-legal-name"
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-customer-vat">{t("new.vatNumber")}</Label>
                <Input
                  id="edit-customer-vat"
                  value={vatNumber}
                  onChange={(event) => setVatNumber(event.target.value)}
                  placeholder="3XXXXXXXXXXXXX3"
                  inputMode="numeric"
                  dir="ltr"
                  className="text-end"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="edit-customer-cr">{t("new.crNumber")}</Label>
                <Input
                  id="edit-customer-cr"
                  value={commercialRegistration}
                  onChange={(event) => setCommercialRegistration(event.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </>
          ) : null}
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
