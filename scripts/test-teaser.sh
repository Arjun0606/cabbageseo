#!/bin/bash

# ============================================
# CabbageSEO - API Endpoint Test Script
# ============================================
# 
# Run this to test all API endpoints
# Usage: ./scripts/test-all-endpoints.sh [BASE_URL]
#
# Examples:
#   ./scripts/test-all-endpoints.sh                        # Test localhost:3000
#   ./scripts/test-all-endpoints.sh https://yourapp.vercel.app  # Test production
#

BASE_URL=${1:-"http://localhost:3000"}
PASS=0
FAIL=0

echo ""
echo "============================================"
echo "CabbageSEO API Endpoint Tests"
echo "Base URL: $BASE_URL"
echo "============================================"
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local body="$5"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$response" == "$expected_status" ]; then
        echo "✅ PASS: $name (HTTP $response)"
        ((PASS++))
    else
        echo "❌ FAIL: $name (Expected $expected_status, got $response)"
        ((FAIL++))
    fi
}

echo "--- Public Endpoints ---"
test_endpoint "Homepage" "GET" "/" "200"
test_endpoint "Pricing Page" "GET" "/pricing" "200"
test_endpoint "Login Page" "GET" "/login" "200"
test_endpoint "Signup Page" "GET" "/signup" "200"

echo ""
echo "--- API Endpoints (No Auth - Should return 401/503) ---"
test_endpoint "Me API (no auth)" "GET" "/api/me" "200"  # Returns { authenticated: false }
test_endpoint "Sites API (no auth)" "GET" "/api/sites" "401"
test_endpoint "Citations API (no auth)" "GET" "/api/geo/citations" "401"
test_endpoint "Notifications API (no auth)" "GET" "/api/notifications" "401"

echo ""
echo "--- Billing Endpoints (No Auth) ---"
test_endpoint "Checkout API (no auth)" "POST" "/api/billing/checkout" "401" '{"planId":"starter"}'
test_endpoint "Usage API (no auth)" "GET" "/api/billing/usage" "401"

echo ""
echo "--- Citation Check (No Auth) ---"
test_endpoint "Citation Check (no auth)" "POST" "/api/geo/citations/check" "401" '{"domain":"example.com"}'

echo ""
echo "--- GEO Intelligence (No Auth) ---"
test_endpoint "GEO Intelligence (no auth)" "GET" "/api/geo/intelligence" "401"

echo ""
echo "============================================"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "============================================"
echo ""

if [ $FAIL -gt 0 ]; then
    exit 1
fi

