# 🧪 Practical Testing Guide - With Real Test Websites

**Goal:** Test all three tiers using real websites that will show meaningful results.

---

## 🎯 Best Test Websites

These websites are perfect for testing because:
- ✅ AI frequently recommends them
- ✅ They have clear competitors
- ✅ They show up in ChatGPT, Perplexity, Google AI responses
- ✅ You'll see real citations and competitive analysis

### Recommended Test Websites:

#### 1. **Notion** (`notion.so`)
- **Why:** Very popular, AI recommends it often
- **Competitors:** Obsidian, Roam Research, Coda, Airtable
- **What to expect:** High citation rate, many competitors mentioned

#### 2. **Figma** (`figma.com`)
- **Why:** Industry standard, AI always recommends it
- **Competitors:** Adobe XD, Sketch, Framer, Canva
- **What to expect:** Strong citations, competitive mentions

#### 3. **Stripe** (`stripe.com`)
- **Why:** Payment processing leader, AI recommends frequently
- **Competitors:** PayPal, Square, Braintree, Adyen
- **What to expect:** High citations, clear competitive landscape

#### 4. **Shopify** (`shopify.com`)
- **Why:** E-commerce platform, AI recommends often
- **Competitors:** WooCommerce, BigCommerce, Squarespace, Wix
- **What to expect:** Good citations, competitive analysis

#### 5. **Slack** (`slack.com`)
- **Why:** Team communication leader
- **Competitors:** Microsoft Teams, Discord, Zoom, Mattermost
- **What to expect:** Strong citations, many competitors

---

## 📋 Step-by-Step Testing Process

### **Phase 1: Test Free Tier**

#### Login
```
Email: test-free@cabbageseo.test
Password: TestFree123!
```

#### Test 1: Add Site
1. Click "Scan my site now" on dashboard
2. Enter: `notion.so`
3. Click "Add & Scan"
4. ✅ **Expected:** Site added successfully
5. ✅ **Verify:** Dashboard shows site

#### Test 2: Run Citation Check
1. Click on the site you added
2. Click "Run Check" or "Scan Now"
3. Wait for results (may take 30-60 seconds)
4. ✅ **Expected:** See results from ChatGPT, Perplexity, Google AI
5. ✅ **Verify:** 
   - Shows whether Notion was cited
   - Shows competitors mentioned (Obsidian, Coda, etc.)
   - Shows estimated loss if not cited

#### Test 3: Test Daily Limit (3 checks/day)
1. Run check #1 ✅
2. Run check #2 ✅
3. Run check #3 ✅
4. Try to run check #4 ❌
5. ✅ **Expected:** Error message "Daily limit reached. Upgrade for unlimited checks."

#### Test 4: Test Site Limit (1 site max)
1. Try to add second site: `figma.com`
2. ✅ **Expected:** Error "Site limit reached. Upgrade for more sites."

#### Test 5: Test Competitor Limit (0 competitors)
1. Try to add a competitor
2. ✅ **Expected:** Paywall or error "Upgrade to add competitors"

