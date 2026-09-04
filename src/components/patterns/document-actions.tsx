"use client";

import { FileDown, MessageCircle, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { normalizeSaudiPhone } from "@/lib/validation/saudi";

/**
 * إجراءات المستند الرسمي: طباعة + تصدير PDF + إرسال واتساب.
 * تُستخدم على الفاتورة والتسعير وتقفيل اليومية وفاتورة المشتريات والمردود.
 *
 * **PDF:** لا مكتبة توليد PDF في المشروع، والتصدير هنا هو حوار الطباعة
 * نفسه مع «حفظ بصيغة PDF» — وهو مولّد PDF حقيقي مدمج في المتصفح ينتج
 * ملفًا مطابقًا لتخطيط الطباعة (A4، `PrintDocument`). التوست يقول ذلك
 * صراحةً بدل الإيحاء بتنزيل تلقائي لا يحدث.
 *
 * **واتساب:** `wa.me` فقط لا WhatsApp Business API — يفتح المحادثة في
 * تطبيق الموظف بلا حساب تجاري ولا قوالب معتمدة ولا تكلفة لكل رسالة.
 */
export function DocumentActions({
  phone,
  message,
  className,
}: {
  /** جوال المستلم — بدونه يظهر زر واتساب معطَّلًا بسبب واضح لا مخفيًا. */
  phone?: string;
  /** نص الرسالة المبدئي (ملخّص المستند). */
  message: string;
  className?: string;
}) {
  const t = useTranslations("common");

  const digits = phone ? normalizeSaudiPhone(phone).replace(/\D/g, "") : "";
  const whatsappHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : undefined;

  return (
    <div
      role="group"
      aria-label={t("documentActions")}
      className={`flex flex-wrap items-center gap-2 print:hidden ${className ?? ""}`}
    >
      <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
        <Printer className="size-4" />
        {t("print")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          toast.info(t("exportPdfHint"));
          window.print();
        }}
      >
        <FileDown className="size-4" />
        {t("exportPdf")}
      </Button>
      {whatsappHref ? (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            {t("sendWhatsapp")}
          </a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" disabled title={t("noPhone")}>
          <MessageCircle className="size-4" />
          {t("sendWhatsapp")}
        </Button>
      )}
    </div>
  );
}
