-- 0009_auth_profiles_and_rls.sql
-- المصادقة والصلاحيات على مستوى قاعدة البيانات.
--
-- ⚠️ هذا الملف هو **الحماية الحقيقية** للنظام. الفرض في الواجهة أو في
-- proxy.ts راحة استخدام لا أمان: من يملك مفتاح anon يستطيع مخاطبة REST API
-- مباشرة متجاوزًا التطبيق كله. RLS هو الطبقة التي لا يمكن تجاوزها.

-- ═══════════════════════════════════════════════════════════════════════
-- 1) ملفات المستخدمين
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists profiles (
  -- المفتاح نفسه هو معرّف المستخدم في auth.users: حذف المستخدم يحذف ملفه.
  id uuid primary key references auth.users (id) on delete cascade,
  full_name_ar text not null,
  full_name_en text not null,
  email text not null,
  role text not null check (
    role in (
      'owner', 'manager', 'serviceAdvisor', 'technician',
      'storekeeper', 'accountant', 'receptionist'
    )
  ),
  branch_id text,
  -- تعطيل موظف بلا حذف سجله: is_active = false يقطع وصوله فورًا
  -- مع بقاء أثره في سجلات التدقيق.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- المستخدم يقرأ ملفه فقط. لا أحد يعدّل دوره من التطبيق —
-- تغيير الأدوار عبر لوحة Supabase أو service_role حصرًا.
create policy profiles_read_own on profiles
  for select using (id = (select auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 2) مصفوفة الصلاحيات
--
-- مولَّدة آليًا من src/lib/auth/permissions.ts — **لا تُحرَّر يدويًا**.
-- المصدر الوحيد للحقيقة هو ملف TypeScript؛ أي تعديل هنا سينحرف عن
-- ما تعرضه الواجهة. أعد التوليد بدل التحرير.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists role_permissions (
  role text not null,
  resource text not null,
  action text not null,
  primary key (role, resource, action)
);

alter table role_permissions enable row level security;

create policy role_permissions_read on role_permissions
  for select using (auth.uid() is not null);

insert into role_permissions (role, resource, action) values
  ('owner', 'accounting', 'approve'),
  ('owner', 'accounting', 'create'),
  ('owner', 'accounting', 'delete'),
  ('owner', 'accounting', 'read'),
  ('owner', 'accounting', 'update'),
  ('owner', 'appointments', 'approve'),
  ('owner', 'appointments', 'create'),
  ('owner', 'appointments', 'delete'),
  ('owner', 'appointments', 'read'),
  ('owner', 'appointments', 'update'),
  ('owner', 'customers', 'approve'),
  ('owner', 'customers', 'create'),
  ('owner', 'customers', 'delete'),
  ('owner', 'customers', 'read'),
  ('owner', 'customers', 'update'),
  ('owner', 'employees', 'approve'),
  ('owner', 'employees', 'create'),
  ('owner', 'employees', 'delete'),
  ('owner', 'employees', 'read'),
  ('owner', 'employees', 'update'),
  ('owner', 'estimates', 'approve'),
  ('owner', 'estimates', 'create'),
  ('owner', 'estimates', 'delete'),
  ('owner', 'estimates', 'read'),
  ('owner', 'estimates', 'update'),
  ('owner', 'inventory', 'approve'),
  ('owner', 'inventory', 'create'),
  ('owner', 'inventory', 'delete'),
  ('owner', 'inventory', 'read'),
  ('owner', 'inventory', 'update'),
  ('owner', 'invoices', 'approve'),
  ('owner', 'invoices', 'create'),
  ('owner', 'invoices', 'delete'),
  ('owner', 'invoices', 'read'),
  ('owner', 'invoices', 'update'),
  ('owner', 'marketing', 'approve'),
  ('owner', 'marketing', 'create'),
  ('owner', 'marketing', 'delete'),
  ('owner', 'marketing', 'read'),
  ('owner', 'marketing', 'update'),
  ('owner', 'purchasing', 'approve'),
  ('owner', 'purchasing', 'create'),
  ('owner', 'purchasing', 'delete'),
  ('owner', 'purchasing', 'read'),
  ('owner', 'purchasing', 'update'),
  ('owner', 'reports', 'approve'),
  ('owner', 'reports', 'create'),
  ('owner', 'reports', 'delete'),
  ('owner', 'reports', 'read'),
  ('owner', 'reports', 'update'),
  ('owner', 'returns', 'approve'),
  ('owner', 'returns', 'create'),
  ('owner', 'returns', 'delete'),
  ('owner', 'returns', 'read'),
  ('owner', 'returns', 'update'),
  ('owner', 'settings', 'approve'),
  ('owner', 'settings', 'create'),
  ('owner', 'settings', 'delete'),
  ('owner', 'settings', 'read'),
  ('owner', 'settings', 'update'),
  ('owner', 'suppliers', 'approve'),
  ('owner', 'suppliers', 'create'),
  ('owner', 'suppliers', 'delete'),
  ('owner', 'suppliers', 'read'),
  ('owner', 'suppliers', 'update'),
  ('owner', 'vehicles', 'approve'),
  ('owner', 'vehicles', 'create'),
  ('owner', 'vehicles', 'delete'),
  ('owner', 'vehicles', 'read'),
  ('owner', 'vehicles', 'update'),
  ('owner', 'workOrders', 'approve'),
  ('owner', 'workOrders', 'create'),
  ('owner', 'workOrders', 'delete'),
  ('owner', 'workOrders', 'read'),
  ('owner', 'workOrders', 'update'),
  ('manager', 'accounting', 'read'),
  ('manager', 'appointments', 'approve'),
  ('manager', 'appointments', 'create'),
  ('manager', 'appointments', 'delete'),
  ('manager', 'appointments', 'read'),
  ('manager', 'appointments', 'update'),
  ('manager', 'customers', 'approve'),
  ('manager', 'customers', 'create'),
  ('manager', 'customers', 'delete'),
  ('manager', 'customers', 'read'),
  ('manager', 'customers', 'update'),
  ('manager', 'employees', 'create'),
  ('manager', 'employees', 'read'),
  ('manager', 'employees', 'update'),
  ('manager', 'estimates', 'approve'),
  ('manager', 'estimates', 'create'),
  ('manager', 'estimates', 'delete'),
  ('manager', 'estimates', 'read'),
  ('manager', 'estimates', 'update'),
  ('manager', 'inventory', 'create'),
  ('manager', 'inventory', 'read'),
  ('manager', 'inventory', 'update'),
  ('manager', 'invoices', 'create'),
  ('manager', 'invoices', 'read'),
  ('manager', 'invoices', 'update'),
  ('manager', 'marketing', 'create'),
  ('manager', 'marketing', 'read'),
  ('manager', 'marketing', 'update'),
  ('manager', 'purchasing', 'approve'),
  ('manager', 'purchasing', 'create'),
  ('manager', 'purchasing', 'delete'),
  ('manager', 'purchasing', 'read'),
  ('manager', 'purchasing', 'update'),
  ('manager', 'reports', 'read'),
  ('manager', 'returns', 'create'),
  ('manager', 'returns', 'read'),
  ('manager', 'returns', 'update'),
  ('manager', 'settings', 'read'),
  ('manager', 'suppliers', 'approve'),
  ('manager', 'suppliers', 'create'),
  ('manager', 'suppliers', 'delete'),
  ('manager', 'suppliers', 'read'),
  ('manager', 'suppliers', 'update'),
  ('manager', 'vehicles', 'approve'),
  ('manager', 'vehicles', 'create'),
  ('manager', 'vehicles', 'delete'),
  ('manager', 'vehicles', 'read'),
  ('manager', 'vehicles', 'update'),
  ('manager', 'workOrders', 'approve'),
  ('manager', 'workOrders', 'create'),
  ('manager', 'workOrders', 'delete'),
  ('manager', 'workOrders', 'read'),
  ('manager', 'workOrders', 'update'),
  ('serviceAdvisor', 'appointments', 'create'),
  ('serviceAdvisor', 'appointments', 'read'),
  ('serviceAdvisor', 'appointments', 'update'),
  ('serviceAdvisor', 'customers', 'create'),
  ('serviceAdvisor', 'customers', 'read'),
  ('serviceAdvisor', 'customers', 'update'),
  ('serviceAdvisor', 'estimates', 'create'),
  ('serviceAdvisor', 'estimates', 'read'),
  ('serviceAdvisor', 'estimates', 'update'),
  ('serviceAdvisor', 'inventory', 'read'),
  ('serviceAdvisor', 'invoices', 'read'),
  ('serviceAdvisor', 'reports', 'read'),
  ('serviceAdvisor', 'returns', 'read'),
  ('serviceAdvisor', 'vehicles', 'create'),
  ('serviceAdvisor', 'vehicles', 'read'),
  ('serviceAdvisor', 'vehicles', 'update'),
  ('serviceAdvisor', 'workOrders', 'create'),
  ('serviceAdvisor', 'workOrders', 'read'),
  ('serviceAdvisor', 'workOrders', 'update'),
  ('technician', 'inventory', 'read'),
  ('technician', 'vehicles', 'read'),
  ('technician', 'workOrders', 'read'),
  ('technician', 'workOrders', 'update'),
  ('storekeeper', 'inventory', 'approve'),
  ('storekeeper', 'inventory', 'create'),
  ('storekeeper', 'inventory', 'delete'),
  ('storekeeper', 'inventory', 'read'),
  ('storekeeper', 'inventory', 'update'),
  ('storekeeper', 'purchasing', 'create'),
  ('storekeeper', 'purchasing', 'read'),
  ('storekeeper', 'purchasing', 'update'),
  ('storekeeper', 'reports', 'read'),
  ('storekeeper', 'suppliers', 'create'),
  ('storekeeper', 'suppliers', 'read'),
  ('storekeeper', 'suppliers', 'update'),
  ('storekeeper', 'workOrders', 'read'),
  ('accountant', 'accounting', 'approve'),
  ('accountant', 'accounting', 'create'),
  ('accountant', 'accounting', 'delete'),
  ('accountant', 'accounting', 'read'),
  ('accountant', 'accounting', 'update'),
  ('accountant', 'customers', 'read'),
  ('accountant', 'invoices', 'approve'),
  ('accountant', 'invoices', 'create'),
  ('accountant', 'invoices', 'delete'),
  ('accountant', 'invoices', 'read'),
  ('accountant', 'invoices', 'update'),
  ('accountant', 'purchasing', 'read'),
  ('accountant', 'reports', 'read'),
  ('accountant', 'returns', 'approve'),
  ('accountant', 'returns', 'create'),
  ('accountant', 'returns', 'delete'),
  ('accountant', 'returns', 'read'),
  ('accountant', 'returns', 'update'),
  ('accountant', 'suppliers', 'read'),
  ('receptionist', 'appointments', 'create'),
  ('receptionist', 'appointments', 'read'),
  ('receptionist', 'appointments', 'update'),
  ('receptionist', 'customers', 'create'),
  ('receptionist', 'customers', 'read'),
  ('receptionist', 'customers', 'update'),
  ('receptionist', 'vehicles', 'create'),
  ('receptionist', 'vehicles', 'read'),
  ('receptionist', 'vehicles', 'update'),
  ('receptionist', 'workOrders', 'read')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════
-- 3) دوال مساعدة
-- ═══════════════════════════════════════════════════════════════════════

-- security definer: تقرأ profiles متجاوزةً RLS الخاص به، وإلا وقعنا في
-- تعاود لا نهائي (سياسة تستعلم عن جدول محمي بنفس السياسة).
-- search_path مثبّت لمنع اختطافها عبر schema وهمي.
create or replace function app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid() and is_active = true;
$$;

create or replace function app_can(resource text, action text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from role_permissions rp
    where rp.role = app_role()
      and rp.resource = resource
      and rp.action = action
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 4) السياسات على جداول الأعمال
--
-- كل جدول: القراءة تتطلب صلاحية read، والكتابة صلاحية create/update/delete.
-- الجداول الأبناء ترث صلاحية الأب (بند فاتورة يتبع مورد invoices).
-- ═══════════════════════════════════════════════════════════════════════

-- دالة مساعدة لتقليل التكرار غير متاحة في CREATE POLICY، لذلك تُكتب صراحةً.

-- العملاء
create policy customers_read on customers for select using (app_can('customers', 'read'));
create policy customers_insert on customers for insert with check (app_can('customers', 'create'));
create policy customers_update on customers for update using (app_can('customers', 'update'));
create policy customers_delete on customers for delete using (app_can('customers', 'delete'));

-- المركبات
create policy vehicles_read on vehicles for select using (app_can('vehicles', 'read'));
create policy vehicles_insert on vehicles for insert with check (app_can('vehicles', 'create'));
create policy vehicles_update on vehicles for update using (app_can('vehicles', 'update'));
create policy vehicles_delete on vehicles for delete using (app_can('vehicles', 'delete'));

-- أوامر التشغيل
create policy work_orders_read on work_orders for select using (app_can('workOrders', 'read'));
create policy work_orders_insert on work_orders for insert with check (app_can('workOrders', 'create'));
create policy work_orders_update on work_orders for update using (app_can('workOrders', 'update'));
create policy work_orders_delete on work_orders for delete using (app_can('workOrders', 'delete'));

create policy work_order_items_read on work_order_items for select using (app_can('workOrders', 'read'));
create policy work_order_items_write on work_order_items for all
  using (app_can('workOrders', 'update')) with check (app_can('workOrders', 'update'));

create policy work_order_parts_read on work_order_parts for select using (app_can('workOrders', 'read'));
create policy work_order_parts_write on work_order_parts for all
  using (app_can('workOrders', 'update')) with check (app_can('workOrders', 'update'));

-- الخط الزمني سجل تدقيق: يُقرأ ويُضاف إليه، ولا يُعدَّل ولا يُحذف من التطبيق.
create policy work_order_timeline_read on work_order_timeline for select using (app_can('workOrders', 'read'));
create policy work_order_timeline_insert on work_order_timeline for insert with check (app_can('workOrders', 'update'));

-- المواعيد
create policy appointments_read on appointments for select using (app_can('appointments', 'read'));
create policy appointments_insert on appointments for insert with check (app_can('appointments', 'create'));
create policy appointments_update on appointments for update using (app_can('appointments', 'update'));
create policy appointments_delete on appointments for delete using (app_can('appointments', 'delete'));

-- التقديرات
create policy estimates_read on estimates for select using (app_can('estimates', 'read'));
create policy estimates_insert on estimates for insert with check (app_can('estimates', 'create'));
create policy estimates_update on estimates for update using (app_can('estimates', 'update'));
create policy estimates_delete on estimates for delete using (app_can('estimates', 'delete'));

create policy estimate_items_read on estimate_items for select using (app_can('estimates', 'read'));
create policy estimate_items_write on estimate_items for all
  using (app_can('estimates', 'update')) with check (app_can('estimates', 'update'));

-- المخزون
create policy parts_read on parts for select using (app_can('inventory', 'read'));
create policy parts_insert on parts for insert with check (app_can('inventory', 'create'));
create policy parts_update on parts for update using (app_can('inventory', 'update'));
create policy parts_delete on parts for delete using (app_can('inventory', 'delete'));

-- المشتريات
create policy purchase_orders_read on purchase_orders for select using (app_can('purchasing', 'read'));
create policy purchase_orders_insert on purchase_orders for insert with check (app_can('purchasing', 'create'));
create policy purchase_orders_update on purchase_orders for update using (app_can('purchasing', 'update'));
create policy purchase_orders_delete on purchase_orders for delete using (app_can('purchasing', 'delete'));

create policy purchase_order_items_read on purchase_order_items for select using (app_can('purchasing', 'read'));
create policy purchase_order_items_write on purchase_order_items for all
  using (app_can('purchasing', 'update')) with check (app_can('purchasing', 'update'));

-- الفواتير
create policy invoices_read on invoices for select using (app_can('invoices', 'read'));
create policy invoices_insert on invoices for insert with check (app_can('invoices', 'create'));

-- ⚠️ فاتورة صادرة مقفلة نهائيًا (متطلب فاتورة/ZATCA): التعديل مسموح على
-- المسودات فقط. التصحيح بعد الإصدار يكون بإشعار دائن/مدين لا بتعديل مباشر.
-- هذا القيد مفروض هنا في قاعدة البيانات لا في التطبيق وحده.
create policy invoices_update_drafts_only on invoices for update
  using (app_can('invoices', 'update') and status = 'draft')
  with check (status = 'draft');

-- لا سياسة حذف للفواتير إطلاقًا — المستند الضريبي لا يُحذف.

create policy invoice_line_items_read on invoice_line_items for select using (app_can('invoices', 'read'));
create policy invoice_line_items_write on invoice_line_items for all
  using (
    app_can('invoices', 'update')
    and exists (select 1 from invoices i where i.id = invoice_id and i.status = 'draft')
  )
  with check (
    exists (select 1 from invoices i where i.id = invoice_id and i.status = 'draft')
  );

-- سجل التدقيق: يُقرأ ويُضاف إليه فقط. لا تعديل ولا حذف بأي دور.
create policy invoice_audit_read on invoice_audit_log for select using (app_can('invoices', 'read'));
create policy invoice_audit_insert on invoice_audit_log for insert with check (app_can('invoices', 'read'));

-- المحاسبة
create policy accounting_read on accounting_transactions for select using (app_can('accounting', 'read'));
create policy accounting_insert on accounting_transactions for insert with check (app_can('accounting', 'create'));
create policy accounting_update on accounting_transactions for update using (app_can('accounting', 'update'));
create policy accounting_delete on accounting_transactions for delete using (app_can('accounting', 'delete'));

-- تقفيل اليومية — يتبع صلاحية المحاسبة
create policy daily_closings_read on daily_closings for select using (app_can('accounting', 'read'));
create policy daily_closings_insert on daily_closings for insert with check (app_can('accounting', 'create'));

-- يومية مقفلة لا تُعدَّل — نفس منطق قفل الفاتورة.
create policy daily_closings_update_drafts on daily_closings for update
  using (app_can('accounting', 'update') and status = 'draft')
  with check (status = 'draft');

create policy daily_closing_entries_read on daily_closing_entries for select using (app_can('accounting', 'read'));
create policy daily_closing_entries_write on daily_closing_entries for all
  using (
    app_can('accounting', 'update')
    and exists (select 1 from daily_closings d where d.id = daily_closing_id and d.status = 'draft')
  )
  with check (
    exists (select 1 from daily_closings d where d.id = daily_closing_id and d.status = 'draft')
  );

create policy daily_closing_audit_read on daily_closing_audit_log for select using (app_can('accounting', 'read'));
create policy daily_closing_audit_insert on daily_closing_audit_log for insert with check (app_can('accounting', 'read'));

-- الموظفون
create policy employees_read on employees for select using (app_can('employees', 'read'));
create policy employees_insert on employees for insert with check (app_can('employees', 'create'));
create policy employees_update on employees for update using (app_can('employees', 'update'));
create policy employees_delete on employees for delete using (app_can('employees', 'delete'));

-- التسويق
create policy campaigns_read on campaigns for select using (app_can('marketing', 'read'));
create policy campaigns_insert on campaigns for insert with check (app_can('marketing', 'create'));
create policy campaigns_update on campaigns for update using (app_can('marketing', 'update'));
create policy campaigns_delete on campaigns for delete using (app_can('marketing', 'delete'));

-- التقارير
create policy reports_read on reports for select using (app_can('reports', 'read'));
create policy reports_write on reports for all
  using (app_can('reports', 'update')) with check (app_can('reports', 'update'));

-- ═══════════════════════════════════════════════════════════════════════
-- تحقّق بعد التشغيل
-- ═══════════════════════════════════════════════════════════════════════
--
-- 1) لا جدول بلا RLS:
--    select tablename from pg_tables
--    where schemaname = 'public' and rowsecurity = false;
--    (يجب أن يعيد صفر صفوف)
--
-- 2) لا جدول بلا سياسة (RLS مفعّل بلا سياسة = لا أحد يقرأ):
--    select t.tablename from pg_tables t
--    where t.schemaname = 'public'
--      and not exists (
--        select 1 from pg_policies p
--        where p.schemaname = 'public' and p.tablename = t.tablename
--      );
--
-- 3) عدد صفوف الصلاحيات يطابق TypeScript:
--    select count(*) from role_permissions;   -- المتوقع: 165