#### Test 6: Test Paywalls
1. Navigate to "AI Trust Map"
2. ✅ **Expected:** Paywall shows (Free tier doesn't have access)
3. Navigate to "Visibility Roadmap"
4. ✅ **Expected:** Paywall shows (Free tier doesn't have access)

---

### **Phase 2: Test Starter Tier**

#### Login
```
Email: test-starter@cabbageseo.test
Password: TestStarter123!
```

#### Test 1: Add Multiple Sites (3 max)
1. Add site #1: `notion.so` ✅
2. Add site #2: `figma.com` ✅
3. Add site #3: `stripe.com` ✅
4. Try to add site #4: `shopify.com` ❌
5. ✅ **Expected:** Error "Site limit reached. Upgrade to Pro for more sites."

#### Test 2: Add Competitors (2 per site)
1. Select `notion.so`
2. Add competitor #1: `obsidian.md` ✅
3. Add competitor #2: `roamresearch.com` ✅
4. Try to add competitor #3: `coda.io` ❌
5. ✅ **Expected:** Error "Competitor limit reached. Upgrade to Pro for more."

#### Test 3: Unlimited Checks
1. Run check #1 ✅
2. Run check #2 ✅
3. Run check #3 ✅
4. Run check #4 ✅ (should work!)
5. Run check #5 ✅ (should work!)
6. ✅ **Expected:** No limit errors

#### Test 4: Test Features
1. Navigate to "AI Trust Map"
2. ✅ **Expected:** Can access (Starter has access)
3. Navigate to "Visibility Roadmap"
4. ✅ **Expected:** Paywall shows (Starter doesn't have Pro features)

---

### **Phase 3: Test Pro Tier**

#### Login
```
Email: test-pro@cabbageseo.test
Password: TestPro123!
```

#### Test 1: Add Many Sites (10 max)
1. Add sites 1-10 ✅
   - `notion.so`
   - `figma.com`
   - `stripe.com`
   - `shopify.com`
   - `slack.com`
   - `github.com`
   - `vercel.com`
   - `linear.app`
   - `airtable.com`
   - `zapier.com`
2. Try to add site #11 ❌
3. ✅ **Expected:** Error "Site limit reached. You've reached the Pro plan limit."

#### Test 2: Add Many Competitors (10 per site)
1. Select `notion.so`
2. Add competitors 1-10 ✅
3. Try to add competitor #11 ❌
4. ✅ **Expected:** Error "Competitor limit reached."

#### Test 3: All Features Accessible
1. Navigate to "AI Trust Map"
2. ✅ **Expected:** Full access, see all sources
3. Navigate to "Visibility Roadmap"
4. ✅ **Expected:** Full access, see roadmap
5. ✅ **Expected:** All intelligence features accessible

---

## 🔍 What to Look For in Results

### Good Results Should Show:

1. **Citation Status:**
   - ✅ "Cited" = AI mentioned your site
   - ❌ "Not Cited" = AI mentioned competitors instead

2. **Competitors Mentioned:**
   - List of competitors AI recommended
   - Example: "AI recommends: Obsidian, Coda, Roam Research"

3. **Estimated Loss:**
   - Dollar amount you're losing
   - Example: "$2,400/month estimated loss"

4. **Query Analysis:**
   - What queries were checked
   - Example: "best note-taking apps", "Notion alternatives"

5. **Sources:**
   - Where AI found information
   - Example: "Product Hunt", "G2", "Reddit"

---

## 📊 Testing Checklist

### Free Tier ✅
- [ ] Can add 1 site
- [ ] Cannot add 2nd site
- [ ] Can run 3 checks/day
- [ ] Cannot run 4th check same day
- [ ] Cannot add competitors
- [ ] Paywalls show for premium features
- [ ] Results show correctly

### Starter Tier ✅
- [ ] Can add 3 sites
- [ ] Cannot add 4th site
- [ ] Can add 2 competitors per site
- [ ] Cannot add 3rd competitor
- [ ] Unlimited checks work
- [ ] AI Trust Map accessible
- [ ] Visibility Roadmap paywalled

### Pro Tier ✅
- [ ] Can add 10 sites
- [ ] Cannot add 11th site
- [ ] Can add 10 competitors per site
- [ ] Cannot add 11th competitor
- [ ] Unlimited checks work
- [ ] All features accessible
- [ ] No paywalls

---

## 🎯 Quick Test Scenarios

### Scenario 1: "I want to see competitors"
```
1. Login: test-starter@cabbageseo.test
2. Add site: notion.so
3. Add competitor: obsidian.md
4. Run check
5. ✅ Should see: Obsidian mentioned as competitor
```

### Scenario 2: "I want to test limits"
```
1. Login: test-free@cabbageseo.test
2. Add site: figma.com
3. Run check 3 times ✅
4. Try 4th check ❌
5. ✅ Should see: "Daily limit reached"
```

### Scenario 3: "I want to see real citations"
```
1. Login: test-pro@cabbageseo.test
2. Add site: stripe.com
3. Run check
4. ✅ Should see: Real citations from ChatGPT, Perplexity, Google AI
5. ✅ Should see: Competitors like PayPal, Square
```

---

## 🐛 Common Issues & Fixes

### "No results showing"
- **Check:** API keys configured (Perplexity, OpenAI, Google AI)
- **Check:** Network tab for API errors
- **Wait:** Checks can take 30-60 seconds

### "All results show 'Not Cited'"
- **Normal:** If site isn't well-known, AI might not cite it
- **Try:** Use popular sites like Notion, Figma, Stripe
- **Check:** API responses in Network tab

### "Limits not enforced"
- **Check:** Plan detection in `/api/me` response
- **Check:** Browser console for errors
- **Verify:** Test account cookie is set

---

## ✅ After Testing

Once you've verified everything works:

1. **Document findings** - Note any bugs or issues
2. **Remove test code** - Clean up test login system
3. **Add auth/paywalls** - Re-enable Supabase auth
4. **Ship!** 🚀

---

**Start testing with `notion.so` - it's perfect for seeing real results! 🎯**

