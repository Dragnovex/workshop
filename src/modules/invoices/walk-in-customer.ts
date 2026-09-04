import type { Customer, CustomerId } from "@/lib/domain/contracts";

/**
 * العميل النقدي غير المسجّل — يُستخدم حين تُصدر فاتورة بلا عميل مسجّل
 * (بيع مباشر). الفاتورة المبسّطة B2C لا توجب بيانات المشتري نظاميًا.
 *
 * هذا معرّف وسجل ثابتان، لا سجل حقيقي في بيانات العملاء ولا في التخزين
 * المحلي: أي محاولة لإضافته إلى قائمة العملاء ستكون خطأ. الغرض الوحيد هو
 * إعطاء صفحات القائمة والتفاصيل كائن `Customer` صالح للعرض بدل الانهيار
 * أو إسقاط الفاتورة بصمت عند عدم وجود عميل مطابق للمعرّف.
 */
export const WALK_IN_CUSTOMER_ID: CustomerId = "customer-walk-in";

export const walkInCustomer: Customer = {
  id: WALK_IN_CUSTOMER_ID,
  kind: "individual",
  displayName: { ar: "عميل نقدي (بدون تسجيل)", en: "Walk-in customer (unregistered)" },
};

export function isWalkInCustomerId(id: string): boolean {
  return id === WALK_IN_CUSTOMER_ID;
}
