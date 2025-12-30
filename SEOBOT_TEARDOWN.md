# SEObot Teardown: What They Do & How We Adapt for AIO

## 🎯 SEObot's Core Value Proposition

> "SEObot takes 100% of SEO work out of your way so that you can focus on building your product."

**Key Stats They Show:**
- 200k articles created
- 1.2 billion impressions
- 30 million clicks
- $49/month starting price

---

## 🔧 SEObot Feature Breakdown

### 1. **Fully Automated Onboarding** ⭐ CRITICAL
> "Just enter your URL and press 'go'"

**What It Does:**
- Enter URL → Site researched automatically
- Audience analyzed
- Keywords researched
- Content plan created
- Articles start publishing weekly

**CabbageSEO AIO Adaptation:**
```
Enter URL → Get AIO Score → See what AI platforms are missing → 
Auto-generate AIO-optimized content plan
```

---

### 2. **Weekly Content Production** ⭐ CRITICAL
> "SEObot will make a content plan and start producing articles every week"

**What It Does:**
- Auto-schedules articles weekly
- No manual intervention needed
- User can approve/decline if they want

**CabbageSEO AIO Adaptation:**
- ✅ Already have `scheduledWeeklyContent` Inngest job
- Need to add: Auto-scheduling based on AIO gaps
- Need to add: Content optimized for AI citations (FAQs, definitions, quotable sections)

---

### 3. **Article Types** ⭐ IMPORTANT
From their examples:
- Listicles ("Best CMS for SEO: Top 12 Platforms Compared")
- How-to Guides ("Robots.txt SEO Guide: 10 Best Practices")
- Checklists ("Google Core Update Checklist: Prepare Your Site")
- Q&A Articles ("Next.js getServerSideProps: Usage, Examples, FAQs")
- Versus Articles ("Subdomain vs. Subdirectory vs. ccTLD for SEO")
- Roundups ("10 Proven Cinema Promotion Tactics for 2024")
- Ultimate Guides ("Next.js 14 Project Structure: Best Practices")

**CabbageSEO AIO Adaptation:**
Add AIO-optimized versions:
- **AIO Listicles** - With FAQ schema + quotable sections
- **AIO How-to** - With HowTo schema + step definitions
- **AIO FAQs** - Pure Q&A format for AI citation
- **AIO Definitions** - "What is X?" format for AI extraction
- **AIO Comparisons** - Tables + direct answer format

---

### 4. **Internal Linking Automation** ⭐ MEDIUM
> "It'll do internal linking for articles and your site pages"

**CabbageSEO AIO Adaptation:**
- Add entity linking (link to definitions)
- Add AIO-aware anchor text (quotable phrases)

---

### 5. **Rich Content Features** ⭐ MEDIUM
> "Up to 4000 words, YouTube embeds, Image gen, Google Image insertion, Tables, Lists"

**CabbageSEO AIO Adaptation:**
- Tables: Add schema markup for AI extraction
- Lists: Use AIO-friendly formatting (key takeaways)
- YouTube: Transcribe and add FAQ from video content

---

### 6. **Fact Checking & Citations** ⭐ IMPORTANT
> "Anti typo hallucination and fact checking system, with citation of sources"

**CabbageSEO AIO Adaptation:**
- Keep fact checking
- Add: Source attribution for AI credibility
- Add: Expert quotes and stats (Perplexity loves these)

---

### 7. **CMS Integrations** ⭐ MEDIUM
WordPress, Webflow, Ghost, Framer, Shopify, WIX, HubSpot, Notion, Next.js

**CabbageSEO AIO Adaptation:**
- Keep existing: WordPress, Webflow, Shopify
- Add: Schema injection for all CMS

---

### 8. **Free Tools (Lead Gen)** ⭐ IMPORTANT
SEObot has these free tools:
- FAQ Schema Generator
- Q&A Schema Generator
- Article Schema Generator
- Canonical URL Checker
- Robots.txt Generator & Validator
- Broken Link Checker
- Meta Description Generator
- SEO Title Generator
- Sitemap URL Extractor

**CabbageSEO AIO Adaptation:**
Create AIO-specific free tools:
- **AIO Score Checker** (already have!)
- **FAQ Schema Generator** (for AI visibility)
- **AI Citation Finder** (check if AI is citing your URL)
- **Entity Density Checker** (how many entities in your content)
- **Quotability Analyzer** (find quotable snippets)

