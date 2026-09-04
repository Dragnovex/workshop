-- 0001_customers_billing_fields.sql
-- توسيع جدول العملاء بحقول الفوترة القانونية.
-- توجه مقترح لـ PostgreSQL/Supabase — لم يُنفَّذ على أي قاعدة بيانات فعلية.
-- الحقول الحالية (id, kind, display_name_ar/en) يُفترض وجودها من مرحلة سابقة.

alter table customers
  add column if not exists legal_name_ar text,
  add column if not exists legal_name_en text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists vat_number char(15),
  add column if not exists commercial_registration char(10),
  add column if not exists national_address jsonb,
  add column if not exists billing_address jsonb;

alter table customers
  add constraint customers_vat_number_format
    check (vat_number is null or vat_number ~ '^3[0-9]{13}3$');

alter table customers
  add constraint customers_cr_format
    check (commercial_registration is null or commercial_registration ~ '^[0-9]{10}$');

create index if not exists customers_vat_number_idx on customers (vat_number) where vat_number is not null;
