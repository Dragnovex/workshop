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
  | "invoices"
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
