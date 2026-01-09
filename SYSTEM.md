# 🔒 CabbageSEO — Truth & Data Integrity System Prompt

> **This product must NEVER display fake, guessed, mocked, simulated, or placeholder data as real.
> If a value is not directly measured from AI responses or user-confirmed actions, it must be labeled as an estimate or not shown at all.**

## 1️⃣ Data Truth Rules

The system may ONLY show:

* Raw AI responses
* Products or domains actually mentioned by AI
* Sources actually cited by AI
* Queries actually run
* Competitors actually detected
* User-confirmed listings
* Changes actually observed over time

The system must NEVER:

* invent market share
* invent traffic
* invent revenue
* invent rankings
* invent competitor positions

If a number is not directly observed, it must be shown as:

> "Estimated" or "Relative"

Never as a precise dollar or percentage.

---

## 2️⃣ How "Market Share" must be defined

Market share is allowed ONLY as:

> **"Share of AI mentions in tracked queries."**

It is:

```
AI_share = (times this site was mentioned) / (total mentions across all sites in those queries)
```

It must never be called:

* total market share
* industry share
* revenue share

Always:

> **"AI mention share (within tracked queries)"**

---

## 3️⃣ How "Revenue" must be handled

The system must never display:

> "You lost $18,500"

It must display:

> **"High-value buyer intent queries you are missing"**
> or
> **"Relative opportunity score"**

If any dollar values are shown, they must be:

* labeled as "estimate"
* based only on:
  * query intent (best, alternatives, pricing, vs)
  * category weighting

Never implied to be real revenue.

---

## 4️⃣ How attribution works

The system may only say:

> "After you got listed on G2, you were mentioned X more times in AI answers."

It must NOT say:

> "You gained $4,300"

Only:

> **"Your AI visibility increased by X mentions in these queries."**

Let the user infer money.

---

## 5️⃣ How models must be used

All AI reasoning, analysis, and content generation must use:

> **OpenAI GPT-5 series models**
> (GPT-5 or GPT-5-mini or GPT-5-nano as appropriate)

Do not use:

* legacy GPT-4
* GPT-4o
* GPT-3.5

Always prefer:

* GPT-5 for analysis
* GPT-5-mini for batch jobs
* GPT-5-nano for lightweight parsing

Reference: https://platform.openai.com/docs/models

---

## 6️⃣ Product philosophy

CabbageSEO is not a demo.
It is a **truth-based intelligence system.**

Users must always be able to trust:

* what AI said
* who AI recommended
* which sources AI used
* what changed over time

If something is uncertain, show:

> "We do not have enough data yet."

Never fake certainty.

---

## 7️⃣ The North Star

Every screen must answer:

> **"Who is AI recommending, and where did it get that information?"**

Not:

* SEO
* scores
* fluff
* vibes

Only:

* real AI outputs
* real competitor presence
* real distribution channels

---

## 8️⃣ If data is missing

The system should say:

> "We haven't observed this yet — run more checks."

Never:

> "Probably…"
> "Likely…"
> "Estimated competitor…"

No speculation in UI.

---

## 9️⃣ Terminology Guide

| ❌ Don't Say | ✅ Say Instead |
|-------------|----------------|
| "You lost $18,500" | "High-intent queries where competitors are recommended" |
| "Revenue loss" | "Opportunity score" or "Buyer intent queries missed" |
| "Market share: 15%" | "AI mention share: 15% (of tracked queries)" |
| "You gained $4,300" | "AI mentions increased by X" |
| "Estimated revenue" | "Relative opportunity (based on query intent)" |
| "Your ranking" | "Your AI visibility" |
| "Traffic potential" | "Query intent level" |

---

## 🔟 Implementation Checklist

- [ ] All dollar amounts labeled "est." or removed
- [ ] Market share labeled as "AI mention share (tracked queries)"
- [ ] No invented competitor positions
- [ ] No fake precision (e.g., "$18,547.23")
- [ ] Attribution shows mentions, not money
- [ ] Missing data shows "Run more checks" message
- [ ] All AI analysis uses GPT-5 series
- [ ] Sources are real URLs from AI responses
- [ ] Competitors are real domains from AI responses

---

This prompt keeps CabbageSEO **clean, credible, and scalable** — which is what allows growth to $100k MRR without burning reputation or getting sued.

