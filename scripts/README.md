# HospiBot — scripts

Operational scripts for testing, verifying, and maintaining the HospiBot
platform. Each script is self-documenting — read the header comment of the
file you're about to run for full usage instructions.

## Available scripts

### `compliance-smoke.sh`

End-to-end smoke test for the Sprint 3 compliance hard-block stack
(commits `484e3a8`, `b845dc9`, `754e98a`, `4df57de`). Exercises every
endpoint under `/api/v1/compliance/*`, validates response shapes, and
confirms state transitions behave correctly.

**What it checks**

1. Backend health + JWT validity
2. `GET /compliance/status` response shape (including the `latestFiledAt`
   field added in the most recent bug-fix commit)
3. BMW waste log → create, verify dashboard flips `isCurrent: true`
4. Biosafety checklist (passing + failing) → verify `passed` is computed
   server-side, verify `createdAt` ordering so recent failing checklists
   correctly trump older passing ones
5. PC-PNDT Form F → create, submit, verify `submittedToAuthority` flip
6. AERB dose entry → create, list
7. Pregnancy screening + flag toggle round-trip (tests the bug fix from
   commit `4df57de`)
8. Mammography operator QC log → create, list
9. Final dashboard state → all surfaces green
10. Negative auth check — unauth request returns 401

**Prerequisites**

- `curl` (any version)
- `jq` — install via `apt install jq` (Linux) or `brew install jq` (macOS)

**Getting a JWT**

1. Register a diagnostic tenant via the Vercel frontend
   (`https://hospibot-web.vercel.app` → Get Started → Diagnostic path)
2. Log into the tenant portal
3. Open browser devtools → Application → Local Storage
4. Copy the value of `hospibot_access_token`

**Usage**

```bash
export JWT='eyJhbGc...'
export BASE_URL='https://hospibotserver-production.up.railway.app/api/v1'
bash scripts/compliance-smoke.sh
```

Optional:

```bash
export BRANCH_ID='some-branch-uuid'   # scopes BMW/biosafety to a branch
```

**Exit codes**

| Code | Meaning |
|------|---------|
| 0    | every assertion passed |
| 1    | one or more assertions failed (see final summary) |
| 2    | missing dependencies or misconfiguration |

**Safe to re-run**

The script uses timestamp-based unique identifiers for Form F numbers
and mammo cert numbers. BMW logs have a `[tenantId, branchId, logDate]`
unique constraint, so re-running the same day will skip BMW creation
(which still counts as "a log exists for today", satisfying the
freshness check). Biosafety, AERB, pregnancy screening, and mammo logs
have no unique constraints — re-runs accumulate new records, but that's
fine for freshness semantics.

**When to run**

- After every backend deploy touching `compliance.service.ts` or the
  compliance schema models
- Before opening a PR that changes anything in `server/src/modules/compliance/`
- As part of a nightly health check (can be wired into CI)
