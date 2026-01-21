# 🧪 Pre-Launch Testing Plan

**CRITICAL:** Test BEFORE Product Hunt launch. One broken flow kills conversion.

---

## ✅ Testing Strategy: "The 5-Minute Test"

**Goal:** Can a solo founder sign up, see value, and understand what to do in 5 minutes?

---

## 🎯 Test 1: Homepage → Signup Flow (CRITICAL)

### What to Test:
1. **Homepage loads** ✅
2. **Domain check works** (enter a real small SaaS domain)
3. **Teaser page shows competitors**
4. **Signup button works**
5. **Onboarding auto-runs scan**
6. **Dashboard shows results**

### Expected Result:
- User sees competitors within 60 seconds
- User understands the problem
- User sees at least one actionable step

### How to Test:
1. Use incognito/private browser
2. Go to https://cabbageseo.com
3. Enter a small SaaS domain (e.g., `usemotion.com`, `linear.app`, `cal.com`)
4. Click "See who AI recommends"
5. Complete signup flow
6. Verify scan runs automatically
7. Verify dashboard shows losses

**✅ PASS:** User sees competitors and one actionable step
**❌ FAIL:** Empty dashboard, broken scan, or no clear next step

---

## 🎯 Test 2: Free Tier Experience (CRITICAL)

### What to Test:
1. **Login with test account:** `test-free@cabbageseo.test` / `TestFree123!`
2. **Dashboard shows losses**
3. **Micro-win indicator appears**
4. **G2 step 1 is visible**
5. **"Show me the full checklist" CTA works**
6. **Trust Map accessible (read-only)**

### Expected Result:
- User sees problem immediately
- User sees path to fix it
- User can take action (G2 step 1)
- User understands what Starter unlocks

### How to Test:
1. Login with free test account
2. Run a check (if no data)
3. Verify all Free tier elements appear
4. Click "Show me the full checklist" → Should go to billing
5. Click Trust Map → Should show sources (read-only)

**✅ PASS:** All elements visible, CTAs work, user can act
**❌ FAIL:** Missing elements, broken links, or unclear path

---

## 🎯 Test 3: Starter Tier Experience (CRITICAL)

### What to Test:
1. **Login with test account:** `test-starter@cabbageseo.test` / `TestStarter123!`
2. **Progress summary appears**
3. **Trust Map shows full steps**
4. **Roadmap accessible**
5. **"Why Not Me?" analysis works** (5/month limit)
6. **Content recommendations work** (3/month limit)

### Expected Result:
- User sees progress tracking
- User sees all actionable steps
- User can check off roadmap items
- User understands limits

### How to Test:
1. Login with Starter test account
2. Verify progress summary card
3. Go to Trust Map → Expand G2 → See all steps
4. Go to Roadmap → Check off a step
5. Click "Why not me?" on a loss → See analysis
6. Verify limits are enforced

**✅ PASS:** All features work, progress visible, limits clear
**❌ FAIL:** Missing features, broken analysis, or unclear limits

---

## 🎯 Test 4: Pro Tier Experience (CRITICAL)

### What to Test:
1. **Login with test account:** `test-pro@cabbageseo.test` / `TestPro123!`
2. **"AI Visibility Mode: Active" appears**
3. **All features unlimited**
4. **"This Week's AI Visibility Moves" shows**
5. **Hourly monitoring status visible**

### Expected Result:
- User feels elite/control room vibe
- User sees everything is unlimited
- User sees strategic guidance

### How to Test:
1. Login with Pro test account
2. Verify "AI Visibility Mode: Active" status
3. Verify all features accessible
4. Go to Roadmap → See "This Week's AI Visibility Moves"
5. Verify no limits on analyses

**✅ PASS:** Elite feel, all features work, strategic guidance visible
**❌ FAIL:** Missing Pro features or unclear value

---

## 🎯 Test 5: Payment Flow (CRITICAL)

### What to Test:
1. **Click "Show me the full checklist"** (Free tier)
2. **Billing page loads**
3. **Starter plan shows correctly**
4. **Checkout button works**
5. **Dodo test card works** (`4242 4242 4242 4242`)
6. **Webhook processes correctly**
7. **User upgrades successfully**

### Expected Result:
- Smooth upgrade flow
- Payment processes
- User gets Starter features immediately

### How to Test:
1. Use Free test account
2. Click upgrade CTA
3. Go through checkout with test card
4. Verify webhook processes
5. Verify user now has Starter features

**✅ PASS:** Payment works, upgrade successful, features unlock
**❌ FAIL:** Broken checkout, payment fails, or features don't unlock

---

## 🎯 Test 6: Real Domain Check (CRITICAL)

### What to Test:
1. **Use a real small SaaS domain**
2. **Scan completes successfully**
3. **Results show real competitors**
4. **No errors or crashes**

### Expected Result:
- Real AI responses shown
- Real competitors identified
- No fake/mock data

### How to Test:
1. Use domains like:
   - `usemotion.com`
   - `cal.com`
   - `linear.app`
   - `notion.so` (for testing, but note it's popular)
2. Run checks
3. Verify results are real
4. Verify no errors

**✅ PASS:** Real data, real competitors, no errors
**❌ FAIL:** Mock data, errors, or crashes

---

## 🎯 Test 7: Mobile Experience (IMPORTANT)

### What to Test:
1. **Homepage loads on mobile**
2. **Domain input works**
3. **Dashboard is usable**
4. **CTAs are clickable**
5. **No horizontal scrolling**

### Expected Result:
- Mobile-friendly experience
- All features accessible
- No broken layouts

### How to Test:
1. Use mobile device or browser dev tools
2. Test all flows on mobile
3. Verify responsive design

**✅ PASS:** Mobile-friendly, all features work
**❌ FAIL:** Broken layouts or unusable on mobile

---

## 🎯 Test 8: Edge Cases (IMPORTANT)

### What to Test:
1. **Empty state handling** (no sites)
2. **Error handling** (API failures)
3. **Rate limiting** (too many checks)
4. **Trial expiration** (free tier)
5. **Invalid domains**

### Expected Result:
- Graceful error handling
- Clear error messages
- No crashes

### How to Test:
1. Test with invalid domains
2. Test with expired trial
3. Test rate limits
4. Verify error messages are helpful

**✅ PASS:** Graceful errors, helpful messages
**❌ FAIL:** Crashes or confusing errors

---

## ✅ Testing Checklist

### Must Pass (Blocking):
- [ ] Homepage → Signup → Dashboard flow works
- [ ] Free tier shows value in <60 seconds
- [ ] Starter tier shows progress and full roadmap
- [ ] Pro tier shows elite features
- [ ] Payment flow works with test card
- [ ] Real domain checks work
- [ ] No crashes or critical errors

### Should Pass (Important):
- [ ] Mobile experience works
- [ ] Edge cases handled gracefully
- [ ] Error messages are helpful

---

## 🚀 If All Tests Pass → LAUNCH

If any blocking test fails → FIX FIRST

---

## 📊 How to Test Efficiently

1. **Use test accounts** (already set up)
2. **Test in incognito** (fresh experience)
3. **Test with real domains** (not just test data)
4. **Test payment flow** (critical for conversion)
5. **Test on mobile** (many users will be mobile)

---

## ⚠️ Common Issues to Watch For

1. **Empty dashboard** → User sees nothing → Bounce
2. **Broken scan** → User can't see value → Bounce
3. **Broken payment** → User can't upgrade → Lost revenue
4. **Missing CTAs** → User doesn't know what to do → Bounce
5. **Mock data** → User loses trust → Bounce

---

**Test thoroughly. Then launch with confidence.**

