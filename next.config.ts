import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // لا نُخفي أخطاء TypeScript أبدًا — الأخطاء المخفية تصل إلى الإنتاج.
  typescript: { ignoreBuildErrors: false },
};

export default withNextIntl(nextConfig);
