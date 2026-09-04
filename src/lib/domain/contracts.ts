export type LocalizedText = {
  ar: string;
  en: string;
};

export type CustomerId = `customer-${string}`;
export type VehicleId = `vehicle-${string}`;

/** عنوان منظّم بصيغة العنوان الوطني السعودي — لا نص حر. */
export type Address = {
  buildingNo?: string;
  street: LocalizedText;
  secondaryNo?: string;
  district: LocalizedText;
  city: LocalizedText;
  postalCode?: string;
  country: LocalizedText;
  /** الرمز المختصر للعنوان الوطني (8 خانات) إن وُجد. */
  shortAddress?: string;
};

export type Customer = {
  id: CustomerId;
  kind: "individual" | "company";
  /** اسم العرض داخل الواجهة — قد يختصر الاسم القانوني. */
  displayName: LocalizedText;
  /** الاسم القانوني الكامل — مصدر الحقيقة الوحيد لاسم الفاتورة. غير موجود = يُستخدم displayName. */
  legalName?: LocalizedText;
  phone?: string;
  email?: string;
  /** رقم ضريبي سعودي 15 رقمًا — للعملاء المسجّلين (B2B). تحقّقه عبر lib/validation/saudi. */
  vatNumber?: string;
  commercialRegistration?: string;
  nationalAddress?: Address;
  /** عنوان الفوترة إن اختلف عن العنوان الوطني — وإلا يُستخدم nationalAddress. */
  billingAddress?: Address;
};

export const vehicleFuelTypes = ["gasoline", "diesel", "hybrid", "electric"] as const;
export type VehicleFuelType = (typeof vehicleFuelTypes)[number];

export const vehicleStatuses = ["active", "inactive", "sold"] as const;
export type VehicleStatus = (typeof vehicleStatuses)[number];

export type Vehicle = {
  id: VehicleId;
  /** المالك — مصدر الحقيقة الوحيد لملكية المركبة. */
  customerId: CustomerId;
  make: LocalizedText;
  model: LocalizedText;
  year: number;
  plate: string;
  vin?: string;
  imageUrl?: string;
  color?: LocalizedText;
  fuelType?: VehicleFuelType;
  status: VehicleStatus;
  /** آخر عداد مسجَّل في بيانات المركبة نفسها — منفصل عن عداد آخر أمر تشغيل. */
  mileage?: number;
};
