/**
 * DIY Outreach System for CabbageSEO
 * 
 * NO PAID TOOLS - Uses only what we have:
 * - Claude AI for email generation & contact finding
 * - Web scraping for contact pages
 * - Email pattern guessing
 * - User sends via their own email
 * 
 * It's not Apollo, but it's FREE and works.
 */

import { claude } from "@/lib/ai/openai-client";
import { serpapi } from "@/lib/integrations/serpapi/client";

// ============================================
// TYPES
// ============================================

export interface OutreachTarget {
  domain: string;
  pageUrl: string;
  pageTitle: string;
  reason: string;
  priority: number;
}

export interface ContactInfo {
  domain: string;
  emails: Array<{
    email: string;
    confidence: "high" | "medium" | "low";
    source: "scraped" | "pattern" | "guessed";
    role?: string;
  }>;
  contactPageUrl?: string;
  socialProfiles?: {
    twitter?: string;
    linkedin?: string;
  };
}

export interface OutreachEmail {
  to: string;
  subject: string;
  body: string;
  followUp1?: { subject: string; body: string; sendAfterDays: number };
  followUp2?: { subject: string; body: string; sendAfterDays: number };
}

export interface OutreachPackage {
  target: OutreachTarget;
  contact: ContactInfo;
  emails: OutreachEmail;
  readyToSend: boolean;
}

// ============================================
// EMAIL PATTERN GENERATOR
// ============================================

const EMAIL_PATTERNS = [
  "{first}@{domain}",
  "{first}.{last}@{domain}",
  "{first}{last}@{domain}",
  "{f}{last}@{domain}",
  "{first}_{last}@{domain}",
  "{last}@{domain}",
  "contact@{domain}",
  "hello@{domain}",
  "info@{domain}",
  "editor@{domain}",
  "content@{domain}",
  "marketing@{domain}",
  "partnerships@{domain}",
];

function generateEmailPatterns(
  domain: string,
  firstName?: string,
  lastName?: string
): Array<{ email: string; confidence: "high" | "medium" | "low" }> {
  const results: Array<{ email: string; confidence: "high" | "medium" | "low" }> = [];
  
  // Generic emails (always work)
  results.push({ email: `contact@${domain}`, confidence: "medium" });
  results.push({ email: `hello@${domain}`, confidence: "medium" });
  results.push({ email: `info@${domain}`, confidence: "medium" });
  
  // If we have a name, generate personal patterns
  if (firstName && lastName) {
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const f = first[0];
    
    results.unshift({ email: `${first}@${domain}`, confidence: "high" });
    results.unshift({ email: `${first}.${last}@${domain}`, confidence: "high" });
    results.unshift({ email: `${first}${last}@${domain}`, confidence: "medium" });
    results.unshift({ email: `${f}${last}@${domain}`, confidence: "medium" });
  }
  
  return results;
}

// ============================================
// CONTACT FINDER (Using Claude)
// ============================================

async function findContactsWithAI(
  domain: string,
  pageContent?: string
): Promise<ContactInfo> {
  const prompt = `Analyze this website/content and find contact information.

Domain: ${domain}
${pageContent ? `Page content (first 2000 chars):\n${pageContent.slice(0, 2000)}` : "No page content available"}

Find:
1. Any email addresses visible
2. Names of people (authors, editors, founders)
3. Social profiles (Twitter, LinkedIn)
4. Contact page URL patterns

Return JSON:
{
  "emails": [
    { "email": "found@email.com", "role": "Editor", "confidence": "high" }
  ],
  "people": [
    { "name": "John Smith", "role": "Content Manager" }
  ],
  "socialProfiles": {
    "twitter": "@handle",
    "linkedin": "linkedin.com/in/..."
  },
  "contactPageUrl": "/contact or /about"
}

If no emails found, return empty arrays. Be accurate, don't make up emails.`;

  try {
    const response = await claude.chat(
      [{ role: "user", content: prompt }],
      undefined,
      { model: "haiku", maxTokens: 500 }
    );

    const data = JSON.parse(response.content);
    
    // Combine AI-found emails with pattern guesses
    const emails: ContactInfo["emails"] = [];
    
    // Add scraped emails
    for (const e of data.emails || []) {
      emails.push({
        email: e.email,
        confidence: "high",
        source: "scraped",
        role: e.role,
      });
    }
    
    // Add pattern-based guesses for people found
    for (const person of data.people || []) {
      const nameParts = person.name.split(" ");
      if (nameParts.length >= 2) {
        const patterns = generateEmailPatterns(domain, nameParts[0], nameParts[nameParts.length - 1]);
        for (const p of patterns.slice(0, 2)) {
          emails.push({
            email: p.email,
            confidence: p.confidence,
            source: "pattern",
            role: person.role,
          });
        }
      }
    }
    
    // If no emails at all, add generic patterns
    if (emails.length === 0) {
      const generic = generateEmailPatterns(domain);
      for (const g of generic.slice(0, 3)) {
        emails.push({
          email: g.email,
          confidence: g.confidence,
          source: "guessed",
        });
      }
    }

    return {
      domain,
      emails,
      contactPageUrl: data.contactPageUrl,
      socialProfiles: data.socialProfiles,
    };
  } catch {
    // Fallback to pattern guessing
    const patterns = generateEmailPatterns(domain);
    return {
      domain,
      emails: patterns.map(p => ({
        email: p.email,
        confidence: p.confidence,
        source: "guessed" as const,
      })),
    };
  }
}

