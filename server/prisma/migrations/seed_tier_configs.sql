-- Seed TierConfig table with 4 default tiers
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "TierConfig" (id, scope, "tierKey", "displayName", tagline,
  "priceMonthly", "priceAnnual", currency, color, badge,
  "dailyVolumeMin", "dailyVolumeMax", "branchesAllowed", "staffAllowed",
  "waMessagesPerMonth", "smsPerMonth", "storageGB", "isActive", "sortOrder",
  "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::TEXT, 'family:diagnostic', 'small', 'Starter',
   'Solo practitioner or single-room setup — core workflow, WhatsApp delivery, GST billing',
   99900, 999000, 'INR', '#0369A1', NULL,
   1, 50, 1, 5, 2000, 500, 10, true, 1, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'family:diagnostic', 'medium', 'Growth',
   'Growing center — doctor CRM, insurance billing, clinical decision support, home collection',
   299900, 2999000, 'INR', '#0D7C66', 'Most Popular',
   50, 300, 3, 20, 10000, 2000, 50, true, 2, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'family:diagnostic', 'large', 'Professional',
   'Multi-site operations — NABL accreditation, QC, HRMS, advanced analytics, priority support',
   799900, 7999000, 'INR', '#7C3AED', NULL,
   300, 1000, 10, 75, 50000, 10000, 500, true, 3, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'family:diagnostic', 'enterprise', 'Enterprise',
   'Network operations — franchise management, government reporting, ABDM, API marketplace, dedicated AM',
   NULL, NULL, 'INR', '#1E293B', 'Contact Sales',
   1000, NULL, 9999, 9999, 999999, 999999, 9999, true, 4, NOW(), NOW())

ON CONFLICT ("scope", "tierKey") DO NOTHING;
