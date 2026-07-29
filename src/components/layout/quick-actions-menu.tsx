"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quickActions } from "@/config/quick-actions";
import { Link } from "@/i18n/navigation";

/**
 * الفعل الأساسي الوحيد في الشريط العلوي — ولهذا هو الزر الأحمر الوحيد فيه.
 */
export function QuickActionsMenu() {
  const t = useTranslations("quickActions");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 ps-2.5 pe-2">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("label")}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {quickActions.map((action) => (
          <DropdownMenuItem
            key={action.href}
            asChild={action.available}
            disabled={!action.available}
            className="gap-2"
          >
            {action.available ? <Link href={action.href}>
              <action.icon className="size-4 text-muted-foreground" />
              {t(action.key)}
              {action.shortcut ? (
                <DropdownMenuShortcut>⌘{action.shortcut}</DropdownMenuShortcut>
              ) : null}
            </Link> : <span className="flex items-center gap-2">
              <action.icon className="size-4 text-muted-foreground" />
              {t(action.key)}
            </span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
