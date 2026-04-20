-- ============================================
-- HospiBot Rebuild Batch 7 Migration
-- 5 tables: Specialty Diagnostics + Regulatory
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS allergen_panels (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  test_date TIMESTAMPTZ NOT NULL, test_method TEXT NOT NULL, panel_category TEXT, panel_name TEXT,
  platform TEXT, referring_doctor TEXT, clinical_indication TEXT,
  medications_stopped_days INTEGER, antihistamines_stopped BOOLEAN DEFAULT FALSE,
  total_ige DOUBLE PRECISION, allergens_tested_count INTEGER, positive_count INTEGER,
  allergen_results JSONB, positive_control_valid TEXT, negative_control_valid TEXT,
  anaphylaxis_kit_present BOOLEAN DEFAULT FALSE, adverse_reaction BOOLEAN DEFAULT FALSE, adverse_reaction_detail TEXT,
  interpretation TEXT, recommendations TEXT, immunotherapy_recommended BOOLEAN DEFAULT FALSE,
  performed_by TEXT, interpreted_by TEXT, notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_allergen_panels_tenant ON allergen_panels(tenant_id);

CREATE TABLE IF NOT EXISTS immunotherapy_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER,
  therapy_type TEXT NOT NULL, allergen_extract TEXT, allergen_source TEXT,
  start_date TIMESTAMPTZ NOT NULL, current_phase TEXT DEFAULT 'build-up',
  build_up_start_date TIMESTAMPTZ, maintenance_start_date TIMESTAMPTZ,
  planned_duration_years INTEGER, current_dose_concentration TEXT, current_dose_volume_ml DOUBLE PRECISION,
  injection_interval_weeks INTEGER, total_sessions_completed INTEGER DEFAULT 0,
  last_session_date TIMESTAMPTZ, next_session_date TIMESTAMPTZ,
  observation_min_post INTEGER DEFAULT 30,
  systemic_reactions_count INTEGER DEFAULT 0, local_reactions_count INTEGER DEFAULT 0,
  symptom_score_pre DOUBLE PRECISION, symptom_score_current DOUBLE PRECISION,
  rescue_medication_reduced TEXT, prescribing_doctor TEXT, emergency_kit_available BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_immunotherapy_tenant ON immunotherapy_plans(tenant_id);

CREATE TABLE IF NOT EXISTS urodynamic_studies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  study_date TIMESTAMPTZ NOT NULL, study_type TEXT DEFAULT 'comprehensive',
  referring_doctor TEXT, clinical_indication TEXT,
  qmax DOUBLE PRECISION, qavg DOUBLE PRECISION, voided_volume_ml DOUBLE PRECISION,
  flow_time_sec DOUBLE PRECISION, flow_pattern TEXT, post_void_residual_ml DOUBLE PRECISION,
  first_sensation_ml DOUBLE PRECISION, normal_desire_ml DOUBLE PRECISION, strong_desire_ml DOUBLE PRECISION,
  max_cystometric_capacity_ml DOUBLE PRECISION, compliance_ml_cmh2o DOUBLE PRECISION,
  detrusor_overactivity BOOLEAN DEFAULT FALSE, detrusor_pressure_at_qmax DOUBLE PRECISION,
  bladder_outlet_obstruction TEXT, booi_index DOUBLE PRECISION,
  emg_performed BOOLEAN DEFAULT FALSE, emg_findings TEXT,
  diagnosis TEXT, findings TEXT, performed_by TEXT, interpreted_by TEXT,
  notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_urodynamic_tenant ON urodynamic_studies(tenant_id);

CREATE TABLE IF NOT EXISTS wmda_searches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER,
  diagnosis TEXT, urgency TEXT, hla_typing TEXT,
  hla_a TEXT, hla_b TEXT, hla_c TEXT, hla_drb1 TEXT, hla_dqb1 TEXT,
  registry_searched TEXT, registry_name TEXT, search_date TIMESTAMPTZ NOT NULL,
  matches_found INTEGER, best_match_score TEXT,
  donor_id TEXT, donor_registry_id TEXT, donor_age INTEGER, donor_gender TEXT, donor_hla_match TEXT,
  workup_requested BOOLEAN DEFAULT FALSE, workup_date TIMESTAMPTZ,
  collection_date TIMESTAMPTZ, collection_type TEXT, transplant_date TIMESTAMPTZ,
  coordinator_name TEXT, transplant_center TEXT, search_status TEXT DEFAULT 'searching',
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_wmda_tenant ON wmda_searches(tenant_id);

CREATE TABLE IF NOT EXISTS cdsco_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, report_type TEXT NOT NULL, report_title TEXT,
  device_name TEXT, device_class TEXT, manufacturer_name TEXT, manufacturer_country TEXT,
  license_number TEXT, license_expiry TIMESTAMPTZ, sugam_application_id TEXT,
  adverse_event_date TIMESTAMPTZ, adverse_event_description TEXT, patient_impact TEXT,
  severity_level TEXT, corrective_action TEXT,
  reported_to_manufacturer BOOLEAN DEFAULT FALSE, reported_to_cdsco BOOLEAN DEFAULT FALSE,
  cdsco_report_date TIMESTAMPTZ,
  kit_name TEXT, kit_lot_number TEXT, kit_expiry TIMESTAMPTZ,
  sensitivity_pct DOUBLE PRECISION, specificity_pct DOUBLE PRECISION, accuracy_pct DOUBLE PRECISION,
  samples_tested_count INTEGER, validation_result TEXT,
  pms_reporting_period TEXT, complaints_received INTEGER, field_safety_actions TEXT,
  notes TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_cdsco_reports_tenant ON cdsco_reports(tenant_id);
