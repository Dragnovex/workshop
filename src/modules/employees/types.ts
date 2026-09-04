import type { LocalizedText } from "@/lib/domain/contracts";

export const employeeDepartments = [
  "technicians",
  "serviceAdvisors",
  "sales",
  "admin",
  "management",
] as const;

export type EmployeeDepartment = (typeof employeeDepartments)[number];

export const employeeStatuses = ["active", "onLeave", "inactive"] as const;

export type EmployeeStatus = (typeof employeeStatuses)[number];

export type Employee = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  department: EmployeeDepartment;
  phone: string;
  email: string;
  /** تاريخ التعاقد. */
  hireDate: string;
  status: EmployeeStatus;

  // ── بيانات نظامية للعمالة (اختيارية على سجلات ما قبل هذه المرحلة) ──
  /** الجنسية — تظهر في كشوف العمالة والتأمينات. */
  nationality?: LocalizedText;
  /**
   * رقم الإقامة (أو الهوية الوطنية للسعودي) — ١٠ أرقام.
   * يبدأ بـ 1 للمواطن و 2 للمقيم؛ لا نفرض ذلك هنا لأن السجلات القديمة
   * قد تحمل صيغًا أخرى، لكن الطول يُتحقَّق منه في النموذج.
   */
  residencyNumber?: string;
  /**
   * تاريخ المباشرة الفعلي — يختلف عن `hireDate`: العقد قد يوقَّع قبل
   * وصول الموظف بأسابيع، والمباشرة هي ما يُحتسب عليه الراتب والإجازة.
   */
  startDate?: string;
  /** ساعات العمل الأسبوعية المتعاقد عليها. */
  weeklyHours?: number;
};
