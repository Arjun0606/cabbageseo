---
title: "How AI Decides Who to Recommend: Inside the Scoring"
description: "A transparent breakdown of how ChatGPT, Perplexity, and Google AI form recommendations, and how CabbageSEO scores your visibility across all three."
date: "2026-02-11"
author: "Arjun"
tags: ai, scoring, transparency
---

# How AI Decides Who to Recommend: Inside the Scoring

When someone asks Perplexity "What's the best CRM for startups?" and it recommends your competitor, that's not random. There's a system behind it. Understanding that system is the first step to changing the outcome.

This article breaks down how the three major AI platforms form recommendations, what signals actually increase your chances of being mentioned, and how CabbageSEO's 6-factor scoring model measures your visibility. No black boxes. No hand-waving.

---

## How LLMs Form Recommendations

AI recommendations come from four distinct sources, and each platform weights them differently.

### 1. Training Data (The Web Crawl)

Every LLM is trained on a massive crawl of the internet. This is the foundation: billions of web pages, forum posts, documentation sites, and articles that the model absorbed during training. If your product was well-documented across the web when the training data was collected, the model "knows" about you.

The catch: training data has a cutoff. ChatGPT's knowledge has a fixed date. If you launched after that date, or if your web presence was thin at the time of crawling, you're underrepresented in the model's memory. No amount of prompting will fix that.

### 2. RLHF (Human Preference Tuning)

After initial training, models go through Reinforcement Learning from Human Feedback. Human raters evaluate the model's outputs and mark which responses are more helpful, accurate, and well-sourced. This process shapes which brands the model learns to recommend confidently versus which ones it hedges on.

Products that appear frequently in well-sourced, high-quality content (reviews, comparisons, technical documentation) tend to get reinforced during this phase. Products that only appear in their own marketing materials don't.

### 3. Retrieval Augmentation (Real-Time Search)

This is where things get interesting. Perplexity and Google AI Overviews don't just rely on training data. They run real-time web searches and incorporate live results into their answers. This means fresh content, new reviews, and recently published comparisons can influence recommendations immediately.

Retrieval augmentation is the most actionable signal because you can influence it right now. You don't need to wait for the next model training cycle. If Perplexity's search finds your site when answering a query, you can get cited today.

### 4. Citation Behavior

When AI cites a source, it's making a trust judgment. It's saying "this source is authoritative enough to back my claim." Citation behavior follows clear patterns: AI prefers established review platforms (G2, Capterra), well-structured content with clear data points, and pages that directly answer the question being asked.

Pages that are vague, promotional, or poorly structured almost never get cited, even if the AI mentions the brand in passing.

---

## Platform Differences: Where Each AI Looks

The three major platforms aren't interchangeable. Each has a distinct architecture that determines how it forms recommendations.

### ChatGPT: Knowledge-Heavy

ChatGPT leans heavily on its training data. When answering recommendation queries, it draws primarily from what it learned during training, supplemented by browsing when enabled.

What this means for you:

- Being mentioned on high-authority sites (Wikipedia, major publications, established review platforms) matters most
- Your own site's content is secondary to what others say about you
- Training data staleness is a real problem -- if you've changed positioning or launched new features since the last training cutoff, ChatGPT might describe you inaccurately
- Getting third-party coverage is more important here than on any other platform

### Perplexity: Search-Grounded

Perplexity runs real-time web searches for every query and constructs answers from the results. It's essentially a research engine that synthesizes search results into a coherent answer with citations.

What this means for you:

- SEO fundamentals still matter because Perplexity uses web search to find sources
- Citations are everything -- Perplexity explicitly links to its sources, and users click through
- Fresh content has immediate impact because there's no training data delay
- Structured data helps Perplexity understand and extract information from your pages
- Being on review platforms (G2, Capterra) helps because these rank well in the searches Perplexity runs

### Google AI Overviews: Search-Index Grounded

Google AI Overviews are built on top of Google's search index. The AI layer synthesizes information from pages that already rank well in Google Search.

What this means for you:

- Traditional SEO is the foundation. If you don't rank in Google Search, you won't appear in AI Overviews.
- Structured data is weighted heavily because Google's systems are built to parse it
- E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness) directly influence whether Google's AI cites you
- Local and vertical search signals carry over to the AI layer

---

## What Signals Actually Increase Your Chances

Across all three platforms, certain signals consistently correlate with being recommended.

**Being cited on authoritative third-party sites.** This is the number one signal. When G2, Capterra, industry blogs, or review sites mention your product, AI treats those mentions as third-party validation. Your own site saying you're great is marketing. G2 saying you're great is evidence.

**Having clear, well-structured content.** AI extracts information from web pages programmatically. Pages with clear headings, bulleted lists, FAQ sections, and direct-answer paragraphs are dramatically easier for AI to parse and cite. A comparison table with clean HTML gets cited. A wall of text doesn't.

**Structured data markup.** JSON-LD schema (Organization, Product, FAQPage, Article) gives AI explicit signals about what your page contains. Think of it as a machine-readable summary. Without it, AI has to guess what your page is about. With it, AI knows.

