import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * هيكل التطبيق: شريط جانبي قابل للطي + شريط علوي ثابت + منطقة محتوى.
 * هذا التخطيط واحد في السمتين وفي اللغتين — الألوان والاتجاه فقط هما ما يتغيّر.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // نقرأ حالة الطي من الكوكي على الخادم لتفادي وميض الانهيار عند أول رسم.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-surface-subtle">
        <AppHeader />
        {/* SidebarInset يصيّر <main> بنفسه — لا نضع main آخر بداخله */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
