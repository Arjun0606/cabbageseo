# 🧪 Complete Testing Guide - CabbageSEO
**Date:** January 2025  
**Purpose:** End-to-end testing of authentication, payments, all pricing tiers, AND revenue optimization

---

## 🎯 TWO-PHASE TESTING

### Phase 1: Revenue Optimization Testing (PRIORITY)
**Focus:** Verify all revenue optimization changes work correctly  
**See:** `REVENUE_TESTING_CHECKLIST.md` for complete guide  
**See:** `MASTER_TESTING_REFERENCE.md` for all points

### Phase 2: Technical Testing (After Revenue)
**Focus:** Verify authentication, payments, and tier limits  
**See:** Sections below for technical testing

---

## ⚠️ START HERE: Revenue Optimization Testing

**Before technical testing, verify revenue optimization points:**

1. **Read:** `REVENUE_TESTING_CHECKLIST.md` - Complete checklist
2. **Read:** `MASTER_TESTING_REFERENCE.md` - All points to test
3. **Use:** `TESTING_SESSION_NOTES.md` - Document your findings

**Key Tests:**
- Dashboard losses first ✅ (implemented)
- One metric display ✅ (implemented)
- Homepage competitors ⚠️ (test)
- Onboarding auto-scan ⚠️ (test)
- Progress tracking ⚠️ (test)
- Email alerts ⚠️ (test)

**Then proceed with technical testing below.**

---

## 📋 Pre-Testing Setup

### 1. Environment Check

Verify these environment variables are set:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Dodo Payments (TEST MODE)
DODO_PAYMENTS_API_KEY=your_test_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_STARTER_MONTHLY_ID=prod_starter_monthly_test
DODO_STARTER_YEARLY_ID=prod_starter_yearly_test
DODO_PRO_MONTHLY_ID=prod_pro_monthly_test
DODO_PRO_YEARLY_ID=prod_pro_yearly_test

# AI APIs
PERPLEXITY_API_KEY=your_key
GOOGLE_AI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Email
RESEND_API_KEY=your_key

# Inngest
INNGEST_EVENT_KEY=your_key
INNGEST_SIGNING_KEY=your_key
```

### 2. Dodo Payments Configuration

1. **Set Webhook URL in Dodo Dashboard:**
   - Go to Dodo Payments dashboard → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/dodo`
   - Select events: `subscription.*`, `payment.*`
   - Copy webhook secret to `.env`

2. **Verify Test Mode:**
   - Ensure Dodo SDK is using `test_mode` (not `live_mode`)
   - Check `src/lib/billing/dodo.ts` - should use `test_mode` in development

### 3. Test Cards (Dodo Payments)

Use these test cards for all payment testing:

| Card Number | Type | Result | Use Case |
|-------------|------|--------|----------|
| `4242 4242 4242 4242` | Visa | ✅ Success | Normal checkout |
| `5555 5555 5555 4444` | Mastercard | ✅ Success | Alternative card |
| `4000 0000 0000 0002` | Visa | ❌ Declined | Payment failure |
| `4000 0000 0000 9995` | Mastercard | ❌ Declined | Payment failure |

**Card Details (use for all):**
- Expiry: `12/34` (any future date)
- CVV: `123` (any 3 digits)
- ZIP: `12345` (any 5 digits)
- Name: Any name

---

## 🔐 PHASE 1: Authentication Testing

### Test 1.1: Email/Password Signup

**Steps:**
1. Navigate to `/signup`
2. Enter email: `test-auth-1@example.com`
3. Enter password: `TestPassword123!`
4. Click "Sign up"

**Expected Results:**
- ✅ Account created successfully
- ✅ Redirected to `/onboarding` or `/dashboard`
- ✅ Organization created automatically
- ✅ User has `free` plan
- ✅ Trial period set (7 days from now)

