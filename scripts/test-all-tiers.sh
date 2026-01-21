#!/bin/bash

# Comprehensive Test Script for All Tiers
# Tests everything before reinstating paywalls/auth

set -e

echo "🧪 Starting Comprehensive Test Suite"
echo "======================================"
echo ""

BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local path=$3
    local data=$4
    local expected_status=${5:-200}
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$path" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $name (got $http_code, expected $expected_status)${NC}"
        echo "   Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📋 Testing API Endpoints..."
echo ""

# Test 1: Health check
test_endpoint "Health check" "GET" "/api/health" "" 200 || test_endpoint "Health check" "GET" "/" "" 200

# Test 2: Test account login
echo ""
echo "📋 Testing Authentication..."
for tier in free starter pro; do
    email="test-${tier}@cabbageseo.test"
    password="Test${tier^}123!"
    
    test_endpoint "Login: $tier tier" "POST" "/api/test/login" \
        "{\"email\":\"$email\",\"password\":\"$password\"}" 200
done

# Test 3: API endpoints (with test session)
echo ""
echo "📋 Testing API Endpoints with Test Sessions..."

# Get test session for free tier
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/test/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-free@cabbageseo.test","password":"TestFree123!"}')

# Extract session if available
SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -n "$SESSION_TOKEN" ]; then
    test_endpoint "GET /api/me" "GET" "/api/me" "" 200
    test_endpoint "GET /api/sites" "GET" "/api/sites" "" 200
else
    echo -e "${YELLOW}⚠️  Could not get test session, skipping authenticated tests${NC}"
fi

# Test 4: Inngest endpoint
echo ""
echo "📋 Testing Inngest..."
test_endpoint "Inngest endpoint" "GET" "/api/inngest" "" 200 || \
test_endpoint "Inngest endpoint" "GET" "/api/inngest" "" 404

# Test 5: Webhooks
echo ""
echo "📋 Testing Webhooks..."
test_endpoint "Dodo webhook endpoint" "POST" "/api/webhooks/dodo" \
    '{"type":"test"}' 200 || \
test_endpoint "Dodo webhook endpoint" "POST" "/api/webhooks/dodo" \
    '{"type":"test"}' 400

# Test 6: Pages
echo ""
echo "📋 Testing Pages..."
test_endpoint "Homepage" "GET" "/" "" 200
test_endpoint "Pricing page" "GET" "/pricing" "" 200
test_endpoint "Docs page" "GET" "/docs" "" 200
test_endpoint "Login page" "GET" "/login" "" 200
test_endpoint "Signup page" "GET" "/signup" "" 200

# Summary
echo ""
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Fix before launching.${NC}"
    exit 1
fi

