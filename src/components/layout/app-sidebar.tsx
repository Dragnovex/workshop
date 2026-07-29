"use client";

import { useLocale, useTranslations } from "next-intl";

import { BrandLogo } from "@/components/layout/brand-logo";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigation, settingsNavItem, type NavItem } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { getDirection } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function isItemActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** شريط أحمر رفيع على الحافة الداخلية يعلّم العنصر النشط. */
const activeIndicator =
  "relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary";

function NavMenuItem({ item, label }: { item: NavItem; label: string }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const active = isItemActive(pathname, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          activeIndicator,
          "gap-2.5",
          !active && "text-sidebar-foreground/75 hover:text-sidebar-foreground",
        )}
      >
        <Link
          href={item.href}
          onClick={() => isMobile && setOpenMobile(false)}
          aria-current={active ? "page" : undefined}
        >
          <item.icon
            className={cn(
              "transition-colors",
              active ? "text-primary" : "text-current",
            )}
          />
          <span className="truncate">{label}</span>
          {item.status === "planned" ? (
            <span
              aria-hidden
              className="ms-auto size-1.5 shrink-0 rounded-full bg-border-strong group-data-[collapsible=icon]:hidden"
            />
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const locale = useLocale();
  const dir = getDirection(locale);

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      collapsible="icon"
      // الحافة الداخلية هي التي تحمل الفاصل، في الاتجاهين.
      className={cn(dir === "rtl" && "border-s-0! border-e!")}
    >
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-1.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="hidden group-data-[collapsible=icon]:flex">
            <BrandMark />
          </span>
          <span className="flex min-w-0 flex-col gap-1 group-data-[collapsible=icon]:hidden">
            <BrandLogo height={22} />
            <span className="truncate text-2xs text-muted-foreground">
              {tApp("tagline")}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-2">
        {navigation.map((group) => (
          <SidebarGroup key={group.key} className="py-1">
            <SidebarGroupLabel className="px-2 text-2xs font-medium tracking-wide text-muted-foreground/80 uppercase">
              {t(`groups.${group.key}`)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.href}
                    item={item}
                    label={t(item.key)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        <SidebarMenu>
          <NavMenuItem item={settingsNavItem} label={t(settingsNavItem.key)} />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
