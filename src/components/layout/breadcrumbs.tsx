"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findNavGroup, findNavItem } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * مسار التنقّل مشتقّ من config/navigation — لا يُكتب يدويًا في أي صفحة.
 * الفاصل سهم يسار، ويُقلب تلقائيًا في الإنجليزية عبر rtl/ltr.
 */
export function Breadcrumbs() {
  const t = useTranslations("nav");
  const tCrumb = useTranslations("breadcrumbs");
  const pathname = usePathname();

  const item = findNavItem(pathname);
  const group = item ? findNavGroup(item) : undefined;
  const isHome = pathname === "/";

  // في لوحة التحكم لا يوجد مسار — هي الجذر نفسه.
  const trail = isHome
    ? []
    : [
        ...(group ? [{ key: `groups.${group.key}` }] : []),
        ...(item ? [{ key: item.key }] : []),
      ];

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1 sm:gap-1.5">
        <BreadcrumbItem>
          {isHome ? (
            <BreadcrumbPage className="font-medium">
              {t("dashboard")}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/">{tCrumb("home")}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {trail.map((crumb, index) => (
          <Fragment key={crumb.key}>
            <BreadcrumbSeparator className="[&>svg]:size-3.5">
              <ChevronLeft className="ltr:rotate-180" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {index === trail.length - 1 ? (
                <BreadcrumbPage className="font-medium">
                  {t(crumb.key)}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{t(crumb.key)}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
