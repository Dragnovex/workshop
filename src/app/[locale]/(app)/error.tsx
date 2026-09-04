"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[100rem] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface-subtle text-danger-text">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </span>
      <div className="max-w-md space-y-1.5">
        <h1 className="text-lg font-semibold tracking-tight">{t("errorTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("errorBody")}</p>
      </div>
      <Button onClick={() => reset()}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {t("tryAgain")}
      </Button>
    </div>
  );
}
