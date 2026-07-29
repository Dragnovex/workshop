import { cn } from "@/lib/utils";

/**
 * علامة الشركة.
 * مربّع أحمر واحد — هذا هو الموضع الوحيد الذي يظهر فيه الأحمر كمساحة ممتلئة
 * في الشريط الجانبي، وهو ما يجعله يعمل كلون تمييز لا كلون واجهة.
 */
export function BrandMark({
  className,
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-primary font-mono font-medium tracking-tight text-primary-foreground shadow-xs",
        size === "sm" ? "size-6 text-2xs" : "size-8 text-xs",
        className,
      )}
    >
      3MR
    </span>
  );
}
