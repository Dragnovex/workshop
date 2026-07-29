import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * تخطيط المصادقة: عمود العلامة + عمود النموذج.
 * عمود العلامة يبقى داكنًا في السمتين — هو سطح هوية لا سطح واجهة،
 * وهو الموضع الذي يُسمح فيه للأحمر بأن يكون كبيرًا.
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const tPanel = await getTranslations("auth.brandPanel");

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
      {/* عمود النموذج */}
      <div className="relative flex flex-col">
        <div className="absolute top-4 end-4 flex items-center gap-1">
          <ThemeToggle />
          <LocaleToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center lg:hidden">
              <BrandLogo height={28} />
            </div>
            {children}
          </div>
        </div>

        <footer className="px-5 pb-6 text-center text-2xs text-muted-foreground sm:px-8">
          {t("company")}
        </footer>
      </div>

      {/* عمود العلامة */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.2393_0_0)] text-[oklch(0.97_0_0)] lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(1 0 0) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* توهّج أحمر خافت — أثر لا لون */}
        <div
          aria-hidden
          className="absolute -top-32 -end-24 size-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "oklch(0.5622 0.2136 26.35)" }}
        />

        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
          <div className="flex flex-col gap-2">
            <BrandLogo height={36} />
            <span className="text-2xs text-[oklch(0.97_0_0)]/55">
              {t("company")}
            </span>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-4xl font-semibold tracking-tight text-balance">
              {tPanel("heading")}
            </h2>
            <p className="text-md leading-relaxed text-[oklch(0.97_0_0)]/65">
              {tPanel("body")}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-[oklch(1_0_0)]/10 pt-8">
            {[
              { label: tPanel("stat1"), value: "2.4", suffix: "h" },
              { label: tPanel("stat2"), value: "38", suffix: "" },
              { label: tPanel("stat3"), value: "94", suffix: "%" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <dd
                  data-ltr
                  data-numeric
                  className="text-2xl font-semibold tracking-tight"
                >
                  {stat.value}
                  <span className="text-md text-[oklch(0.97_0_0)]/50">
                    {stat.suffix}
                  </span>
                </dd>
                <dt className="text-2xs text-[oklch(0.97_0_0)]/55">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
