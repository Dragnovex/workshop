-- 0005_appointments_estimates.sql
-- المواعيد والتقديرات.
--
-- المواعيد: `scheduled_at` من نوع timestamptz لا timestamp — الوقت يُخزَّن
-- بـ UTC ويُعرَض بتوقيت الرياض (Asia/Riyadh). استخدام timestamp بلا منطقة
-- زمنية يجعل موعد الساعة ٩ صباحًا يتحرّك حسب خادم العرض.

create table if not exists appointments (
  id text primary key,
  customer_id text not null references customers (id) on delete restrict,
  vehicle_id text not null references vehicles (id) on delete restrict,
  service_type_ar text not null,
  service_type_en text not null,
  status text not null check (
    status in ('requested', 'confirmed', 'checkedIn', 'completed', 'cancelled', 'noShow')
  ) default 'requested',
  scheduled_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  notes_ar text,
  notes_en text,
  linked_work_order_id text references work_orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists estimates (
  id text primary key,
  number text not null unique,
  customer_id text not null references customers (id) on delete restrict,
  vehicle_id text not null references vehicles (id) on delete restrict,
  status text not null check (
    status in ('draft', 'sent', 'approved', 'rejected', 'expired')
  ) default 'draft',
  created_at timestamptz not null,
  valid_until timestamptz not null,
  notes_ar text,
  notes_en text,
  linked_work_order_id text references work_orders (id) on delete set null
);

create table if not exists estimate_items (
  id text primary key,
  estimate_id text not null references estimates (id) on delete cascade,
  description_ar text not null,
  description_en text not null,
  qty numeric(10, 3) not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_order int not null default 0
);

create index if not exists appointments_customer_idx on appointments (customer_id);
create index if not exists appointments_scheduled_idx on appointments (scheduled_at);
create index if not exists appointments_status_idx on appointments (status);
create index if not exists estimates_customer_idx on estimates (customer_id);
create index if not exists estimate_items_parent_idx on estimate_items (estimate_id);

alter table appointments enable row level security;
alter table estimates enable row level security;
alter table estimate_items enable row level security;
