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
  hireDate: string;
  status: EmployeeStatus;
};
