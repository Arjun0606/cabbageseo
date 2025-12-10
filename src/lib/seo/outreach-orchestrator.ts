/**
 * Backlink Outreach Orchestrator
 * 
 * Orchestrates Apollo.io for end-to-end outreach:
 * - Email finding
 * - Contact enrichment
 * - Email sequences
 * - Campaign analytics
 * 
 * We DON'T rebuild outreach tools.
 * We INTEGRATE and ORCHESTRATE Apollo.io.
 */

import { ApolloClient, ApolloContact, ApolloSequenceStep } from "@/lib/integrations/apollo/client";
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
  status: "draft" | "finding_contacts" | "ready" | "active" | "paused" | "completed";
  stats: {
    contactsFound: number;
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
  contact: ApolloContact | null;
  personalizedEmails: OutreachEmail[];
}

// ============================================
// OUTREACH ORCHESTRATOR
// ============================================

export class OutreachOrchestrator {
  private apollo: ApolloClient;

  constructor(apolloApiKey?: string) {
    this.apollo = new ApolloClient(apolloApiKey);
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
   * Find contacts for outreach targets using Apollo
   */
  async findContacts(targets: OutreachTarget[]): Promise<OutreachProspect[]> {
    const prospects: OutreachProspect[] = [];

    for (const target of targets) {
      // Search for relevant contacts at this domain
      const contacts = await this.apollo.searchContacts(target.domain, {
        titles: [
          "Editor",
          "Content Manager", 
          "Marketing Manager",
          "SEO Manager",
          "Head of Content",
          "Blogger",
          "Writer",
          "Founder",
          "Owner",
        ],
        limit: 3,
      });

      // Pick the best contact
      const bestContact = this.selectBestContact(contacts);

      prospects.push({
        target,
        contact: bestContact,
        personalizedEmails: [],
      });
    }

    return prospects.filter(p => p.contact !== null);
  }

  /**
   * Generate personalized outreach emails using AI
   */
  async generateOutreachEmails(
    prospect: OutreachProspect,
    ourContent: { title: string; url: string; summary: string }
  ): Promise<OutreachEmail[]> {
    const contactName = prospect.contact?.first_name || "there";
    
    const prompt = `Generate a 3-email outreach sequence for link building.

Context:
- Target site: ${prospect.target.domain}
- Target page: ${prospect.target.pageTitle}
- Their page URL: ${prospect.target.pageUrl}
- Outreach reason: ${prospect.target.reason}
- Contact name: ${contactName}
- Contact role: ${prospect.contact?.title || "Unknown"}

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

      const emails = JSON.parse(response.content);
      prospect.personalizedEmails = emails;
      return emails;
    } catch {
      // Return template emails on error
      const templates = this.getTemplateEmails(prospect, ourContent);
      prospect.personalizedEmails = templates;
      return templates;
    }
  }

  /**
   * Create and launch an outreach campaign in Apollo
   */
  async createCampaign(
    name: string,
    prospects: OutreachProspect[]
  ): Promise<{ campaignId: string; contactsAdded: number } | null> {
    // Get email sequence from first prospect (they all use same template)
    const emailTemplate = prospects[0]?.personalizedEmails || [];
    
    if (emailTemplate.length === 0) {
      console.error("No email templates available");
      return null;
    }

    // Create sequence steps
    const steps: ApolloSequenceStep[] = emailTemplate.map((email, index) => ({
      position: index + 1,
      type: "auto_email" as const,
      wait_time: email.delayDays,
      subject: email.subject,
      body: email.body,
    }));

    // Create the sequence in Apollo
    const sequence = await this.apollo.createSequence(name, steps);
    
    if (!sequence) {
      console.error("Failed to create sequence");
      return null;
    }

    // Add contacts to the sequence
    const contactIds = prospects
      .filter(p => p.contact?.id)
      .map(p => p.contact!.id);

    const result = await this.apollo.addContactsToSequence(sequence.id, contactIds);

    return {
      campaignId: sequence.id,
      contactsAdded: result.added,
    };
  }

  /**
   * Start an outreach campaign
   */
  async startCampaign(campaignId: string): Promise<boolean> {
    return this.apollo.activateSequence(campaignId);
  }

  /**
   * Pause an outreach campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    return this.apollo.pauseSequence(campaignId);
  }

  /**
   * Get campaign performance
   */
  async getCampaignStats(campaignId: string) {
    return this.apollo.getSequenceStats(campaignId);
  }

  /**
   * Full outreach workflow: find → contact → email → launch
   */
  async runOutreachCampaign(
    keyword: string,
    ourContent: { title: string; url: string; summary: string },
    serpResults: Array<{ url: string; title: string; snippet: string }>,
    options: {
      autoLaunch?: boolean;
      maxProspects?: number;
    } = {}
  ): Promise<OutreachCampaign | null> {
    const { autoLaunch = false, maxProspects = 20 } = options;

    // 1. Find opportunities
    const targets = await this.findOpportunities(keyword, ourContent.url, serpResults);
    const limitedTargets = targets.slice(0, maxProspects);

    if (limitedTargets.length === 0) {
      console.log("No outreach targets found");
      return null;
    }

    // 2. Find contacts
    const prospects = await this.findContacts(limitedTargets);

    if (prospects.length === 0) {
      console.log("No contacts found");
      return null;
    }

    // 3. Generate personalized emails
    for (const prospect of prospects) {
      await this.generateOutreachEmails(prospect, ourContent);
    }

    // 4. Create campaign
    const campaignName = `${keyword} - ${new Date().toLocaleDateString()}`;
    const result = await this.createCampaign(campaignName, prospects);

    if (!result) {
      return null;
    }

    // 5. Optionally launch
    if (autoLaunch) {
      await this.startCampaign(result.campaignId);
    }

    return {
      id: result.campaignId,
      name: campaignName,
      targets: limitedTargets,
      status: autoLaunch ? "active" : "ready",
      stats: {
        contactsFound: prospects.length,
        emailsSent: 0,
        opened: 0,
        replied: 0,
        linksWon: 0,
      },
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async analyzeTarget(
    result: { url: string; title: string; snippet: string },
    keyword: string
  ): Promise<{ isGoodTarget: boolean; reason: OutreachReason; priority: number }> {
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

  private selectBestContact(contacts: ApolloContact[]): ApolloContact | null {
    if (contacts.length === 0) return null;

    // Priority: verified emails first
    const verified = contacts.filter(c => c.email_status === "verified");
    if (verified.length > 0) {
      return verified[0];
    }

    // Then guessed emails
    const guessed = contacts.filter(c => c.email_status === "guessed");
    if (guessed.length > 0) {
      return guessed[0];
    }

    return contacts[0];
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

I thought this might interest you - our guide has been getting great feedback from readers in the ${prospect.target.domain} space.

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
