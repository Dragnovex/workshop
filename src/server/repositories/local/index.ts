import { transactions } from "@/modules/accounting/data";
import { appointments } from "@/modules/appointments/data";
import { employees } from "@/modules/employees/data";
import { estimates } from "@/modules/estimates/data";
import { parts } from "@/modules/inventory/data";
import { campaigns } from "@/modules/marketing/data";
import { purchaseOrders } from "@/modules/purchasing/data";
import { reports } from "@/modules/reports/data";
import { suppliers } from "@/modules/suppliers/data";
import { vehicles } from "@/modules/vehicles/data";
import { workOrders } from "@/modules/work-orders/data";

import {
  createLocalCollection,
  createWritableLocalCollection,
} from "../collection-repository";
import { customerRepository } from "./local-customer-repository";
import { dailyClosingRepository } from "./local-daily-closing-repository";
import { invoiceRepository } from "./local-invoice-repository";

/**
 * المحوّل المحلي الكامل — بيانات البذرة في الذاكرة، بلا اتصال بأي قاعدة بيانات.
 *
 * هذا هو **الملف الوحيد** الذي يعرف أن البيانات تأتي من `modules/<domain>/data.ts`.
 * محوّل Supabase في المرحلة ج سيُنشئ نظيرًا له بنفس الشكل بالضبط، والتبديل
 * يتم من `../index.ts` دون لمس أي صفحة.
 */
export const localRepositories = {
  accounting: createLocalCollection(transactions),
  appointments: createLocalCollection(appointments),
  customers: customerRepository,
  dailyClosings: dailyClosingRepository,
  employees: createLocalCollection(employees),
  estimates: createLocalCollection(estimates),
  inventory: createLocalCollection(parts),
  invoices: invoiceRepository,
  marketing: createLocalCollection(campaigns),
  purchasing: createLocalCollection(purchaseOrders),
  reports: createLocalCollection(reports),
  // أول مجموعة تكتب على الخادم فعليًا — اسم الملف = اسم الجدول في Supabase.
  suppliers: createWritableLocalCollection("suppliers", suppliers),
  vehicles: createLocalCollection(vehicles),
  workOrders: createLocalCollection(workOrders),
};
