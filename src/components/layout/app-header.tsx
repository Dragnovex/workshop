"use client";

import { Bell, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/layout/command-palette";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { QuickActionsMenu } from "@/components/layout/quick-actions-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
        <SidebarTrigger
          aria-label={tNav("toggleSidebar")}
          className="size-8 text-muted-foreground hover:text-foreground [&>span]:hidden"
        />
        <Separator orientation="vertical" className="me-1 h-5" />

        <Breadcrumbs />

        <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
          {/* البحث العام — نفس لوحة الأوامر، مدخلان لسطح واحد */}
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            className="hidden h-8 w-56 justify-start gap-2 bg-surface-subtle px-2.5 text-muted-foreground font-normal hover:bg-surface-subtle lg:flex xl:w-72"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate text-sm">{t("search")}</span>
            <kbd className="ms-auto hidden shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-2xs text-muted-foreground sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label={t("search")}
            className="size-8 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Search className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("notifications")}
            className="relative size-8 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 end-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background" />
          </Button>

          <ThemeToggle />
          <LocaleToggle />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <QuickActionsMenu />
          <UserMenu />
        </div>
      </header>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
