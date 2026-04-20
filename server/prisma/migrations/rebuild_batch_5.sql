-- ============================================
-- HospiBot Rebuild Batch 5 Migration
-- 5 tables: Network & Regulatory Reporting
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

-- 1. Population Cohort
CREATE TABLE IF NOT EXISTS population_cohorts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, cohort_name TEXT NOT NULL, cohort_type TEXT DEFAULT 'custom',
  description TEXT, age_min INTEGER, age_max INTEGER, gender TEXT, location TEXT, pincode TEXT,
  disease_filter TEXT, test_filter TEXT, employer_filter TEXT,
  date_range_start TIMESTAMPTZ, date_range_end TIMESTAMPTZ,
  total_patients INTEGER, male_count INTEGER, female_count INTEGER, avg_age DOUBLE PRECISION,
  diabetes_prevalence DOUBLE PRECISION, hypertension_prevalence DOUBLE PRECISION,
  dyslipidemia_prevalence DOUBLE PRECISION, anemia_prevalence DOUBLE PRECISION, thyroid_prevalence DOUBLE PRECISION,
  high_risk_count INTEGER, medium_risk_count INTEGER, low_risk_count INTEGER,
  trend_data JSONB, top_abnormal_tests JSONB, seasonal_patterns JSONB,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_pop_cohorts_tenant ON population_cohorts(tenant_id);

-- 2. Partner Lab (Referral Lab)
CREATE TABLE IF NOT EXISTS partner_labs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, lab_name TEXT NOT NULL, partner_type TEXT DEFAULT 'referral',
  lab_code TEXT, contact_person TEXT, phone TEXT, email TEXT, address TEXT, city TEXT, state TEXT,
  nabl_accredited BOOLEAN DEFAULT FALSE, nabl_cert_no TEXT, nabl_expiry TIMESTAMPTZ,
  cap_accredited BOOLEAN DEFAULT FALSE,
  rate_card_effective TIMESTAMPTZ, rate_card_expiry TIMESTAMPTZ, rate_card JSONB,
  commission_pct DOUBLE PRECISION, payment_terms_days INTEGER,
  tests_offered JSONB, specializations JSONB, modalities_available JSONB,
  routine_tat_hours DOUBLE PRECISION, stat_tat_hours DOUBLE PRECISION,
  sample_pickup_available BOOLEAN DEFAULT FALSE, pickup_schedule JSONB,
  cold_chain_available BOOLEAN DEFAULT FALSE, courier_partner TEXT,
  total_samples_referred INTEGER DEFAULT 0, avg_tat_achieved DOUBLE PRECISION,
  tat_breach_count INTEGER DEFAULT 0, quality_concordance DOUBLE PRECISION, rejection_rate DOUBLE PRECISION,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_partner_labs_tenant ON partner_labs(tenant_id);

-- 3. Hub-Spoke Node
CREATE TABLE IF NOT EXISTS hub_spoke_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, node_name TEXT NOT NULL, node_code TEXT, node_type TEXT NOT NULL,
  parent_hub_id TEXT, address TEXT, city TEXT, state TEXT, pincode TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, contact_person TEXT, phone TEXT,
  nabl_covered BOOLEAN DEFAULT FALSE, nabl_annexure_ref TEXT,
  daily_capacity INTEGER, current_utilization DOUBLE PRECISION,
  tests_available_locally JSONB, tests_routed_to_hub JSONB, routing_rules JSONB,
  pickup_schedule JSONB, transit_time_hours DOUBLE PRECISION,
  cold_chain_available BOOLEAN DEFAULT FALSE, runner_assigned TEXT,
  operating_hours TEXT, staff_count INTEGER, equipment_list JSONB,
  samples_processed_mtd INTEGER DEFAULT 0, samples_routed_mtd INTEGER DEFAULT 0,
  avg_tat_hours DOUBLE PRECISION, tat_breach_pct DOUBLE PRECISION, revenues_mtd DOUBLE PRECISION,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_hub_spoke_tenant ON hub_spoke_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hub_spoke_type ON hub_spoke_nodes(tenant_id, node_type);

-- 4. Franchise Lab
CREATE TABLE IF NOT EXISTS franchise_labs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, franchise_name TEXT NOT NULL, franchise_code TEXT, franchise_type TEXT NOT NULL,
  owner_name TEXT, owner_phone TEXT, owner_email TEXT, owner_aadhaar TEXT, owner_pan TEXT,
  address TEXT, city TEXT, state TEXT, pincode TEXT, area_sq_ft DOUBLE PRECISION, floor_level TEXT,
  agreement_date TIMESTAMPTZ, agreement_expiry TIMESTAMPTZ, agreement_duration_years INTEGER,
  security_deposit DOUBLE PRECISION, franchise_fee DOUBLE PRECISION,
  rev_share_pct DOUBLE PRECISION, rev_share_model TEXT, monthly_min_guarantee DOUBLE PRECISION,
  onboarding_stage TEXT DEFAULT 'application',
  site_approved BOOLEAN DEFAULT FALSE, setup_complete BOOLEAN DEFAULT FALSE,
  staff_trained BOOLEAN DEFAULT FALSE, trial_run_done BOOLEAN DEFAULT FALSE, launch_date TIMESTAMPTZ,
  brand_compliance_score DOUBLE PRECISION, last_audit_date TIMESTAMPTZ, last_audit_score DOUBLE PRECISION,
  audit_findings JSONB, sop_adherence TEXT,
  monthly_revenue DOUBLE PRECISION, monthly_samples INTEGER, avg_daily_footfall INTEGER,
  customer_rating DOUBLE PRECISION,
  notes TEXT, status TEXT DEFAULT 'onboarding',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_franchise_labs_tenant ON franchise_labs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_franchise_labs_type ON franchise_labs(tenant_id, franchise_type);

-- 5. DGHS Report (IDSP Forms S/P/L)
CREATE TABLE IF NOT EXISTS dghs_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, report_form TEXT NOT NULL, disease_code TEXT, disease_name TEXT NOT NULL,
  reporting_week_start TIMESTAMPTZ, reporting_week_end TIMESTAMPTZ,
  epi_week_number INTEGER, reporting_year INTEGER,
  facility_name TEXT, facility_code TEXT, district_name TEXT, district_code TEXT,
  state_name TEXT, state_code TEXT,
  cases_reported INTEGER, deaths_reported INTEGER, males_cases INTEGER, females_cases INTEGER,
  age_0_to_5 INTEGER, age_5_to_14 INTEGER, age_15_to_44 INTEGER, age_45_plus INTEGER,
  lab_test_performed TEXT, samples_collected INTEGER, samples_positive INTEGER, organism TEXT,
  amr_relevant BOOLEAN DEFAULT FALSE, amr_organism TEXT, amr_pattern TEXT, whonet_exported BOOLEAN DEFAULT FALSE,
  submitted_to_ihip BOOLEAN DEFAULT FALSE, ihip_submission_date TIMESTAMPTZ,
  submitted_to_dsu BOOLEAN DEFAULT FALSE, dsu_officer_name TEXT,
  alert_generated BOOLEAN DEFAULT FALSE, outbreak_investigated BOOLEAN DEFAULT FALSE,
  blood_bank_reporting BOOLEAN DEFAULT FALSE, units_collected INTEGER, ttis_detected INTEGER,
  notes TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_dghs_reports_tenant ON dghs_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dghs_reports_form ON dghs_reports(tenant_id, report_form);
CREATE INDEX IF NOT EXISTS idx_dghs_reports_disease ON dghs_reports(tenant_id, disease_name);
