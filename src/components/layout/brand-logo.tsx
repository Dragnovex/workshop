import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * شعار الشركة الكامل (أيقونة + شعار نصّي).
 * الملف الفعلي في public/brand/logo.png — object-contain يمنع التمدد
 * أو تشويه النسبة أيًا كان حجم الحاوية.
 */
export function BrandLogo({
  className,
  height = 32,
}: {
  className?: string;
  height?: number;
}) {
  const t = useTranslations("app");

  return (
    <Image
      src="/brand/logo.png"
      alt={t("name")}
      width={height * 4}
      height={height}
      priority
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );
}
