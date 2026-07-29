"use client";

import { Megaphone, Search, Target, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { campaignChannels, campaignStatuses, type Campaign, type CampaignChannel, type CampaignStatus } from "../types";

type ChannelFilter = "all" | CampaignChannel;
type StatusFilter = "all" | CampaignStatus;

export function MarketingView({ campaigns }: { campaigns: Campaign[] }) {
  const t = useTranslations("marketing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeCount = campaigns.filter((campaign) => campaign.status === "active").length;
  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalReach = campaigns.reduce((sum, campaign) => sum + campaign.reach, 0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (channelFilter !== "all" && campaign.channel !== channelFilter) return false;
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (!query) return true;
      return (
        campaign.name.ar.toLowerCase().includes(query) ||
        campaign.name.en.toLowerCase().includes(query)
      );
    });
  }, [campaigns, channelFilter, search, statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("stats.active")} value={formatNumber(activeCount, locale)} icon={Megaphone} tone="accent" />
        <StatCard label={t("stats.totalBudget")} value={formatCurrency(totalBudget, locale)} unit={tCommon("currency")} icon={Wallet} />
        <StatCard label={t("stats.totalReach")} value={formatNumber(totalReach, locale)} icon={Target} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="campaign-search" className="sr-only">{t("searchLabel")}</label>
          <Input
            id="campaign-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as ChannelFilter)}>
          <SelectTrigger aria-label={t("channelFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllChannels")}</SelectItem>
            {campaignChannels.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {t(`channel.${channel}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger aria-label={t("statusFilterLabel")} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {campaignStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4 text-xs whitespace-nowrap">{t("columns.name")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.channel")}</TableHead>
                <TableHead className="text-end text-xs whitespace-nowrap">{t("columns.budget")}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{t("columns.dates")}</TableHead>
                <TableHead className="pe-4 text-end text-xs whitespace-nowrap">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {tCommon("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((campaign) => (
                  <TableRow key={campaign.id} className="relative cursor-pointer">
                    <TableCell className="ps-4">
                      <Link
                        href={`/marketing/${campaign.id}`}
                        aria-label={t("openCampaign", { name: campaign.name[lang] })}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {campaign.name[lang]}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t(`channel.${campaign.channel}`)}</Badge></TableCell>
                    <TableCell data-numeric className="text-end text-sm">{formatCurrency(campaign.budget, locale)}</TableCell>
                    <TableCell data-numeric className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
                    </TableCell>
                    <TableCell className="pe-4 text-end">
                      <CampaignStatusBadge status={campaign.status} label={t(`status.${campaign.status}`)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
