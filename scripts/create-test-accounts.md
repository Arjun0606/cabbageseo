# Create Test Accounts - Quick Reference

This guide helps you quickly create test accounts for all three pricing tiers.

---

## Option 1: Manual Account Creation (Recommended)

### Free Tier Account
1. Navigate to `/signup`
2. Email: `test-free@example.com` (or use your email + `+free`)
3. Password: `TestPassword123!`
4. Complete signup
5. **No payment needed** - starts as free tier

### Starter Tier Account
1. Navigate to `/signup`
2. Email: `test-starter@example.com` (or use your email + `+starter`)
3. Password: `TestPassword123!`
4. Complete signup
5. Navigate to `/settings/billing`
6. Click "Upgrade to Starter"
7. Use test card: `4242 4242 4242 4242`
8. Expiry: `12/34`, CVV: `123`, ZIP: `12345`
9. Complete payment

### Pro Tier Account
1. Navigate to `/signup`
2. Email: `test-pro@example.com` (or use your email + `+pro`)
3. Password: `TestPassword123!`
4. Complete signup
5. Navigate to `/settings/billing`
6. Click "Upgrade to Pro"
7. Use test card: `4242 4242 4242 4242`
8. Expiry: `12/34`, CVV: `123`, ZIP: `12345`
9. Complete payment

---

## Option 2: Direct Database Update (For Quick Testing)

**⚠️ WARNING:** Only use this for testing. Don't use in production.

### Create Free Account via SQL

```sql
-- 1. Create auth user (requires Supabase admin access)
-- Note: This is complex - better to use signup flow

-- 2. Or update existing account to free tier
UPDATE organizations 
SET 
  plan = 'free',
  subscription_status = 'active',
  trial_ends_at = NOW() + INTERVAL '7 days'
WHERE id = 'your_org_id';
```

### Upgrade to Starter via SQL

```sql
-- Update organization to Starter plan
UPDATE organizations 
SET 
  plan = 'starter',
  subscription_status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  dodo_subscription_id = 'test_sub_' || gen_random_uuid()::text,
  dodo_customer_id = 'test_cust_' || gen_random_uuid()::text
WHERE id = 'your_org_id';
```

### Upgrade to Pro via SQL

```sql
-- Update organization to Pro plan
UPDATE organizations 
SET 
  plan = 'pro',
  subscription_status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  dodo_subscription_id = 'test_sub_' || gen_random_uuid()::text,
  dodo_customer_id = 'test_cust_' || gen_random_uuid()::text
WHERE id = 'your_org_id';
```

---

## Option 3: Using Email Aliases (Gmail/Outlook)

If you use Gmail or Outlook, you can use email aliases to create multiple accounts with the same inbox:

- `yourname+free@gmail.com` → Free account
- `yourname+starter@gmail.com` → Starter account  
- `yourname+pro@gmail.com` → Pro account

All emails go to `yourname@gmail.com`, but they're treated as separate accounts.

---

## Verify Test Accounts

After creating accounts, verify they're set up correctly:

```sql
-- Check all test accounts
SELECT 
  u.email,
  o.plan,
  o.subscription_status,
  o.trial_ends_at,
  o.current_period_end
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email LIKE 'test-%@example.com'
ORDER BY u.email;
```

---

## Quick Test Checklist

After creating accounts, quickly verify:

- [ ] Free account: Can only add 1 site
- [ ] Free account: Can only run 3 checks/day
- [ ] Starter account: Can add 3 sites
- [ ] Starter account: Can add 2 competitors per site
- [ ] Pro account: Can add 10 sites
- [ ] Pro account: Can add 10 competitors per site
- [ ] All accounts: Login works
- [ ] All accounts: Dashboard loads

---

**Note:** Always use test cards (`4242 4242 4242 4242`) in test mode. Never use real payment cards during testing.

