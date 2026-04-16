#!/bin/bash
# =============================================================================
# HospiBot Railway Environment Variables Setup
# Run: bash setup-railway-env.sh
# Requires: railway CLI installed (npm install -g @railway/cli)
# =============================================================================

echo "🚂 Setting up Railway environment variables for HospiBot..."
echo ""

# ── REQUIRED — Server will not start without these ───────────────────────────
# These MUST already be set in Railway (DATABASE_URL, JWT_SECRET, etc.)
# Check Railway dashboard: hospibotserver → Variables

echo "Checking required variables..."
railway variables get DATABASE_URL 2>/dev/null && echo "✅ DATABASE_URL set" || echo "❌ DATABASE_URL MISSING — add in Railway dashboard"
railway variables get JWT_SECRET   2>/dev/null && echo "✅ JWT_SECRET set" || echo "❌ JWT_SECRET MISSING"

# ── OPTIONAL — Set defaults if not already configured ────────────────────────

# Super Admin credentials (auto-seeded on first boot)
railway variables set SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@hospibot.in}"
railway variables set SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-HospiBot@2026!}"

# Frontend URL for CORS and report links
railway variables set FRONTEND_URL="${FRONTEND_URL:-https://hospibot-web.vercel.app}"

# Bootstrap secret for /bootstrap/init endpoint
railway variables set BOOTSTRAP_SECRET="${BOOTSTRAP_SECRET:-hospibot-init-2026}"

# HospiBot GST number for invoices
railway variables set HOSPIBOT_GSTIN="${HOSPIBOT_GSTIN:-29AAACI1681G1ZJ}"

echo ""
echo "✅ Optional variables set"
echo ""
echo "📌 Variables you still need to set manually in Railway dashboard:"
echo "   RAZORPAY_KEY_ID         — from Razorpay dashboard"
echo "   RAZORPAY_KEY_SECRET     — from Razorpay dashboard"
echo "   RAZORPAY_WEBHOOK_SECRET — from Razorpay dashboard"
echo "   AWS_REGION              — ap-south-1 (recommended)"
echo "   AWS_ACCESS_KEY_ID       — from AWS IAM"
echo "   AWS_SECRET_ACCESS_KEY   — from AWS IAM"
echo "   S3_BUCKET               — hospibot-reports"
echo ""
echo "🎉 Done! Redeploy Railway for changes to take effect."
