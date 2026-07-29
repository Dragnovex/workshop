"use client";

import { useLocale, useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { statusStyles } from "@/components/patterns/status-badge";
import { getWorkOrderTotals } from "../read-models";
import type { WorkOrder } from "../types";

const PART_STATUS_STYLES = {
  installed: "bg-status-ready-subtle text-success-text",
  ordered: "bg-status-awaiting-parts-subtle text-status-awaiting-parts",
  available: "bg-muted text-muted-foreground",
} as const;

export function DetailTabs({ order }: { order: WorkOrder }) {
  const t = useTranslations("workOrders.detail");
  const tStatus = useTranslations("workOrders.status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";

  const totals = getWorkOrderTotals(order);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="h-9 max-w-full overflow-x-auto">
        <TabsTrigger value="overview" className="text-xs">
          {t("tabs.overview")}
        </TabsTrigger>
        <TabsTrigger value="items" className="text-xs">
          {t("tabs.items")}
          {order.items.length > 0 && (
            <span
              data-numeric
              className="ms-1.5 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px]"
            >
              {order.items.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="parts" className="text-xs">
          {t("tabs.parts")}
          {order.parts.length > 0 && (
            <span
              data-numeric
              className="ms-1.5 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px]"
            >
              {order.parts.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs">
          {t("tabs.history")}
        </TabsTrigger>
      </TabsList>

      {/* نظرة عامة */}
      <TabsContent value="overview" className="mt-4 space-y-4">
        {/* شكوى العميل */}
        <div className="surface-card space-y-3 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("complaint")}
          </p>
          <p className="text-sm">{order.complaint[lang]}</p>
        </div>

        {/* تشخيص الفني */}
        {order.diagnosis ? (
          <div className="surface-card space-y-3 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("diagnosis")}
            </p>
            <p className="text-sm">{order.diagnosis[lang]}</p>
          </div>
        ) : null}

        {/* الملخص المالي */}
        {totals.total > 0 ? (
          <div className="surface-card divide-y divide-border">
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t("laborTotal")}</span>
              <span data-numeric>
                {formatCurrency(totals.labor, locale)} <span className="ms-0.5 text-xs text-muted-foreground">{tCommon("currency")}</span>
              </span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t("partsTotal")}</span>
              <span data-numeric>
                {formatCurrency(totals.parts, locale)} <span className="ms-0.5 text-xs text-muted-foreground">{tCommon("currency")}</span>
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span data-numeric className="text-success-text">
                  -{formatCurrency(totals.discount, locale)} <span className="ms-0.5 text-xs">{tCommon("currency")}</span>
                </span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3">
              <span className="font-semibold">{t("total")}</span>
              <span data-numeric className="text-lg font-semibold">
                {formatCurrency(totals.total, locale)} <span className="ms-0.5 text-sm font-normal text-muted-foreground">{tCommon("currency")}</span>
              </span>
            </div>
          </div>
        ) : null}
      </TabsContent>

      {/* بنود العمل */}
      <TabsContent value="items" className="mt-4">
        <div className="surface-card overflow-hidden">
          {order.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      item.done ? "bg-status-ready" : "bg-status-awaiting-approval",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.description[lang]}</p>
                    <p className="text-2xs text-muted-foreground">
                      <span data-numeric>{item.hours}</span>
                      {" "}
                      {t("hours")}
                      {" · "}
                      <span data-numeric>{formatCurrency(item.rate, locale)}</span>
                      {" "}
                      {tCommon("currency")}/{t("hours")}
                    </p>
                  </div>
                  <div className="text-end">
                    <p data-numeric className="text-sm font-medium">
                      {formatCurrency(item.hours * item.rate, locale)}
                    </p>
                    <p className="text-2xs text-muted-foreground">{tCommon("currency")}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      item.done
                        ? "bg-status-ready-subtle text-success-text"
                        : "bg-status-awaiting-approval-subtle text-warning-text",
                    )}
                  >
                    {item.done ? t("done") : t("pending")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* القطع */}
      <TabsContent value="parts" className="mt-4">
        <div className="surface-card overflow-hidden">
          {order.parts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <div className="divide-y divide-border">
              {order.parts.map((part) => (
                <div key={part.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{part.name[lang]}</p>
                    <p data-ltr className="text-2xs text-muted-foreground">
                      {part.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                        PART_STATUS_STYLES[part.installStatus],
                      )}
                    >
                      {t(`partStatus.${part.installStatus}`)}
                    </span>
                    <div className="text-end">
                      <p data-numeric className="text-sm font-medium">
                        {formatCurrency(part.qty * part.unitPrice, locale)}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        <span data-numeric>{part.qty}</span> × <span data-numeric>{formatCurrency(part.unitPrice, locale)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* السجل الزمني */}
      <TabsContent value="history" className="mt-4">
        <div className="surface-card p-4">
          <ol className="relative border-s border-border ps-6 space-y-6">
            {order.timeline.map((event, idx) => {
              const style = statusStyles[event.status];
              const isLast = idx === order.timeline.length - 1;
              return (
                <li key={event.id} className="relative">
                  <span
                    className={cn(
                      "absolute -start-[1.3125rem] flex size-5 items-center justify-center rounded-full border-2 border-background",
                      style.dot,
                    )}
                  />
                  <div className={cn("space-y-1", !isLast && "pb-1")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                          style.chip,
                        )}
                      >
                        {tStatus(event.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.timestamp, locale)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {event.actor[lang]}
                      </span>
                    </div>
                    {event.note ? (
                      <p className="text-sm text-muted-foreground">{event.note[lang]}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </TabsContent>
    </Tabs>
  );
}
