import type { Action, Permission, Resource, Role, SessionUser } from "./types";

/**
 * مصفوفة الصلاحيات حسب الدور (RBAC).
 * تُعرَّف هنا مرة واحدة، وتُفرَض لاحقًا في ثلاث طبقات:
 *   1) الواجهة  — إخفاء ما لا يُسمح به (هذه المرحلة).
 *   2) proxy.ts — حماية المسارات (المرحلة الثانية).
 *   3) الخادم   — الفرض الحقيقي في Server Actions و Route Handlers (المرحلة الثانية).
 *
 * الطبقة الأولى وحدها ليست أمانًا. هي راحة استخدام فقط.
 */

const ALL: Action[] = ["read", "create", "update", "delete", "approve"];
const READ_ONLY: Action[] = ["read"];
const READ_WRITE: Action[] = ["read", "create", "update"];

function grant(
  entries: Partial<Record<Resource, Action[]>>,
): ReadonlySet<Permission> {
  const set = new Set<Permission>();
  for (const [resource, actions] of Object.entries(entries)) {
    for (const action of actions ?? []) {
      set.add(`${resource as Resource}:${action}`);
    }
  }
  return set;
}

const EVERY_RESOURCE: Resource[] = [
  "workOrders",
  "appointments",
  "estimates",
  "customers",
  "vehicles",
  "inventory",
  "purchasing",
  "invoices",
  "accounting",
  "employees",
  "marketing",
  "reports",
  "settings",
];

export const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  owner: grant(
    Object.fromEntries(EVERY_RESOURCE.map((r) => [r, ALL])) as Partial<
      Record<Resource, Action[]>
    >,
  ),
  manager: grant({
    workOrders: ALL,
    appointments: ALL,
    estimates: ALL,
    customers: ALL,
    vehicles: ALL,
    inventory: READ_WRITE,
    purchasing: ALL,
    invoices: READ_WRITE,
    accounting: READ_ONLY,
    employees: READ_WRITE,
    marketing: READ_WRITE,
    reports: READ_ONLY,
    settings: READ_ONLY,
  }),
  serviceAdvisor: grant({
    workOrders: READ_WRITE,
    appointments: READ_WRITE,
    estimates: READ_WRITE,
    customers: READ_WRITE,
    vehicles: READ_WRITE,
    inventory: READ_ONLY,
    invoices: READ_ONLY,
    reports: READ_ONLY,
  }),
  technician: grant({
    workOrders: ["read", "update"],
    vehicles: READ_ONLY,
    inventory: READ_ONLY,
  }),
  storekeeper: grant({
    inventory: ALL,
    purchasing: READ_WRITE,
    workOrders: READ_ONLY,
    reports: READ_ONLY,
  }),
  accountant: grant({
    invoices: ALL,
    accounting: ALL,
    purchasing: READ_ONLY,
    customers: READ_ONLY,
    reports: READ_ONLY,
  }),
  receptionist: grant({
    appointments: READ_WRITE,
    customers: READ_WRITE,
    vehicles: READ_WRITE,
    workOrders: READ_ONLY,
  }),
};

export function can(
  user: SessionUser | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  return rolePermissions[user.role]?.has(permission) ?? false;
}
