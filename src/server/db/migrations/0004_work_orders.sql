-- 0004_work_orders.sql
-- أوامر التشغيل: الأمر + بنود العمل + قطع الغيار + الخط الزمني.
-- المصفوفات المتداخلة في TypeScript (items/parts/timeline) تصير جداول أبناء
-- لا أعمدة jsonb — لأنها تُستعلَم وتُجمَّع حسابيًا (ساعات، تكاليف، حالة القطع).

create table if not exists work_orders (
  id text primary key,
  number text not null unique,
  status text not null check (
    status in (
      'reception', 'inspection', 'awaitingApproval', 'inProgress',
      'awaitingParts', 'readyForDelivery', 'delivered'
    )
  ) default 'reception',
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  customer_id text not null references customers (id) on delete restrict,
  vehicle_id text not null references vehicles (id) on delete restrict,
  mileage_at_reception int not null default 0 check (mileage_at_reception >= 0),
  complaint_ar text not null,
  complaint_en text not null,
  diagnosis_ar text,
  diagnosis_en text,
  technician_ar text not null,
  technician_en text not null,
  bay int check (bay is null or bay > 0),
  received_at timestamptz not null,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_order_items (
  id text primary key,
  work_order_id text not null references work_orders (id) on delete cascade,
  description_ar text not null,
  description_en text not null,
  hours numeric(6, 2) not null check (hours >= 0),
  rate numeric(12, 2) not null check (rate >= 0),
  done boolean not null default false,
  line_order int not null default 0
);

create table if not exists work_order_parts (
  id text primary key,
  work_order_id text not null references work_orders (id) on delete cascade,
  part_id text,
  name_ar text not null,
  name_en text not null,
  sku text not null,
  qty numeric(10, 3) not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  install_status text not null check (install_status in ('installed', 'ordered', 'available')),
  line_order int not null default 0
);

-- الخط الزمني سجل تدقيق: يُضاف إليه ولا يُعدَّل. كل انتقال حالة يترك أثرًا.
create table if not exists work_order_timeline (
  id text primary key,
  work_order_id text not null references work_orders (id) on delete cascade,
  status text not null check (
    status in (
      'reception', 'inspection', 'awaitingApproval', 'inProgress',
      'awaitingParts', 'readyForDelivery', 'delivered'
    )
  ),
  occurred_at timestamptz not null,
  actor_ar text not null,
  actor_en text not null,
  note_ar text,
  note_en text
);

create index if not exists work_orders_customer_idx on work_orders (customer_id);
create index if not exists work_orders_vehicle_idx on work_orders (vehicle_id);
create index if not exists work_orders_status_idx on work_orders (status);
create index if not exists work_order_items_parent_idx on work_order_items (work_order_id);
create index if not exists work_order_parts_parent_idx on work_order_parts (work_order_id);
create index if not exists work_order_timeline_parent_idx on work_order_timeline (work_order_id);

alter table work_orders enable row level security;
alter table work_order_items enable row level security;
alter table work_order_parts enable row level security;
alter table work_order_timeline enable row level security;