// ============================================
// OUTREACH EMAIL GENERATOR
// ============================================

async function generateOutreachEmails(
  target: OutreachTarget,
  contact: ContactInfo,
  ourContent: { title: string; url: string; description: string }
): Promise<OutreachEmail> {
  const bestEmail = contact.emails[0]?.email || `contact@${target.domain}`;
  const contactName = contact.emails[0]?.role ? 
    `the ${contact.emails[0].role}` : "there";

  const prompt = `Write a link building outreach email sequence.

Target site: ${target.domain}
Their page: ${target.pageTitle}
Their URL: ${target.pageUrl}
Outreach reason: ${target.reason}

Our content to promote:
Title: ${ourContent.title}
URL: ${ourContent.url}
Description: ${ourContent.description}

Write 3 emails:
1. Initial outreach (friendly, value-focused)
2. Follow-up after 3 days
3. Final follow-up after 5 more days

Return JSON:
{
  "subject": "Initial email subject",
  "body": "Initial email body with {{name}} placeholder",
  "followUp1": {
    "subject": "Follow-up subject",
    "body": "Follow-up body",
    "sendAfterDays": 3
  },
  "followUp2": {
    "subject": "Final subject",
    "body": "Final body",
    "sendAfterDays": 5
  }
}

Rules:
- Keep each email under 100 words
- Be genuine, not pushy
- Focus on value to THEM
- Don't use "I hope this email finds you well"
- Be specific about their content`;

  try {
    const response = await claude.chat(
      [{ role: "user", content: prompt }],
      undefined,
      { model: "sonnet", maxTokens: 1000 }
    );

    const emails = JSON.parse(response.content);
    
    return {
      to: bestEmail,
      subject: emails.subject,
      body: emails.body.replace("{{name}}", contactName),
      followUp1: emails.followUp1 ? {
        ...emails.followUp1,
        body: emails.followUp1.body.replace("{{name}}", contactName),
      } : undefined,
      followUp2: emails.followUp2 ? {
        ...emails.followUp2,
        body: emails.followUp2.body.replace("{{name}}", contactName),
      } : undefined,
    };
  } catch {
    // Fallback template
    return {
      to: bestEmail,
      subject: `Quick thought on your ${target.pageTitle.slice(0, 30)} article`,
      body: `Hi ${contactName},

I just read your article "${target.pageTitle}" and thought it was really helpful.

I recently published a guide on "${ourContent.title}" that your readers might find valuable: ${ourContent.url}

Would you consider mentioning it if you think it adds value?

Either way, keep up the great work!

Best,
[Your name]`,
      followUp1: {
        subject: `Re: ${target.pageTitle.slice(0, 30)}`,
        body: `Hi ${contactName},

Just following up on my previous email. I thought our guide might complement your article nicely.

Let me know if you have any questions!

Best,
[Your name]`,
        sendAfterDays: 3,
      },
    };
  }
}

// ============================================
// MAIN OUTREACH ORCHESTRATOR
// ============================================

