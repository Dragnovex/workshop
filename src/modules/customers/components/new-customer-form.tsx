"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import type { Customer } from "@/lib/domain/contracts";
import { firstIssueMessage, newCustomerSchema } from "@/lib/validation/forms";
import { normalizeSaudiPhone } from "@/lib/validation/saudi";
import { loadStoredCustomers, saveStoredCustomers } from "../client-store";

/**
 * نموذج عميل جديد — يحفظ في localStorage (بلا باك-إند).
 * يُفتح من «إجراء سريع ← عميل جديد» أو من /customers/new.
 */
export function NewCustomerForm({ seedCustomers }: { seedCustomers: Customer[] }) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  type CustomerKind = "individual" | "company" | "institution";
  const [kind, setKind] = useState<CustomerKind>("individual");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // البيانات القانونية — تظهر للشركات والمؤسسات فقط.
  const [legalName, setLegalName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const isBusiness = kind !== "individual";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = schema.safeParse({
      kind,
      nameAr,
      nameEn,
      phone,
      email,
      legalName: isBusiness ? legalName : "",
      vatNumber: isBusiness ? vatNumber : "",
      commercialRegistration: isBusiness ? commercialRegistration : "",
      buildingNo: isBusiness ? buildingNo : "",
      street: isBusiness ? street : "",
      district: isBusiness ? district : "",
      city: isBusiness ? city : "",
      postalCode: isBusiness ? postalCode : "",
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }
    const input = parsed.data;

    setSaving(true);
    try {
      // العنوان الوطني يُبنى فقط إذا أُدخل منه شيء — لا كائن فارغ.
      const hasAddress = Boolean(
        input.street || input.district || input.city || input.buildingNo,
      );

      const customer: Customer = {
        id: `customer-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        // «مؤسسة» تُخزَّن كـ company في نموذج البيانات — التمييز تجاري لا قانوني،
        // وكلاهما منشأة مسجّلة برقم ضريبي.
        kind: input.kind === "individual" ? "individual" : "company",
        displayName: {
          ar: input.nameAr,
          en: input.nameEn ?? input.nameAr,
        },
        legalName: input.legalName
          ? { ar: input.legalName, en: input.legalName }
          : undefined,
        phone: input.phone ? normalizeSaudiPhone(input.phone) : undefined,
        email: input.email,
        vatNumber: input.vatNumber,
        commercialRegistration: input.commercialRegistration,
        nationalAddress: hasAddress
          ? {
              buildingNo: input.buildingNo,
              street: { ar: input.street ?? "", en: input.street ?? "" },
              district: { ar: input.district ?? "", en: input.district ?? "" },
              city: { ar: input.city ?? "", en: input.city ?? "" },
              postalCode: input.postalCode,
              country: { ar: "السعودية", en: "Saudi Arabia" },
            }
          : undefined,
      };

      const all = loadStoredCustomers(seedCustomers);
      const ok = saveStoredCustomers([...all, customer]);
      if (!ok) {
        // الحفظ فشل فعليًا (مساحة ممتلئة/تخزين محجوب) — لا ننتقل ولا ندّعي نجاحًا.
        toast.error(tCommon("storageSaveFailed"));
        return;
      }
      toast.success(t("new.saved"));
      router.push("/customers");
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
      <PageHeader title={t("new.title")} description={t("new.subtitle")} />

      <SectionCard title={t("new.basicInfo")} contentClassName="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-customer-kind">{t("new.kind")}</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as CustomerKind)}
            >
              <SelectTrigger id="new-customer-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{t("kind.individual")}</SelectItem>
                <SelectItem value="company">{t("kind.company")}</SelectItem>
                <SelectItem value="institution">{t("new.kindInstitution")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-customer-phone">{t("new.phone")}</Label>
            <Input
              id="new-customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+9665xxxxxxxx"
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-customer-name-ar">{t("new.nameAr")}</Label>
            <Input
              id="new-customer-name-ar"
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
              placeholder={locale === "ar" ? "مثال: محمد العتيبي" : "e.g. Mohammed Al-Otaibi"}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-customer-name-en">{t("new.nameEn")}</Label>
            <Input
              id="new-customer-name-en"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              placeholder="e.g. Mohammed Al-Otaibi"
              dir="ltr"
              className="text-end"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="new-customer-email">{t("new.email")}</Label>
            <Input
              id="new-customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              className="text-end"
            />
          </div>
        </div>

        {/*
          البيانات القانونية — للشركات والمؤسسات فقط.
          الرقم الضريبي وحده إلزامي؛ العنوان الوطني اختياري بالكامل.
        */}
        {isBusiness ? (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("new.legalInfo")}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-legal-name">{t("new.legalName")}</Label>
                <Input
                  id="new-customer-legal-name"
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-customer-vat">{t("new.vatNumber")}</Label>
                <Input
                  id="new-customer-vat"
                  value={vatNumber}
                  onChange={(event) => setVatNumber(event.target.value)}
                  placeholder="3XXXXXXXXXXXXX3"
                  inputMode="numeric"
                  dir="ltr"
                  className="text-end"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-customer-cr">{t("new.crNumber")}</Label>
                <Input
                  id="new-customer-cr"
                  value={commercialRegistration}
                  onChange={(event) => setCommercialRegistration(event.target.value)}
                  placeholder="1010XXXXXX"
                  inputMode="numeric"
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </div>

            <p className="text-sm font-medium">{t("new.nationalAddress")}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-building">{t("new.buildingNo")}</Label>
                <Input
                  id="new-customer-building"
                  value={buildingNo}
                  onChange={(event) => setBuildingNo(event.target.value)}
                  dir="ltr"
                  className="text-end"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-street">{t("new.street")}</Label>
                <Input
                  id="new-customer-street"
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-district">{t("new.district")}</Label>
                <Input
                  id="new-customer-district"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-city">{t("new.city")}</Label>
                <Input
                  id="new-customer-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-postal">{t("new.postalCode")}</Label>
                <Input
                  id="new-customer-postal"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" asChild>
            <Link href="/customers">{tCommon("cancel")}</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? tCommon("loading") : t("new.save")}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
