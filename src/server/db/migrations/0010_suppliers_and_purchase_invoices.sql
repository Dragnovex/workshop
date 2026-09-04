-- 0010_suppliers_and_purchase_invoices.sql
-- الموردون كسجل مستقل + تحويل أوامر الشراء إلى فواتير شراء كاملة.
--
-- ⚠️ وثيقة تصميم لا يشغّلها أي كود (نفس بقية الملفات في هذا المجلد).
--
-- سبب الفصل: اسم المورّد كان نصًا مكرّرًا داخل كل أمر شراء، فلا رقم ضريبي
-- ولا عنوان وطني ولا شروط سداد — وكلها مطلوبة لاسترداد ضريبة المدخلات
-- ولمطابقة كشف حساب المورّد.

create table if not exists suppliers (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  -- ١٥ رقمًا حين يوجد. المورّد غير المسجّل ضريبيًا يبقى null، ولا تُحتسب
  -- ضريبة مدخلات على فواتيره.
  vat_number text check (vat_number is null or vat_number ~ '^3[0-9]{13}3$'),
  commercial_registration text,
  national_address jsonb,
  phone text,
  email text,
  payment_terms text not null check (
    payment_terms in ('cash', 'credit', 'bankTransfer')
  ),
  reference text,
  notes_ar text,
  notes_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table suppliers enable row level security;

-- الصلاحيات من مصفوفة role_permissions لا مكرّرة هنا — نفس نمط 0009.
create policy suppliers_read on suppliers
  for select using (app_can('suppliers', 'read'));

create policy suppliers_insert on suppliers
  for insert with check (app_can('suppliers', 'create'));

create policy suppliers_update on suppliers
  for update using (app_can('suppliers', 'update'));

create policy suppliers_delete on suppliers
  for delete using (app_can('suppliers', 'delete'));

-- ═══════════════════════════════════════════════════════════════════════
-- أوامر الشراء ← فواتير شراء
-- ═══════════════════════════════════════════════════════════════════════

alter table purchase_orders
  -- on delete set null لا cascade: حذف مورّد يجب ألا يمحو فاتورة شراء
  -- مسجّلة في الدفاتر. الاسم النصي في supplier_ar/en يبقى شاهدًا.
  add column if not exists supplier_id text references suppliers (id) on delete set null,
  add column if not exists invoice_number text,
  add column if not exists invoice_date date,
  add column if not exists payment_terms text check (
    payment_terms is null or payment_terms in ('cash', 'credit', 'bankTransfer')
  ),
  add column if not exists reference text,
  -- النسبة مخزّنة لا محسوبة: فاتورة مورّد غير مسجّل نسبتها صفر فعليًا.
  add column if not exists vat_rate numeric(5, 4) not null default 0.15,
  -- ختم الاستلام: وجوده يمنع إدخال نفس الفاتورة للمخزون مرتين.
  add column if not exists received_at timestamptz;

-- البحث في سجل المشتريات يتم برقم فاتورة المورّد وبالتاريخ.
create index if not exists purchase_orders_invoice_number_idx
  on purchase_orders (invoice_number);
create index if not exists purchase_orders_invoice_date_idx
  on purchase_orders (invoice_date desc);
