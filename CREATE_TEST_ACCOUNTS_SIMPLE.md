# 🚀 Create Test Accounts - Simple Method

**No email verification needed!** Just run this API call and login directly.

---

## ✅ Step 1: Create All Test Accounts

**Open your browser and go to:**

```
https://cabbageseo.com/api/test/create-accounts
```

**Or use curl:**

```bash
curl -X POST https://cabbageseo.com/api/test/create-accounts
```

**Or if running locally:**

```bash
curl -X POST http://localhost:3000/api/test/create-accounts
```

This will create all 3 test accounts with **auto-confirmed emails** - no email verification needed!

---

## ✅ Step 2: Login Directly

After running the API, you can login immediately with:

### Free Account
- **Email:** `test-free@cabbageseo.test`
- **Password:** `TestFree123!`

### Starter Account
- **Email:** `test-starter@cabbageseo.test`
- **Password:** `TestStarter123!`

### Pro Account
- **Email:** `test-pro@cabbageseo.test`
- **Password:** `TestPro123!`

---

## ✅ What This Does

1. **Creates accounts** in Supabase Auth with auto-confirmed emails
2. **Sets passwords** directly (no email needed)
3. **Ready to login** immediately

---

## 🔍 Verify It Worked

After running the API, you should see:

```json
{
  "success": true,
  "message": "Test accounts processed",
  "results": [
    {
      "email": "test-free@cabbageseo.test",
      "status": "created",
      "message": "Account created and confirmed"
    },
    {
      "email": "test-starter@cabbageseo.test",
      "status": "created",
      "message": "Account created and confirmed"
    },
    {
      "email": "test-pro@cabbageseo.test",
      "status": "created",
      "message": "Account created and confirmed"
    }
  ]
}
```

---

## ⚠️ Requirements

Make sure you have `SUPABASE_SERVICE_ROLE_KEY` set in your `.env` file. This is needed for admin operations.

---

## 🎯 That's It!

Once accounts are created, just login and start testing! No email verification needed.

