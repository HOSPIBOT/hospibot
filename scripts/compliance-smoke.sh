#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# HospiBot — Compliance Smoke Test
# ─────────────────────────────────────────────────────────────────────────────
#
# Verifies the end-to-end behavior of the Sprint 3 compliance hard-block
# stack (commits 484e3a8 + b845dc9 + 754e98a + 4df57de) against a live
# deployment. Runs through every endpoint under /api/v1/compliance/*, checks
# response shapes and state transitions, and confirms the bug fixes from
# commit 4df57de actually took effect in production.
#
# ─────────────────────────────────────────────────────────────────────────────
# HOW TO GET A JWT
# ─────────────────────────────────────────────────────────────────────────────
#
#   1. Register a diagnostic tenant via the Vercel frontend
#      (https://hospibot-web.vercel.app → Get Started → Diagnostic path).
#   2. Log into the tenant portal.
#   3. Open browser devtools → Application → Local Storage.
#   4. Copy the value of `hospibot_access_token`.
#
# ─────────────────────────────────────────────────────────────────────────────
# USAGE
# ─────────────────────────────────────────────────────────────────────────────
#
#   export JWT='eyJhbGc...'
#   export BASE_URL='https://hospibotserver-production.up.railway.app/api/v1'
#   bash scripts/compliance-smoke.sh
#
# Optional:
#
#   export BRANCH_ID='some-branch-uuid'   # scopes BMW/biosafety to a branch
#
# ─────────────────────────────────────────────────────────────────────────────
# DEPENDENCIES
# ─────────────────────────────────────────────────────────────────────────────
#
#   - curl      (any version)
#   - jq        (apt install jq  /  brew install jq)
#   - date      (GNU date or BSD date; both handled)
#
# ─────────────────────────────────────────────────────────────────────────────
# EXIT CODES
# ─────────────────────────────────────────────────────────────────────────────
#
#   0 — every assertion passed
#   1 — one or more assertions failed; see final summary
#   2 — missing dependencies or misconfiguration (JWT / BASE_URL unset)
#
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

# ── ANSI helpers ────────────────────────────────────────────────────────────
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
BLUE=$'\033[34m'; DIM=$'\033[2m';   BOLD=$'\033[1m'; RESET=$'\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
FAILED_TESTS=()

