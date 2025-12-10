/**
 * Backlink Outreach Orchestrator
 * 
 * Orchestrates existing outreach tools:
 * - Hunter.io for email finding
 * - Instantly.ai for campaign automation
 * - AI for personalized email generation
 * 
 * We DON'T rebuild outreach tools.
 * We INTEGRATE and ORCHESTRATE them.
 */

import { HunterClient, HunterEmail } from "@/lib/integrations/hunter/client";
import { InstantlyClient, InstantlyLead, InstantlyEmailStep } from "@/lib/integrations/instantly/client";
import { claude } from "@/lib/ai/claude-client";

// ============================================
// TYPES
// ============================================

export interface OutreachTarget {
  domain: string;
  pageUrl: string;
  pageTitle: string;
  reason: OutreachReason;
  priority: number;
}

export type OutreachReason = 
  | "broken_link"        // They have a broken link we can replace
  | "resource_mention"   // They mention our topic, we have a resource
  | "competitor_link"    // They link to competitor, we're better
  | "guest_post"         // They accept guest posts
  | "roundup"            // They do link roundups
  | "skyscraper";        // Our content is better than what they link

export interface OutreachCampaign {
  id: string;
  name: string;
  targets: OutreachTarget[];
  emailSequence: OutreachEmail[];
  status: "draft" | "finding_emails" | "ready" | "active" | "paused" | "completed";
  stats: {
    targetsFound: number;
    emailsSent: number;
    opened: number;
    replied: number;
    linksWon: number;
  };
}

export interface OutreachEmail {
  subject: string;
  body: string;
  delayDays: number;
}

export interface OutreachProspect {
  target: OutreachTarget;
  contacts: HunterEmail[];
  bestContact: HunterEmail | null;
  personalizedEmail: OutreachEmail | null;
}

// ============================================
// OUTREACH ORCHESTRATOR
// ============================================

export class OutreachOrchestrator {
  private hunter: HunterClient;
  private instantly: InstantlyClient;

  constructor(hunterApiKey?: string, instantlyApiKey?: string) {
    this.hunter = new HunterClient(hunterApiKey);
    this.instantly = new InstantlyClient(instantlyApiKey);
  }

