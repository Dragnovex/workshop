import {
  CalendarPlus,
  CarFront,
  FilePlus2,
  Receipt,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * الإجراءات السريعة — تظهر في زر «إجراء سريع» بالشريط العلوي
 * وفي لوحة الأوامر تحت مجموعة الإجراءات.
 * `key` = مفتاح الترجمة تحت quickActions.*
 */
export type QuickAction = {
  key: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  available: boolean;
};

export const quickActions: QuickAction[] = [
  { key: "newWorkOrder", href: "/work-orders?new=1", icon: FilePlus2, shortcut: "W", available: true },
  { key: "receiveVehicle", href: "/work-orders?new=1", icon: CarFront, shortcut: "R", available: true },
  { key: "newCustomer", href: "/customers/new", icon: UserPlus, shortcut: "C", available: true },
  { key: "newAppointment", href: "/appointments/new", icon: CalendarPlus, shortcut: "A", available: true },
  { key: "newInvoice", href: "/invoices/new", icon: Receipt, shortcut: "I", available: true },
];
