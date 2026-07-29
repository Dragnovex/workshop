"use client";

import { CircleUser, LifeBuoy, LogOut, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { displayUser } from "@/lib/auth/display-user";

export function UserMenu() {
  const t = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-8 rounded-full p-0"
          aria-label={t("account")}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-secondary text-2xs font-medium">
              {displayUser.initials[lang]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium">{displayUser.name[lang]}</span>
          <span className="text-2xs text-muted-foreground" data-ltr>
            {displayUser.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <CircleUser className="size-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/settings">
            <Settings className="size-4" />
            {t("account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <LifeBuoy className="size-4" />
          {t("help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 text-danger-text">
          <Link href="/login">
            <LogOut className="size-4" />
            {t("signOut")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
