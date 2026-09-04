-- 0006_inventory_purchasing.sql
-- المخزون وأوامر الشراء.

create table if not exists parts (
  id text primary key,
  sku text not null unique,
  name_ar text not null,
  name_en text not null,
  category text not null check (
    category in ('brakes', 'engine', 'electrical', 'fluids', 'filters', 'tires', 'bodyParts')
  ),
  qty_on_hand numeric(10, 3) not null default 0 check (qty_on_hand >= 0),
  reorder_level numeric(10, 3) not null default 0 check (reorder_level >= 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id text primary key,
  number text not null unique,
  supplier_ar text not null,
  supplier_en text not null,
  status text not null check (
    status in ('draft', 'ordered', 'partiallyReceived', 'received', 'cancelled')
  ) default 'draft',
  ordered_at timestamptz not null,
  expected_at timestamptz not null,
  notes_ar text,
  notes_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id text primary key,
  purchase_order_id text not null references purchase_orders (id) on delete cascade,
  -- on delete set null لا cascade: حذف صنف من الكتالوج يجب ألّا يمحو سطرًا
  -- من أمر شراء تاريخي — السجل المحاسبي يبقى، ويفقد الربط فقط.
  part_id text references parts (id) on delete set null,
  description_ar text not null,
  description_en text not null,
  sku text not null,
  qty numeric(10, 3) not null check (qty > 0),
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  line_order int not null default 0
);

create index if not exists parts_category_idx on parts (category);
create index if not exists parts_low_stock_idx on parts (qty_on_hand) where qty_on_hand <= reorder_level;
create index if not exists purchase_orders_status_idx on purchase_orders (status);
create index if not exists purchase_order_items_parent_idx on purchase_order_items (purchase_order_id);

alter table parts enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