export class DIYOutreach {
  /**
   * Find outreach opportunities from SERP
   */
  async findOpportunities(
    keyword: string,
    ourUrl: string,
    limit: number = 10
  ): Promise<OutreachTarget[]> {
    const serpResults = await serpapi.searchGoogle({ q: keyword, num: 20 });
    const ourDomain = new URL(ourUrl).hostname;
    const targets: OutreachTarget[] = [];

    for (const result of serpResults.organic_results || []) {
      try {
        const targetDomain = new URL(result.link).hostname;
        if (targetDomain === ourDomain) continue;

        // Determine outreach reason
        let reason = "skyscraper";
        let priority = 50;
        const title = result.title.toLowerCase();

        if (title.includes("best") || title.includes("top") || title.includes("tools")) {
          reason = "Resource/roundup page - ask for inclusion";
          priority = 90;
        } else if (title.includes("guide") || title.includes("how to")) {
          reason = "Educational content - suggest as additional resource";
          priority = 70;
        } else if (title.includes("review") || title.includes("comparison")) {
          reason = "Review page - request feature/mention";
          priority = 80;
        }

        targets.push({
          domain: targetDomain,
          pageUrl: result.link,
          pageTitle: result.title,
          reason,
          priority,
        });

        if (targets.length >= limit) break;
      } catch {
        // Invalid URL
      }
    }

    return targets.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find contacts for a target
   */
  async findContacts(target: OutreachTarget): Promise<ContactInfo> {
    // Try to fetch the contact/about page
    let pageContent = "";
    
    try {
      // Try common contact page URLs
      const contactUrls = [
        `https://${target.domain}/contact`,
        `https://${target.domain}/about`,
        `https://${target.domain}/contact-us`,
        `https://${target.domain}/team`,
      ];

      for (const url of contactUrls) {
        try {
          const response = await fetch(url, { 
            headers: { "User-Agent": "CabbageSEO Bot" },
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            pageContent = await response.text();
            break;
          }
        } catch {
          // Try next URL
        }
      }
    } catch {
      // No page content available
    }

    return findContactsWithAI(target.domain, pageContent);
  }

  /**
   * Generate complete outreach package
   */
  async prepareOutreach(
    target: OutreachTarget,
    ourContent: { title: string; url: string; description: string }
  ): Promise<OutreachPackage> {
    const contact = await this.findContacts(target);
    const emails = await generateOutreachEmails(target, contact, ourContent);

    return {
      target,
      contact,
      emails,
      readyToSend: contact.emails.length > 0,
    };
  }

  /**
   * Full outreach workflow: find targets → get contacts → generate emails
   */
  async runOutreachCampaign(
    keyword: string,
    ourContent: { title: string; url: string; description: string },
    options: { maxTargets?: number } = {}
  ): Promise<OutreachPackage[]> {
    const { maxTargets = 10 } = options;
    
    // 1. Find opportunities
    const targets = await this.findOpportunities(keyword, ourContent.url, maxTargets);
    
    // 2. Prepare outreach for each
    const packages: OutreachPackage[] = [];
    
    for (const target of targets) {
      const pkg = await this.prepareOutreach(target, ourContent);
      packages.push(pkg);
    }

    return packages;
  }

  /**
   * Generate mailto link for easy sending
   */
  generateMailtoLink(email: OutreachEmail): string {
    const subject = encodeURIComponent(email.subject);
    const body = encodeURIComponent(email.body);
    return `mailto:${email.to}?subject=${subject}&body=${body}`;
  }

  /**
   * Export outreach as CSV for mail merge
   */
  exportAsCSV(packages: OutreachPackage[]): string {
    const headers = ["Domain", "Email", "Confidence", "Subject", "Body", "Page URL", "Reason"];
    const rows = packages.map(pkg => [
      pkg.target.domain,
      pkg.emails.to,
      pkg.contact.emails[0]?.confidence || "low",
      pkg.emails.subject,
      pkg.emails.body.replace(/\n/g, " ").replace(/"/g, '""'),
      pkg.target.pageUrl,
      pkg.target.reason,
    ]);

    return [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");
  }
}

// ============================================
// SINGLETON
// ============================================

export const diyOutreach = new DIYOutreach();

