-- 0008_enable_rls_on_legacy_tables.sql
--
-- ⚠️ إصلاح أمني. الترحيلات 0002 (الفواتير) و0003 (تقفيل اليومية) كُتبت قبل
-- وجود خطة نشر فعلية، ولا تفعّل Row Level Security على جداولها.
--
-- في Supabase مفتاح `anon` **علني بالتصميم** (يصل إلى المتصفح). جدول بلا RLS
-- يعني أن أي شخص يملك هذا المفتاح يقرأ ويكتب فيه مباشرة عبر REST API —
-- فواتير ضريبية، أرقام ضريبية للعملاء، وأرصدة صناديق يومية.
--
-- تفعيل RLS بلا سياسات = رفض كل شيء لـ anon و authenticated معًا،
-- بينما يتجاوزه `service_role` (المستخدم على الخادم فقط). هذا هو الوضع
-- الآمن الصحيح إلى أن تُضاف سياسات الأدوار في المرحلة د.
--
-- شغّل هذا الملف **مع** بقية الترحيلات، لا بعدها.

alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table invoice_audit_log enable row level security;

alter table daily_closings enable row level security;
alter table daily_closing_entries enable row level security;
alter table daily_closing_audit_log enable row level security;

-- تحقّق سريع بعد التشغيل: يجب ألّا يُرجع هذا الاستعلام أي صف.
--
--   select tablename
--   from pg_tables
--   where schemaname = 'public' and rowsecurity = false;
