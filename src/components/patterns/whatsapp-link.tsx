import { MessageCircle } from "lucide-react";

import { normalizeSaudiPhone } from "@/lib/validation/saudi";

/**
 * رابط محادثة واتساب — أيقونة صغيرة بجانب رقم الجوال.
 *
 * يستخدم `wa.me` لا واجهة WhatsApp Business API: يفتح المحادثة في تطبيق
 * الموظف نفسه، بلا حساب تجاري ولا قوالب معتمدة ولا تكلفة لكل رسالة.
 * الموظف هو من يرسل، والنظام يوفّر الاختصار فقط.
 */
export function WhatsAppLink({
  phone,
  label,
  message,
  className,
}: {
  phone?: string;
  label: string;
  /** نص مبدئي يُملأ في المحادثة — اختياري. */
  message?: string;
  className?: string;
}) {
  if (!phone) return null;

  // wa.me يقبل الأرقام فقط بلا + ولا فواصل.
  const digits = normalizeSaudiPhone(phone).replace(/\D/g, "");
  if (!digits) return null;

  const href = message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      // stopPropagation: الأيقونة تعيش داخل صف قابل للنقر يفتح صفحة العميل،
      // والضغط عليها يجب أن يفتح واتساب لا الصفحة.
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-success-subtle hover:text-success-text ${className ?? ""}`}
    >
      <MessageCircle aria-hidden="true" className="size-3.5" />
    </a>
  );
}
