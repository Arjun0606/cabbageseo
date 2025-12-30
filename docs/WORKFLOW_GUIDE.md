# CabbageSEO Complete Workflow Guide

> The only tool that optimizes your content to be cited by AI.

---

## Overview

CabbageSEO is built around one core mission: **Get your content cited by AI**.

This guide walks through every workflow, button by button, page by page.

---

## 🎯 The Money Path (Core Workflow)

This is the primary flow that delivers value fastest:

```
Paste URL → Get AIO Score → View Issues → Export to Cursor → Fix → Publish Content
```

### Step-by-Step

#### 1. Add Your Website

**Where:** Dashboard → Command Palette (Cmd/Ctrl + K) or "Analyze Your Website" button

**Action:**
1. Press `Cmd/Ctrl + K` to open command palette
2. Paste your website URL (e.g., `https://yoursite.com`)
3. Press Enter

**What Happens:**
- Site is crawled (10-30 seconds)
- Technical SEO issues are detected
- AI Visibility Score is calculated across 3 platforms:
  - Google AI Overviews
  - ChatGPT
  - Perplexity

**Result:** You now have your site in the system with baseline scores.

---

#### 2. Check Your AI Visibility Score

**Where:** Dashboard → "Check AI Visibility Score" or sidebar → "AIO"

**What You See:**
- **Overall AIO Score** (0-100) - Your average across all platforms
- **Platform Breakdown:**
  - 🔍 Google AI Overviews - Are you featured in AI summaries?
  - 🤖 ChatGPT - Does it know your brand/product?
  - 💡 Perplexity - Are you in Perplexity's knowledge base?
- **Top Recommendations** - What to fix first

**Actions Available:**
- View detailed analysis per platform
- Export recommendations for Cursor/Claude
- Run fresh analysis

---

#### 3. View & Fix Issues

**Where:** Sidebar → "Issues" or Dashboard → "View Issues"

**What You See:**
- **Critical Issues** (🔴) - Fix immediately
- **Warnings** (🟡) - Important but not urgent
- **Info** (🔵) - Suggestions for optimization

**Issue Types:**
| Issue | What It Means | Why It Matters for AI |
|-------|---------------|----------------------|
| Missing Meta Title | No `<title>` tag | AI can't understand page topic |
| Missing Meta Description | No description | AI won't cite without context |
| Thin Content | <300 words | Not enough for AI to extract info |
| Missing H1 | No main heading | AI can't identify main topic |
| Missing Alt Text | Images without alt | AI accessibility issues |
| Missing Schema | No structured data | Critical for AI to parse content |
| Missing FAQ Schema | No FAQ markup | Missed opportunity for AI citation |
| Stale Content | Not updated recently | AI prefers fresh content |
| Poor Answer Structure | No direct answers | AI can't extract quotable snippets |

**Actions:**
- **Export for Cursor** - Generates markdown report for AI coding assistants
- **Run New Audit** - Refresh the analysis
- **View by Category** - Filter by issue type

---

#### 4. Export for Cursor/Claude

**Where:** Any issues page → "Export Report" or AIO page → "Export for Cursor"

**What It Does:**
1. Generates a structured markdown file
2. Lists all issues with severity
3. Includes specific recommendations
4. Provides implementation instructions

**How to Use:**
1. Click "Export for Cursor"
2. Open Cursor/Claude
3. Paste the markdown content
4. AI assistant implements the fixes

**Example Output:**
```markdown
# CabbageSEO Report for yoursite.com

## Critical Issues

### 1. Missing Meta Description
- **Location:** /blog/my-article
- **Current:** (none)
- **Recommended:** Add a 150-160 character meta description
- **Fix:** Update <meta name="description" content="...">
```

---

## 📝 Content Generation Workflow

Create AI-optimized articles in 5 minutes.

### Step-by-Step

#### 1. Research Keywords

**Where:** Sidebar → "Keywords" or Dashboard → "Research Keywords"

**Action:**
1. Enter a seed keyword (e.g., "SaaS SEO")
2. Click "Find Keywords"

**What You Get:**
- Related keywords with:
  - Search volume
  - Difficulty score
  - CPC (commercial value)
  - Search intent (informational/transactional)
- Keyword clusters for content planning

**Save Keywords:** Click a keyword to add to your tracked list.

---

#### 2. Generate Content

**Where:** Sidebar → "Content" → "Generate New" or Dashboard → "Generate Content"

**Action:**
1. Select a keyword or enter a topic
2. Choose content type:
   - **Article** - Long-form blog post (1500-2500 words)
   - **Landing Page** - Conversion-focused (800-1200 words)
   - **Product Description** - E-commerce focused
