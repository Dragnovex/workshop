import { cn } from "@/lib/utils";

/**
 * حاوية طباعة A4 — مخفية على الشاشة (hidden)، تظهر فقط عند الطباعة.
 * تُستخدم لصفحات المستندات المحاسبية (فواتير، تقفيل يومية) إلى جانب
 * عرض الشاشة التفاعلي العادي الذي يحمل print:hidden.
 */
export function PrintDocument({
  children,
  dir,
  className,
}: {
  children: React.ReactNode;
  dir: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <div className="hidden print:block" dir={dir}>
      <div
        className={cn(
          "mx-auto w-[186mm] bg-white p-0 text-[11px] leading-normal text-black",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
