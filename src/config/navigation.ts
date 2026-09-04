import {
  BarChart3,
  BookLock,
  Calculator,
  CalendarDays,
  Car,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * مصدر الحقيقة الوحيد للتنقّل.
 * يغذّي: الشريط الجانبي، مسار التنقّل (breadcrumbs)، ولوحة الأوامر.
 * لا تُعرَّف روابط التنقّل في أي مكان آخر.
 *
 * `key` = مفتاح الترجمة تحت nav.* في messages/*.json
 * `href` = مسار إنجليزي بلا بادئة لغة (تُضاف تلقائيًا عبر i18n/navigation)
 */
export type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  /** ready = مبنية في هذه المرحلة، planned = الهيكل جاهز والمحتوى لاحقًا */
  status: "ready" | "planned";
};

export type NavGroup = {
  key: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    key: "operations",
    items: [
      {
        key: "dashboard",
        href: "/",
        icon: LayoutDashboard,
        status: "ready",
      },
      {
        key: "workOrders",
        href: "/work-orders",
        icon: ClipboardList,
        status: "ready",
      },
      {
        key: "appointments",
        href: "/appointments",
        icon: CalendarDays,
        status: "ready",
      },
      {
        key: "estimates",
        href: "/estimates",
        icon: FileText,
        status: "ready",
      },
    ],
  },
  {
    key: "customers",
    items: [
      { key: "customers", href: "/customers", icon: Users, status: "ready" },
      { key: "vehicles", href: "/vehicles", icon: Car, status: "ready" },
    ],
  },
  {
    key: "supply",
    items: [
      { key: "inventory", href: "/inventory", icon: Package, status: "ready" },
      {
        key: "purchasing",
        href: "/purchasing",
        icon: ShoppingCart,
        status: "ready",
      },
      { key: "suppliers", href: "/suppliers", icon: Truck, status: "ready" },
    ],
  },
  {
    key: "finance",
    items: [
      { key: "invoices", href: "/invoices", icon: Receipt, status: "ready" },
      { key: "returns", href: "/returns", icon: RotateCcw, status: "ready" },
      {
        key: "accounting",
        href: "/accounting",
        icon: Calculator,
        status: "ready",
      },
      {
        key: "dailyClosing",
        href: "/daily-closing",
        icon: BookLock,
        status: "ready",
      },
    ],
  },
  {
    key: "company",
    items: [
      { key: "employees", href: "/employees", icon: UserCog, status: "ready" },
      { key: "marketing", href: "/marketing", icon: Megaphone, status: "ready" },
      { key: "reports", href: "/reports", icon: BarChart3, status: "ready" },
    ],
  },
];

export const settingsNavItem: NavItem = {
  key: "settings",
  href: "/settings",
  icon: Settings,
  status: "ready",
};

/** كل عناصر التنقّل مسطّحة — للبحث وبناء مسار التنقّل. */
export const allNavItems: NavItem[] = [
  ...navigation.flatMap((group) => group.items),
  settingsNavItem,
];

/** إيجاد العنصر المطابق لمسار حالي (بعد إزالة بادئة اللغة). */
export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return allNavItems.find((item) => item.href === "/");
  }
  return allNavItems
    .filter((item) => item.href !== "/")
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
}

/** المجموعة التي ينتمي إليها عنصر — يستخدمها مسار التنقّل. */
export function findNavGroup(item: NavItem): NavGroup | undefined {
  return navigation.find((group) => group.items.includes(item));
}