**Being mentioned in comparison and review content.** AI answers "best X for Y" and "X vs Z" queries constantly. Content that honestly compares multiple options in a category is one of AI's preferred source types. This includes content on your own site (comparison pages) and content on third-party sites (review roundups).

**Having a Wikipedia page or Crunchbase profile.** These are primary sources in LLM training data. A Wikipedia page is the single strongest signal for ChatGPT specifically. Crunchbase data feeds into multiple AI knowledge bases. If you meet Wikipedia's notability criteria, this is worth the effort.

**Active presence on platforms AI crawls for opinions.** Reddit, Hacker News, Stack Overflow, and industry forums are heavily represented in training data. Authentic discussions about your product on these platforms create the kind of organic mentions that AI weights highly.

---

## CabbageSEO's 6-Factor Scoring Model

When you run a scan on CabbageSEO, we query all three AI platforms with relevant prompts for your brand and category, then score the responses using six factors that sum to 100 points. Here's exactly how each factor works and why it's weighted the way it is.

### Citation Presence (40 points)

**What it measures:** Whether your domain appears in the actual citation links that AI provides alongside its response.

**Why it's worth 40% of the score:** A citation is the strongest possible signal. It means AI isn't just mentioning you in passing -- it's pointing users to your site as a source. Citations drive real traffic and represent genuine trust from the AI platform.

**How we calculate it:** We check each platform's response for your domain in its source citations. If 2 out of 3 platforms cite you, you get roughly 27 out of 40 points. If all three cite you, you get the full 40.

### Domain Visibility (25 points)

**What it measures:** Whether your full domain (e.g., "yoursite.com") appears in the text of the AI's response, even if it's not in a formal citation link.

**Why it's worth 25%:** Domain mentions in the response body indicate that AI knows your website and considers it relevant enough to name explicitly. It's a strong signal, though weaker than a full citation because it doesn't always drive click-through traffic.

**How we calculate it:** We scan each platform's response text for your domain. Scoring is proportional to how many platforms include it.

### Position Bonus (12 points)

**What it measures:** Where in the response your brand appears. Being mentioned first signals higher relevance than being mentioned last.

**Why it's worth 12%:** Position matters because users read AI responses top-to-bottom. The first recommendation gets disproportionate attention. But we only count position for genuine mentions (citations or domain references), not brand echoes.

**How we calculate it:** We measure the normalized position of your mention in each response (0 = top, 1 = bottom) and award more points for earlier mentions. Only genuine mentions count -- if AI just echoes your brand name from the query, it doesn't get a position bonus.

### Mention Depth (10 points)

**What it measures:** How many times your brand is genuinely referenced across the AI responses. A single passing mention is different from being discussed in detail.

**Why it's worth 10%:** Multiple mentions indicate that AI considers you substantively relevant to the query, not just tangentially related. Depth correlates with user perception of recommendation strength.

**How we calculate it:** We count genuine mentions (domain or citation) across all platform responses and apply a logarithmic curve, so going from 0 to 3 mentions matters a lot, but going from 10 to 13 matters less.

### Brand Echo (8 points)

**What it measures:** Whether AI mentions your brand name in its response text without including your domain or citing you as a source.

**Why it's worth only 8%:** This is the factor we deliberately underweight, and here's why: when you ask AI "Tell me about [Brand X]," it will almost always echo the brand name back to you. That's not a recommendation. That's pattern matching.

A brand echo means AI has heard of you (your name exists in its training data), but it doesn't trust you enough to cite your site or reference your domain. It's the participation trophy of AI visibility. Counting it at full value would inflate scores and mislead users into thinking they're more visible than they actually are.

We include it at 8 points because there is a meaningful difference between a brand AI has never encountered (0 echo) and one it can at least name (8 points). But we refuse to pretend that an echo equals a recommendation.

### Market Crowding (5 points)

**What it measures:** How many other brands AI mentions alongside you in response to the same query.

**Why it's worth 5%:** If AI recommends 12 brands for "best CRM," each recommendation is diluted. If it recommends 3, yours carries much more weight. Market crowding is a contextual factor: it doesn't reflect your efforts directly, but it affects the real-world impact of being mentioned.

**How we calculate it:** We count the other brands detected in AI responses and apply an exponential decay. Fewer competitors in the response means a higher score. This factor caps at 5 points because market dynamics are largely outside your control.

---

## Why This Scoring Matters

Most GEO tools either don't explain their scoring or use inflated metrics that make everyone feel good without providing actionable signal. We built this model to be honest.

A score of 35 means AI knows you exist but doesn't trust you enough to recommend you. A score of 72 means you're being actively cited and recommended. The difference between those numbers maps directly to specific, fixable gaps: missing trust source profiles, absent structured data, thin content that AI can't extract from.

Every point in your score connects to an action you can take. That's the whole point.

---

## See Your Score

Run a free scan at [CabbageSEO](https://cabbageseo.com) to see your 6-factor breakdown across ChatGPT, Perplexity, and Google AI Overviews. You'll see exactly which factors are dragging your score down and what to do about each one.
