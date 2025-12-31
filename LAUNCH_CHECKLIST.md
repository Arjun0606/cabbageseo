# 🚀 CabbageSEO Production Launch Checklist

## ⚠️ CRITICAL: Disable Testing Mode

Before going live, you MUST update these environment variables in Vercel:

### Vercel Dashboard → Settings → Environment Variables

```
TESTING_MODE=false
NEXT_PUBLIC_TESTING_MODE=false
```

This will:
- ✅ Enable authentication checks (redirect to /login if not logged in)
- ✅ Enable subscription gate (show paywall for non-subscribers)
- ✅ Protect all dashboard routes

---

## 🔐 Authentication Flow

When `TESTING_MODE=false`:

1. **Unauthenticated users** visiting `/dashboard`, `/content`, `/keywords`, `/geo`, `/audit`, etc. will be redirected to `/login`
2. **Authenticated users without a subscription** will see the paywall
3. **Authenticated users with a subscription** have full access

### Public routes (no auth required):
- `/` (landing page)
- `/login`
- `/signup`
- `/pricing`
- `/analyze` (free analyzer)
- `/privacy`, `/terms`

---

## 💳 Payment Setup (Dodo Payments)

Ensure these environment variables are set:

```
DODO_PAYMENTS_API_KEY=your_api_key
DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_key

# Product IDs (from Dodo Dashboard)
DODO_STARTER_MONTHLY_ID=pdt_xxxxx
DODO_STARTER_YEARLY_ID=pdt_xxxxx
DODO_PRO_MONTHLY_ID=pdt_xxxxx
DODO_PRO_YEARLY_ID=pdt_xxxxx
DODO_PRO_PLUS_MONTHLY_ID=pdt_xxxxx
DODO_PRO_PLUS_YEARLY_ID=pdt_xxxxx
```

### Webhook Configuration
In your Dodo Dashboard, set the webhook URL to:
```
https://cabbageseo.com/api/billing/webhooks
```

---

## 🔑 API Keys Required

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| OpenAI | `OPENAI_API_KEY` | Content generation, AI analysis |
| Perplexity | `PERPLEXITY_API_KEY` | GEO Score - Perplexity visibility |
| SerpAPI | `SERPAPI_KEY` | GEO Score - Google AI Overviews |
| DataForSEO | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Keyword research |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database & Auth |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google" login |

---

## ✅ Pre-Launch Testing Checklist

### Landing Page
- [ ] GEO-focused messaging (no fake testimonials)
- [ ] Free analyzer CTA works
- [ ] Pricing link works
- [ ] Login/Signup buttons work

### Free Analyzer (`/analyze`)
- [ ] Accepts URL input
- [ ] Shows SEO Score + GEO Score
- [ ] Shows real AI visibility check
- [ ] Shows detailed breakdown
- [ ] Sign-up gate appears (for non-logged-in users)
- [ ] Export to Cursor button works

### Authentication
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Logout works
- [ ] Password reset works

### Paywall
- [ ] Dashboard requires login (when TESTING_MODE=false)
- [ ] Paywall appears for non-subscribers
- [ ] Checkout redirects to Dodo Payments
- [ ] Webhook updates subscription status

### Dashboard Features
- [ ] Add site via URL input
- [ ] Site switcher works
- [ ] Delete site works
- [ ] GEO Score displays
- [ ] Content generation works
- [ ] Keyword research works
- [ ] SEO Audit shows issues
- [ ] Export to Cursor works

### Settings
- [ ] Billing page shows plan status
- [ ] Integrations page shows connection status

---

## 🎯 Quick Test Script

1. Go to https://cabbageseo.com
2. Click "Try Free Analysis"
3. Enter a URL and click Analyze
4. Verify scores appear
5. Click "Sign Up Free to Unlock"
6. Create an account (or login)
7. Verify paywall appears
8. Go to /pricing and click "Start Free Trial"
9. Complete Dodo checkout (use test card in test mode)
10. Verify dashboard is now accessible

---

## 🚨 Common Issues

### "Dashboard accessible without login"
→ Set `TESTING_MODE=false` in Vercel

### "Checkout not working"
→ Check `DODO_PAYMENTS_API_KEY` is set
→ Check product IDs are correct

### "GEO Score not showing"
→ Check `PERPLEXITY_API_KEY` and `SERPAPI_KEY` are set

### "Content generation fails"
→ Check `OPENAI_API_KEY` is set

### "Keyword research empty"
→ Check `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are set

---

## 📊 Post-Launch Monitoring

1. **Vercel Analytics** - Monitor traffic and errors
2. **Dodo Dashboard** - Track subscriptions and revenue
3. **Supabase Dashboard** - Monitor database usage
4. **OpenAI Dashboard** - Monitor API costs

---

Good luck with the launch! 🥬

