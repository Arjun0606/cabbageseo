/**
 * Apollo.io API Integration
 * 
 * All-in-one outreach platform:
 * - Email finding (replaces Hunter.io)
 * - Email sequences (replaces Instantly.ai)
 * - Contact enrichment
 * - Lead database
 * 
 * Free tier: 50 credits/month
 * 
 * @see https://apolloio.github.io/apollo-api-docs/
 */

// ============================================
// TYPES
// ============================================

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  email_status: "verified" | "guessed" | "unavailable";
  title: string;
  organization_name: string;
  organization?: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string;
    industry: string;
    estimated_num_employees: number;
  };
  linkedin_url: string;
  twitter_url: string;
  city: string;
  state: string;
  country: string;
}

export interface ApolloSearchResult {
  contacts: ApolloContact[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloEmailSequence {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  num_steps: number;
  unique_scheduled: number;
  unique_delivered: number;
  unique_opened: number;
  unique_replied: number;
}

export interface ApolloSequenceStep {
  position: number;
  type: "auto_email" | "manual_email" | "call" | "task";
  wait_time: number; // days
  subject?: string;
  body?: string;
}

export interface ApolloEnrichmentResult {
  person: ApolloContact | null;
  organization: ApolloContact["organization"] | null;
}

// ============================================
// APOLLO CLIENT
// ============================================

export class ApolloClient {
  private apiKey: string;
  private baseUrl = "https://api.apollo.io/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    if (!this.apiKey) {
      console.warn("Apollo API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          ...options.headers,
        },
        body: options.body ? 
          JSON.stringify({ ...JSON.parse(options.body as string), api_key: this.apiKey }) : 
          JSON.stringify({ api_key: this.apiKey }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Apollo API error:", response.status, error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Apollo request failed:", error);
      return null;
    }
  }

  // ============================================
  // EMAIL FINDING (replaces Hunter.io)
  // ============================================

  /**
   * Search for contacts at a domain
   */
  async searchContacts(
    domain: string,
    options: {
      titles?: string[];      // e.g., ["Marketing Manager", "Content Lead"]
      limit?: number;
    } = {}
  ): Promise<ApolloContact[]> {
    const result = await this.request<ApolloSearchResult>("/mixed_people/search", {
      method: "POST",
      body: JSON.stringify({
        q_organization_domains: domain,
        person_titles: options.titles,
        per_page: options.limit || 10,
        page: 1,
      }),
    });

    return result?.contacts || [];
  }

  /**
   * Find a specific person's email
   */
  async findEmail(
    firstName: string,
    lastName: string,
    domain: string
  ): Promise<ApolloContact | null> {
    const result = await this.request<ApolloSearchResult>("/mixed_people/search", {
      method: "POST",
      body: JSON.stringify({
        q_organization_domains: domain,
        person_first_name: firstName,
        person_last_name: lastName,
        per_page: 1,
      }),
    });

    return result?.contacts?.[0] || null;
  }

  /**
   * Enrich a contact with more data
   */
  async enrichContact(
    email?: string,
    linkedinUrl?: string,
    domain?: string
  ): Promise<ApolloEnrichmentResult | null> {
    return this.request<ApolloEnrichmentResult>("/people/match", {
      method: "POST",
      body: JSON.stringify({
        email,
        linkedin_url: linkedinUrl,
        organization_domain: domain,
      }),
    });
  }

  /**
   * Bulk enrich contacts
   */
  async bulkEnrich(
    contacts: Array<{ email?: string; linkedin_url?: string; domain?: string }>
  ): Promise<ApolloEnrichmentResult[]> {
    const results: ApolloEnrichmentResult[] = [];
    
    // Apollo doesn't have a bulk endpoint, so we batch requests
    for (const contact of contacts.slice(0, 10)) { // Limit to 10 to save credits
      const result = await this.enrichContact(
        contact.email,
        contact.linkedin_url,
        contact.domain
      );
      if (result) results.push(result);
    }
    
    return results;
  }

