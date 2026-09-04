"use server";

import { revalidatePath } from "next/cache";

import {
  serverSupplierMessages,
  supplierSchema,
  type SupplierInput,
} from "@/lib/validation/supplier";
import { repositories } from "@/server/repositories";
import {
  actionFailed,
  withPermission,
  type ActionResult,
} from "@/server/actions/guard";

import type { Supplier } from "./types";

/**
 * إجراءات الموردين — أول وحدة تكتب على الخادم بدل `localStorage`.
 *
 * ثلاث ضمانات لم تكن ممكنة على العميل:
 *   1. الصلاحية تُفرض في مكان لا يملك المتصفح تجاوزه.
 *   2. التحقق من الإدخال يُعاد على الخادم بنفس المخطّط — العميل ليس مرجعًا.
 *   3. البيانات تصير مشتركة بين كل الأجهزة لا حبيسة متصفح واحد.
 */

/** معرّف يُولَّد على الخادم: العميل لا يختار مفاتيح السجلات. */
function newSupplierId(): string {
  return `supplier-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function toSupplier(input: SupplierInput, id: string): Supplier {
  const hasAddress = Boolean(
    input.street || input.district || input.city || input.buildingNo,
  );

  return {
    id,
    name: { ar: input.nameAr, en: input.nameEn ?? input.nameAr },
    vatNumber: input.vatNumber,
    commercialRegistration: input.commercialRegistration,
    phone: input.phone,
    email: input.email,
    paymentTerms: input.paymentTerms,
    reference: input.reference,
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
    notes: input.notes ? { ar: input.notes, en: input.notes } : undefined,
  };
}

export async function createSupplierAction(
  raw: unknown,
): Promise<ActionResult<Supplier>> {
  const parsed = supplierSchema(serverSupplierMessages).safeParse(raw);
  if (!parsed.success) return actionFailed("INVALID_INPUT");

  return withPermission("suppliers:create", async () => {
    const supplier = await repositories.suppliers.create(
      toSupplier(parsed.data, newSupplierId()),
    );
    // الصفحة تُعاد قراءتها من الخادم بعد الكتابة، فلا تبقى الشاشة تعرض
    // نسخة قديمة إلى أن يحدّث المستخدم بنفسه.
    revalidatePath("/[locale]/suppliers", "page");
    return supplier;
  });
}

export async function updateSupplierAction(
  id: string,
  raw: unknown,
): Promise<ActionResult<Supplier>> {
  const parsed = supplierSchema(serverSupplierMessages).safeParse(raw);
  if (!parsed.success) return actionFailed("INVALID_INPUT");

  return withPermission("suppliers:update", async () => {
    // المعرّف يأتي من المسار لا من الحمولة، والمستودع يتجاهل أي محاولة
    // لتغييره — تغيير المعرّف إنشاءُ سجل لا تحديث.
    const supplier = await repositories.suppliers.update(
      id,
      toSupplier(parsed.data, id),
    );
    revalidatePath("/[locale]/suppliers", "page");
    return supplier;
  });
}

export async function deleteSupplierAction(
  id: string,
): Promise<ActionResult<null>> {
  return withPermission("suppliers:delete", async () => {
    await repositories.suppliers.remove(id);
    revalidatePath("/[locale]/suppliers", "page");
    return null;
  });
}