3. Choose optimization mode:
   - **AIO First** - Optimized for AI citation (recommended)
   - **SEO First** - Traditional SEO focus
   - **Balanced** - Mix of both
4. Click "Generate"

**What Happens (5-10 seconds):**
- AI analyzes top-ranking content
- Creates SERP-aware outline
- Generates full article with:
  - Compelling headline
  - Meta title & description
  - H2/H3 structure
  - FAQ section (for AI citation)
  - Key takeaways
  - Internal linking suggestions

**AI-Optimized Elements:**
- ✅ FAQ sections (AI loves Q&A format)
- ✅ Definitions ("X is...")
- ✅ Quotable snippets (50-150 words)
- ✅ Statistics with sources
- ✅ Key takeaways list

---

#### 3. Review & Publish

**Where:** Content page → Click on generated article

**Actions:**
- **Edit** - Make changes to the content
- **View Score** - See SEO + AIO scores
- **Publish** - One-click to CMS

**CMS Integrations:**
- WordPress
- Webflow
- Shopify
- Ghost
- Any REST API

---

## 🔄 Content Refresh Workflow

Recover traffic from decaying content.

### When to Use
- Content that was ranking but dropped
- Articles >6 months old
- Pages with outdated information

### Step-by-Step

1. **Identify Decay:** Dashboard shows pages losing traffic
2. **Select Page:** Click on the decaying page
3. **Analyze:** AI identifies:
   - Missing sections competitors added
   - Outdated statistics
   - New search intent shifts
   - AIO optimization gaps
4. **Refresh:** One-click updates:
   - Add missing H2 sections
   - Update statistics
   - Add FAQ schema
   - Improve quotable snippets
5. **Publish:** Push updated content

---

## 📊 Analytics & Tracking

### What's Tracked

**AIO Metrics:**
- AI Visibility Score (daily tracking)
- Platform-specific scores
- Citation count (when available)
- Improvement trends

**SEO Metrics:**
- Keyword rankings
- Organic traffic (with GSC)
- Click-through rates
- Core Web Vitals

### Connecting Analytics

**Where:** Settings → Integrations

**Available:**
- Google Search Console - Required for ranking data
- Google Analytics 4 - Traffic & engagement
- (Coming Soon) ChatGPT citation tracking

---

## ⚡ Quick Actions Reference

| Action | Keyboard Shortcut | Location |
|--------|------------------|----------|
| Add new site | `Cmd/Ctrl + K` | Anywhere |
| Run audit | — | Dashboard or Issues page |
| Generate content | `Cmd/Ctrl + N` | Content page |
| Export report | — | Issues or AIO page |
| Switch sites | Top-right dropdown | Header |

---

## 🎨 Site Switcher

**Where:** Top-right corner of dashboard

**How It Works:**
- Click the dropdown to see all your sites
- Select a site to switch context
- All pages update to show that site's data

**Adding Sites:**
- Use Command Palette (`Cmd/Ctrl + K`)
- Or Dashboard → "Add Site" button

---

## 💡 Pro Tips

### For Maximum AI Citation

1. **Add FAQ sections to EVERY page** - AI platforms love Q&A format
2. **Use definition patterns** - "CabbageSEO is..." helps AI cite you
3. **Keep content fresh** - Update articles monthly
4. **Add schema markup** - Especially FAQ, HowTo, Article schemas
5. **Create quotable snippets** - 50-150 word paragraphs with clear value

### For Best ROI

1. **Start with AIO Score** - Know your baseline
2. **Fix critical issues first** - Use the export feature
3. **Generate 2-3 articles/week** - Consistency wins
4. **Refresh old content monthly** - Fastest traffic gains
5. **Track AIO score weekly** - See what's working

---

## 🚀 Getting to Value Fast

**First 10 Minutes:**
1. Paste your URL (30 seconds)
2. See your AIO Score (instant)
3. Export issues to Cursor (2 minutes)
4. Implement fixes (5-10 minutes)

**First Week:**
1. Generate 3 AIO-optimized articles
2. Fix all critical issues
3. Add FAQ schema to top 5 pages
4. Connect Google Search Console

**First Month:**
1. Publish 10-15 articles
2. Refresh 5 old pages
3. Track AIO score improvement
4. Expand to additional sites

---

## Need Help?

- **Documentation:** `/docs` folder in codebase
- **Support:** support@cabbageseo.com
- **Twitter:** @cabbageseo

---

*CabbageSEO: The only tool that gets you cited by AI.*

