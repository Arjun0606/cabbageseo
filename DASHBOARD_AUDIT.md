# DASHBOARD FUNCTIONALITY AUDIT

## CRITICAL ISSUES FOUND

### 1. API Response Mismatch - Dashboard Citations
**File:** `src/app/(dashboard)/dashboard/page.tsx:77-80`
**Issue:** 
- API returns: `{ success: true, data: { citations: [...], recent: [...] } }`
- Dashboard expects: `{ citations: [...] }`
- **FIX:** Update dashboard to use `data.data.recent` or `data.data.citations`

### 2. Missing "Cited" Field Logic
**File:** `src/app/(dashboard)/dashboard/page.tsx:121-136`
**Issue:**
- Dashboard expects `citation.cited` boolean field
- API doesn't return this field
- Citations table only stores WINS (when user IS mentioned)
- **FIX:** If citation exists in table = WIN (cited: true). Need to track queries checked to determine losses.

### 3. Hardcoded Checks Remaining
**File:** `src/app/(dashboard)/dashboard/page.tsx:152`
**Issue:**
- Uses hardcoded values: `plan === "free" ? 3 : plan === "starter" ? 87 : 872`
- Should use actual usage data from context
- **FIX:** Use `usage.checksLimit - usage.checksUsed` from context

### 4. Mock Week-Over-Week Data
**File:** `src/app/(dashboard)/dashboard/page.tsx:147-148`
**Issue:**
- Hardcoded `lossesChange: -2` and `winsChange: 3`
- Should calculate from `citations_this_week` vs `citations_last_week`
- **FIX:** Use real data from site stats

### 5. Query Page Mock Fallback
**File:** `src/app/(dashboard)/dashboard/query/page.tsx:88-125`
**Issue:**
- If API fails, shows mock data (violates "no fake data" rule)
- **FIX:** Show error state, don't show mock data

### 6. Usage API Response Mismatch
**File:** `src/app/api/billing/usage/route.ts:97`
**Issue:**
- Returns `checksPerDay` but context expects `checks`
- **FIX:** Return `checks` or update context to use `checksPerDay`

### 7. Citations API Structure
**File:** `src/app/api/geo/citations/route.ts:141-151`
**Issue:**
- Returns `{ success: true, data: { citations: ..., recent: ... } }`
- Dashboard expects flat `{ citations: [...] }`
- **FIX:** Either update API or update dashboard

## WORKFLOW ISSUES

### Dashboard Flow
1. ✅ User loads dashboard → Context fetches sites
2. ✅ Dashboard fetches citations → API mismatch
3. ❌ Calculates wins/losses → Logic broken (no cited field)
4. ❌ Shows checks remaining → Hardcoded
5. ❌ Shows week-over-week → Mock data

### Query Analysis Flow
1. ✅ User clicks "Why not me?" → Navigates to query page
2. ✅ Fetches analysis → API call works
3. ❌ If API fails → Shows mock data (BAD)

### Trust Map Flow
1. ✅ Page loads → Shows sources
2. ⚠️ Uses mock competitor data → Should use real data from citations

### Roadmap Flow
1. ✅ Page loads → Shows steps
2. ✅ Paywall works → Correctly gates content
3. ✅ Progress tracking → Works (local state)

## DATA FLOW ISSUES

### Citations Data
- **Stored:** Only WINS (when user IS mentioned)
- **Missing:** Query history (which queries were checked)
- **Impact:** Can't show losses without knowing what was checked

### Usage Data
- **Stored:** Monthly usage in `usage` table
- **API:** Returns `checksPerDay` but context expects `checks`
- **Impact:** Checks remaining calculation broken

### Week-Over-Week
- **Available:** `citations_this_week` and `citations_last_week` in sites table
- **Not Used:** Dashboard uses mock data instead
- **Impact:** Users see fake progress

## FIXES NEEDED

1. Fix API response handling in dashboard
2. Fix citations data structure (add cited field or fix logic)
3. Use real usage data for checks remaining
4. Calculate real week-over-week changes
5. Remove mock fallback in query page
6. Fix usage API response format
7. Add query history tracking (to show losses)

