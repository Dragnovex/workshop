import type { LocalizedText } from "@/lib/domain/contracts";

export const campaignChannels = ["sms", "email", "social", "print"] as const;

export type CampaignChannel = (typeof campaignChannels)[number];

export const campaignStatuses = ["draft", "scheduled", "active", "completed", "paused"] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

export type Campaign = {
  id: string;
  name: LocalizedText;
  channel: CampaignChannel;
  status: CampaignStatus;
  targetSegment: LocalizedText;
  startDate: string;
  endDate: string;
  budget: number;
  reach: number;
  notes?: LocalizedText;
};
