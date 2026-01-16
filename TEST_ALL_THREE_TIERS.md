# 🎯 Test All Three Tiers - Complete Guide

**Goal:** Test Free, Starter, and Pro tiers thoroughly. Once verified, we'll add auth and paywalls.

---

## ✅ How It Works

1. **Login with test credentials** → Gets that tier's plan
2. **Test account creates real database organization** → Real data, real limits
3. **All limits enforced** → Sites, competitors, checks, etc.
4. **After testing** → Remove test code, add auth/paywalls, ship

---

## 🔑 Test Credentials

### Free Tier
- **Email:** `test-free@cabbageseo.test`
- **Password:** `TestFree123!`
- **Plan Limits:**
  - ✅ 3 manual checks/day
  - ✅ 1 site max
  - ✅ 0 competitors
  - ✅ 7-day trial

### Starter Tier
- **Email:** `test-starter@cabbageseo.test`
- **Password:** `TestStarter123!`
- **Plan Limits:**
  - ✅ Unlimited manual checks
  - ✅ 3 sites max
  - ✅ 2 competitors per site
  - ✅ 5 gap analyses/month
  - ✅ Daily auto-checks

### Pro Tier
- **Email:** `test-pro@cabbageseo.test`
- **Password:** `TestPro123!`
- **Plan Limits:**
  - ✅ Unlimited manual checks
  - ✅ 10 sites max
  - ✅ 10 competitors per site
  - ✅ Unlimited gap analyses
  - ✅ Hourly auto-checks
  - ✅ Full Trust Map access
  - ✅ Full Roadmap access

---

## 📋 Testing Checklist

### For EACH Tier:

#### 1. Login & Dashboard
- [ ] Login with test credentials works
- [ ] Dashboard shows correct plan name
- [ ] Plan limits displayed correctly
- [ ] Usage stats show correctly

#### 2. Site Management
- [ ] Can add first site
- [ ] Can add sites up to limit
- [ ] **VERIFY:** Cannot add more than limit (should show error)
- [ ] Sites list shows correctly
- [ ] Can delete sites

#### 3. Competitor Management
- [ ] Can add competitors (if plan allows)
- [ ] **VERIFY:** Cannot add more than limit
- [ ] Competitors list shows correctly
- [ ] Can remove competitors

#### 4. Citation Checks
- [ ] Can run manual check
- [ ] **Free Tier:** Verify 3 checks/day limit
- [ ] **Free Tier:** Verify cannot run 4th check same day
- [ ] **Paid Tiers:** Verify unlimited checks
- [ ] Check results display correctly
- [ ] Citations saved to database

#### 5. Plan Limits Enforcement
- [ ] Site limit enforced (try exceeding)
- [ ] Competitor limit enforced (try exceeding)
- [ ] Check limit enforced for free tier
- [ ] Error messages show correctly
- [ ] Upgrade prompts show correctly

#### 6. Features & Paywalls
- [ ] Free tier: Paywalls show for premium features
- [ ] Starter tier: Paywalls show for Pro features
- [ ] Pro tier: All features accessible
- [ ] Trust Map access (Pro only)
- [ ] Roadmap access (Pro only)
- [ ] Intelligence features (check limits)

#### 7. Database Verification
- [ ] Organization created in database
- [ ] User record created
- [ ] Sites saved correctly
- [ ] Competitors saved correctly
- [ ] Citations saved correctly
- [ ] Usage tracked correctly

---

## 🧪 Testing Workflow

### Step 1: Test Free Tier
```
1. Login: test-free@cabbageseo.test / TestFree123!
2. Add 1 site ✅
3. Try adding 2nd site ❌ (should fail)
4. Run 3 checks ✅
5. Try running 4th check ❌ (should fail)
6. Try adding competitor ❌ (should fail - 0 allowed)
7. Check paywalls show for premium features
```

### Step 2: Test Starter Tier
```
1. Login: test-starter@cabbageseo.test / TestStarter123!
2. Add 3 sites ✅
3. Try adding 4th site ❌ (should fail)
4. Add 2 competitors per site ✅
5. Try adding 3rd competitor ❌ (should fail)
6. Run unlimited checks ✅
7. Check paywalls show for Pro features
```

### Step 3: Test Pro Tier
```
1. Login: test-pro@cabbageseo.test / TestPro123!
2. Add 10 sites ✅
3. Try adding 11th site ❌ (should fail)
4. Add 10 competitors per site ✅
5. Try adding 11th competitor ❌ (should fail)
6. Run unlimited checks ✅
7. Access Trust Map ✅
8. Access Roadmap ✅
9. All features accessible ✅
```

---

## 🔍 What to Verify

### Critical Checks:
1. **Limits are enforced** - Cannot exceed plan limits
2. **Error messages are clear** - Users know why they're blocked
3. **Upgrade prompts work** - Shows path to upgrade
4. **Database persists** - Data saved correctly
5. **Plan detection works** - Correct plan shown everywhere

### Edge Cases:
1. **Free tier:** Trial expiration logic (7 days)
2. **Daily reset:** Free tier checks reset at midnight
3. **Multiple sites:** Competitor limits per site, not total
4. **Empty states:** What shows when no sites/competitors

---

## ✅ After Testing

Once all tiers tested and verified:

1. **Remove test login code:**
   - `src/app/(auth)/login/page.tsx` - Remove test account check
   - `src/app/api/test/login/route.ts` - Delete
   - `src/app/api/test/logout/route.ts` - Delete
   - `src/lib/testing/test-session.ts` - Delete
   - `src/app/api/me/route.ts` - Remove test session check
   - `src/lib/supabase/middleware.ts` - Remove test session check
   - `src/app/api/sites/route.ts` - Remove test session handling

2. **Re-enable Supabase auth:**
   - Email confirmation required
   - Normal signup flow

3. **Re-enable payment gateways:**
   - Dodo Payments checkout
   - Webhook handling
   - Subscription management

4. **Ship! 🚀**

---

## 🐛 Troubleshooting

### "Invalid credentials"
- Check exact email/password from above
- Check credentials in `src/lib/testing/test-accounts.ts`

### "Not authenticated"
- Check cookie is set (DevTools → Application → Cookies)
- Check `test_account` cookie exists
- Try logging in again

### Plan not showing correctly
- Check `/api/me` response in Network tab
- Verify test session cookie
- Check browser console for errors

### Limits not enforced
- Check plan detection in API routes
- Verify `getTestPlan()` returns correct plan
- Check database organization plan matches

---

**Ready to test! Start with Free tier, then Starter, then Pro. Document any issues! 🎯**

