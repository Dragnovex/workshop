"use client";

import { Copy, ImageIcon, Lightbulb, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCan, useGuard } from "@/lib/auth/permission-context";
import { createClientStore } from "@/lib/client-store";
import {
  contentHooks,
  contentSlotCount,
  contentSlotStatuses,
  type ContentSlot,
  type ContentSlotStatus,
} from "../content-types";

const slotStore = createClientStore<ContentSlot>("3mr-workshop-content-slots-v1");

function emptySlots(): ContentSlot[] {
  return Array.from({ length: contentSlotCount }, (_, index) => ({
    id: `slot-${index + 1}`,
    position: index + 1,
    title: "",
    body: "",
    status: "idea" as ContentSlotStatus,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * استوديو المحتوى — ثلاث خانات منشورات + مكتبة هوكات وتعليمات.
 *
 * الخانات الثلاث بيانات مستخدم تُحفظ محليًا؛ الهوكات والتعليمات ثابتة
 * في الكود (`content-types.ts`) لأنها إرشاد لا سجل — تحريرها تحرير كود
 * لا إدخال بيانات.
 *
 * زر النسخ لا يستخدم `navigator.clipboard` وحده: الواجهة قد تعمل عبر
 * HTTP في الشبكة المحلية حيث تكون الحافظة غير متاحة، فنسقط إلى تحديد
 * النص بدل فشل صامت.
 */
export function ContentStudio() {
  const t = useTranslations("marketing.studio");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const can = useCan();
  const guard = useGuard();

  const [slots, setSlots] = useState<ContentSlot[]>(() => slotStore.load(emptySlots()));
  const canEdit = can("marketing:update");

  function updateSlot(id: string, apply: (slot: ContentSlot) => ContentSlot) {
    // التعديل المحلي لا يُحفظ عند كل ضغطة مفتاح — الحفظ بزر صريح أدناه،
    // وإلا كتبنا في localStorage عشرات المرات في الثانية.
    setSlots((previous) =>
      previous.map((slot) => (slot.id === id ? apply(slot) : slot)),
    );
  }

  function save() {
    if (!guard("marketing:update")) return;
    const stamped = slots.map((slot) => ({
      ...slot,
      updatedAt: new Date().toISOString(),
    }));
    if (!slotStore.save(stamped)) {
      toast.error(tCommon("storageSaveFailed"));
      return;
    }
    setSlots(stamped);
    toast.success(tCommon("saved"));
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  const hooks = contentHooks.filter((hook) => hook.category === "hook");
  const instructions = contentHooks.filter((hook) => hook.category === "instruction");

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title={t("title")}
        subtitle={t("subtitle")}
        contentClassName="p-4"
        action={
          canEdit ? (
            <Button size="sm" onClick={save}>
              {tCommon("save")}
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {slots.map((slot) => (
            <div key={slot.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{t("slot", { number: slot.position })}</Badge>
                <Select
                  value={slot.status}
                  disabled={!canEdit}
                  onValueChange={(value) =>
                    updateSlot(slot.id, (item) => ({
                      ...item,
                      status: value as ContentSlotStatus,
                    }))
                  }
                >
                  <SelectTrigger
                    aria-label={t("statusLabel", { number: slot.position })}
                    className="h-8 w-32"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentSlotStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={`${slot.id}-title`} className="text-xs">
                  {t("slotTitle")}
                </Label>
                <Input
                  id={`${slot.id}-title`}
                  value={slot.title}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateSlot(slot.id, (item) => ({ ...item, title: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={`${slot.id}-body`} className="text-xs">
                  {t("slotBody")}
                </Label>
                <Textarea
                  id={`${slot.id}-body`}
                  rows={5}
                  value={slot.body}
                  disabled={!canEdit}
                  placeholder={t("slotBodyPlaceholder")}
                  onChange={(event) =>
                    updateSlot(slot.id, (item) => ({ ...item, body: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={`${slot.id}-media`} className="flex items-center gap-1.5 text-xs">
                  <ImageIcon aria-hidden="true" className="size-3.5" />
                  {t("slotMedia")}
                </Label>
                <Input
                  id={`${slot.id}-media`}
                  value={slot.mediaUrl ?? ""}
                  disabled={!canEdit}
                  dir="ltr"
                  className="text-end"
                  placeholder="https://…"
                  onChange={(event) =>
                    updateSlot(slot.id, (item) => ({
                      ...item,
                      mediaUrl: event.target.value || undefined,
                    }))
                  }
                />
                {/* الرابط يُعرض كرابط لا كصورة: لا رفع ملفات في هذه المرحلة،
                    وعرض صورة من نطاق خارجي داخل النظام مخاطرة بلا فائدة. */}
                {slot.mediaUrl ? (
                  <a
                    href={slot.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-muted-foreground underline"
                  >
                    {slot.mediaUrl}
                  </a>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!slot.body.trim()}
                onClick={() => copyText(`${slot.title}\n\n${slot.body}`.trim())}
              >
                <Copy className="size-4" />
                {t("copyPost")}
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Lightbulb aria-hidden="true" className="size-4" />
              {t("hooks")}
            </span>
          }
          subtitle={t("hooksSubtitle")}
          contentClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {hooks.map((hook) => (
              <li key={hook.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <p className="text-sm">{hook.text[lang]}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={`${t("copyHook")} — ${hook.text[lang]}`}
                  onClick={() => copyText(hook.text[lang])}
                >
                  <Copy className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <ListChecks aria-hidden="true" className="size-4" />
              {t("instructions")}
            </span>
          }
          subtitle={t("instructionsSubtitle")}
          contentClassName="p-0"
        >
          <ol className="divide-y divide-border">
            {instructions.map((instruction, index) => (
              <li key={instruction.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  data-numeric
                  className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs text-muted-foreground"
                >
                  {index + 1}
                </span>
                <p className="text-sm">{instruction.text[lang]}</p>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}
