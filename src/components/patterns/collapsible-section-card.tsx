"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";

/**
 * بطاقة قسم قابلة للطي بسهم.
 *
 * غلاف حول `SectionCard` لا بديل عنها: نفس الشكل تمامًا، ويُضاف زر سهم
 * في موضع الإجراء. الطي حالة عميل فقط ولا يُحفظ — إخفاء بصري لا أكثر.
 */
export function CollapsibleSectionCard({
  title,
  subtitle,
  className,
  contentClassName,
  expandLabel,
  collapseLabel,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  expandLabel: string;
  collapseLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      className={className}
      contentClassName={contentClassName}
      action={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? collapseLabel : expandLabel}
          title={open ? collapseLabel : expandLabel}
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        </Button>
      }
    >
      {/*
        الإخفاء عبر `hidden` على غلاف داخلي لا عبر contentClassName:
        SectionCard تدمج الأصناف بـ cn، و`p-4` يبقى فيغلب `hidden` أحيانًا.
        السمة hidden الأصلية أوضح ولا تتأثر بترتيب الأصناف.
      */}
      <div hidden={!open}>{children}</div>
    </SectionCard>
  );
}
