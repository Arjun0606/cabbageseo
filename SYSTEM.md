# 🔒 CabbageSEO — Production Truth & Feasibility Contract

> **This project is a real SaaS, not a demo.
> Every feature must be implemented using real data, real APIs, and real system state.
> No fake, mock, simulated, placeholder, or invented data may ever be shown to users.**

---

## 1️⃣ Allowed Data Sources (Only These)

The system may ONLY use data from:

| Source              | What it provides                                        |
| ------------------- | ------------------------------------------------------- |
| Perplexity API      | Real web-grounded AI answers + citations                |
| Google Gemini API   | Google AI Overviews                                     |
| OpenAI GPT-5 series | ChatGPT-style answers + reasoning                       |
| Supabase            | Stored queries, sites, competitors, citations, listings |
| Inngest             | Scheduled checks & historical tracking                  |
| Resend              | Email delivery                                          |
| User input          | Site URLs, competitors, listing confirmations           |

Nothing else.

No scraping.
No third-party SEO APIs.
No search volume APIs.
No fake metrics.

---

## 2️⃣ Data Integrity Rules

The system may display ONLY:

* AI responses that were actually returned by APIs
* Products or domains actually mentioned in those responses
* Sources actually cited by those responses
* Competitors actually detected
* Listings the user explicitly confirmed
* Changes that were actually observed over time

The system must NEVER:

* invent traffic
* invent revenue
* invent market size
* invent competitor positions
* invent rankings
* invent improvement

If something is not observed:

> **Show "Not observed yet — run more checks."**

---

## 3️⃣ What "AI Market Share" Means

AI Market Share must be defined ONLY as:

```
AI mention share =  
(times this site was mentioned in tracked AI queries)  
÷  
(total mentions of all sites in those same queries)
```

It must be labeled:

> **"AI mention share (tracked queries only)"**

It must never be labeled:

* industry share
* revenue share
* market share
* dominance

---

## 4️⃣ What "Impact" Means

The system may ONLY say:

> "After you got listed on G2, AI mentioned you 5 more times in these queries."

It must NOT say:

* "You gained $X"
* "You captured traffic"
* "You earned revenue"

Only:

> **observed AI mentions increased or decreased.**

---

## 5️⃣ Model Usage (Strict)

All reasoning, analysis, extraction, gap analysis, and recommendations must use:

> **OpenAI GPT-5 series models**
> (GPT-5, GPT-5-mini, GPT-5-nano as appropriate)

Reference: https://platform.openai.com/docs/models

Never:

* GPT-4
* GPT-4o
* GPT-3.5
* Claude
* Gemini for reasoning

Gemini & Perplexity are ONLY for:

> retrieving AI answers.

GPT-5 is ONLY for:

> analyzing them.

---

## 6️⃣ What We Are Allowed To Infer

We are allowed to infer:

* intent level of queries (best / alternatives / vs / pricing)
* relative opportunity based on query type

We are NOT allowed to infer:

* dollar values
* traffic volume
* revenue

We may show:

> "High-intent query"
> "Medium-intent query"

Never:

> "$8,400 opportunity"

---

## 7️⃣ Technical Feasibility Constraint

Every feature must be implemented using:

* Supabase tables
* Inngest scheduled jobs
* Next.js API routes
* The AI APIs above

If a feature would require:

* crawling the web
* proprietary datasets
* SEO volume APIs
* paid third-party data

It must NOT be built.

We only build what the stack can actually do.

---

## 8️⃣ If Something Can't Be Known

The UI must say:

> **"We don't have enough data yet — run more checks."**

Never:

> "Probably…"
> "Likely…"
> "Estimated competitor…"

No speculation.

---

## 9️⃣ Product North Star

Every screen must answer:

> **"Who is AI recommending, and which sources caused that?"**

Not:

* SEO
* scores
* vanity metrics
* made-up numbers

Only:

* AI outputs
* competitors
* sources
* changes over time

---

## 🔟 This Is a Production System

CabbageSEO must behave like:

> a financial trading terminal

Data must be:

* traceable
* verifiable
* reproducible

If a value cannot be traced to:

> an AI response, a Supabase row, or a user action

it must not exist.

---

## 📋 Terminology Guide

| ❌ Don't Say | ✅ Say Instead |
|-------------|----------------|
| "You lost $18,500" | "High-intent queries where competitors are recommended" |
| "Revenue loss" | "Opportunity score" or "Buyer intent queries missed" |
| "Market share: 15%" | "AI mention share: 15% (of tracked queries)" |
| "You gained $4,300" | "AI mentions increased by X" |
| "Estimated revenue" | "Relative opportunity (based on query intent)" |
| "Your ranking" | "Your AI visibility" |
| "Traffic potential" | "Query intent level" |
| "Probably..." | "Not observed yet — run more checks" |

---

## ✅ Implementation Checklist

- [x] All dollar amounts labeled "est." or removed
- [x] Market share labeled as "AI mention share (tracked queries)"
- [x] No invented competitor positions
- [x] No fake precision (e.g., "$18,547.23")
- [x] Attribution shows mentions, not money
- [x] Missing data shows "Run more checks" message
- [x] All AI analysis uses GPT-5 series
- [x] Sources are real URLs from AI responses
- [x] Competitors are real domains from AI responses
- [x] Technical feasibility verified for all features

---

## 🎯 Why This Matters

If you keep this contract enforced, you will have something incredibly rare in SaaS:

**A product people trust.**

That is what lets you grow to **$100k MRR without blowing up later**.

---

*Last updated: January 2026*