**Verify in Database:**
```sql
-- Check Supabase auth.users table
SELECT id, email, created_at FROM auth.users WHERE email = 'test-auth-1@example.com';

-- Check organizations table
SELECT id, plan, subscription_status, trial_ends_at 
FROM organizations 
WHERE id IN (
  SELECT organization_id FROM users WHERE email = 'test-auth-1@example.com'
);
```

### Test 1.2: Google OAuth Signup

**Steps:**
1. Navigate to `/signup`
2. Click "Continue with Google"
3. Complete Google OAuth flow

**Expected Results:**
- ✅ OAuth redirects to Google
- ✅ After approval, redirects back to app
- ✅ Account created in Supabase
- ✅ Organization created
- ✅ User logged in

### Test 1.3: Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter email: `test-auth-1@example.com`
3. Enter password: `TestPassword123!`
4. Click "Sign in"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/dashboard`
- ✅ Session persists after page refresh
- ✅ User data loads correctly

### Test 1.4: Login Error Handling

**Steps:**
1. Navigate to `/login`
2. Enter wrong password
3. Click "Sign in"

**Expected Results:**
- ❌ Error message shown: "Invalid email or password"
- ✅ User stays on login page
- ✅ Form doesn't clear (user can retry)

### Test 1.5: Password Reset Flow

**Steps:**
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter email: `test-auth-1@example.com`
4. Check email inbox
5. Click reset link
6. Enter new password
7. Try logging in with new password

**Expected Results:**
- ✅ Reset email sent (check Resend dashboard)
- ✅ Reset link works
- ✅ Password can be changed
- ✅ Login works with new password

### Test 1.6: Logout

**Steps:**
1. While logged in, click "Logout" or navigate to `/api/auth/logout`
2. Try accessing `/dashboard`

**Expected Results:**
- ✅ Logout successful
- ✅ Redirected to homepage
- ✅ Dashboard access blocked (redirects to login)

---

## 💳 PHASE 2: Payment Testing

### Test 2.1: Checkout Session Creation

**Steps:**
1. Login as free user
2. Navigate to `/settings/billing`
3. Click "Upgrade to Starter" button
4. Observe redirect

**Expected Results:**
- ✅ API call to `/api/billing/checkout` succeeds
- ✅ Redirects to Dodo Payments checkout page
- ✅ Checkout URL is valid
- ✅ Plan and interval shown correctly

**Verify API Response:**
```bash
curl -X POST https://yourdomain.com/api/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{"planId": "starter", "interval": "monthly"}'
```

Should return:
```json
{
  "success": true,
  "url": "https://checkout.dodopayments.com/...",
  "data": {
    "checkoutUrl": "...",
    "sessionId": "..."
  }
}
```

### Test 2.2: Successful Payment (Starter Plan)

**Steps:**
1. Start checkout for Starter plan (monthly)
2. On Dodo checkout page:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVV: `123`
   - ZIP: `12345`
3. Complete payment
4. Wait for redirect back to app

**Expected Results:**
- ✅ Payment succeeds in Dodo
- ✅ Redirects to `/settings/billing?session_id=...`
- ✅ Webhook received (check logs)
- ✅ Organization plan updated to `starter`
- ✅ Subscription status: `active`
- ✅ Features unlock immediately

**Verify in Database:**
```sql
SELECT 
  plan, 
  subscription_status, 
  dodo_subscription_id, 
  dodo_customer_id,
  current_period_start,
  current_period_end
