-- 0003_daily_closing.sql
-- جداول تقفيل اليومية — توجه مقترح لـ PostgreSQL/Supabase، لم يُنفَّذ على أي قاعدة بيانات فعلية.

create table if not exists daily_closings (
  id uuid primary key default gen_random_uuid(),
  entry_number text not null unique,
  closing_date date not null unique,
  branch_ar text not null,
  branch_en text not null,
  cash_account_ar text not null,
  cash_account_en text not null,
  opening_balance numeric(12, 2) not null,
  notes text,
  status text not null check (status in ('draft', 'closed')) default 'draft',
  closed_by_ar text,
  closed_by_en text,
  closed_at timestamptz,
  reviewed_by_accountant_ar text,
  reviewed_by_accountant_en text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- نوع القيد: sale / receipt / expense / purchase — عمود entry_type بدل أربعة جداول منفصلة
-- لتبسيط الاستعلام مع الحفاظ على نفس البنية المنطقية في التطبيق (receipts/expenses/purchases/sales).
create table if not exists daily_closing_entries (
  id uuid primary key default gen_random_uuid(),
  daily_closing_id uuid not null references daily_closings (id) on delete cascade,
  entry_type text not null check (entry_type in ('sale', 'receipt', 'expense', 'purchase')),
  reference_number text not null,
  description_ar text not null,
  description_en text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('cash', 'card', 'bankTransfer', 'credit')),
  responsible_ar text not null,
  responsible_en text not null,
  -- مصدر القيد لتفادي الإدخال المكرر: مرتبط بفاتورة أو أمر شراء، أو تسوية يدوية صريحة.
  source text not null check (source in ('invoice', 'purchaseOrder', 'manual')),
  linked_invoice_id uuid references invoices (id),
  linked_purchase_order_id text,
  is_manual_adjustment boolean not null default false,
  entry_time timestamptz not null,
  constraint daily_closing_entries_source_link check (
    (source = 'invoice' and linked_invoice_id is not null)
    or (source = 'purchaseOrder' and linked_purchase_order_id is not null)
    or (source = 'manual')
  )
);

create table if not exists daily_closing_audit_log (
  id uuid primary key default gen_random_uuid(),
  daily_closing_id uuid not null references daily_closings (id) on delete cascade,
  logged_at timestamptz not null default now(),
  actor_ar text not null,
  actor_en text not null,
  action_ar text not null,
  action_en text not null,
  note_ar text,
  note_en text,
  is_manual_adjustment boolean not null default false
);

create index if not exists daily_closing_entries_closing_idx on daily_closing_entries (daily_closing_id);
create index if not exists daily_closing_entries_type_idx on daily_closing_entries (entry_type);
