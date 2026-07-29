"use client";

import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { allNavItems } from "@/config/navigation";
import { quickActions } from "@/config/quick-actions";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * لوحة الأوامر — مصدرها نفس config/navigation و config/quick-actions،
 * فلا يوجد أي احتمال لانحراف القائمة عن الشريط الجانبي.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("command");
  const tNav = useTranslations("nav");
  const tActions = useTranslations("quickActions");
  const tTheme = useTranslations("theme");
  const tLocale = useTranslations("locale");

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { setTheme } = useTheme();

  const run = React.useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("placeholder")}
      className="top-[18%] translate-y-0"
    >
      <CommandInput placeholder={t("placeholder")} />
      <CommandList className="max-h-[22rem]">
        <CommandEmpty>{t("empty")}</CommandEmpty>

        <CommandGroup heading={t("groups.navigation")}>
          {allNavItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${tNav(item.key)} ${item.href}`}
              onSelect={() => run(() => router.push(item.href))}
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span>{tNav(item.key)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("groups.actions")}>
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={tActions(action.key)}
              disabled={!action.available}
              onSelect={() =>
                action.available && run(() => router.push(action.href))
              }
            >
              <action.icon className="size-4 text-muted-foreground" />
              <span>{tActions(action.key)}</span>
              {action.shortcut ? (
                <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("groups.preferences")}>
          <CommandItem
            value={`${tTheme("toggle")} ${tTheme("light")}`}
            onSelect={() => run(() => setTheme("light"))}
          >
            <Sun className="size-4 text-muted-foreground" />
            <span>{tTheme("light")}</span>
          </CommandItem>
          <CommandItem
            value={`${tTheme("toggle")} ${tTheme("dark")}`}
            onSelect={() => run(() => setTheme("dark"))}
          >
            <Moon className="size-4 text-muted-foreground" />
            <span>{tTheme("dark")}</span>
          </CommandItem>
          <CommandItem
            value={`${tTheme("toggle")} ${tTheme("system")}`}
            onSelect={() => run(() => setTheme("system"))}
          >
            <Monitor className="size-4 text-muted-foreground" />
            <span>{tTheme("system")}</span>
          </CommandItem>
          {routing.locales
            .filter((item) => item !== locale)
            .map((item) => (
              <CommandItem
                key={item}
                value={`${tLocale("switch")} ${tLocale(item)}`}
                onSelect={() =>
                  run(() => router.replace(pathname, { locale: item }))
                }
              >
                <Languages className="size-4 text-muted-foreground" />
                <span>
                  {tLocale("switch")} — {tLocale(item)}
                </span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** يربط اختصار ⌘K / Ctrl+K بحالة فتح اللوحة. */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
