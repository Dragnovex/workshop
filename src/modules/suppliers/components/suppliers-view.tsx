"use client";

import { Building2, CreditCard, Plus, Search, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/patterns/confirm-delete-dialog";
import {
  EntityFormDialog,
  type FormFieldDef,
  type FormValues,
} from "@/components/patterns/entity-form-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { RowActions } from "@/components/patterns/row-actions";
import {
  SortableTableHead,
  nextSortState,
  type SortDirection,
} from "@/components/patterns/sortable-table-head";
import { StatCard } from "@/components/patterns/stat-card";
import { TablePagination } from "@/components/patterns/table-pagination";
import { WhatsAppLink } from "@/components/patterns/whatsapp-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActionResult } from "@/lib/actions/use-action-result";
import { useCan } from "@/lib/auth/permission-context";
import { formatNumber } from "@/lib/format";
import { isValidSaudiVatNumber } from "@/lib/validation/saudi";

import {
  createSupplierAction,
  deleteSupplierAction,
  updateSupplierAction,
} from "../actions";
import {
  supplierPaymentTerms,
  type Supplier,
  type SupplierPaymentTerms,
} from "../types";

type TermsFilter = "all" | SupplierPaymentTerms;
type SortKey = "name" | "terms";

const PAGE_SIZE = 10;

/**
 * الموردون — **أول وحدة تكتب على الخادم** لا في localStorage.
 *
 * لا حالة محلية للسجلات هنا: القائمة تأتي من الخادم في كل رسم، وبعد كل
 * كتابة ناجحة يُعاد تحميلها (`router.refresh()` داخل `useActionResult`).
 * الاحتفاظ بنسخة محلية موازية كان سيعني شاشتين تختلفان عن بعضهما.
 */
export function SuppliersView({ suppliers: rows }: { suppliers: Supplier[] }) {
  const t = useTranslations("suppliers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();

  const handleResult = useActionResult();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const [search, setSearch] = useState("");
  const [termsFilter, setTermsFilter] = useState<TermsFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const formFields = useMemo<FormFieldDef[]>(
    () => [
      { name: "nameAr", label: t("form.nameAr"), kind: "text", required: true },
      { name: "nameEn", label: t("form.nameEn"), kind: "text", ltr: true },
      {
        name: "vatNumber",
        label: t("columns.vatNumber"),
        kind: "text",
        ltr: true,
        placeholder: "3XXXXXXXXXXXXX3",
        hint: t("form.vatHint"),
      },
      { name: "commercialRegistration", label: t("form.cr"), kind: "text", ltr: true },
      { name: "phone", label: t("columns.phone"), kind: "text", ltr: true, placeholder: "+9665xxxxxxxx" },
      { name: "email", label: t("form.email"), kind: "text", ltr: true },
      {
        name: "paymentTerms",
        label: t("columns.paymentTerms"),
        kind: "select",
        required: true,
        options: supplierPaymentTerms.map((term) => ({
          value: term,
          label: t(`paymentTerms.${term}`),
        })),
      },
      { name: "reference", label: t("columns.reference"), kind: "text", ltr: true },
      { name: "buildingNo", label: t("form.buildingNo"), kind: "text", ltr: true },
      { name: "street", label: t("form.street"), kind: "text" },
      { name: "district", label: t("form.district"), kind: "text" },
      { name: "city", label: t("form.city"), kind: "text" },
      { name: "postalCode", label: t("form.postalCode"), kind: "text", ltr: true },
      { name: "notes", label: t("form.notes"), kind: "textarea", wide: true },
    ],
    [t],
  );

  /**
   * الرقم الضريبي اختياري (بعض الموردين الصغار غير مسجّلين)، لكنه إن
   * أُدخل فلا بد أن يكون صالحًا: رقم مشوّه في فاتورة شراء يعني ضريبة
   * مدخلات غير قابلة للاسترداد.
   */
  function validate(values: FormValues): string | null {
    const vat = values.vatNumber.trim();
    if (vat && !isValidSaudiVatNumber(vat)) return t("form.vatInvalid");
    return null;
  }

  /*
   * لا تحويل من الحقول إلى كائن `Supplier` هنا بعد اليوم: القيم تُرسل كما
   * هي إلى الـ Server Action، وهو من يتحقق منها ويبني السجل ويولّد المعرّف.
   * بناء الكيان على العميل كان يعني أن المتصفح يقرّر شكل ما يُحفظ.
   */

  function valuesOf(supplier: Supplier | null): FormValues {
    return {
      nameAr: supplier?.name.ar ?? "",
      nameEn: supplier?.name.en ?? "",
      vatNumber: supplier?.vatNumber ?? "",
      commercialRegistration: supplier?.commercialRegistration ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      paymentTerms: supplier?.paymentTerms ?? "cash",
      reference: supplier?.reference ?? "",
      buildingNo: supplier?.nationalAddress?.buildingNo ?? "",
      street: supplier?.nationalAddress?.street.ar ?? "",
      district: supplier?.nationalAddress?.district.ar ?? "",
      city: supplier?.nationalAddress?.city.ar ?? "",
      postalCode: supplier?.nationalAddress?.postalCode ?? "",
      notes: supplier?.notes?.ar ?? "",
    };
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((supplier) => {
      if (termsFilter !== "all" && supplier.paymentTerms !== termsFilter) return false;
      if (!query) return true;
      return (
        supplier.name.ar.toLowerCase().includes(query) ||
        supplier.name.en.toLowerCase().includes(query) ||
        (supplier.vatNumber?.includes(query) ?? false) ||
        (supplier.reference?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [rows, search, termsFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return factor * a.name[lang].localeCompare(b.name[lang]);
        case "terms":
          return factor * a.paymentTerms.localeCompare(b.paymentTerms);
        default:
          return 0;
      }
    });
  }, [filtered, lang, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    const next = nextSortState(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {can("suppliers:create") ? (
          <Button className="shrink-0 gap-2" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("newSupplier")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.total")} value={formatNumber(rows.length, locale)} icon={Truck} tone="accent" />
        <StatCard
          label={t("stats.withVat")}
          value={formatNumber(rows.filter((supplier) => supplier.vatNumber).length, locale)}
          icon={Building2}
        />
        <StatCard
          label={t("stats.credit")}
          value={formatNumber(
            rows.filter((supplier) => supplier.paymentTerms === "credit").length,
            locale,
          )}
          icon={CreditCard}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="supplier-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="supplier-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select
          value={termsFilter}
          onValueChange={(value) => {
            setTermsFilter(value as TermsFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("termsFilterLabel")} className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {supplierPaymentTerms.map((term) => (
              <SelectItem key={term} value={term}>
                {t(`paymentTerms.${term}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead label={t("columns.name")} sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="ps-4" />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.vatNumber")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.phone")}</TableHead>
                <SortableTableHead label={t("columns.paymentTerms")} sortKey="terms" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                <TableHead className="text-xs whitespace-nowrap">{t("columns.reference")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="ps-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{supplier.name[lang]}</span>
                        <WhatsAppLink phone={supplier.phone} label={tCommon("sendWhatsapp")} />
                      </div>
                    </TableCell>
                    <TableCell data-ltr data-numeric className="text-xs text-muted-foreground">
                      {supplier.vatNumber ?? "—"}
                    </TableCell>
                    <TableCell data-ltr className="text-xs text-muted-foreground">
                      {supplier.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`paymentTerms.${supplier.paymentTerms}`)}</Badge>
                    </TableCell>
                    <TableCell data-ltr className="text-xs text-muted-foreground">
                      {supplier.reference ?? "—"}
                    </TableCell>
                    <TableCell className="pe-4">
                      <RowActions
                        resource="suppliers"
                        label={supplier.name[lang]}
                        onEdit={() => setEditing(supplier)}
                        onDelete={() => setDeleting(supplier)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={currentPage} pageCount={pageCount} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityFormDialog
        idPrefix="new-supplier"
        open={creating}
        onOpenChange={setCreating}
        title={t("newSupplier")}
        description={t("form.description")}
        fields={formFields}
        initialValues={valuesOf(null)}
        validate={validate}
        onSubmit={async (values) =>
          handleResult(await createSupplierAction(values), tCommon("createdSuccess"))
        }
      />

      <EntityFormDialog
        idPrefix="edit-supplier"
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("editSupplier")}
        description={t("form.description")}
        fields={formFields}
        initialValues={valuesOf(editing)}
        validate={validate}
        onSubmit={async (values) => {
          if (!editing) return false;
          return handleResult(
            await updateSupplierAction(editing.id, values),
            tCommon("saved"),
          );
        }}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        name={deleting ? deleting.name[lang] : ""}
        description={deleting ? t("deleteWarning", { name: deleting.name[lang] }) : undefined}
        onConfirm={async () => {
          if (!deleting) return;
          handleResult(await deleteSupplierAction(deleting.id), tCommon("deleted"));
        }}
      />
    </div>
  );
}
