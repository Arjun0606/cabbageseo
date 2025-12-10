/**
 * Hunter.io API Integration
 * 
 * Find email addresses for backlink outreach:
 * - Domain search (find all emails at a domain)
 * - Email finder (find specific person's email)
 * - Email verification
 * 
 * @see https://hunter.io/api-documentation
 */

// ============================================
// TYPES
// ============================================

export interface HunterEmail {
  value: string;
  type: "personal" | "generic";
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  linkedin: string | null;
  twitter: string | null;
  phone_number: string | null;
}

export interface DomainSearchResult {
  domain: string;
  organization: string;
  emails: HunterEmail[];
  pattern: string | null;
  webmail: boolean;
}

export interface EmailFinderResult {
  email: string;
  score: number;
  domain: string;
  first_name: string;
  last_name: string;
  position: string | null;
  linkedin_url: string | null;
}

export interface EmailVerifyResult {
  email: string;
  status: "valid" | "invalid" | "accept_all" | "unknown";
  score: number;
  regexp: boolean;
  gibberish: boolean;
  disposable: boolean;
  webmail: boolean;
  mx_records: boolean;
  smtp_server: boolean;
  smtp_check: boolean;
}

// ============================================
// HUNTER.IO CLIENT
// ============================================

export class HunterClient {
  private apiKey: string;
  private baseUrl = "https://api.hunter.io/v2";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUNTER_API_KEY || "";
  }

  /**
   * Find all emails at a domain
   */
  async domainSearch(
    domain: string,
    options: {
      type?: "personal" | "generic";
      department?: string;
      limit?: number;
    } = {}
  ): Promise<DomainSearchResult | null> {
    if (!this.apiKey) {
      console.warn("Hunter.io API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      domain,
      api_key: this.apiKey,
      ...(options.type && { type: options.type }),
      ...(options.department && { department: options.department }),
      ...(options.limit && { limit: options.limit.toString() }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/domain-search?${params}`);
      const data = await response.json();

      if (data.errors) {
        console.error("Hunter.io error:", data.errors);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error("Hunter.io request failed:", error);
      return null;
    }
  }

  /**
   * Find a specific person's email
   */
  async findEmail(
    domain: string,
    firstName: string,
    lastName: string
  ): Promise<EmailFinderResult | null> {
    if (!this.apiKey) {
      console.warn("Hunter.io API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: this.apiKey,
    });

    try {
      const response = await fetch(`${this.baseUrl}/email-finder?${params}`);
      const data = await response.json();

      if (data.errors) {
        console.error("Hunter.io error:", data.errors);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error("Hunter.io request failed:", error);
      return null;
    }
  }

  /**
   * Verify an email address
   */
  async verifyEmail(email: string): Promise<EmailVerifyResult | null> {
    if (!this.apiKey) {
      console.warn("Hunter.io API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      email,
      api_key: this.apiKey,
    });

    try {
      const response = await fetch(`${this.baseUrl}/email-verifier?${params}`);
      const data = await response.json();

      if (data.errors) {
        console.error("Hunter.io error:", data.errors);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error("Hunter.io request failed:", error);
      return null;
    }
  }

  /**
   * Get account info and remaining credits
   */
  async getAccountInfo(): Promise<{ 
    requests: { used: number; available: number };
    email_verifications: { used: number; available: number };
  } | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/account?api_key=${this.apiKey}`
      );
      const data = await response.json();
      return data.data;
    } catch {
      return null;
    }
  }
}

// ============================================
// SINGLETON
// ============================================

export const hunter = new HunterClient();

