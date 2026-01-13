# 🧪 CabbageSEO Complete Testing Guide

> This guide covers testing every feature, workflow, and pricing tier before launch.

---

## 📋 Quick Start

### Step 1: Run Automated Tests

Visit this URL in your browser:

```
https://cabbageseo.com/api/test/full-suite
```

This tests:
- ✅ Environment variables
- ✅ Database tables
- ✅ AI API connectivity (Perplexity, Google AI, OpenAI)
- ✅ Billing integration
- ✅ Email service
- ✅ Pricing plan configuration

**All tests should pass before proceeding.**

---

### Step 2: Create Test Accounts

#### Option A: Use Real Accounts (Recommended)

Create 3 accounts with your email aliases:

1. **Free Account:** `yourname+free@gmail.com`
2. **Starter Account:** `yourname+starter@gmail.com`  
3. **Pro Account:** `yourname+pro@gmail.com`

#### Option B: Use Test SQL

Run `scripts/test-accounts-setup.sql` in Supabase SQL Editor to create test data.

---

## 🔍 Manual Testing Checklist

### TIER 1: Free Plan Testing

Login as the Free account and verify:

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| **Signup** | Visit /signup → Enter email → Submit | Account created, redirected to dashboard | ☐ |
| **Add Site** | Click "Add Site" → Enter domain | Site appears in sidebar | ☐ |
| **Manual Check** | Click "Check Now" | Shows AI responses (not mock data) | ☐ |
| **3 Checks/Day Limit** | Run 4 checks | 4th check blocked with upgrade prompt | ☐ |
| **View Raw AI Response** | Click on any citation | Shows actual AI text | ☐ |
| **No CSV Export** | Look for export button | Export not visible or disabled | ☐ |
| **No Email Alerts** | Go to Settings → Notifications | Alert options disabled or not shown | ☐ |
| **No Automated Monitoring** | Check dashboard | No "Last auto-check" shown | ☐ |
| **Upgrade Prompt** | Try to access Pro feature | Modal shows upgrade options | ☐ |
| **7-Day History** | Check history | Only last 7 days shown | ☐ |

---

### TIER 2: Starter Plan Testing

Login as the Starter account and verify:

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| **Upgrade Flow** | Click upgrade → Complete checkout | Plan changes to Starter | ☐ |
| **3 Sites Allowed** | Add 3 sites | All 3 appear | ☐ |
| **4th Site Blocked** | Try to add 4th site | Error: "Upgrade to add more sites" | ☐ |
| **Daily Auto-Checks** | Wait or check Inngest | Daily job scheduled | ☐ |
| **2 Competitors** | Add 2 competitors to a site | Both appear in comparison | ☐ |
| **3rd Competitor Blocked** | Try to add 3rd competitor | Error or upgrade prompt | ☐ |
| **CSV Export** | Click Export → Download | CSV downloads with raw data | ☐ |
| **Email Alerts** | Enable alerts → Trigger event | Email received | ☐ |
| **5 Content Fixes/Month** | Generate 5 fixes | All work | ☐ |
| **6th Fix Blocked** | Try 6th fix | "Monthly limit reached" | ☐ |
| **30-Day History** | Check history | Full 30 days visible | ☐ |
| **Weekly Report** | Check email or settings | Weekly report option available | ☐ |

---

### TIER 3: Pro Plan Testing

Login as the Pro account and verify:

| Test | Steps | Expected Result | ✓ |
|------|-------|-----------------|---|
| **Upgrade to Pro** | Click upgrade → Complete $79 checkout | Plan changes to Pro | ☐ |
| **10 Sites Allowed** | Add up to 10 sites | All work | ☐ |
| **Hourly Auto-Checks** | Check Inngest dashboard | Hourly job scheduled | ☐ |
| **10 Competitors** | Add 10 competitors to a site | All appear | ☐ |
| **Unlimited Content Fixes** | Generate 10+ fixes | No limit message | ☐ |
| **API Access** | Go to Settings → API | API key visible | ☐ |
| **Priority Support** | Check support options | Pro badge or priority queue | ☐ |
| **1-Year History** | Check history | Full year available | ☐ |
| **Competitor Takeover Alerts** | Enable alerts | Option available | ☐ |
| **All Intelligence Features** | Use gap analysis, etc. | All work without limits | ☐ |

---

## 🔌 API Endpoint Testing

### Test Each Endpoint

```bash
# Replace YOUR_TOKEN with actual auth token from browser

# Get user info
curl https://cabbageseo.com/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get sites
curl https://cabbageseo.com/api/sites \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run citation check (POST)
curl -X POST https://cabbageseo.com/api/geo/citations/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"siteId": "YOUR_SITE_ID"}'

# Get usage
curl https://cabbageseo.com/api/billing/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💳 Billing Flow Testing

### Dodo Payments Checkout

1. Go to `/settings/billing`
2. Click "Upgrade to Starter" or "Upgrade to Pro"
3. Should redirect to Dodo Payments checkout
4. Complete payment (use test card if available)
5. Verify webhook updates user plan in Supabase

### Verify Webhook

Check Supabase `organizations` table:
- `plan` should update to `starter` or `pro`
- `subscription_status` should be `active`
- `dodo_subscription_id` should be populated

---

## 📧 Email Testing

### Test Alert Emails

1. Login as Starter/Pro user
2. Enable email alerts in Settings → Notifications
3. Run a citation check
4. If site gets cited → Should receive alert email

### Test Weekly Report

1. Check Inngest dashboard for `weekly-report` job
2. Manually trigger or wait for scheduled run
3. Verify email received with correct data

---

## 🤖 AI Integration Testing

### Perplexity Check

1. Run citation check
2. Verify `platform: "perplexity"` results appear
3. Verify citations array is populated
4. Verify raw response is stored

### Google AI Check

1. Run citation check  
2. Verify `platform: "google_ai"` results appear
3. Verify search grounding is working

### OpenAI/ChatGPT Check

1. Run citation check
2. Verify `platform: "chatgpt"` results appear
3. Verify responses are real (not mock)

---

## 🚨 Edge Cases to Test

| Scenario | Steps | Expected |
|----------|-------|----------|
| **Invalid domain** | Add "not-a-domain" | Error message |
| **Duplicate site** | Add same domain twice | Error: "Site already exists" |
| **Empty check** | Check site with no queries | Graceful empty state |
| **API timeout** | (Hard to test) | Retry or error message |
| **Expired trial** | Set trial_ends_at in past | Upgrade required message |
| **Cancelled subscription** | Cancel in Dodo | Plan reverts to free |
| **Network error** | Disable internet | Error handling |

---

## ✅ Final Launch Checklist

Before Product Hunt:

- [ ] All automated tests pass (`/api/test/full-suite`)
- [ ] Free tier limits enforced correctly
- [ ] Starter tier features all work
- [ ] Pro tier features all work  
- [ ] Billing checkout completes
- [ ] Webhooks update database
- [ ] Emails send correctly
- [ ] AI checks return real data
- [ ] No mock/fake data anywhere
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] Error pages look good (404, 500)

---

## 🐛 Reporting Issues

If you find a bug:

1. Note the exact steps to reproduce
2. Screenshot the error
3. Check browser console for errors
4. Check Vercel logs for server errors
5. Document and fix before launch

---

## 🚀 Ready for Launch?

If all tests pass:

1. ✅ Marketing site is ready
2. ✅ Product works correctly
3. ✅ Billing is functional
4. ✅ Emails are sending
5. ✅ All tiers are properly gated

**You're ready for Product Hunt! 🥬**

