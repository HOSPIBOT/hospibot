-- Migration: Add feedback/NPS fields to Visit, ABHA ID to UHR
-- Created: 2026-04-14

-- Visit: patient feedback fields
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "feedback" TEXT;
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "nps_score" INTEGER;

-- UniversalHealthRecord: ABHA ID linkage
ALTER TABLE "universal_health_records" ADD COLUMN IF NOT EXISTS "abha_id" TEXT;
ALTER TABLE "universal_health_records" ADD COLUMN IF NOT EXISTS "abha_address" TEXT;

-- Create index for ABHA lookup
CREATE INDEX IF NOT EXISTS "uhr_abha_id_idx" ON "universal_health_records"("abha_id") WHERE "abha_id" IS NOT NULL;
