import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * حقل نموذج موحّد: تسمية + محتوى + رسالة خطأ.
 * الخطأ يُربط بالحقل عبر aria-describedby في المكوّنات المستخدِمة.
 */
export function Field({
  id,
  label,
  error,
  action,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
