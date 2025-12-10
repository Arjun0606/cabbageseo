/**
 * Instantly.ai API Integration
 * 
 * Cold email outreach automation:
 * - Campaign management
 * - Lead management
 * - Email sequences
 * - Analytics
 * 
 * @see https://developer.instantly.ai/
 */

// ============================================
// TYPES
// ============================================

export interface InstantlyCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "draft";
  created_at: string;
  daily_limit: number;
}

export interface InstantlyLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  website?: string;
  custom_variables?: Record<string, string>;
}

export interface InstantlyEmailStep {
  subject: string;
  body: string;
  delay_days: number;
}

export interface CampaignStats {
  campaign_id: string;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
  open_rate: number;
  reply_rate: number;
}

// ============================================
// INSTANTLY CLIENT
// ============================================

export class InstantlyClient {
  private apiKey: string;
  private baseUrl = "https://api.instantly.ai/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.INSTANTLY_API_KEY || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    if (!this.apiKey) {
      console.warn("Instantly API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.error("Instantly API error:", response.status);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Instantly request failed:", error);
      return null;
    }
  }

  /**
   * List all campaigns
   */
  async listCampaigns(): Promise<InstantlyCampaign[]> {
    const result = await this.request<InstantlyCampaign[]>(
      `/campaign/list?api_key=${this.apiKey}`
    );
    return result || [];
  }

  /**
   * Create a new outreach campaign
   */
  async createCampaign(
    name: string,
    options: {
      from_email: string;
      daily_limit?: number;
    }
  ): Promise<InstantlyCampaign | null> {
    return this.request<InstantlyCampaign>(`/campaign/create`, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        name,
        ...options,
      }),
    });
  }

  /**
   * Add leads to a campaign
   */
  async addLeads(
    campaignId: string,
    leads: InstantlyLead[]
  ): Promise<{ added: number } | null> {
    return this.request<{ added: number }>(`/lead/add`, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        campaign_id: campaignId,
        leads: leads.map(lead => ({
          email: lead.email,
          first_name: lead.first_name || "",
          last_name: lead.last_name || "",
          company_name: lead.company_name || "",
          website: lead.website || "",
          ...lead.custom_variables,
        })),
      }),
    });
  }

  /**
   * Set email sequence for a campaign
   */
  async setEmailSequence(
    campaignId: string,
    steps: InstantlyEmailStep[]
  ): Promise<boolean> {
    const result = await this.request(`/campaign/set-sequence`, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        campaign_id: campaignId,
        sequences: steps.map((step, index) => ({
          step: index + 1,
          subject: step.subject,
          body: step.body,
          delay: step.delay_days,
        })),
      }),
    });
    return result !== null;
  }

  /**
   * Start a campaign
   */
  async startCampaign(campaignId: string): Promise<boolean> {
    const result = await this.request(`/campaign/activate`, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        campaign_id: campaignId,
      }),
    });
    return result !== null;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    const result = await this.request(`/campaign/pause`, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        campaign_id: campaignId,
      }),
    });
    return result !== null;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    return this.request<CampaignStats>(
      `/analytics/campaign/summary?api_key=${this.apiKey}&campaign_id=${campaignId}`
    );
  }

  /**
   * Get leads status
   */
  async getLeadStatus(
    campaignId: string,
    email: string
  ): Promise<{
    status: "pending" | "sent" | "opened" | "replied" | "bounced";
    sent_count: number;
    open_count: number;
  } | null> {
    return this.request(
      `/lead/status?api_key=${this.apiKey}&campaign_id=${campaignId}&email=${email}`
    );
  }
}

// ============================================
// SINGLETON
// ============================================

export const instantly = new InstantlyClient();