FROM organizations 
WHERE id = 'your_org_id';
```

**Verify Webhook:**
- Check Vercel logs for `[Dodo Webhook]` messages
- Should see: `Subscription created for org ...: starter`
- Check `notifications` table for success notification

### Test 2.3: Failed Payment

**Steps:**
1. Start checkout for Starter plan
2. On Dodo checkout page:
   - Card: `4000 0000 0000 0002` (declined card)
   - Expiry: `12/34`
   - CVV: `123`
3. Try to complete payment

**Expected Results:**
- ❌ Payment fails
- ✅ Error message shown in Dodo checkout
- ✅ User can retry with different card
- ✅ Organization plan stays as `free`
- ✅ No webhook received

### Test 2.4: Upgrade to Pro Plan

**Steps:**
1. Login as Starter user
2. Navigate to `/settings/billing`
3. Click "Upgrade to Pro"
4. Complete payment with test card `4242 4242 4242 4242`

**Expected Results:**
- ✅ Payment succeeds
- ✅ Plan updates to `pro`
- ✅ All Pro features unlock
- ✅ Limits increase (sites: 3→10, competitors: 2→10, etc.)

### Test 2.5: Billing Portal Access

**Steps:**
1. Login as paid user (Starter or Pro)
2. Navigate to `/settings/billing`
3. Click "Manage Subscription" or "Billing Portal"
4. Should redirect to Dodo customer portal

**Expected Results:**
- ✅ Portal URL generated successfully
- ✅ Redirects to Dodo portal
- ✅ Can view subscription details
- ✅ Can view invoices
- ✅ Can update payment method
- ✅ Can cancel subscription

**Verify API:**
```bash
curl -X POST https://yourdomain.com/api/billing/portal \
  -H "Cookie: your_session_cookie"
```

Should return:
```json
{
  "success": true,
  "data": {
    "portalUrl": "https://portal.dodopayments.com/..."
  }
}
```

### Test 2.6: Subscription Cancellation

**Steps:**
1. Access billing portal (from Test 2.5)
2. Cancel subscription
3. Return to app
4. Check organization status

**Expected Results:**
- ✅ Cancellation succeeds in Dodo
- ✅ Webhook received: `subscription.cancelled`
- ✅ Organization `cancel_at_period_end` = `true`
- ✅ Subscription status stays `active` until period end
- ✅ Features remain active until period end

**Verify Webhook:**
- Check logs for `[Dodo Webhook] Subscription canceled`
- Check `notifications` table for cancellation notification

---

## 🆓 PHASE 3: Free Tier Testing

### Create Free Test Account

**Account:** `test-free@example.com`  
**Password:** `TestPassword123!`

### Test 3.1: Free Tier Limits - Manual Checks

**Steps:**
1. Login as free user
2. Add a site (e.g., `example.com`)
3. Run 3 manual checks (click "Check Now" 3 times)
4. Try to run 4th check

**Expected Results:**
- ✅ First 3 checks succeed
- ✅ 4th check fails with error: "Free plan allows 3 checks per day. Upgrade to Starter for unlimited checks."
- ✅ Upgrade CTA shown

**Verify Usage:**
```sql
SELECT * FROM usage_tracking 
WHERE organization_id = 'your_org_id' 
  AND resource_type = 'manual_checks'
  AND period = CURRENT_DATE::text