  // ============================================
  // EMAIL SEQUENCES (replaces Instantly.ai)
  // ============================================

  /**
   * List all email sequences
   */
  async listSequences(): Promise<ApolloEmailSequence[]> {
    const result = await this.request<{ emailer_campaigns: ApolloEmailSequence[] }>(
      "/emailer_campaigns/search",
      { method: "POST", body: JSON.stringify({}) }
    );
    return result?.emailer_campaigns || [];
  }

  /**
   * Create a new email sequence
   */
  async createSequence(
    name: string,
    steps: ApolloSequenceStep[]
  ): Promise<ApolloEmailSequence | null> {
    // First create the sequence
    const sequence = await this.request<{ emailer_campaign: ApolloEmailSequence }>(
      "/emailer_campaigns",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          permissions: "team",
          active: false,
        }),
      }
    );

    if (!sequence?.emailer_campaign) return null;

    // Then add steps
    for (const step of steps) {
      await this.request("/emailer_steps", {
        method: "POST",
        body: JSON.stringify({
          emailer_campaign_id: sequence.emailer_campaign.id,
          position: step.position,
          type: step.type,
          wait_time: step.wait_time,
          exact_datetime: null,
          priority: "normal",
          emailer_template: step.type === "auto_email" ? {
            subject: step.subject,
            body_html: step.body,
          } : undefined,
        }),
      });
    }

    return sequence.emailer_campaign;
  }

  /**
   * Add contacts to a sequence
   */
  async addContactsToSequence(
    sequenceId: string,
    contactIds: string[]
  ): Promise<{ added: number }> {
    const result = await this.request<{ contacts: unknown[] }>(
      "/emailer_campaigns/add_contact_ids",
      {
        method: "POST",
        body: JSON.stringify({
          emailer_campaign_id: sequenceId,
          contact_ids: contactIds,
          send_email_from_email_account_id: null, // Use default
        }),
      }
    );
    
    return { added: result?.contacts?.length || 0 };
  }

  /**
   * Start/activate a sequence
   */
  async activateSequence(sequenceId: string): Promise<boolean> {
    const result = await this.request(
      `/emailer_campaigns/${sequenceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ active: true }),
      }
    );
    return result !== null;
  }

  /**
   * Pause a sequence
   */
  async pauseSequence(sequenceId: string): Promise<boolean> {
    const result = await this.request(
      `/emailer_campaigns/${sequenceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ active: false }),
      }
    );
    return result !== null;
  }

  /**
   * Get sequence analytics
   */
  async getSequenceStats(sequenceId: string): Promise<{
    delivered: number;
    opened: number;
    replied: number;
    openRate: number;
    replyRate: number;
  } | null> {
    const sequences = await this.listSequences();
    const sequence = sequences.find(s => s.id === sequenceId);
    
    if (!sequence) return null;

    const delivered = sequence.unique_delivered || 0;
    return {
      delivered,
      opened: sequence.unique_opened || 0,
      replied: sequence.unique_replied || 0,
      openRate: delivered > 0 ? (sequence.unique_opened / delivered) * 100 : 0,
      replyRate: delivered > 0 ? (sequence.unique_replied / delivered) * 100 : 0,
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Check API connection and credits
   */
  async checkConnection(): Promise<{
    connected: boolean;
    credits?: number;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { connected: false, error: "API key not configured" };
    }

    try {
      // Use a simple search to test connection
      const result = await this.request<{ pagination: { total_entries: number } }>(
        "/mixed_people/search",
        {
          method: "POST",
          body: JSON.stringify({ per_page: 1 }),
        }
      );

      if (result) {
        return { connected: true };
      }
      return { connected: false, error: "API call failed" };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

// ============================================
// SINGLETON
// ============================================

export const apollo = new ApolloClient();

