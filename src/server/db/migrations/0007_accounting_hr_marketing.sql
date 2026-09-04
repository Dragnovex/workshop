-- 0007_accounting_hr_marketing.sql
-- القيود المحاسبية، الموظفون، الحملات التسويقية، التقارير.

create table if not exists accounting_transactions (
  id text primary key,
  reference text not null,
  account_ar text not null,
  account_en text not null,
  type text not null check (type in ('debit', 'credit')),
  category text not null check (
    category in (
      'serviceRevenue', 'partsRevenue', 'partsCost',
      'payroll', 'rent', 'utilities', 'other'
    )
  ),
  -- المبلغ موجب دائمًا؛ الاتجاه يحدّده عمود type. خلط الإشارة مع النوع
  -- مصدر شائع لأخطاء الجمع في التقارير.
  amount numeric(12, 2) not null check (amount >= 0),
  transaction_date date not null,
  linked_invoice_id uuid references invoices (id) on delete set null,
  linked_purchase_order_id text references purchase_orders (id) on delete set null,
  notes_ar text,
  notes_en text,
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  role_ar text not null,
  role_en text not null,
  department text not null check (
    department in ('technicians', 'serviceAdvisors', 'sales', 'admin', 'management')
  ),
  phone text not null,
  email text not null,
  hire_date date not null,
  status text not null check (status in ('active', 'onLeave', 'inactive')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaigns (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  channel text not null check (channel in ('sms', 'email', 'social', 'print')),
  status text not null check (
    status in ('draft', 'scheduled', 'active', 'completed', 'paused')
  ) default 'draft',
  target_segment_ar text not null,
  target_segment_en text not null,
  start_date date not null,
  end_date date not null,
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  reach int not null default 0 check (reach >= 0),
  notes_ar text,
  notes_en text,
  created_at timestamptz not null default now(),
  constraint campaigns_date_order check (end_date >= start_date)
);

create table if not exists reports (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  category text not null check (
    category in ('operations', 'finance', 'inventory', 'customers')
  ),
  description_ar text not null,
  description_en text not null,
  frequency text not null check (
    frequency in ('daily', 'weekly', 'monthly', 'onDemand')
  ),
  last_generated_at timestamptz
);

create index if not exists accounting_date_idx on accounting_transactions (transaction_date);
create index if not exists accounting_category_idx on accounting_transactions (category);
create index if not exists accounting_invoice_idx on accounting_transactions (linked_invoice_id);
create index if not exists employees_department_idx on employees (department);
create index if not exists campaigns_status_idx on campaigns (status);

alter table accounting_transactions enable row level security;
alter table employees enable row level security;
alter table campaigns enable row level security;
alter table reports enable row level security;
