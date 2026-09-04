-- 0000_base_customers_vehicles.sql
-- الأساس: العملاء والمركبات. هذا الملف كان **ناقصًا** — الترحيل 0001 يعدّل
-- جدول customers ويفترض وجوده مسبقًا، ولم يكن أي ملف ينشئه.
--
-- المعرّفات نصية (text) لا uuid عمدًا: التطبيق يستخدم أنماطًا مثل
-- `customer-001` / `vehicle-001`، وأنواع TypeScript موسومة بها
-- (`CustomerId = \`customer-${string}\``). الإبقاء على text يحفظ التوافق
-- ويسمح باستيراد بيانات البذرة كما هي بلا إعادة ترقيم.

create table if not exists customers (
  id text primary key,
  kind text not null check (kind in ('individual', 'company')),
  display_name_ar text not null,
  display_name_en text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id text primary key,
  customer_id text not null references customers (id) on delete restrict,
  make_ar text not null,
  make_en text not null,
  model_ar text not null,
  model_en text not null,
  year int not null check (year between 1900 and 2200),
  plate text not null,
  vin text,
  image_url text,
  color_ar text,
  color_en text,
  fuel_type text check (fuel_type in ('gasoline', 'diesel', 'hybrid', 'electric')),
  status text not null check (status in ('active', 'inactive', 'sold')) default 'active',
  mileage int check (mileage is null or mileage >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_customer_idx on vehicles (customer_id);
create index if not exists vehicles_plate_idx on vehicles (plate);

-- ═══════════════════════════════════════════════════════════════════════
-- أمان: RLS مفعّل بلا أي سياسة = **رفض كل شيء** لمفتاح anon العلني.
-- هذا هو الوضع الآمن الافتراضي. سياسات القراءة/الكتابة حسب الدور تُضاف
-- في ترحيل المصادقة (المرحلة د) بعد إنشاء جدول profiles.
-- بدون هذين السطرين يستطيع أي شخص يملك anon key قراءة قاعدة البيانات كاملة.
-- ═══════════════════════════════════════════════════════════════════════
alter table customers enable row level security;
alter table vehicles enable row level security;
