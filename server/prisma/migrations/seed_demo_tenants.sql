-- Demo tenants for testing (8 subtypes, one per group)
-- Run AFTER tier_configs seed

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: hash password 'Demo@1234' (bcrypt)
-- In production, use proper bcrypt hash from the auth module

INSERT INTO tenants (id, name, slug, type, status, plan, email, phone, address, city, state, country, pincode,
  portal_family_id, sub_type_id, logo_url, primary_color, settings, created_at, updated_at)
VALUES
  (gen_random_uuid()::TEXT, 'Sunrise Diagnostics', 'sunrise-diagnostics', 'DIAGNOSTIC', 'ACTIVE', 'GROWTH',
   'demo-pathology@hospibot.in', '9876543210', '123 MG Road', 'Hyderabad', 'Telangana', 'India', '500001',
   'diagnostic', 'pathology-lab', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"medium","subtypeSlug":"pathology-lab"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'Bright Scans Imaging', 'bright-scans', 'DIAGNOSTIC', 'ACTIVE', 'GROWTH',
   'demo-radiology@hospibot.in', '9876543211', '456 Jubilee Hills', 'Hyderabad', 'Telangana', 'India', '500033',
   'diagnostic', 'radiology-center', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"medium","subtypeSlug":"radiology-center"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'Mother Trust USG Center', 'mother-trust-usg', 'DIAGNOSTIC', 'ACTIVE', 'GROWTH',
   'demo-usg@hospibot.in', '9876543212', '789 Banjara Hills', 'Hyderabad', 'Telangana', 'India', '500034',
   'diagnostic', 'ultrasound-center', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"medium","subtypeSlug":"ultrasound-center"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'HeartCare Hub', 'heartcare-hub', 'DIAGNOSTIC', 'ACTIVE', 'PROFESSIONAL',
   'demo-cardiac@hospibot.in', '9876543213', '321 HITEC City', 'Hyderabad', 'Telangana', 'India', '500081',
   'diagnostic', 'cardiac-diagnostics', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"large","subtypeSlug":"cardiac-diagnostics"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'GenoCare Labs', 'genocare-labs', 'DIAGNOSTIC', 'ACTIVE', 'STARTER',
   'demo-genetic@hospibot.in', '9876543214', '654 Gachibowli', 'Hyderabad', 'Telangana', 'India', '500032',
   'diagnostic', 'genetic-lab', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"small","subtypeSlug":"genetic-lab"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'Wellness Partners India', 'wellness-partners', 'DIAGNOSTIC', 'ACTIVE', 'PROFESSIONAL',
   'demo-corporate@hospibot.in', '9876543215', '987 Madhapur', 'Hyderabad', 'Telangana', 'India', '500081',
   'diagnostic', 'corporate-screening', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"large","subtypeSlug":"corporate-screening"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'Metro Central Lab', 'metro-central-lab', 'DIAGNOSTIC', 'ACTIVE', 'ENTERPRISE',
   'demo-reference@hospibot.in', '9876543216', '111 Kukatpally', 'Hyderabad', 'Telangana', 'India', '500072',
   'diagnostic', 'reference-lab', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"enterprise","subtypeSlug":"reference-lab"}'::JSONB, NOW(), NOW()),

  (gen_random_uuid()::TEXT, 'ReportNow TeleRad', 'reportnow-telerad', 'DIAGNOSTIC', 'ACTIVE', 'PROFESSIONAL',
   'demo-telerad@hospibot.in', '9876543217', '222 Financial District', 'Hyderabad', 'Telangana', 'India', '500032',
   'diagnostic', 'tele-radiology', NULL, '0D7C66',
   '{"currentPeriodEnd":"2027-01-01","labTier":"large","subtypeSlug":"tele-radiology"}'::JSONB, NOW(), NOW())

ON CONFLICT (slug) DO NOTHING;
