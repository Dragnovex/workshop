"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getDirection } from "@/i18n/routing";
import { formatCompact, shortWeekday } from "@/lib/format";

export function RevenueChart({
  series,
}: {
  series: { dayOffset: number; labor: number; parts: number }[];
}) {
  const t = useTranslations("dashboard.revenue");
  const locale = useLocale();
  const isRtl = getDirection(locale) === "rtl";

  const chartConfig = {
    parts: { label: t("parts"), color: "var(--chart-2)" },
    labor: { label: t("labor"), color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const data = series.map((point) => ({
    ...point,
    day: shortWeekday(point.dayOffset, locale),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          reversed={isRtl}
          className="text-2xs"
        />
        <YAxis
          orientation={isRtl ? "right" : "left"}
          tickLine={false}
          axisLine={false}
          width={44}
          tickMargin={4}
          tickFormatter={(value: number) => formatCompact(value, locale)}
          className="text-2xs"
        />
        <ChartTooltip
          cursor={{ fill: "var(--surface-sunken)" }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="parts"
          stackId="revenue"
          fill="var(--color-parts)"
          radius={[0, 0, 4, 4]}
          maxBarSize={38}
        />
        <Bar
          dataKey="labor"
          stackId="revenue"
          fill="var(--color-labor)"
          radius={[4, 4, 0, 0]}
          maxBarSize={38}
        />
      </BarChart>
    </ChartContainer>
  );
}
