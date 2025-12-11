# AIO Integration Plan: SEO OS → Search OS

> Extending CabbageSEO from an SEO Operating System to a full Search Optimization OS (SEO + AIO)

---

## 🎯 Vision

CabbageSEO becomes the **first Search Optimization OS** that optimizes for:
1. **Traditional Search** (Google, Bing) - SEO Engine
2. **AI Search** (ChatGPT, Perplexity, Gemini, Claude, AI Overviews) - AIO Engine

Both engines share the same foundation. AIO is not a pivot—it's a natural extension.

---

## 📊 AI Search Platforms & Scoring

### The Five AI Visibility Scores

| Platform | Score Name | What It Measures |
|----------|------------|------------------|
| **Google AI Overviews** | `aio_google_score` | Likelihood of being cited in Google's AI-generated summaries |
| **ChatGPT / SearchGPT** | `aio_chatgpt_score` | How well content can be quoted/cited by ChatGPT browsing |
| **Perplexity** | `aio_perplexity_score` | Citation probability in Perplexity answers |
| **Claude** | `aio_claude_score` | Extractability for Claude-based search tools |
| **Gemini** | `aio_gemini_score` | Visibility in Google Gemini responses |

### Combined Score

```
AI Visibility Score = weighted_avg(
  google_aio: 30%,
  chatgpt: 25%, 
  perplexity: 25%,
  claude: 10%,
  gemini: 10%
)
```

---

## 🧬 What Each AI Platform Values

### 1. Google AI Overviews

**Ranking Factors:**
- Traditional SEO signals (still matter)
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Direct answer formatting
- Structured data / Schema markup
- FAQ sections
- Step-by-step instructions
- Entity presence and context

**Optimization Actions:**
- Add FAQ schema
- Add HowTo schema
- Include expert author attribution
- Add clear, quotable definitions
- Structure with proper H2/H3 hierarchy

---

### 2. ChatGPT / SearchGPT

**Ranking Factors:**
- Content quotability (concise, well-structured paragraphs)
- Factual density
- Entity richness
- Source authority (backlinks still matter)
- Recency for time-sensitive queries
- Direct answers to common questions

**Optimization Actions:**
- Write in quotable chunks (2-3 sentence paragraphs)
- Lead sections with the answer, then explain
- Include statistics with sources
- Add "Key Takeaways" sections
- Use entity-rich language

---

### 3. Perplexity

**Ranking Factors:**
- Source diversity (not just one page)
- Citation-worthy snippets
- Factual accuracy
- Expert credentials
- Comprehensive topic coverage
- External validation (other sites referencing you)

**Optimization Actions:**
- Create comprehensive pillar content
- Include original research/data
- Add expert quotes
- Build topical authority across multiple pages
- Get cited by other authoritative sources

---

### 4. Claude-based Search

**Ranking Factors:**
- Semantic clarity
- Context completeness
- Logical structure
- Entity relationships
- Lack of ambiguity

**Optimization Actions:**
- Define terms before using them
- Provide context for all claims
- Use clear cause-effect language
- Structure hierarchically
- Avoid jargon without explanation

---

### 5. Google Gemini

**Ranking Factors:**
- Similar to Google AI Overviews
- Multimodal signals (images, videos)
- Freshness
- Google ecosystem signals (YouTube, etc.)

**Optimization Actions:**
- Same as Google AI Overviews
- Add quality images with descriptive alt text
- Include video content where relevant
- Keep content fresh

---

## 🏗️ Database Schema Extensions

```sql
-- ============================================
-- AIO SCORES (Add to pages table)
-- ============================================

ALTER TABLE pages ADD COLUMN aio_score integer;
ALTER TABLE pages ADD COLUMN aio_google_score integer;
ALTER TABLE pages ADD COLUMN aio_chatgpt_score integer;
ALTER TABLE pages ADD COLUMN aio_perplexity_score integer;
ALTER TABLE pages ADD COLUMN aio_claude_score integer;
ALTER TABLE pages ADD COLUMN aio_gemini_score integer;
ALTER TABLE pages ADD COLUMN aio_last_analyzed timestamp;

-- ============================================
-- ENTITY TRACKING
-- ============================================

CREATE TABLE entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  type text, -- person, organization, concept, product, etc.
  description text,
  wikidata_id text,
  
  mentions integer DEFAULT 0,
  context_quality integer, -- 0-100, how well explained
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX entities_site_idx ON entities(site_id);
CREATE INDEX entities_page_idx ON entities(page_id);

-- ============================================
-- AIO ISSUES (Extend existing issues)
-- ============================================

-- Add new issue categories for AIO
-- These integrate with existing issues table

-- New issue types:
-- - aio_low_entity_density
-- - aio_poor_answer_structure
-- - aio_missing_faq
-- - aio_missing_howto
-- - aio_weak_quotability
-- - aio_missing_definitions
-- - aio_ambiguous_context
-- - aio_no_expert_attribution
-- - aio_stale_content

-- ============================================
-- AI CITATIONS TRACKING
-- ============================================

CREATE TABLE ai_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  
  platform text NOT NULL, -- chatgpt, perplexity, google_aio, gemini
  query text NOT NULL,
  citation_type text, -- direct_quote, paraphrase, source_link
  snippet text,
  
  discovered_at timestamp DEFAULT now(),
  
  UNIQUE(site_id, platform, query, page_id)
);

CREATE INDEX ai_citations_site_idx ON ai_citations(site_id);
CREATE INDEX ai_citations_platform_idx ON ai_citations(platform);

-- ============================================
-- CONTENT AIO OPTIMIZATION
-- ============================================

ALTER TABLE content ADD COLUMN aio_optimized boolean DEFAULT false;
ALTER TABLE content ADD COLUMN aio_score integer;
ALTER TABLE content ADD COLUMN entity_count integer;
ALTER TABLE content ADD COLUMN quotability_score integer;
ALTER TABLE content ADD COLUMN answer_structure_score integer;
```