---

### 9. **Social Proof** ⭐ CRITICAL
SEObot shows:
- Twitter testimonials with real metrics
- "500 clicks/day" results
- "$6500 client closed" ROI stories
- Product Hunt badges

**CabbageSEO AIO Adaptation:**
Track and show:
- "AIO Score improved from 29 to 80"
- "Now cited by ChatGPT for X topic"
- "Featured in Google AI Overview"

---

### 10. **Multi-language** ⭐ LOW
SEObot supports 50+ languages

**CabbageSEO AIO Adaptation:**
- Not priority for v1
- AIO works best in English anyway

---

## 🚀 Priority Build List for AIO

### Phase 1: Core Simplification (Week 1)

| Feature | SEObot Equivalent | AIO Twist |
|---------|-------------------|-----------|
| **One-Click Start** | Enter URL, press go | Enter URL → See AIO Score instantly |
| **Auto Content Plan** | Weekly SEO articles | Weekly AIO-optimized articles |
| **Progress Dashboard** | Impressions/clicks | AIO Score improvement |

### Phase 2: AIO-Specific Features (Week 2)

| Feature | What It Does |
|---------|--------------|
| **AIO Content Templates** | Article formats optimized for AI citation |
| **Schema Auto-Injection** | FAQ, HowTo, QA schema in every article |
| **Entity Enrichment** | Auto-add definitions, named entities |
| **Quotable Sections** | Highlight 50-150 word citable paragraphs |

### Phase 3: Free Tools & Growth (Week 3)

| Tool | Purpose |
|------|---------|
| **Free AIO Checker** | Lead gen (already have) |
| **AI Citation Finder** | Show if ChatGPT/Perplexity cite you |
| **FAQ Schema Generator** | Free tool, captures emails |
| **Entity Density Checker** | Free tool, shows value |

---

## 📊 Key Differences: SEObot vs CabbageSEO

| Aspect | SEObot | CabbageSEO |
|--------|--------|------------|
| **Focus** | Google rankings | AI citations |
| **Metric** | Impressions/Clicks | AIO Score |
| **Content** | SEO articles | AIO-optimized content |
| **Schema** | Basic | FAQ, HowTo, QA optimized |
| **Target** | Google first page | ChatGPT/Perplexity answers |
| **Price** | $49/mo | $29/mo |

---

## 🎯 The "SEObot for AIO" Positioning

### SEObot says:
> "SEObot takes 100% of SEO work out of your way"

### CabbageSEO should say:
> "CabbageSEO makes AI cite you instead of your competitors"

---

## ✅ What We Already Have

| Feature | Status |
|---------|--------|
| Free AIO Checker | ✅ Working |
| AIO Score Dashboard | ✅ Working |
| Platform Breakdown | ✅ Working (Google AI, ChatGPT, Perplexity) |
| Recommendations | ✅ Working |
| Export for Cursor | ✅ Working (unique!) |
| Content Generation | ⚠️ Works but slow |
| Weekly Autopilot | ✅ Added (Inngest job) |
| Keywords Research | ⚠️ Works but needs polish |

---

## 🔨 What We Need to Build

### Immediate (This Week)

1. **Simplify Dashboard**
   - Make AIO Score THE hero
   - Hide SEO-only features
   - One-click "Improve My AIO" flow

2. **Fix Content Generation Speed**
   - Reduce timeout issues
   - Add progress indicator
   - Cache keyword research

3. **Add AIO Content Templates**
   - FAQ format
   - Definition format
   - Comparison format with tables

### Soon (Next 2 Weeks)

4. **AI Citation Finder**
   - Check if ChatGPT mentions your URL
   - Check Perplexity for citations
   - Track over time

5. **Free Tools Landing**
   - Free AIO Checker (have it)
   - FAQ Schema Generator
   - Entity Density Analyzer

6. **Social Proof Collection**
   - Track AIO improvements
   - Request testimonials
   - Show before/after

---

## 💡 Final Summary

**SEObot proves:** Founders pay $49/mo for autonomous content that drives Google traffic.

**Your opportunity:** Be the autonomous tool for AI visibility at $29/mo.

**The moat:** AIO Score is a unique metric no one else has. Own it.

