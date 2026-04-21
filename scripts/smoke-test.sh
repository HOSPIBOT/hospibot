#!/bin/bash
# HospiBot Diagnostic Portal — Production Smoke Test
# Run: bash scripts/smoke-test.sh https://your-api-url.railway.app/api/v1

API_URL="${1:-http://localhost:4000/api/v1}"
PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL + 1))
  local desc="$1"
  local url="$2"
  local expected="${3:-200}"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
  
  if [ "$status" = "$expected" ]; then
    echo "  ✅ $desc (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc (Expected $expected, got $status)"
    FAIL=$((FAIL + 1))
  fi
}

echo "╔════════════════════════════════════════════════╗"
echo "║  HospiBot Smoke Test — $API_URL"
echo "╚════════════════════════════════════════════════╝"
echo ""

echo "── Health ──"
check "Health endpoint" "$API_URL/../health"

echo ""
echo "── Public Endpoints ──"
check "Portal families" "$API_URL/portal/families"
check "Diagnostic groups" "$API_URL/portal/families/diagnostic/groups"
check "Tier configs" "$API_URL/portal/tier-configs?family=diagnostic"

echo ""
echo "── Auth Endpoints ──"
check "Login (no creds)" "$API_URL/auth/login" "401"
check "Register (no body)" "$API_URL/auth/register" "400"

echo ""
echo "── Protected Endpoints (should 401 without token) ──"
check "Dashboard" "$API_URL/diagnostic/dashboard" "401"
check "Patients" "$API_URL/diagnostic/patients" "401"
check "Lab Orders" "$API_URL/diagnostic/lab-orders" "401"
check "Catalog" "$API_URL/diagnostic/test-catalog" "401"
check "Results" "$API_URL/diagnostic/results" "401"
check "Billing" "$API_URL/diagnostic/billing" "401"
check "Analytics" "$API_URL/diagnostic/analytics" "401"
check "Staff" "$API_URL/diagnostic/staff" "401"
check "Settings" "$API_URL/diagnostic/settings" "401"

echo ""
echo "── Super Admin (should 401/403) ──"
check "SA Dashboard" "$API_URL/super-admin/dashboard" "401"
check "SA Tenants" "$API_URL/super-admin/tenants" "401"
check "SA Wallets" "$API_URL/super-admin/wallets" "401"
check "SA Subscriptions" "$API_URL/super-admin/subscription-tracker" "401"
check "SA Gateway" "$API_URL/super-admin/gateway-charges" "401"

echo ""
echo "════════════════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED"
else
  echo "⚠️  $FAIL test(s) failed — check above"
fi
echo "════════════════════════════════════════════════"
