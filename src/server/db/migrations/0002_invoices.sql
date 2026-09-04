-- 0002_invoices.sql
-- جداول الفوترة — توجه مقترح لـ PostgreSQL/Supabase، لم يُنفَّذ على أي قاعدة بيانات فعلية.
-- الإصدار (issue) عملية أحادية الاتجاه: بعدها تصبح number/sequence_number/uuid/issued_at
-- غير قابلة للتعديل على مستوى التطبيق (تُفرض في طبقة الخدمة invoice-service، وتُوثَّق هنا
-- كنيّة تصميم لتريغر قاعدة بيانات لاحقًا يمنع UPDATE على تلك الأعمدة بعد الإصدار).

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('invoice', 'creditNote', 'debitNote')),
  kind text not null check (kind in ('standard', 'simplified')),
  number text unique,
  sequence_number bigint unique,
  status text not null check (
    status in ('draft', 'issued', 'partiallyPaid', 'paid', 'overdue', 'cancelled')
  ) default 'draft',
  issued_at timestamptz,
  supply_date date not null,
  due_at timestamptz,
  customer_id text not null references customers (id),
  vehicle_id text references vehicles (id),
  linked_work_order_id text,
  linked_estimate_id text,
  seller_snapshot jsonb not null,
  buyer_snapshot jsonb not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'bankTransfer', 'credit')),
  paid_amount numeric(12, 2) not null default 0,
  notes_ar text,
  notes_en text,
  related_invoice_id uuid references invoices (id),
  reason_for_note_ar text,
  reason_for_note_en text,
  created_at timestamptz not null default now()
);

-- الرقم التسلسلي والرقم البشري يُخصَّصان فقط عند issue، عبر sequence منفصل لكل (kind, document_type).
create sequence if not exists invoices_standard_seq;
create sequence if not exists invoices_simplified_seq;
create sequence if not exists invoices_credit_note_seq;
create sequence if not exists invoices_debit_note_seq;

create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description_ar text not null,
  description_en text not null,
  qty numeric(10, 3) not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  tax_category text not null check (tax_category in ('standard', 'zeroRated', 'exempt')),
  tax_rate numeric(4, 3) not null default 0,
  exemption_reason_ar text,
  exemption_reason_en text,
  line_order int not null default 0
);

create table if not exists invoice_audit_log (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  logged_at timestamptz not null default now(),
  actor_ar text not null,
  actor_en text not null,
  action_ar text not null,
  action_en text not null,
  note_ar text,
  note_en text,
  is_manual_adjustment boolean not null default false
);

create index if not exists invoices_customer_idx on invoices (customer_id);
create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_related_invoice_idx on invoices (related_invoice_id);
