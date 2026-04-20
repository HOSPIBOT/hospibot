-- ============================================
-- HospiBot Rebuild Batch 4 Migration
-- 5 tables: Preventive/Corporate features
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

-- 1. NGS Run (CAP NGS Checklist)
CREATE TABLE IF NOT EXISTS ngs_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, run_id TEXT NOT NULL, platform TEXT NOT NULL,
  instrument_id TEXT, instrument_name TEXT, flowcell_id TEXT, flowcell_type TEXT,
  panel_name TEXT, panel_version TEXT, enrichment_method TEXT,
  sample_count INTEGER, index_type TEXT,
  library_prep_kit TEXT, library_prep_date TIMESTAMPTZ,
  fragment_size_bp INTEGER, library_concentration DOUBLE PRECISION,
  library_qc_passed TEXT, pooling_ratio TEXT,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), read_length TEXT, read_type TEXT,
  cluster_density DOUBLE PRECISION, clusters_pf_pct DOUBLE PRECISION,
  q30_pct DOUBLE PRECISION, yield_gb DOUBLE PRECISION, error_rate DOUBLE PRECISION,
  phasing_pct DOUBLE PRECISION, prephasing_pct DOUBLE PRECISION, run_quality TEXT,
  pipeline_name TEXT, pipeline_version TEXT, reference_genome TEXT,
  avg_coverage DOUBLE PRECISION, pct_target_covered_20x DOUBLE PRECISION,
  total_variants_called INTEGER, ti_tv_ratio DOUBLE PRECISION,
  performed_by TEXT, reviewed_by TEXT, bioinformatician TEXT,
  notes TEXT, run_status TEXT DEFAULT 'library-prep',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_ngs_runs_tenant ON ngs_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ngs_runs_status ON ngs_runs(tenant_id, run_status);

-- 2. Health Risk Assessment (Labour Code 2020)
CREATE TABLE IF NOT EXISTS health_risk_assessments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL,
  patient_age INTEGER, patient_gender TEXT,
  assessment_date TIMESTAMPTZ NOT NULL, assessment_type TEXT DEFAULT 'comprehensive',
  employer_id TEXT, employer_name TEXT,
  height_cm DOUBLE PRECISION, weight_kg DOUBLE PRECISION, bmi DOUBLE PRECISION, bmi_category TEXT,
  waist_cm DOUBLE PRECISION, systolic_bp INTEGER, diastolic_bp INTEGER, resting_hr INTEGER,
  fasting_glucose DOUBLE PRECISION, hba1c DOUBLE PRECISION,
  total_cholesterol DOUBLE PRECISION, ldl DOUBLE PRECISION, hdl DOUBLE PRECISION,
  triglycerides DOUBLE PRECISION, creatinine DOUBLE PRECISION,
  smoking_status TEXT, alcohol_frequency TEXT, exercise_frequency TEXT,
  diet_type TEXT, stress_level TEXT, sleep_hours DOUBLE PRECISION,
  family_history_diabetes BOOLEAN DEFAULT FALSE, family_history_cardiac BOOLEAN DEFAULT FALSE,
  family_history_cancer BOOLEAN DEFAULT FALSE, family_history_hypertension BOOLEAN DEFAULT FALSE,
  diabetes_risk TEXT, cardiovascular_risk TEXT,
  overall_risk_score DOUBLE PRECISION, overall_risk_level TEXT,
  recommendations JSONB, referrals JSONB, follow_up_date TIMESTAMPTZ,
  assessed_by TEXT, notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_hra_tenant ON health_risk_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hra_risk ON health_risk_assessments(tenant_id, overall_risk_level);

-- 3. Consult Schedule
CREATE TABLE IF NOT EXISTS consult_schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL,
  patient_age INTEGER, patient_phone TEXT,
  consult_type TEXT DEFAULT 'post-checkup', consult_date TIMESTAMPTZ,
  time_slot TEXT, duration_min INTEGER DEFAULT 15,
  doctor_name TEXT, doctor_specialty TEXT,
  auto_booked BOOLEAN DEFAULT FALSE, trigger_reason TEXT, abnormal_findings TEXT,
  health_checkup_id TEXT, package_name TEXT,
  chief_complaint TEXT, consultation_notes TEXT, diagnosis TEXT,
  prescription_given BOOLEAN DEFAULT FALSE, referral_given BOOLEAN DEFAULT FALSE,
  referral_to TEXT, follow_up_advised BOOLEAN DEFAULT FALSE, follow_up_date TIMESTAMPTZ,
  employer_id TEXT, employer_name TEXT,
  notes TEXT, status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_consult_schedules_tenant ON consult_schedules(tenant_id);

-- 4. Health Camp (Factories Act)
CREATE TABLE IF NOT EXISTS health_camps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, camp_name TEXT NOT NULL, camp_type TEXT DEFAULT 'corporate',
  camp_date TIMESTAMPTZ NOT NULL, camp_end_date TIMESTAMPTZ,
  venue TEXT, venue_address TEXT, venue_city TEXT, on_site BOOLEAN DEFAULT TRUE,
  corporate_client TEXT, corporate_contact_person TEXT, corporate_phone TEXT, contract_id TEXT,
  test_menu JSONB, package_name TEXT, test_count INTEGER,
  includes_consultation BOOLEAN DEFAULT FALSE, includes_ecg BOOLEAN DEFAULT FALSE,
  includes_xray BOOLEAN DEFAULT FALSE, includes_usg BOOLEAN DEFAULT FALSE,
  staff_assigned JSONB, phlebotomist_count INTEGER, doctor_count INTEGER, technician_count INTEGER,
  coordinator_name TEXT,
  expected_participants INTEGER, registered_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0, no_show_count INTEGER DEFAULT 0,
  equipment_list JSONB, cold_chain_required BOOLEAN DEFAULT FALSE,
  per_person_rate DOUBLE PRECISION, total_billed_amount DOUBLE PRECISION, payment_status TEXT,
  notes TEXT, status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_health_camps_tenant ON health_camps(tenant_id);

-- 5. Employer Portal (Labour Code 2020, DPDPA 2023)
CREATE TABLE IF NOT EXISTS employer_portals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, employer_name TEXT NOT NULL, industry_type TEXT, gstin TEXT,
  contact_person TEXT, contact_phone TEXT, contact_email TEXT,
  address TEXT, city TEXT, state TEXT,
  contract_id TEXT, contract_start TIMESTAMPTZ, contract_end TIMESTAMPTZ,
  total_employees INTEGER, employees_above_40 INTEGER,
  screened_count INTEGER DEFAULT 0, pending_count INTEGER, utilization_pct DOUBLE PRECISION,
  package_name TEXT, per_employee_rate DOUBLE PRECISION,
  labour_code_compliant BOOLEAN DEFAULT FALSE, compliance_cert_issued BOOLEAN DEFAULT FALSE,
  compliance_cert_date TIMESTAMPTZ,
  factories_act_applicable BOOLEAN DEFAULT FALSE,
  form32_submitted BOOLEAN DEFAULT FALSE, form33_submitted BOOLEAN DEFAULT FALSE,
  aggregate_report JSONB, top_risks JSONB, abnormal_pct DOUBLE PRECISION,
  portal_login_enabled BOOLEAN DEFAULT FALSE, portal_username TEXT,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_employer_portals_tenant ON employer_portals(tenant_id);
