import { setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAuthEnabled } from "@/lib/auth/config";
import { PermissionProvider } from "@/lib/auth/permission-context";
import { getSession } from "@/lib/auth/session";

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

  // حالة الطي تُحفظ وتُقرأ من جهة العميل (shadcn sidebar) — لا حاجة لقراءة كوكي الخادم.
  const defaultOpen = true;

  // الجلسة تُقرأ هنا مرة واحدة وتُمرَّر للشريط العلوي: المكوّنات التي تعرض
  // المستخدم عميلية، ولا يمكنها قراءة الجلسة بنفسها.
  // في وضع البذرة تعود null ويعرض الشريط مستخدم العرض كما كان.
  const session = await getSession();

  return (
    // مزوّد الصلاحيات هنا لا أدنى: كل صفحات التطبيق تحته، والدور يُقرأ مرة
    // واحدة. `authEnabled` يُقرأ على الخادم لأن DATA_SOURCE بلا بادئة
    // NEXT_PUBLIC عمدًا — العميل لا يستطيع قراءته بنفسه.
    <PermissionProvider user={session?.user ?? null} authEnabled={isAuthEnabled()}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader user={session?.user ?? null} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </PermissionProvider>
  );
}