---

## 📁 New Module Structure

```
src/lib/aio/
├── index.ts                    # Main exports
├── visibility-score.ts         # Combined AIO scoring
├── platforms/
│   ├── google-aio.ts          # Google AI Overviews analyzer
│   ├── chatgpt.ts             # ChatGPT optimization
│   ├── perplexity.ts          # Perplexity citation analysis
│   ├── claude.ts              # Claude readability
│   └── gemini.ts              # Gemini optimization
├── entity-extractor.ts         # NER and entity analysis
├── quotability-analyzer.ts     # Content quotability scoring
├── answer-structure.ts         # Answer format detection
├── citation-tracker.ts         # Track AI citations
└── aio-audit.ts               # AIO-specific audit checks
```

---

## 🖥️ UI Integration Points

### 1. Dashboard Enhancement

```
Current Dashboard Stats:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Keywords   │   Content    │  Avg Position│    Issues    │
│    1,247     │      48      │     14.3     │      23      │
└──────────────┴──────────────┴──────────────┴──────────────┘

Enhanced Dashboard Stats (Add row):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  SEO Score   │  AIO Score   │ AI Citations │ AIO Issues   │
│     78/100   │    64/100    │      12      │      8       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 2. Page Analysis View

```
/pages/[id] - Add AIO Panel:

┌─────────────────────────────────────────────────────────────┐
│ AI Visibility Scores                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google AI Overviews  ████████████░░░░░░  72/100           │
│  ChatGPT              ███████████░░░░░░░  68/100           │
│  Perplexity           █████████░░░░░░░░░  58/100           │
│  Claude               ████████████░░░░░░  74/100           │
│  Gemini               ██████████░░░░░░░░  65/100           │
│                                                             │
│  Combined AIO Score   ██████████░░░░░░░░  67/100           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. AIO Suggestions Panel

```
┌─────────────────────────────────────────────────────────────┐
│ AIO Optimization Suggestions                    [Auto-Fix]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ HIGH: Missing FAQ Section                               │
│    Add FAQ schema to improve AI Overview visibility         │
│    [Generate FAQ] [Ignore]                                  │
│                                                             │
│ ⚠️ HIGH: Low Entity Density (3 entities, need 8+)          │
│    Add more named entities: products, people, concepts      │
│    [Show Suggestions] [Ignore]                              │
│                                                             │
│ ⚠️ MEDIUM: Weak Answer Structure                           │
│    First paragraph doesn't directly answer the query        │
│    [Rewrite Intro] [Ignore]                                 │
│                                                             │
│ ⚠️ MEDIUM: No Expert Attribution                           │
│    Add author bio with credentials                          │
│    [Add Author] [Ignore]                                    │
│                                                             │
│ ⚡ LOW: Could improve quotability                           │
│    Break up long paragraphs into quotable chunks            │
│    [Optimize] [Ignore]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Content Generator Enhancement

```
Content Generation Mode:
┌─────────────────────────────────────────────────────────────┐
│ Optimization Target                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ SEO Only (Traditional Google ranking)                   │
│  ○ AIO Only (AI search visibility)                         │
│  ● SEO + AIO (Balanced for both) ← Recommended             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. New AIO Dashboard Page

