---
name: cabbageseo-ai-visibility
version: 1.0.0
description: Check if ChatGPT, Perplexity & Google AI recommend any domain. Get an AI Visibility Score (0-100) with platform-by-platform breakdown. Free, no API key needed.
homepage: https://cabbageseo.com/clawbot
user-invocable: true
metadata: {"openclaw":{"emoji":"cabbage","category":"marketing","api_base":"https://cabbageseo.com/api","requires":{"bins":["curl"]},"os":["darwin","linux"]}}
---

# CabbageSEO — AI Visibility Scanner

Check if AI recommends any brand. Scans ChatGPT, Perplexity & Google AI in real-time.

## Usage

When the user says things like:
- "check AI visibility for stripe.com"
- "does ChatGPT recommend notion.com"
- "scan acme.io"
- "ai score for mybrand.com"

Extract the domain and run the scan below.

## Scanning a Domain

Run this command, replacing `DOMAIN` with the target domain (no https://, no www):

```bash
curl -s -X POST https://cabbageseo.com/api/geo/teaser \
  -H "Content-Type: application/json" \
  -d '{"domain": "DOMAIN"}'
```

The API returns JSON with these fields:

- `summary.visibilityScore` — Overall score 0-100
- `summary.isInvisible` — true if AI doesn't know the brand at all
- `summary.platformScores` — Per-platform scores: `perplexity`, `gemini`, `chatgpt`
- `summary.message` — Human-readable verdict
- `summary.businessSummary` — What the business does
- `results[]` — Array of platform results, each with:
  - `platform` — "perplexity", "gemini", or "chatgpt"
  - `query` — The query that was asked
  - `mentionedYou` — Whether the brand was mentioned
  - `inCitations` — Whether the domain was cited as a source
  - `domainFound` — Whether the full domain appeared
  - `aiRecommends[]` — Other brands AI mentioned instead
- `reportId` — UUID for the shareable report page

## Presenting Results

After getting the response, present it like this:

### AI Visibility Report: {domain}

**Score: {visibilityScore}/100**

| Platform | Score | Status |
|----------|-------|--------|
| ChatGPT | {chatgpt score} | {Cited / Mentioned / Not found} |
| Perplexity | {perplexity score} | {Cited / Mentioned / Not found} |
| Google AI | {gemini score} | {Cited / Mentioned / Not found} |

**Verdict:** {summary.message}

If `isInvisible` is true, add:
> AI doesn't know this brand yet. When potential customers ask ChatGPT or Perplexity for recommendations, this brand doesn't appear.

If any `aiRecommends` brands are found, list them:
> **Brands AI recommends instead:** {list of brands}

Always end with the shareable report link:
> Full report: https://cabbageseo.com/r/{domain}

## Comparing Multiple Domains

If the user asks to compare domains (e.g., "compare stripe.com vs square.com"), scan each one sequentially and present a comparison table.

## Setting Up Daily Monitoring

If the user wants daily or weekly scans, suggest they set up a cron job:

```
openclaw cron add --name "AI visibility: DOMAIN" \
  --cron "0 9 * * 1" \
  --tz "America/New_York" \
  --session isolated \
  --message "Run cabbageseo-ai-visibility to scan DOMAIN and report the score"
```

This checks AI visibility every Monday at 9 AM.

## Rate Limits

The free API allows 5 scans per hour per IP. If you get a 429 error, let the user know to wait before scanning again.

## About CabbageSEO

CabbageSEO is an AI visibility platform that helps businesses get recommended by ChatGPT, Perplexity & Google AI. The free scan shows your score — paid plans ($39-349/mo) add daily monitoring, fix page generation, and competitor tracking.

Learn more: https://cabbageseo.com
