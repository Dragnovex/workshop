import type { Employee } from "./types";

export const employees: Employee[] = [
  { id: "emp-001", name: { ar: "سعيد ناصر", en: "Saeed Nasser" }, role: { ar: "فني فرامل", en: "Brake technician" }, department: "technicians", phone: "+966501112233", email: "saeed.nasser@3mr.sa", hireDate: "2022-03-01", status: "active" },
  { id: "emp-002", name: { ar: "ماجد العتيبي", en: "Majed Al-Otaibi" }, role: { ar: "فني محركات", en: "Engine technician" }, department: "technicians", phone: "+966501112234", email: "majed.otaibi@3mr.sa", hireDate: "2021-06-15", status: "active" },
  { id: "emp-003", name: { ar: "أحمد السالم", en: "Ahmed Al-Salem" }, role: { ar: "مستشار خدمة", en: "Service advisor" }, department: "serviceAdvisors", phone: "+966501112235", email: "ahmed.salem@3mr.sa", hireDate: "2020-01-10", status: "active" },
  { id: "emp-004", name: { ar: "محمد الجهني", en: "Mohammed Al-Juhani" }, role: { ar: "مستشار خدمة", en: "Service advisor" }, department: "serviceAdvisors", phone: "+966501112236", email: "mohammed.juhani@3mr.sa", hireDate: "2023-02-20", status: "onLeave" },
  { id: "emp-005", name: { ar: "فيصل القرني", en: "Faisal Al-Qarni" }, role: { ar: "فني كهرباء", en: "Electrical technician" }, department: "technicians", phone: "+966501112237", email: "faisal.qarni@3mr.sa", hireDate: "2022-09-05", status: "active" },
  { id: "emp-006", name: { ar: "عبدالله الشمري", en: "Abdullah Al-Shammari" }, role: { ar: "مندوب مبيعات قطع", en: "Parts sales rep" }, department: "sales", phone: "+966501112238", email: "abdullah.shammari@3mr.sa", hireDate: "2021-11-01", status: "active" },
  { id: "emp-007", name: { ar: "نورة الدوسري", en: "Noura Al-Dosari" }, role: { ar: "محاسبة", en: "Accountant" }, department: "admin", phone: "+966501112239", email: "noura.dosari@3mr.sa", hireDate: "2020-07-12", status: "active" },
  { id: "emp-008", name: { ar: "خالد الزهراني", en: "Khalid Al-Zahrani" }, role: { ar: "مدير الورشة", en: "Workshop manager" }, department: "management", phone: "+966501112240", email: "khalid.zahrani@3mr.sa", hireDate: "2018-04-01", status: "active" },
  { id: "emp-009", name: { ar: "بندر العنزي", en: "Bandar Al-Anazi" }, role: { ar: "فني إطارات", en: "Tire technician" }, department: "technicians", phone: "+966501112241", email: "bandar.anazi@3mr.sa", hireDate: "2023-08-15", status: "active" },
  { id: "emp-010", name: { ar: "سلطان الحربي", en: "Sultan Al-Harbi" }, role: { ar: "أمين مخزون", en: "Inventory clerk" }, department: "admin", phone: "+966501112242", email: "sultan.harbi@3mr.sa", hireDate: "2022-01-20", status: "inactive" },
];