```
/aio - AI Visibility Dashboard

┌─────────────────────────────────────────────────────────────┐
│ AI Search Visibility                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall AIO Score: 64/100  (+8 from last month)           │
│                                                             │
│  Platform Breakdown:                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Google AI Overviews │ ████████░░ │ 72  │ ↑ 5      │    │
│  │ ChatGPT             │ ███████░░░ │ 68  │ ↑ 12     │    │
│  │ Perplexity          │ ██████░░░░ │ 58  │ ↓ 2      │    │
│  │ Claude              │ ████████░░ │ 74  │ ↑ 3      │    │
│  │ Gemini              │ ███████░░░ │ 65  │ → 0      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Recent AI Citations: 12 discovered                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Perplexity cited /blog/seo-guide for "seo tips"   │    │
│  │ ChatGPT quoted /pricing for pricing info          │    │
│  │ Google AIO featured /faq in overview              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Top Opportunities:                                         │
│  • 5 pages need FAQ sections                               │
│  • 12 pages have low entity density                        │
│  • 3 pages missing expert attribution                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Integration with Existing Systems

### 1. Audit System Extension

The existing `TechnicalAuditEngine` gets a sibling:

```typescript
// src/lib/aio/aio-audit.ts

export interface AIOIssue {
  id: string;
  type: AIOIssueType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  platform: 'all' | 'google_aio' | 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
  message: string;
  recommendation: string;
  autoFixable: boolean;
}

export type AIOIssueType = 
  | 'missing_faq_schema'
  | 'missing_howto_schema'
  | 'low_entity_density'
  | 'poor_answer_structure'
  | 'weak_quotability'
  | 'missing_definitions'
  | 'no_expert_attribution'
  | 'ambiguous_context'
  | 'stale_content'
  | 'no_structured_data'
  | 'poor_heading_hierarchy'
  | 'missing_key_takeaways';

export class AIOAuditEngine {
  async audit(page: PageData): Promise<AIOAuditResult> {
    // Uses Claude to analyze page for AIO readiness
  }
}
```

### 2. Content Pipeline Extension

The existing content generator adds AIO presets:

```typescript
// src/lib/ai/content-pipeline.ts - Extended

export interface ContentGenerationOptions {
  // Existing options...
  targetKeyword: string;
  wordCount: number;
  
  // New AIO options
  optimizationMode: 'seo' | 'aio' | 'balanced';
  includeEntities: boolean;
  addFAQSection: boolean;
  addKeyTakeaways: boolean;
  quotabilityOptimized: boolean;
}
```

### 3. Crawler Extension

The existing crawler collects AIO-relevant data:

```typescript
// src/lib/crawler/site-crawler.ts - Extended PageData

export interface PageData {
  // Existing fields...
  url: string;
  title: string;
  meta: MetaData;
  
  // New AIO fields
  entities: ExtractedEntity[];
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  hasAuthorInfo: boolean;
  paragraphCount: number;
  avgParagraphLength: number;
  definitionCount: number;
  quotableSnippets: string[];
}
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Current Sprint)
- [x] Complete SEO OS foundation
- [x] Crawler with technical audit
- [x] Content generation pipeline
- [x] CMS integrations
- [x] Dashboard with SEO metrics

### Phase 2: AIO Scoring (February)
- [ ] Add `src/lib/aio/` module
- [ ] Implement `visibility-score.ts`
- [ ] Add platform-specific analyzers
- [ ] Database schema migration
- [ ] Add AIO scores to page view

### Phase 3: AIO Audit (February)
- [ ] Implement `aio-audit.ts`
- [ ] Add AIO issue types
- [ ] Add AIO suggestions panel
- [ ] Auto-fix for simple issues

### Phase 4: Content Optimization (March)
- [ ] Add AIO presets to content generator
- [ ] Entity injection system
- [ ] Quotability optimizer
- [ ] FAQ/HowTo auto-generation

### Phase 5: Citation Tracking (March)
- [ ] Citation discovery system
- [ ] AI search monitoring
- [ ] Citation alerts

### Phase 6: Full AIO Dashboard (April)
- [ ] `/aio` dashboard page
- [ ] Platform breakdown charts
- [ ] Trend tracking
- [ ] Opportunity prioritization

### Phase 7: Marketing Launch (April)
- [ ] Update landing page
- [ ] "SEO + AIO OS" positioning
- [ ] Case studies

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| AIO Score improvement after optimization | +20 points avg |
| AI citation discovery rate | 80% of actual citations |
| User adoption of AIO features | 60% of active users |
| Content optimized for AIO | 40% of generated content |

---

## 💡 Key Technical Decisions

1. **Claude as primary analyzer** - All AIO scoring uses Claude for consistency
2. **Offline-first scoring** - No real-time API calls to AI platforms; we predict based on content analysis
3. **Shared data model** - AIO extends existing tables, doesn't create parallel structures
4. **Same UI patterns** - AIO features use existing component library
5. **Incremental rollout** - AIO features appear as tabs/sections, not new pages

---

## 🔗 Related Files

- `src/lib/ai/client.ts` - Claude integration (will power AIO)
- `src/lib/crawler/technical-audit.ts` - Audit system to extend
- `src/lib/db/schema.ts` - Schema to migrate
- `src/app/(dashboard)/audit/page.tsx` - UI to extend

---

*This document should be updated as implementation progresses.*

