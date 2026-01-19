# 🧪 Practical Testing Guide - With Real Test Websites

**Goal:** Test all three tiers using real websites that will show meaningful results.

---

## 🎯 Best Test Websites

**Important:** These are realistic test sites that represent your ACTUAL target customers:
- ✅ Small/medium SaaS products
- ✅ Online marketplaces
- ✅ Tools that AI probably WON'T recommend (yet)
- ✅ Have clear competitors that AI DOES recommend
- ✅ Perfect for seeing the "loss" scenario

### Recommended Test Websites:

#### 1. **Small SaaS Products** (Realistic targets)
- **Example:** `your-saas-tool.com` or `indie-product.com`
- **Why:** Represents actual customers - small founders
- **Competitors:** AI will recommend bigger players instead
- **What to expect:** "Not cited" results, competitors mentioned
- **Use your own domain** or a friend's small SaaS

#### 2. **Niche Marketplaces** (Realistic targets)
- **Example:** `niche-marketplace.com` or `specialized-platform.com`
- **Why:** Small marketplaces compete with big players
- **Competitors:** Etsy, Amazon, eBay (AI recommends these)
- **What to expect:** Clear competitive losses

#### 3. **Indie Tools** (Realistic targets)
- **Example:** `indie-tool.com` or `small-product.com`
- **Why:** Small tools compete with established players
- **Competitors:** Bigger, well-known alternatives
- **What to expect:** "AI chose competitors" scenarios

#### 4. **Your Own Product** (Best for testing!)
- **Use your actual domain** if you have a SaaS/marketplace
- **Why:** Most realistic - see what AI says about YOUR product
- **Competitors:** Your actual competitors
- **What to expect:** Real insights into your competitive position

#### 5. **Friend's/Client's Product** (Realistic)
- **Use a small SaaS you know**
- **Why:** Real-world scenario
- **Competitors:** Their actual competitors
- **What to expect:** Actionable competitive intelligence

---

## 📋 Step-by-Step Testing Process

### **Phase 1: Test Free Tier**

#### Login
```
Email: test-free@cabbageseo.test
Password: TestFree123!
```

#### Test 1: Add Site (Use a small SaaS/marketplace)
1. Click "Scan my site now" on dashboard
2. Enter: Your small SaaS domain (or use a realistic test domain)
   - Example: `your-indie-tool.com` or `small-marketplace.com`
3. Click "Add & Scan"
4. ✅ **Expected:** Site added successfully
5. ✅ **Verify:** Dashboard shows site

#### Test 2: Run Citation Check
1. Click on the site you added
2. Click "Run Check" or "Scan Now"
3. Wait for results (may take 30-60 seconds)
4. ✅ **Expected:** See results from ChatGPT, Perplexity, Google AI
5. ✅ **Verify:** 
   - Shows whether YOUR site was cited (probably NOT - that's the point!)
   - Shows competitors mentioned (bigger players AI recommends instead)
   - Shows estimated loss (this is the value - seeing what you're missing)
   - Shows "AI chose competitors" message

#### Test 3: Test Daily Limit (3 checks/day)
1. Run check #1 ✅ (on your small SaaS)
2. Run check #2 ✅ (on same site or different query)
3. Run check #3 ✅
4. Try to run check #4 ❌
5. ✅ **Expected:** Error message "Daily limit reached. Upgrade for unlimited checks."

#### Test 4: Test Site Limit (1 site max)
1. Try to add second site: Another small SaaS domain
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
1. Add site #1: Your small SaaS #1 ✅
2. Add site #2: Your small SaaS #2 ✅
3. Add site #3: Your small SaaS #3 ✅
4. Try to add site #4: Another domain ❌
5. ✅ **Expected:** Error "Site limit reached. Upgrade to Pro for more sites."

#### Test 2: Add Competitors (2 per site)
1. Select your first site
2. Add competitor #1: A bigger competitor AI recommends ✅
3. Add competitor #2: Another competitor ✅
4. Try to add competitor #3: Another competitor ❌
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
1. Add sites 1-10 ✅ (Use multiple small SaaS/marketplace domains)
   - Your SaaS #1
   - Your SaaS #2
   - Your SaaS #3
   - Friend's SaaS #1
   - Friend's SaaS #2
   - Small marketplace #1
   - Small marketplace #2
   - Indie tool #1
   - Indie tool #2
   - Indie tool #3
2. Try to add site #11 ❌
3. ✅ **Expected:** Error "Site limit reached. You've reached the Pro plan limit."

#### Test 2: Add Many Competitors (10 per site)
1. Select your first site
2. Add competitors 1-10 ✅ (All the bigger players AI recommends instead)
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

### Realistic Results for Small SaaS/Marketplaces:

1. **Citation Status:**
   - ❌ "Not Cited" = **This is EXPECTED and GOOD for testing!**
   - This shows the product is working - it's detecting that AI chose competitors
   - ✅ "Cited" = Your site IS being recommended (rare for small SaaS)

2. **Competitors Mentioned:**
   - List of bigger players AI recommended instead
   - Example: "AI recommends: BigPlayer1, BigPlayer2, BigPlayer3"
   - **This is the value** - seeing who's getting your customers

3. **Estimated Loss:**
   - Dollar amount you're losing to competitors
   - Example: "$2,400/month estimated loss"
   - **This creates urgency** - the "gut punch" moment

4. **Query Analysis:**
   - What queries were checked
   - Example: "best [your category] tools", "[your category] alternatives"
   - Shows where you're missing out

5. **Sources:**
   - Where AI found information about competitors
   - Example: "Product Hunt", "G2", "Reddit"
   - Shows where you need to get listed

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

### Scenario 1: "I want to see competitors" (Realistic)
```
1. Login: test-starter@cabbageseo.test
2. Add site: your-small-saas.com
3. Add competitor: bigger-competitor.com (who AI recommends)
4. Run check
5. ✅ Should see: Bigger competitor mentioned, your site NOT mentioned
6. ✅ Should see: "AI chose competitors" message
7. ✅ Should see: Estimated loss amount
```

### Scenario 2: "I want to test limits"
```
1. Login: test-free@cabbageseo.test
2. Add site: your-indie-tool.com
3. Run check 3 times ✅
4. Try 4th check ❌
5. ✅ Should see: "Daily limit reached"
```

### Scenario 3: "I want to see competitive losses" (Realistic)
```
1. Login: test-pro@cabbageseo.test
2. Add site: your-small-marketplace.com
3. Run check
4. ✅ Should see: "Not cited" results (expected for small products)
5. ✅ Should see: Competitors AI recommends instead
6. ✅ Should see: Estimated monthly loss
7. ✅ Should see: Sources where competitors are listed (but you're not)
```

---

## 🐛 Common Issues & Fixes

### "No results showing"
- **Check:** API keys configured (Perplexity, OpenAI, Google AI)
- **Check:** Network tab for API errors
- **Wait:** Checks can take 30-60 seconds

### "All results show 'Not Cited'"
- **This is EXPECTED and GOOD!** For small SaaS/marketplaces, this is realistic
- **This is the value prop:** Showing founders that AI is choosing competitors
- **What matters:** Are competitors being mentioned? Are you seeing estimated losses?
- **Check:** API responses in Network tab to verify competitors are detected

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

**Start testing with YOUR actual small SaaS or marketplace domain - that's the real value! 🎯**

**Remember:** The product is FOR small founders who AREN'T being recommended. Seeing "Not Cited" with competitors mentioned is the EXACT scenario your customers face. That's the "gut punch" moment that drives upgrades!