  /**
   * Find link building opportunities from SERP data
   */
  async findOpportunities(
    keyword: string,
    ourUrl: string,
    serpResults: Array<{ url: string; title: string; snippet: string }>
  ): Promise<OutreachTarget[]> {
    const targets: OutreachTarget[] = [];
    const ourDomain = new URL(ourUrl).hostname;

    for (const result of serpResults) {
      try {
        const targetDomain = new URL(result.url).hostname;
        
        // Skip our own domain
        if (targetDomain === ourDomain) continue;

        // Analyze if this is a good outreach target
        const analysis = await this.analyzeTarget(result, keyword);
        
        if (analysis.isGoodTarget) {
          targets.push({
            domain: targetDomain,
            pageUrl: result.url,
            pageTitle: result.title,
            reason: analysis.reason,
            priority: analysis.priority,
          });
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return targets.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find contacts for outreach targets
   */
  async findContacts(targets: OutreachTarget[]): Promise<OutreachProspect[]> {
    const prospects: OutreachProspect[] = [];

    for (const target of targets) {
      const result = await this.hunter.domainSearch(target.domain, {
        type: "personal",
        limit: 5,
      });

      const contacts = result?.emails || [];
      
      // Find the best contact (editor, marketing, content roles)
      const bestContact = this.selectBestContact(contacts);

      prospects.push({
        target,
        contacts,
        bestContact,
        personalizedEmail: null,
      });
    }

    return prospects;
  }

  /**
   * Generate personalized outreach emails using AI
   */
  async generateOutreachEmails(
    prospect: OutreachProspect,
    ourContent: { title: string; url: string; summary: string }
  ): Promise<OutreachEmail[]> {
    const contactName = prospect.bestContact?.first_name || "there";
    
    const prompt = `Generate a 3-email outreach sequence for link building.

Context:
- Target site: ${prospect.target.domain}
- Target page: ${prospect.target.pageTitle}
- Their page URL: ${prospect.target.pageUrl}
- Outreach reason: ${prospect.target.reason}
- Contact name: ${contactName}
- Contact role: ${prospect.bestContact?.position || "Unknown"}

Our content:
- Title: ${ourContent.title}
- URL: ${ourContent.url}
- Summary: ${ourContent.summary}

Generate 3 emails:
1. Initial outreach (friendly, value-focused, not pushy)
2. Follow-up after 3 days (add more value, maybe share a stat)
3. Final follow-up after 5 more days (breakup email, leave door open)

Return JSON:
[
  {
    "subject": "Email subject (personalized, not spammy)",
    "body": "Email body (use {{first_name}} for personalization)",
    "delayDays": 0
  },
  {
    "subject": "Follow-up subject",
    "body": "Follow-up body",
    "delayDays": 3
  },
  {
    "subject": "Final subject",
    "body": "Final body",
    "delayDays": 5
  }
]

Rules:
- Be genuine, not salesy
- Focus on value to THEM
- Keep emails under 150 words
- Use their page/content specifically
- Don't say "I hope this finds you well"
- Don't be generic`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "sonnet", maxTokens: 1500 }
      );

      return JSON.parse(response.content);
    } catch {
      // Return template emails on error
      return this.getTemplateEmails(prospect, ourContent);
    }
  }

  /**
   * Create and launch an outreach campaign
   */
  async createCampaign(
    name: string,
    prospects: OutreachProspect[],
    fromEmail: string
  ): Promise<string | null> {
    // Create campaign in Instantly
    const campaign = await this.instantly.createCampaign(name, {
      from_email: fromEmail,
      daily_limit: 50,
    });

    if (!campaign) {
      console.error("Failed to create campaign");
      return null;
    }

    // Add leads
    const leads: InstantlyLead[] = prospects
      .filter(p => p.bestContact?.value)
      .map(p => ({
        email: p.bestContact!.value,
        first_name: p.bestContact!.first_name || undefined,
        last_name: p.bestContact!.last_name || undefined,
        company_name: p.target.domain,
        website: p.target.pageUrl,
        custom_variables: {
          page_title: p.target.pageTitle,
          outreach_reason: p.target.reason,
        },
      }));

    await this.instantly.addLeads(campaign.id, leads);

    // Set email sequence (use first prospect's emails as template)
    if (prospects[0]?.personalizedEmail) {
      const sequence = await this.generateOutreachEmails(
        prospects[0],
        { title: "Our Resource", url: "https://example.com", summary: "..." }
      );

      const steps: InstantlyEmailStep[] = sequence.map(email => ({
        subject: email.subject,
        body: email.body,
        delay_days: email.delayDays,
      }));

      await this.instantly.setEmailSequence(campaign.id, steps);
    }

    return campaign.id;
  }

  /**
   * Get campaign performance
   */
  async getCampaignStats(campaignId: string) {
    return this.instantly.getCampaignStats(campaignId);
  }

  // ============================================
  // HELPERS
  // ============================================

  private async analyzeTarget(
    result: { url: string; title: string; snippet: string },
    keyword: string
  ): Promise<{ isGoodTarget: boolean; reason: OutreachReason; priority: number }> {
    // Simple heuristics for target quality
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    
    // Check for roundup posts
    if (title.includes("best") || title.includes("top") || title.includes("roundup")) {
      return { isGoodTarget: true, reason: "roundup", priority: 80 };
    }

    // Check for resource pages
    if (title.includes("resource") || title.includes("tools") || title.includes("guide")) {
      return { isGoodTarget: true, reason: "resource_mention", priority: 70 };
    }

    // Check for guest post opportunities
    if (snippet.includes("guest post") || snippet.includes("write for us")) {
      return { isGoodTarget: true, reason: "guest_post", priority: 90 };
    }

    // Default: could be skyscraper opportunity
    if (snippet.includes(keyword)) {
      return { isGoodTarget: true, reason: "skyscraper", priority: 50 };
    }

    return { isGoodTarget: false, reason: "skyscraper", priority: 0 };
  }

  private selectBestContact(contacts: HunterEmail[]): HunterEmail | null {
    if (contacts.length === 0) return null;

    // Priority roles for outreach
    const priorityRoles = [
      "editor",
      "content",
      "marketing",
      "seo",
      "writer",
      "blogger",
      "founder",
      "owner",
    ];

    for (const role of priorityRoles) {
      const match = contacts.find(c => 
        c.position?.toLowerCase().includes(role) ||
        c.department?.toLowerCase().includes(role)
      );
      if (match) return match;
    }

    // Return highest confidence personal email
    return contacts
      .filter(c => c.type === "personal")
      .sort((a, b) => b.confidence - a.confidence)[0] || contacts[0];
  }

  private getTemplateEmails(
    prospect: OutreachProspect,
    ourContent: { title: string; url: string; summary: string }
  ): OutreachEmail[] {
    return [
      {
        subject: `Quick thought on your ${prospect.target.pageTitle.slice(0, 30)} article`,
        body: `Hi {{first_name}},

I just read your article on ${prospect.target.pageTitle} and thought it was really well done.

I recently published a comprehensive guide on a related topic that your readers might find valuable: ${ourContent.title}

Here's the link: ${ourContent.url}

If you think it adds value, would you consider mentioning it?

Either way, keep up the great work!

Best,
[Your name]`,
        delayDays: 0,
      },
      {
        subject: `Re: ${prospect.target.pageTitle.slice(0, 30)}`,
        body: `Hi {{first_name}},

Just wanted to follow up on my previous email.

I thought this stat from our guide might interest you: [Include relevant stat]

Happy to chat if you have any questions!

Best,
[Your name]`,
        delayDays: 3,
      },
      {
        subject: `Last one from me`,
        body: `Hi {{first_name}},

I know you're busy, so I'll keep this brief.

If our resource isn't a fit, no worries at all. But if you'd ever like to collaborate on content, I'm always open to it.

Thanks for your time!

[Your name]`,
        delayDays: 5,
      },
    ];
  }
}

// ============================================
// SINGLETON
// ============================================

export const outreach = new OutreachOrchestrator();

