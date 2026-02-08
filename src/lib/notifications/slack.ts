/**
 * Slack Webhook Notification Utility
 *
 * Sends messages to Slack channels via incoming webhooks.
 * Non-fatal: returns boolean success status.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SlackPayload {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text?: string; url?: string }>;
  fields?: Array<{ type: string; text: string }>;
  [key: string]: unknown;
}

export async function sendSlackNotification(
  webhookUrl: string,
  payload: SlackPayload,
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("[Slack] Notification failed:", error);
    return false;
  }
}

export function buildCheckCompleteBlocks(data: {
  domain: string;
  score: number;
  queriesWon: number;
  queriesLost: number;
  topCompetitor?: string;
}): SlackPayload {
  const emoji = data.score >= 60 ? ":white_check_mark:" : data.score >= 30 ? ":warning:" : ":red_circle:";
  return {
    text: `AI check complete for ${data.domain}: Score ${data.score}/100`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} AI Visibility Check: ${data.domain}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Score:* ${data.score}/100` },
          {
            type: "mrkdwn",
            text: `*Queries:* ${data.queriesWon} won / ${data.queriesLost} lost`,
          },
          ...(data.topCompetitor
            ? [
                {
                  type: "mrkdwn",
                  text: `*Top Competitor:* ${data.topCompetitor}`,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

export function buildScoreDropBlocks(data: {
  domain: string;
  previousScore: number;
  newScore: number;
  drop: number;
  lostQueries?: string[];
}): SlackPayload {
  return {
    text: `:rotating_light: Score drop: ${data.domain} dropped ${data.drop} points (${data.previousScore} → ${data.newScore})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:rotating_light: Score Drop Alert: ${data.domain}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `AI visibility dropped from *${data.previousScore}* to *${data.newScore}* (-${data.drop} points)`,
        },
      },
      ...(data.lostQueries && data.lostQueries.length > 0
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "*Queries now losing:*\n" +
                  data.lostQueries.map((q) => `• _"${q}"_`).join("\n"),
              },
            },
          ]
        : []),
    ],
  };
}

export function buildWeeklySummaryBlocks(data: {
  domain: string;
  score: number;
  change: number;
  queriesWon: number;
  queriesLost: number;
}): SlackPayload {
  const trend =
    data.change > 0
      ? `:chart_with_upwards_trend: +${data.change}`
      : data.change < 0
        ? `:chart_with_downwards_trend: ${data.change}`
        : ":left_right_arrow: no change";
  return {
    text: `Weekly report: ${data.domain} — Score ${data.score}/100 (${trend})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:bar_chart: Weekly AI Visibility Report: ${data.domain}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Score:* ${data.score}/100` },
          { type: "mrkdwn", text: `*Trend:* ${trend}` },
          {
            type: "mrkdwn",
            text: `*Queries Won:* ${data.queriesWon}`,
          },
          {
            type: "mrkdwn",
            text: `*Queries Lost:* ${data.queriesLost}`,
          },
        ],
      },
    ],
  };
}

/**
 * Get Slack webhook URL from organization settings.
 * Returns null if not configured.
 */
export async function getOrgSlackWebhook(
  orgId: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    const settings = org?.settings as Record<string, unknown> | null;
    return (settings?.slackWebhookUrl as string) || null;
  } catch {
    return null;
  }
}
