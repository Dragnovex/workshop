import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  statusStyles,
  workOrderStatuses,
} from "@/components/patterns/status-badge";
import type { WorkOrderStatus } from "../types";

export function LifecycleTracker({ status }: { status: WorkOrderStatus }) {
  const t = useTranslations("workOrders.status");
  const tState = useTranslations("workOrders.detail.lifecycleState");
  const currentIndex = workOrderStatuses.indexOf(status);

  return (
    <ol className="relative flex min-w-[44rem] items-start gap-0 pb-1">
      {workOrderStatuses.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const pending = index > currentIndex;

        return (
          <li
            key={step}
            className="flex min-w-0 flex-1 flex-col items-center"
            aria-current={active ? "step" : undefined}
          >
            <div className="relative flex w-full items-center">
              {/* الخط الأيمن / الوصلة */}
              <div
                className={cn(
                  "h-px flex-1",
                  index === 0 ? "invisible" : done || active ? "bg-status-ready" : "bg-border",
                )}
              />
              {/* نقطة الخطوة */}
              <div
                className={cn(
                  "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-status-ready bg-status-ready text-primary-foreground",
                  active && cn("border-transparent text-primary-foreground", statusStyles[step].dot),
                  pending && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="text-[10px] font-semibold leading-none" data-numeric>
                    {index + 1}
                  </span>
                )}
              </div>
              {/* الخط الأيسر / الوصلة */}
              <div
                className={cn(
                  "h-px flex-1",
                  index === workOrderStatuses.length - 1
                    ? "invisible"
                    : done
                      ? "bg-status-ready"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 px-1 text-center text-[10px] leading-tight whitespace-nowrap",
                active && "font-semibold text-foreground",
                done && "text-muted-foreground",
                pending && "text-muted-foreground",
              )}
            >
              {t(step)}
              <span className="sr-only">
                {": "}
                {tState(done ? "completed" : active ? "current" : "upcoming")}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
