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
import { Link, useRouter } from "@/i18n/navigation";
import { displayUser } from "@/lib/auth/display-user";
import type { SessionUser } from "@/lib/auth/types";
import { signOutAction } from "@/modules/auth/actions";

export function UserMenu({ user }: { user: SessionUser | null }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const router = useRouter();

  // مستخدم حقيقي عند وجود جلسة، وإلا مستخدم العرض في وضع البذرة.
  const name = user?.name ?? displayUser.name[lang];
  const email = user?.email ?? displayUser.email;
  const initials = user
    ? name.trim().charAt(0).toUpperCase()
    : displayUser.initials[lang];

  async function handleSignOut() {
    await signOutAction();
    router.replace("/login");
    router.refresh();
  }

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
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-2xs text-muted-foreground" data-ltr>
            {email}
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
        {/*
          كان رابطًا إلى /login فقط — لا يُنهي أي جلسة. مع تفعيل المصادقة
          كان الحارس سيعيد المستخدم إلى اللوحة فورًا وكأن الزر لا يعمل.
        */}
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="gap-2 text-danger-text"
        >
          <LogOut className="size-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
