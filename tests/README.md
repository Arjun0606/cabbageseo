# 🧪 CabbageSEO E2E Test Suite

> Production-grade end-to-end tests for validating that CabbageSEO works exactly as users will experience it when money is on the line.

## Quick Start

### 1. Install Dependencies

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Set Environment Variables

Create a `.env.test` file or export these:

```bash
# Required
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# AI APIs (at least one required for AI tests)
export PERPLEXITY_API_KEY="pplx-..."
export GOOGLE_AI_API_KEY="..."
export OPENAI_API_KEY="sk-..."

# Billing (optional for billing tests)
export DODO_API_KEY="..."
export RESEND_API_KEY="re_..."

# Test config
export TEST_BASE_URL="https://cabbageseo.com"  # or http://localhost:3000
export KEEP_TEST_DATA="false"  # set to "true" to inspect test data
```

### 3. Run Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/02-marketing.spec.ts

# Run with UI
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Generate report
npx playwright show-report
```

---

## Test Structure

```
tests/
├── e2e/
│   ├── 01-signup.spec.ts      # Signup & auth flows
│   ├── 02-marketing.spec.ts   # Homepage, pricing, docs
│   ├── 03-api-health.spec.ts  # API endpoint health
│   ├── 04-plan-gating.spec.ts # Tier-specific features
│   ├── 05-ai-apis.spec.ts     # AI API connectivity
│   ├── 06-data-integrity.spec.ts  # No fake data
│   └── 07-billing.spec.ts     # Billing & payments
├── fixtures/
│   └── ai-responses.json      # Recorded AI responses
├── seeds/
│   ├── global-setup.ts        # Creates test data
│   └── global-teardown.ts     # Cleans up test data
└── README.md
```

---

## What's Tested

### ✅ Signup & Auth (01-signup.spec.ts)
- Signup page loads correctly
- Form elements present
- OAuth buttons visible
- Terms/Privacy links work

### ✅ Marketing Pages (02-marketing.spec.ts)
- Homepage value proposition
- Navigation links
- Footer with required links
- Pricing page shows all tiers
- Correct prices displayed
- Docs page accessible
- No fake data or placeholders

### ✅ API Health (03-api-health.spec.ts)
- Unauthenticated requests handled
- Endpoints exist (not 404)
- Static assets load

### ✅ Plan Gating (04-plan-gating.spec.ts)
- Free plan limits
- Starter plan limits
- Pro plan limits
- Usage tracking works
- Database tables accept data

### ✅ AI APIs (05-ai-apis.spec.ts)
- Perplexity API connectivity
- Google AI (Gemini) connectivity
- OpenAI connectivity
- Real responses (not mocks)
- Contains real product names

### ✅ Data Integrity (06-data-integrity.spec.ts)
- No placeholder dollar amounts
- No lorem ipsum
- No TODO/FIXME in public content
- Proper confidence level labeling
- No overclaiming

### ✅ Billing (07-billing.spec.ts)
- Billing page exists
- Dodo integration configured
- CTAs link correctly

---

## Test Matrix by Tier

| Feature | Free | Starter | Pro |
|---------|------|---------|-----|
| Manual checks | 3/day | 10/day | Unlimited |
| Automated checks | ❌ | Daily | Hourly |
| Sites | 1 | 3 | 10 |
| Competitors | 0 | 2/site | 10/site |
| CSV Export | ❌ | ✅ | ✅ |
| Email Alerts | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Content Fixes | ❌ | 5/mo | Unlimited |
| History | 7 days | 30 days | 1 year |

---

## Truth Rules (SYSTEM.md)

These tests enforce:

1. **No fake numbers** - No invented metrics, percentages, or dollar values
2. **Real AI responses** - All displayed data comes from actual API calls
3. **Proper labeling** - Confidence levels (High/Medium/Low) are explained
4. **No overclaiming** - No "100% accurate" or unsubstantiated claims
5. **Raw data available** - Users can see original AI responses

---

## CI/CD Integration

Add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Run tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          TEST_BASE_URL: https://cabbageseo.com
          
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Failed Tests

### View Test Report
```bash
npx playwright show-report
```

### Run Single Test
```bash
npx playwright test -g "Homepage loads"
```

### Debug Mode
```bash
npx playwright test --debug
```

### Keep Browser Open
```bash
npx playwright test --headed --timeout=0
```

### Inspect Test Data

Set `KEEP_TEST_DATA=true` to prevent cleanup, then check Supabase for rows with IDs starting with `e2e-`.

---

## Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Use numbered prefix for ordering (e.g., `08-new-feature.spec.ts`)
3. Import from `@playwright/test`
4. Follow existing patterns
5. Test both success and failure cases
6. Add to this README

---

## Test Site

All AI tests use **notion.com** as the test domain because:
- It's well-known and AI definitely mentions it
- We can verify citations are real
- Results are reproducible

---

## Questions?

If tests fail:
1. Check environment variables are set
2. Verify API keys are valid
3. Check if rate limited
4. Review the HTML report

Contact: arjun@cabbageseo.com