ORDER BY created_at DESC;
```

Should show 3 entries for today.

### Test 3.2: Free Tier Limits - Sites

**Steps:**
1. Login as free user
2. Add first site: `site1.com`
3. Try to add second site: `site2.com`

**Expected Results:**
- ✅ First site added successfully
- ✅ Second site fails with error: "Free plan allows 1 site. Upgrade to Starter for 3 sites."

**Verify API:**
```bash
curl -X POST https://yourdomain.com/api/sites \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{"domain": "site2.com"}'
```

Should return 403 with error message.

### Test 3.3: Free Tier Limits - Competitors

**Steps:**
1. Login as free user
2. Try to add a competitor to your site

**Expected Results:**
- ❌ Competitor addition fails
- ✅ Error: "Free plan doesn't include competitor tracking. Upgrade to Starter."

### Test 3.4: Free Tier Paywalls

**Steps:**
1. Login as free user
2. Navigate to `/dashboard/roadmap`
3. Navigate to `/dashboard/sources`
4. Try to access gap analysis on a query

**Expected Results:**
- ✅ Roadmap page shows paywall: "Upgrade to Starter to unlock your visibility roadmap"
- ✅ Trust Map shows limited sources (2 sources only)
- ✅ Gap analysis shows paywall: "Upgrade to Starter for gap analysis"

### Test 3.5: Trial Expiration

**Steps:**
1. Manually set trial expiration in database:
```sql
UPDATE organizations 
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE id = 'your_free_org_id';
```
2. Login as free user
3. Try to run a check

**Expected Results:**
- ❌ Check fails with error: "Your 7-day trial has expired. Upgrade to continue using CabbageSEO."
- ✅ Upgrade CTA shown prominently

---

## 🚀 PHASE 4: Starter Tier Testing

### Create Starter Test Account

**Account:** `test-starter@example.com`  
**Password:** `TestPassword123!`  
**Upgrade:** Use test card `4242 4242 4242 4242` to upgrade to Starter

### Test 4.1: Starter Tier - Unlimited Manual Checks

**Steps:**
1. Login as Starter user
2. Run 10+ manual checks

**Expected Results:**
- ✅ All checks succeed (no limit)
- ✅ No error messages
- ✅ Usage tracking shows all checks

### Test 4.2: Starter Tier - Site Limits

**Steps:**
1. Login as Starter user
2. Add 3 sites: `site1.com`, `site2.com`, `site3.com`
3. Try to add 4th site: `site4.com`

**Expected Results:**
- ✅ First 3 sites added successfully
- ✅ 4th site fails: "Starter plan allows 3 sites. Upgrade to Pro for 10 sites."

### Test 4.3: Starter Tier - Competitor Limits

**Steps:**
1. Login as Starter user
2. Add 2 competitors to a site
3. Try to add 3rd competitor

**Expected Results:**
- ✅ First 2 competitors added successfully
- ✅ 3rd competitor fails: "Starter plan allows 2 competitors per site. Upgrade to Pro for 10 competitors."

### Test 4.4: Starter Tier - Gap Analysis Limits

**Steps:**
1. Login as Starter user
2. Run 5 gap analyses (via `/dashboard/query` → "Why not me?")
3. Try to run 6th gap analysis

**Expected Results:**
- ✅ First 5 gap analyses succeed
- ✅ 6th fails: "You've used 5 gap analyses this month. Upgrade to Pro for unlimited."

**Verify Usage:**
```sql
SELECT COUNT(*) FROM usage_tracking 
WHERE organization_id = 'your_org_id' 
  AND resource_type = 'gap_analyses'
  AND period = TO_CHAR(NOW(), 'YYYY-MM');
