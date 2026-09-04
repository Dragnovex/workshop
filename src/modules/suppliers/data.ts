import type { Supplier } from "./types";

/**
 * بذرة الموردين — مستخرجة من أسماء الموردين التي كانت مكتوبة نصًا داخل
 * أوامر الشراء. الاسم النصي بقي في `PurchaseOrder.supplier` للأوامر
 * القديمة، والجديد يرتبط بـ `supplierId` فيصبح للمورّد سجل واحد
 * برقم ضريبي وعنوان بدل تكرار اسمه في كل أمر.
 *
 * الأرقام الضريبية هنا بيانات بذرة تجريبية لا مستندات رسمية.
 */
export const suppliers: Supplier[] = [
  {
    id: "supplier-001",
    name: { ar: "مؤسسة قطع الرياض", en: "Riyadh Parts Est." },
    vatNumber: "310122393500003",
    commercialRegistration: "1010111222",
    phone: "+966112223301",
    email: "sales@riyadhparts.example",
    paymentTerms: "credit",
    reference: "ACC-3301",
    nationalAddress: {
      buildingNo: "3120",
      street: { ar: "طريق الملك عبدالعزيز", en: "King Abdulaziz Road" },
      district: { ar: "الصناعية الأولى", en: "First Industrial" },
      city: { ar: "الرياض", en: "Riyadh" },
      postalCode: "12345",
      country: { ar: "السعودية", en: "Saudi Arabia" },
    },
  },
  {
    id: "supplier-002",
    name: { ar: "شركة الخليج لقطع الغيار", en: "Gulf Auto Parts Co." },
    vatNumber: "310122393500011",
    commercialRegistration: "1010333444",
    phone: "+966112223302",
    paymentTerms: "bankTransfer",
    reference: "ACC-4410",
  },
  {
    id: "supplier-003",
    name: { ar: "مركز الزيوت المتخصص", en: "Specialist Oils Center" },
    vatNumber: "310122393500029",
    phone: "+966112223303",
    paymentTerms: "cash",
  },
  {
    id: "supplier-004",
    name: { ar: "مؤسسة الإطارات الوطنية", en: "National Tyres Est." },
    commercialRegistration: "1010555666",
    phone: "+966112223304",
    paymentTerms: "credit",
    reference: "ACC-5566",
  },
];
