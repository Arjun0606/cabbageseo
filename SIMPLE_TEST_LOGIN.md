# 🎯 Simple Test Login System

**No Supabase auth complexity!** Just enter credentials and get access.

---

## ✅ How It Works

1. **Login page checks test accounts first**
2. **If test account → Simple credential check → Sets cookie → Logs you in**
3. **If regular account → Uses Supabase auth (normal flow)**

---

## 🔑 Test Account Credentials

### Free Tier
- **Email:** `test-free@cabbageseo.test`
- **Password:** `TestFree123!`
- **Access:** Free plan features (3 checks/day, 1 site, 0 competitors)

### Starter Tier
- **Email:** `test-starter@cabbageseo.test`
- **Password:** `TestStarter123!`
- **Access:** Starter plan features (Unlimited checks, 3 sites, 2 competitors)

### Pro Tier
- **Email:** `test-pro@cabbageseo.test`
- **Password:** `TestPro123!`
- **Access:** Pro plan features (Unlimited checks, 10 sites, 10 competitors)

---

## 🚀 How to Use

### Step 1: Go to Login Page
Navigate to: `https://cabbageseo.com/login`

### Step 2: Enter Test Credentials
Enter one of the test account emails and passwords above.

### Step 3: Click "Sign in"
You'll be logged in immediately and redirected to dashboard.

### Step 4: Test Features
- Dashboard shows correct plan
- Plan limits are enforced
- All features work for that tier

---

## ✅ What Happens

1. **Login page detects** test account email
2. **Calls `/api/test/login`** with credentials
3. **Checks credentials** against test account list
4. **Sets cookie** with plan info
5. **Redirects to dashboard**
6. **All API routes** check cookie first, then Supabase auth

---

## 🔍 Testing Different Tiers

To test different tiers:

1. **Logout** (or clear cookies)
2. **Login** with different test account credentials
3. **Verify** plan changes in dashboard
4. **Test** limits for that tier

---

## 📝 What Gets Tested

### Free Tier (`test-free@cabbageseo.test`)
- ✅ 3 checks/day limit
- ✅ 1 site limit
- ✅ 0 competitors limit
- ✅ Paywalls for premium features
- ✅ 7-day trial logic

### Starter Tier (`test-starter@cabbageseo.test`)
- ✅ Unlimited checks
- ✅ 3 sites limit
- ✅ 2 competitors per site
- ✅ 5 gap analyses/month
- ✅ Daily auto-checks

### Pro Tier (`test-pro@cabbageseo.test`)
- ✅ Unlimited checks
- ✅ 10 sites limit
- ✅ 10 competitors per site
- ✅ Unlimited gap analyses
- ✅ Hourly auto-checks
- ✅ Full Trust Map
- ✅ Full Roadmap

---

## 🎯 After Testing

Once you've verified everything works:

1. **Remove test login code** from:
   - `src/app/(auth)/login/page.tsx` - Remove test account check
   - `src/app/api/test/login/route.ts` - Delete this file
   - `src/app/api/test/logout/route.ts` - Delete this file
   - `src/lib/testing/test-session.ts` - Delete this file
   - `src/app/api/me/route.ts` - Remove test session check
   - `src/lib/supabase/middleware.ts` - Remove test session check

2. **Re-enable Supabase auth** fully

3. **Re-enable payment gateways**

---

## ⚠️ Important Notes

- **Test accounts bypass Supabase auth** - No email confirmation needed
- **Plan limits still enforced** - Test accounts respect plan restrictions
- **Cookie-based session** - Stored in `test_account` cookie
- **Temporary only** - Remove before production launch

---

## 🐛 Troubleshooting

### "Invalid credentials"
- Check you're using exact email/password from above
- Check credentials match `TEST_ACCOUNTS` in `src/lib/testing/test-accounts.ts`

### "Not authenticated"
- Check cookie is set (open DevTools → Application → Cookies)
- Try logging in again

### Plan not showing correctly
- Check `/api/me` response in Network tab
- Verify test session cookie is set

---

**Ready to test! Just login with test credentials and start testing! 🚀**

