"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { SectionCard } from "@/components/patterns/section-card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAuthEnabled,
  useCurrentRole,
  useSetPreviewRole,
} from "@/lib/auth/permission-context";
import { rolePermissions } from "@/lib/auth/permissions";
import { previewableRoles } from "@/lib/auth/role-preview";
import type { Role } from "@/lib/auth/types";

/**
 * بطاقة الدور في الإعدادات.
 *
 * وظيفتان:
 *   • عرض الدور الفعّال وما يسمح به فعلًا (عدد الصلاحيات) — شفافية تُغني
 *     عن تجربة كل زر لمعرفة ما هو مسموح.
 *   • تبديل **دور المعاينة** في وضع البذرة المحلية وحده.
 *
 * ⚠️ التبديل ليس تسجيل دخول ولا يمنح وصولًا لأي بيانات: عند تفعيل
 * المصادقة الحقيقية يختفي المحدِّد ويأتي الدور من الجلسة وحدها.
 */
export function RolePreviewCard() {
  const t = useTranslations("permissions");
  const role = useCurrentRole();
  const authEnabled = useAuthEnabled();
  const setPreviewRole = useSetPreviewRole();

  const permissionCount = role ? rolePermissions[role].size : 0;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          {authEnabled ? (
            <ShieldCheck aria-hidden="true" className="size-4" />
          ) : (
            <ShieldAlert aria-hidden="true" className="size-4" />
          )}
          {authEnabled ? t("sessionRoleTitle") : t("previewTitle")}
        </span>
      }
      subtitle={authEnabled ? t("sessionRoleDescription") : t("previewDescription")}
      contentClassName="flex flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("roleLabel")}:</span>
        <Badge variant="secondary">{role ? t(`roles.${role}`) : "—"}</Badge>
        <span data-numeric className="text-xs text-muted-foreground">
          {t("permissionCount", { count: permissionCount })}
        </span>
      </div>

      {setPreviewRole ? (
        <div className="grid max-w-sm gap-1.5">
          <Label htmlFor="role-preview" className="text-xs">
            {t("switchRole")}
          </Label>
          <Select
            value={role ?? ""}
            onValueChange={(value) => {
              if (!setPreviewRole(value as Role)) {
                toast.error(t("switchFailed"));
                return;
              }
              toast.success(t("switched", { role: t(`roles.${value as Role}`) }));
            }}
          >
            <SelectTrigger id="role-preview" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {previewableRoles.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`roles.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </SectionCard>
  );
}
