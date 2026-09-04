import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // لا نُخفي أخطاء TypeScript أبدًا — الأخطاء المخفية تصل إلى الإنتاج.
  typescript: { ignoreBuildErrors: false },
  // جذر صريح لـ Turbopack — يوجد package-lock.json في D:\Obsidian يخدع الاستدلال
  // ويختار جذرًا خاطئًا (يسبب خطأ Missing field isPersistentCachingEnabled).
  turbopack: { root: __dirname },
  experimental: {
    // يعالج سباق معروف في Next.js (#95545): فشل توليد صفحات عشوائية (E696
    // workUnitAsyncStorage) تحت حمل الجهاز — الإعادة تمتص السباق.
    staticGenerationRetryCount: 10,
    // توليد تسلسلي (صفحة-صفحة) بدل 8 صفحات متوازية = لا تنافس على سياق
    // العمل = لا سباق.
    staticGenerationMaxConcurrency: 1,
  },
};

export default withNextIntl(nextConfig);
