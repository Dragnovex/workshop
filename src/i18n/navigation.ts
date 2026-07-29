import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * بدائل واعية باللغة لـ next/link و next/navigation.
 * استخدم هذه دائمًا داخل التطبيق بدل الاستيراد من next مباشرة،
 * وإلا ضاعت بادئة اللغة عند التنقّل.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