pass()  { echo "${GREEN}✓${RESET} $*"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail()  { echo "${RED}✗${RESET} $*"; FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED_TESTS+=("$*"); }
skip()  { echo "${YELLOW}⊘${RESET} $*"; SKIP_COUNT=$((SKIP_COUNT + 1)); }
info()  { echo "${DIM}  $*${RESET}"; }
head1() { echo; echo "${BOLD}${BLUE}━━ $* ━━${RESET}"; }

# ── Environment checks ──────────────────────────────────────────────────────
if [[ -z "${JWT:-}" ]]; then
  echo "${RED}ERROR:${RESET} JWT env var not set."
  echo "       See header of this file for how to obtain a JWT."
  exit 2
fi
if [[ -z "${BASE_URL:-}" ]]; then
  echo "${RED}ERROR:${RESET} BASE_URL env var not set."
  echo "       Example: export BASE_URL='https://hospibotserver-production.up.railway.app/api/v1'"
  exit 2
fi
command -v jq >/dev/null 2>&1 || { echo "${RED}ERROR:${RESET} jq not installed. Run: brew install jq  (or  apt install jq)"; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "${RED}ERROR:${RESET} curl not installed."; exit 2; }

# Trim trailing slash from BASE_URL
BASE_URL="${BASE_URL%/}"

# ── Cross-platform date helpers ─────────────────────────────────────────────
today()      { date -u +"%Y-%m-%d"; }
nowIso()     { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
nowSeconds() { date -u +"%s"; }
oneYearFromToday() {
  if date -u -d "+1 year" +"%Y-%m-%d" >/dev/null 2>&1; then
    date -u -d "+1 year" +"%Y-%m-%d"       # GNU (Linux)
  else
    date -u -v+1y +"%Y-%m-%d"              # BSD (macOS)
  fi
}

# ── curl wrappers ───────────────────────────────────────────────────────────
# Prints body to stdout; prints "HTTP_STATUS=NNN" on its own line (trailing).
api() {
  local method="$1"; local path="$2"; local body="${3:-}"
  local url="${BASE_URL}${path}"
  local args=(-sS -X "$method" "$url"
    -H "Authorization: Bearer $JWT"
    -H "Content-Type: application/json"
    -w "\nHTTP_STATUS=%{http_code}\n")
  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi
  curl "${args[@]}" 2>/dev/null
}

api_body()   { sed '/^HTTP_STATUS=/d'; }             # stdin → JSON body
api_status() { awk -F= '/^HTTP_STATUS=/{print $2}'; } # stdin → "200" etc.

# Run request, split body + status into variables
#   BODY and STATUS will be set in caller's scope.
run() {
  local raw
  raw="$(api "$@")"
  BODY="$(printf '%s\n' "$raw" | api_body)"
  STATUS="$(printf '%s\n' "$raw" | api_status)"
}

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight
# ─────────────────────────────────────────────────────────────────────────────
head1 "Pre-flight"

run GET "/health"
if [[ "$STATUS" == "200" ]]; then
  pass "backend healthy at $BASE_URL"
else
  fail "backend /health returned HTTP $STATUS — aborting"
  exit 1
fi

run GET "/tenants/current"
if [[ "$STATUS" == "200" ]]; then
  TENANT_NAME="$(echo "$BODY" | jq -r '.name // "?"')"
  TENANT_FAMILY="$(echo "$BODY" | jq -r '.portalFamilySlug // .portalFamily.slug // "?"')"
  pass "JWT valid — tenant: $TENANT_NAME ($TENANT_FAMILY)"
  if [[ "$TENANT_FAMILY" != "diagnostic" ]]; then
    echo "${YELLOW}WARNING:${RESET} this tenant is '$TENANT_FAMILY', not 'diagnostic'."
    echo "         Compliance endpoints work but may not be relevant to this portal."
  fi
else
  fail "JWT invalid or /tenants/current unreachable (HTTP $STATUS)"
  info "$(echo "$BODY" | jq -c . 2>/dev/null | head -c 200)"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 1. Dashboard baseline
# ─────────────────────────────────────────────────────────────────────────────
head1 "1. Dashboard baseline — GET /compliance/status"

run GET "/compliance/status"
if [[ "$STATUS" != "200" ]]; then
  fail "GET /compliance/status returned HTTP $STATUS"
  info "$(echo "$BODY" | jq -c .)"
else
  pass "GET /compliance/status → HTTP 200"

  # Verify response shape — the four top-level keys
  for key in bmw biosafety pcpndt pregnancyScreenings; do
    if [[ "$(echo "$BODY" | jq -r ".$key | type")" == "object" ]]; then
      pass "response has '$key' object"
    else
      fail "response missing '$key' object"
    fi
  done

  # Verify new latestFiledAt field (added in commit 4df57de)
  if echo "$BODY" | jq -e '.bmw | has("latestFiledAt")' >/dev/null; then
    pass "bmw.latestFiledAt present (fix 4df57de confirmed live)"
  else
    fail "bmw.latestFiledAt missing — fix 4df57de NOT live, still on old deploy"
  fi
  if echo "$BODY" | jq -e '.biosafety | has("latestFiledAt")' >/dev/null; then
    pass "biosafety.latestFiledAt present"
  else
    fail "biosafety.latestFiledAt missing"
  fi

  info "bmw.isCurrent = $(echo "$BODY" | jq -r '.bmw.isCurrent')"
  info "biosafety.isCurrent = $(echo "$BODY" | jq -r '.biosafety.isCurrent')"
  info "biosafety.isPassing = $(echo "$BODY" | jq -r '.biosafety.isPassing')"
  info "pcpndt.pendingSubmissionCount = $(echo "$BODY" | jq -r '.pcpndt.pendingSubmissionCount')"
  info "pregnancyScreenings.flaggedForReviewCount = $(echo "$BODY" | jq -r '.pregnancyScreenings.flaggedForReviewCount')"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. BMW waste log — create + verify dashboard flip
# ─────────────────────────────────────────────────────────────────────────────
head1 "2. BMW waste log"

SMOKE_ID="smoke-$(nowSeconds)"
BRANCH_CLAUSE=""
if [[ -n "${BRANCH_ID:-}" ]]; then
  BRANCH_CLAUSE=",\"branchId\":\"$BRANCH_ID\""
fi

BMW_BODY=$(cat <<EOF
{
  "logDate": "$(today)",
  "yellowBagKg": 2.5,
  "redBagKg": 1.8,
  "whiteBagKg": 0.4,
  "blueBagKg": 0.3,
  "authorizedDisposerName": "Smoke-Test Disposer Pvt Ltd",
  "authorizedDisposerReceipt": "SMOKE-$SMOKE_ID",
  "loggedByUserId": "smoke-test-user"
  $BRANCH_CLAUSE
}
EOF
)

run POST "/compliance/bmw/waste-logs" "$BMW_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  BMW_LOG_ID="$(echo "$BODY" | jq -r '.id')"
  pass "POST BMW log → created id $BMW_LOG_ID"
elif [[ "$STATUS" == "400" || "$STATUS" == "500" ]] && echo "$BODY" | grep -qi "unique\|duplicate\|P2002"; then
  skip "POST BMW log → already exists for today (unique [tenantId, branchId, logDate])"
else
  fail "POST BMW log → HTTP $STATUS"
  info "$(echo "$BODY" | jq -c . 2>/dev/null)"
fi

run GET "/compliance/bmw/waste-logs"
if [[ "$STATUS" == "200" ]]; then
  LOG_COUNT="$(echo "$BODY" | jq 'length')"
  pass "GET BMW logs → HTTP 200, $LOG_COUNT log(s)"
else
  fail "GET BMW logs → HTTP $STATUS"
fi

run GET "/compliance/status"
BMW_CURRENT="$(echo "$BODY" | jq -r '.bmw.isCurrent')"
BMW_FILED_AT="$(echo "$BODY" | jq -r '.bmw.latestFiledAt')"
if [[ "$BMW_CURRENT" == "true" ]]; then
  pass "dashboard: bmw.isCurrent flipped to true"
  info "latestFiledAt = $BMW_FILED_AT"
else
  fail "dashboard: bmw.isCurrent still $BMW_CURRENT after POST (staleness guard may be using wrong field)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Biosafety checklist — passing vs failing
# ─────────────────────────────────────────────────────────────────────────────
head1 "3. Biosafety checklist"

# Passing (all 6 items true)
BIO_PASS_BODY=$(cat <<EOF
{
  "checklistDate": "$(today)",
  "bsc2CertCurrentWithin12Mo": true,
  "ppeInventoryAdequate": true,
  "spillKitsAvailable": true,
  "eyewashStationFunctional": true,
  "autoclaveSporeTestPassedWithin30D": true,
  "trainingLogCurrent": true,
  "completedByUserId": "smoke-test-user",
  "notes": "Smoke test — all items checked"
  $BRANCH_CLAUSE
}
EOF
)

run POST "/compliance/biosafety/checklists" "$BIO_PASS_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  PASSED="$(echo "$BODY" | jq -r '.passed')"
  if [[ "$PASSED" == "true" ]]; then
    pass "POST biosafety (all items true) → passed=true computed server-side"
  else
    fail "POST biosafety (all items true) → passed=$PASSED, expected true"
  fi
else
  fail "POST biosafety → HTTP $STATUS"
  info "$(echo "$BODY" | jq -c . 2>/dev/null)"
fi

# Failing (one item false)
BIO_FAIL_BODY=$(cat <<EOF
{
  "checklistDate": "$(today)",
  "bsc2CertCurrentWithin12Mo": true,
  "ppeInventoryAdequate": false,
  "spillKitsAvailable": true,
  "eyewashStationFunctional": true,
  "autoclaveSporeTestPassedWithin30D": true,
  "trainingLogCurrent": true,
  "completedByUserId": "smoke-test-user",
  "notes": "Smoke test — one item missing"
  $BRANCH_CLAUSE
}
EOF
)

run POST "/compliance/biosafety/checklists" "$BIO_FAIL_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  PASSED="$(echo "$BODY" | jq -r '.passed')"
  if [[ "$PASSED" == "false" ]]; then
    pass "POST biosafety (one item false) → passed=false computed server-side"
  else
    fail "POST biosafety (one item false) → passed=$PASSED, expected false"
  fi
fi

# Dashboard should now reflect the MOST RECENT (failing) checklist
run GET "/compliance/status"
BIO_PASSING="$(echo "$BODY" | jq -r '.biosafety.isPassing')"
if [[ "$BIO_PASSING" == "false" ]]; then
  pass "dashboard: biosafety.isPassing=false (most recent is failing — correct)"
else
  fail "dashboard: biosafety.isPassing=$BIO_PASSING, expected false (createdAt ordering may be wrong)"
fi

# Now file another passing one to restore green
run POST "/compliance/biosafety/checklists" "$BIO_PASS_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  pass "POST biosafety (restore passing) → ok"
fi

run GET "/compliance/status"
BIO_PASSING="$(echo "$BODY" | jq -r '.biosafety.isPassing')"
if [[ "$BIO_PASSING" == "true" ]]; then
  pass "dashboard: biosafety.isPassing flipped back to true after passing refile"
else
  fail "dashboard: biosafety.isPassing=$BIO_PASSING after passing refile"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. PC-PNDT Form F
# ─────────────────────────────────────────────────────────────────────────────
head1 "4. PC-PNDT Form F"

FORM_F_BODY=$(cat <<EOF
{
  "formFNumber": "FF-SMOKE-$(nowSeconds)",
  "patientId": "smoke-patient-uuid",
  "referringDoctorName": "Dr. Smoke Tester",
  "referringDoctorRegNo": "SMOKE-12345",
  "performedByDoctorName": "Dr. Radiology Smoke",
  "performedByDoctorRegNo": "SMOKE-67890",
  "gestationalAgeWeeks": 20,
  "indicationForScan": "Smoke test — routine anomaly scan",
  "scanType": "ANOMALY_SCAN",
  "findings": "Smoke test findings",
  "informedConsentTaken": true
}
EOF
)

run POST "/compliance/pcpndt/form-f" "$FORM_F_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  FORM_F_ID="$(echo "$BODY" | jq -r '.id')"
  pass "POST Form F → created id $FORM_F_ID"
else
  FORM_F_ID=""
  fail "POST Form F → HTTP $STATUS"
  info "$(echo "$BODY" | jq -c . 2>/dev/null)"
fi

run GET "/compliance/pcpndt/form-f?submitted=false"
if [[ "$STATUS" == "200" ]]; then
  UNSUB_COUNT="$(echo "$BODY" | jq 'length')"
  pass "GET Form F (submitted=false) → $UNSUB_COUNT unsubmitted record(s)"
fi

# Flip submittedToAuthority
if [[ -n "$FORM_F_ID" ]]; then
  run PATCH "/compliance/pcpndt/form-f/$FORM_F_ID/submit"
  if [[ "$STATUS" == "200" ]]; then
    SUBMITTED="$(echo "$BODY" | jq -r '.submittedToAuthority')"
    SUBMITTED_AT="$(echo "$BODY" | jq -r '.submittedAt')"
    if [[ "$SUBMITTED" == "true" && "$SUBMITTED_AT" != "null" ]]; then
      pass "PATCH Form F /submit → submittedToAuthority=true, submittedAt=$SUBMITTED_AT"
    else
      fail "PATCH Form F /submit → submittedToAuthority=$SUBMITTED"
    fi
  else
    fail "PATCH Form F /submit → HTTP $STATUS"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. AERB dose entry
# ─────────────────────────────────────────────────────────────────────────────
head1 "5. AERB dose entry"

AERB_BODY=$(cat <<EOF
{
  "examDate": "$(nowIso)",
  "examType": "XRAY",
  "doseMSv": 0.025,
  "operatorUserId": "smoke-test-user",
  "operatorTldBadgeReading": 0.001,
  "notes": "Smoke test dose entry"
}
EOF
)

run POST "/compliance/aerb/dose-entries" "$AERB_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  pass "POST AERB dose entry → created id $(echo "$BODY" | jq -r '.id')"
else
  fail "POST AERB dose entry → HTTP $STATUS"
  info "$(echo "$BODY" | jq -c . 2>/dev/null)"
fi

run GET "/compliance/aerb/dose-entries"
if [[ "$STATUS" == "200" ]]; then
  COUNT="$(echo "$BODY" | jq 'length')"
  pass "GET AERB dose entries → $COUNT record(s)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. Pregnancy screening + flag toggle (tests bug fix 4df57de)
# ─────────────────────────────────────────────────────────────────────────────
head1 "6. Pregnancy screening + flag toggle"

PREG_BODY=$(cat <<EOF
{
  "patientId": "smoke-patient-uuid",
  "gestationalAgeWeeks": 18,
  "hasConsentForm": true,
  "sexDeterminationDeclarationSigned": true,
  "flaggedForReview": false,
  "screenedByUserId": "smoke-test-user"
}
EOF
)

run POST "/compliance/pregnancy-screenings" "$PREG_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  PREG_ID="$(echo "$BODY" | jq -r '.id')"
  pass "POST pregnancy screening → id $PREG_ID"
else
  PREG_ID=""
  fail "POST pregnancy screening → HTTP $STATUS"
fi

if [[ -n "$PREG_ID" ]]; then
  # Flag it
  run PATCH "/compliance/pregnancy-screenings/$PREG_ID" '{"flaggedForReview":true}'
  if [[ "$STATUS" == "200" ]]; then
    FLAGGED="$(echo "$BODY" | jq -r '.flaggedForReview')"
    if [[ "$FLAGGED" == "true" ]]; then
      pass "PATCH → flaggedForReview=true"
    else
      fail "PATCH flag on → flaggedForReview=$FLAGGED"
    fi
  else
    fail "PATCH flag on → HTTP $STATUS"
  fi

  # Verify dashboard counter moves
  run GET "/compliance/status"
  FLAGGED_COUNT="$(echo "$BODY" | jq -r '.pregnancyScreenings.flaggedForReviewCount')"
  if [[ "$FLAGGED_COUNT" -ge 1 ]]; then
    pass "dashboard: flaggedForReviewCount=$FLAGGED_COUNT (≥1 as expected)"
  else
    fail "dashboard: flaggedForReviewCount=$FLAGGED_COUNT, expected ≥1"
  fi

  # Flag filter query
  run GET "/compliance/pregnancy-screenings?flagged=true"
  if [[ "$STATUS" == "200" ]]; then
    FLAGGED_ROWS="$(echo "$BODY" | jq 'length')"
    if [[ "$FLAGGED_ROWS" -ge 1 ]]; then
      pass "GET flagged=true → $FLAGGED_ROWS row(s) including ours"
    else
      fail "GET flagged=true → 0 rows, expected ≥1"
    fi
  fi

  # Clear flag — this tests the bug fix path (button should re-enable on UI)
  run PATCH "/compliance/pregnancy-screenings/$PREG_ID" '{"flaggedForReview":false}'
  if [[ "$STATUS" == "200" ]]; then
    FLAGGED="$(echo "$BODY" | jq -r '.flaggedForReview')"
    if [[ "$FLAGGED" == "false" ]]; then
      pass "PATCH → flaggedForReview=false (toggle round-trip complete)"
    else
      fail "PATCH flag off → flaggedForReview=$FLAGGED"
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Mammography operator log
# ─────────────────────────────────────────────────────────────────────────────
head1 "7. Mammography operator log"

MAMMO_BODY=$(cat <<EOF
{
  "operatorUserId": "smoke-test-user",
  "certificationNumber": "AERB-MAMMO-SMOKE-$(nowSeconds)",
  "certificationExpiresAt": "$(oneYearFromToday)",
  "dailyQcDate": "$(today)",
  "dailyQcPassed": true,
  "phantomImageScore": 95,
  "notes": "Smoke test daily QC"
}
EOF
)

run POST "/compliance/mammography/operator-logs" "$MAMMO_BODY"
if [[ "$STATUS" == "201" || "$STATUS" == "200" ]]; then
  pass "POST mammo operator log → id $(echo "$BODY" | jq -r '.id')"
else
  fail "POST mammo operator log → HTTP $STATUS"
  info "$(echo "$BODY" | jq -c . 2>/dev/null)"
fi

run GET "/compliance/mammography/operator-logs"
if [[ "$STATUS" == "200" ]]; then
  COUNT="$(echo "$BODY" | jq 'length')"
  pass "GET mammo operator logs → $COUNT record(s)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 8. Final dashboard — everything should be green now
# ─────────────────────────────────────────────────────────────────────────────
head1 "8. Final dashboard check"

run GET "/compliance/status"
BMW_CURRENT="$(echo "$BODY" | jq -r '.bmw.isCurrent')"
BIO_CURRENT="$(echo "$BODY" | jq -r '.biosafety.isCurrent')"
BIO_PASSING="$(echo "$BODY" | jq -r '.biosafety.isPassing')"
FLAGGED="$(echo "$BODY" | jq -r '.pregnancyScreenings.flaggedForReviewCount')"

[[ "$BMW_CURRENT" == "true" ]] && pass "bmw.isCurrent=true"           || fail "bmw.isCurrent=$BMW_CURRENT"
[[ "$BIO_CURRENT" == "true" ]] && pass "biosafety.isCurrent=true"     || fail "biosafety.isCurrent=$BIO_CURRENT"
[[ "$BIO_PASSING" == "true" ]] && pass "biosafety.isPassing=true"     || fail "biosafety.isPassing=$BIO_PASSING"
[[ "$FLAGGED" == "0" ]]        && pass "pregnancyScreenings.flaggedForReviewCount=0" \
                              || info "pregnancyScreenings.flaggedForReviewCount=$FLAGGED (includes screenings from prior runs)"

# ─────────────────────────────────────────────────────────────────────────────
# 9. Negative: unauthenticated request must be rejected
# ─────────────────────────────────────────────────────────────────────────────
head1 "9. Auth guard check (negative)"

NO_AUTH_RESP="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/compliance/status" 2>/dev/null)"
if [[ "$NO_AUTH_RESP" == "401" ]]; then
  pass "unauth GET /compliance/status → HTTP 401 (JwtAuthGuard active)"
else
  fail "unauth GET /compliance/status → HTTP $NO_AUTH_RESP (expected 401)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo
echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo "${BOLD}SUMMARY${RESET}"
echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
echo "  ${GREEN}${PASS_COUNT} passed${RESET}  ·  ${RED}${FAIL_COUNT} failed${RESET}  ·  ${YELLOW}${SKIP_COUNT} skipped${RESET}  (${TOTAL} total)"

if [[ ${FAIL_COUNT} -gt 0 ]]; then
  echo
  echo "${RED}Failures:${RESET}"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  ${RED}✗${RESET} $t"
  done
  echo
  echo "${RED}❌ Compliance smoke test FAILED.${RESET}"
  exit 1
fi

echo
echo "${GREEN}✅ All compliance smoke checks passed. Sprint 3 stack is healthy end-to-end.${RESET}"
exit 0
