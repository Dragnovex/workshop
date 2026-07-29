# طبقة المصادقة — جاهزية Auth.js

المرحلة الأولى **لا تنفّذ** مصادقة. تبني المقابس (seams) فقط، بحيث يكون توصيل
Auth.js (NextAuth v5) في المرحلة الثانية تغييرًا محصورًا لا يمسّ أي شاشة.

## ما هو موجود الآن

| الملف | الدور |
|---|---|
| `types.ts` | عقود `Session` و`SessionUser` و`Role` و`Permission` بنفس شكل Auth.js |
| `permissions.ts` | مصفوفة صلاحيات RBAC حسب الدور + الدالة `can()` |
| `session.ts` | `getSession()` — نقطة التبديل الوحيدة، تُعيد `null` حاليًا |
| `../../app/[locale]/(auth)/*` | الشاشات: دخول، نسيان كلمة المرور، إعادة التعيين |

## خطوات التوصيل في المرحلة الثانية

1. `npm i next-auth@beta` ثم أنشئ `config.ts` بمزوّد Credentials (وربما Google للموظفين).
2. في `session.ts` استبدل جسم `getSession` بـ `export const getSession = auth;`.
3. في `proxy.ts` غلّف معالج اللغة بحارس الجلسة — قراءة الجلسة أولًا، ثم `intlMiddleware(request)`.
4. في صفحة الدخول استبدل `simulateSignIn` بـ `signIn("credentials", …)`.
5. افرض `can()` في Server Actions و Route Handlers. **الفرض في الواجهة وحده ليس أمانًا.**

## قواعد ملزمة

- ممنوع إنشاء كوكي جلسة أو `localStorage` وهمي قبل وصول المزوّد الحقيقي.
- ممنوع تخزين كلمات المرور أو المفاتيح في الكود — متغيّرات البيئة فقط.
- كل قرار صلاحية يُقرأ من `permissions.ts`، ولا يُكتب شرط دور مباشرة في مكوّن.
