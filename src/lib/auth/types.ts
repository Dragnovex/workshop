/**
 * عقود المصادقة والصلاحيات.
 *
 * هذه الأنواع مصمّمة لتطابق شكل Auth.js (NextAuth v5) مباشرة،
 * حتى لا تتغيّر أي واجهة عند توصيل المزوّد في المرحلة الثانية.
 * لا توجد جلسة فعلية في المرحلة الأولى — انظر session.ts.
 */

export type Role =
  | "owner" // المالك — صلاحية كاملة
  | "manager" // مدير الورشة
  | "serviceAdvisor" // مستشار خدمة
  | "technician" // فني
  | "storekeeper" // أمين مخزن
  | "accountant" // محاسب
  | "receptionist"; // موظف استقبال

export type Resource =
  | "workOrders"
  | "appointments"
  | "estimates"
  | "customers"
  | "vehicles"
  | "inventory"
  | "purchasing"
  // الموردون مورد مستقل عن المشتريات عمدًا: أمين المخزن يسجّل أمر شراء
  // لكن لا يفتح حساب مورّد جديد ولا يعدّل رقمه الضريبي.
  | "suppliers"
  | "invoices"
  // المردود (إشعار دائن/مدين) مورد مستقل عن الفواتير: من يصدر فاتورة
  // ليس بالضرورة من يملك عكسها بعد إصدارها.
  | "returns"
  | "accounting"
  | "employees"
  | "marketing"
  | "reports"
  | "settings";

export type Action = "read" | "create" | "update" | "delete" | "approve";

export type Permission = `${Resource}:${Action}`;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  /** الفرع الحالي — الورشة قد تصبح متعدّدة الفروع لاحقًا */
  branchId?: string;
};

export type Session = {
  user: SessionUser;
  expires: string;
};