```

Should show 5 entries.

### Test 4.5: Starter Tier - Content Ideas Limits

**Steps:**
1. Login as Starter user
2. Generate 3 content ideas
3. Try to generate 4th content idea

**Expected Results:**
- ✅ First 3 succeed
- ✅ 4th fails: "You've used 3 content ideas this month. Upgrade to Pro for unlimited."

### Test 4.6: Starter Tier - Daily Auto-Checks

**Steps:**
1. Login as Starter user
2. Check Inngest dashboard for scheduled jobs
3. Wait for daily check to run (or trigger manually)

**Expected Results:**
- ✅ Daily job scheduled in Inngest
- ✅ Auto-check runs successfully
- ✅ Citations saved to database
- ✅ Auto-checks don't count against manual limits

**Verify Inngest:**
- Go to Inngest dashboard
- Look for `daily-citation-check` job
- Should be scheduled for each Starter organization

---

## 💎 PHASE 5: Pro Tier Testing

### Create Pro Test Account

**Account:** `test-pro@example.com`  
**Password:** `TestPassword123!`  
**Upgrade:** Use test card `4242 4242 4242 4242` to upgrade to Pro

### Test 5.1: Pro Tier - Unlimited Features

**Steps:**
1. Login as Pro user
2. Run 20+ manual checks
3. Run 10+ gap analyses
4. Generate 10+ content ideas

**Expected Results:**
- ✅ All succeed (no limits)
- ✅ No error messages
- ✅ Features work smoothly

### Test 5.2: Pro Tier - Site Limits

**Steps:**
1. Login as Pro user
2. Add 10 sites
3. Try to add 11th site

**Expected Results:**
- ✅ First 10 sites added successfully
- ✅ 11th site fails: "Pro plan allows 10 sites. Upgrade to Pro+ for 50 sites."

### Test 5.3: Pro Tier - Competitor Limits

**Steps:**
1. Login as Pro user
2. Add 10 competitors to a site
3. Try to add 11th competitor

**Expected Results:**
- ✅ First 10 competitors added successfully
- ✅ 11th fails: "Pro plan allows 10 competitors per site."

### Test 5.4: Pro Tier - Full Trust Map Access

**Steps:**
1. Login as Pro user
2. Navigate to `/dashboard/sources`
3. Check all sources are visible

**Expected Results:**
- ✅ All sources shown (not just top 5)
- ✅ Full instructions available for each source
- ✅ No paywalls

### Test 5.5: Pro Tier - Full Roadmap Access

**Steps:**
1. Login as Pro user
2. Navigate to `/dashboard/roadmap`
3. Check roadmap features

**Expected Results:**
- ✅ Full roadmap visible
- ✅ Progress tracking works
- ✅ Weekly playbook available
- ✅ No paywalls

### Test 5.6: Pro Tier - Hourly Auto-Checks

**Steps:**
1. Login as Pro user
2. Check Inngest dashboard for scheduled jobs
3. Wait for hourly check to run (or trigger manually)

**Expected Results:**
- ✅ Hourly job scheduled in Inngest
- ✅ Auto-check runs successfully
- ✅ Citations saved to database
- ✅ More frequent checks than Starter

**Verify Inngest:**
- Go to Inngest dashboard
- Look for `hourly-citation-check` job
- Should be scheduled for each Pro organization

---

## 🔄 PHASE 6: Upgrade/Downgrade Testing

### Test 6.1: Free → Starter Upgrade

**Steps:**
1. Login as free user
2. Upgrade to Starter (use test card)
3. Verify features unlock
4. Check limits increase

**Expected Results:**
- ✅ Plan updates immediately
- ✅ Can add 3 sites (was 1)
- ✅ Can add competitors (was 0)
- ✅ Can run unlimited checks (was 3/day)
- ✅ Gap analysis available (was blocked)

### Test 6.2: Starter → Pro Upgrade

**Steps:**
1. Login as Starter user
2. Upgrade to Pro (use test card)
3. Verify features unlock
4. Check limits increase

**Expected Results:**
- ✅ Plan updates immediately
- ✅ Can add 10 sites (was 3)
- ✅ Can add 10 competitors per site (was 2)
- ✅ Unlimited gap analyses (was 5/month)
- ✅ Unlimited content ideas (was 3/month)
- ✅ Full Trust Map access
- ✅ Full Roadmap access

### Test 6.3: Pro → Starter Downgrade

**Steps:**
1. Login as Pro user
2. Access billing portal
3. Change plan to Starter
4. Verify features lock

**Expected Results:**
- ✅ Plan updates to Starter
- ✅ Features lock appropriately
- ✅ Sites beyond limit remain but can't add more
- ✅ Competitors beyond limit remain but can't add more
- ✅ Usage limits apply (5 gap analyses/month)

---

## 📧 PHASE 7: Email & Notifications Testing

### Test 7.1: Email Alerts

**Steps:**
1. Login as Starter/Pro user
2. Enable email alerts in Settings
3. Run a citation check
4. If site gets cited, check email

**Expected Results:**
- ✅ Email sent via Resend
- ✅ Email content is correct
- ✅ Links in email work
- ✅ Email formatting looks good

### Test 7.2: Weekly Reports

**Steps:**
1. Check Inngest dashboard for weekly report job
2. Manually trigger or wait for scheduled run
3. Check email inbox

**Expected Results:**
- ✅ Weekly report sent
- ✅ Report includes real data
- ✅ No mock/fake data
- ✅ Email formatting correct

### Test 7.3: Subscription Notifications

**Steps:**
1. Complete a subscription upgrade
2. Check `notifications` table in database

**Expected Results:**
- ✅ Notification created in database
- ✅ Notification type: `success`
- ✅ Notification category: `billing`
- ✅ Notification visible in UI (if implemented)

---

## ✅ Final Verification Checklist

### Authentication
- [ ] Signup works (email/password)
- [ ] Signup works (Google OAuth)
- [ ] Login works
- [ ] Password reset works
- [ ] Logout works
- [ ] Session persists correctly

### Payments
- [ ] Checkout redirects to Dodo
- [ ] Successful payment updates plan
- [ ] Failed payment shows error
- [ ] Webhook updates database
- [ ] Billing portal accessible
- [ ] Subscription cancellation works

### Free Tier
- [ ] 3 checks/day limit enforced
- [ ] 1 site limit enforced
- [ ] 0 competitors (blocked)
- [ ] Paywalls shown correctly
- [ ] Trial expiration works

### Starter Tier
- [ ] Unlimited manual checks
- [ ] 3 sites limit enforced
- [ ] 2 competitors per site enforced
- [ ] 5 gap analyses/month enforced
- [ ] 3 content ideas/month enforced
- [ ] Daily auto-checks run

### Pro Tier
- [ ] Unlimited manual checks
- [ ] 10 sites limit enforced
- [ ] 10 competitors per site enforced
- [ ] Unlimited gap analyses
- [ ] Unlimited content ideas
- [ ] Full Trust Map access
- [ ] Full Roadmap access
- [ ] Hourly auto-checks run

### Upgrades/Downgrades
- [ ] Free → Starter works
- [ ] Starter → Pro works
- [ ] Features unlock immediately
- [ ] Limits update correctly

### Background Jobs
- [ ] Daily auto-checks run (Starter)
- [ ] Hourly auto-checks run (Pro)
- [ ] Weekly reports sent
- [ ] Email alerts sent

---

## 🐛 Troubleshooting

### Payment Issues

**Problem:** Checkout doesn't redirect  
**Solution:** 
- Check `DODO_PAYMENTS_API_KEY` is set
- Check product IDs are configured
- Check browser console for errors

**Problem:** Webhook not received  
**Solution:**
- Verify webhook URL in Dodo dashboard
- Check webhook secret matches
- Check Vercel logs for webhook attempts
- Signature verification is currently disabled for debugging

**Problem:** Plan doesn't update after payment  
**Solution:**
- Check webhook logs in Vercel
- Manually verify webhook received
- Check database for organization updates
- Verify `dodo_subscription_id` is saved

### Limit Enforcement Issues

**Problem:** Limits not enforced  
**Solution:**
- Check `subscription-check.ts` is imported
- Verify plan is correct in database
- Check usage tracking table
- Verify API routes check limits

### Auto-Check Issues

**Problem:** Auto-checks not running  
**Solution:**
- Check Inngest dashboard for jobs
- Verify Inngest environment variables
- Check Inngest function logs
- Verify job scheduling logic

---

## 📊 Test Results Template

Create a file `TEST_RESULTS.md` and track results:

```markdown
# Test Results - [Date]

## Authentication
- [ ] Signup: ✅ / ❌
- [ ] Login: ✅ / ❌
- [ ] Password Reset: ✅ / ❌

## Payments
- [ ] Checkout: ✅ / ❌
- [ ] Successful Payment: ✅ / ❌
- [ ] Webhook: ✅ / ❌

## Free Tier
- [ ] Limits: ✅ / ❌
- [ ] Paywalls: ✅ / ❌

## Starter Tier
- [ ] Limits: ✅ / ❌
- [ ] Features: ✅ / ❌

## Pro Tier
- [ ] Limits: ✅ / ❌
- [ ] Features: ✅ / ❌

## Issues Found
1. [Issue description]
2. [Issue description]
```

---

**Last Updated:** January 2025  
**Status:** Ready for Testing

