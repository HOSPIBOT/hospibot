-- ============================================
-- 12 New Diagnostic Subtypes Migration
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS histopathology_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, patient_age INTEGER, specimen_type TEXT, specimen_source TEXT,
  clinical_history TEXT, gross_description TEXT, microscopic_findings TEXT, diagnosis TEXT, icd_code TEXT,
  ihc_panel TEXT, ihc_results JSONB, frozen_section BOOLEAN DEFAULT FALSE, frozen_section_result TEXT,
  turnaround_hours INTEGER, block_count INTEGER, slide_count INTEGER, reporting_pathologist TEXT,
  cap_synoptic BOOLEAN DEFAULT FALSE, notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_histopath_tenant ON histopathology_cases(tenant_id);

CREATE TABLE IF NOT EXISTS blood_bank_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, entry_type TEXT NOT NULL, donor_name TEXT, donor_age INTEGER, donor_gender TEXT,
  donor_blood_group TEXT, donor_hb DOUBLE PRECISION, donation_date TIMESTAMPTZ,
  bag_number TEXT, component_type TEXT, volume_ml INTEGER, expiry_date TIMESTAMPTZ,
  screening_hiv TEXT, screening_hbsag TEXT, screening_hcv TEXT, screening_syphilis TEXT, screening_malaria TEXT,
  cross_match_patient TEXT, cross_match_result TEXT, issued_to TEXT, issue_date TIMESTAMPTZ,
  transfusion_reaction BOOLEAN DEFAULT FALSE, naco_reported BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_blood_bank_tenant ON blood_bank_entries(tenant_id);

CREATE TABLE IF NOT EXISTS nuclear_medicine_studies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, study_type TEXT NOT NULL,
  isotope TEXT, half_life_hours DOUBLE PRECISION, administered_activity_mbq DOUBLE PRECISION,
  study_date TIMESTAMPTZ, scan_protocol TEXT, organ_target TEXT,
  therapy_dose BOOLEAN DEFAULT FALSE, isolation_required BOOLEAN DEFAULT FALSE, isolation_days INTEGER,
  dosimetry_done BOOLEAN DEFAULT FALSE, reporting_physician TEXT, aerb_dose_logged BOOLEAN DEFAULT FALSE,
  findings TEXT, notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_nuclear_med_tenant ON nuclear_medicine_studies(tenant_id);

CREATE TABLE IF NOT EXISTS dental_scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, scan_type TEXT NOT NULL,
  scan_date TIMESTAMPTZ, referring_dentist TEXT, clinical_indication TEXT,
  jaw_section TEXT, field_of_view TEXT, kvp DOUBLE PRECISION, m_a DOUBLE PRECISION, exposure_time_sec DOUBLE PRECISION,
  pregnancy_screened BOOLEAN DEFAULT FALSE, lead_apron_used BOOLEAN DEFAULT FALSE, thyroid_shield_used BOOLEAN DEFAULT FALSE,
  findings TEXT, reported_by TEXT, notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_dental_scans_tenant ON dental_scans(tenant_id);

CREATE TABLE IF NOT EXISTS ophthalmic_tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, test_type TEXT NOT NULL,
  eye TEXT, test_date TIMESTAMPTZ, visual_acuity_od TEXT, visual_acuity_os TEXT,
  iop_od DOUBLE PRECISION, iop_os DOUBLE PRECISION,
  oct_rnfl_avg_od DOUBLE PRECISION, oct_rnfl_avg_os DOUBLE PRECISION,
  vf_md_od DOUBLE PRECISION, vf_md_os DOUBLE PRECISION,
  dr_grade_od TEXT, dr_grade_os TEXT, signal_strength INTEGER,
  referring_doctor TEXT, findings TEXT, notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_ophthalmic_tenant ON ophthalmic_tests(tenant_id);

CREATE TABLE IF NOT EXISTS audiology_tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, test_type TEXT NOT NULL,
  test_date TIMESTAMPTZ, patient_age INTEGER,
  pta_right_db DOUBLE PRECISION, pta_left_db DOUBLE PRECISION,
  hearing_loss_type TEXT, hearing_loss_grade TEXT,
  tympanogram_right TEXT, tympanogram_left TEXT, oae_result TEXT, bera_threshold DOUBLE PRECISION,
  hearing_aid_recommended BOOLEAN DEFAULT FALSE, hearing_aid_model TEXT,
  referring_doctor TEXT, notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_audiology_tenant ON audiology_tests(tenant_id);

CREATE TABLE IF NOT EXISTS urodynamics_studies_2 (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, study_type TEXT NOT NULL,
  study_date TIMESTAMPTZ, patient_age INTEGER, patient_gender TEXT, clinical_indication TEXT,
  qmax DOUBLE PRECISION, qavg DOUBLE PRECISION, voided_volume_ml DOUBLE PRECISION, pvr_ml DOUBLE PRECISION,
  max_capacity_ml DOUBLE PRECISION, compliance_ml_cmh2o DOUBLE PRECISION,
  detrusor_overactivity BOOLEAN DEFAULT FALSE, booi_index DOUBLE PRECISION,
  diagnosis TEXT, performed_by TEXT, interpreted_by TEXT,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_urodynamics2_tenant ON urodynamics_studies_2(tenant_id);

CREATE TABLE IF NOT EXISTS endoscopy_procedures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, procedure_type TEXT NOT NULL,
  procedure_date TIMESTAMPTZ, indication TEXT, sedation_type TEXT, sedation_dose TEXT,
  endoscopist TEXT, assistant TEXT, findings TEXT,
  biopsy_taken BOOLEAN DEFAULT FALSE, biopsy_site TEXT, biopsy_specimen_id TEXT,
  boston_bowel_prep_score INTEGER, complication TEXT, scope_id TEXT,
  scope_reprocessed BOOLEAN DEFAULT FALSE, images JSONB,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_endoscopy_tenant ON endoscopy_procedures(tenant_id);

CREATE TABLE IF NOT EXISTS ivf_lab_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, entry_type TEXT NOT NULL,
  cycle_id TEXT, partner_name TEXT,
  semen_count DOUBLE PRECISION, semen_motility DOUBLE PRECISION, semen_morphology DOUBLE PRECISION,
  oocytes_retrieved INTEGER, mii_oocytes INTEGER, fertilization_method TEXT,
  embryos_formed INTEGER, day_of_transfer INTEGER, embryo_grade TEXT,
  embryos_transferred INTEGER, embryos_frozen INTEGER,
  cryo_tank_id TEXT, cryo_position TEXT, pgt_result TEXT,
  witness_verified BOOLEAN DEFAULT FALSE, art_act_compliant BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_ivf_lab_tenant ON ivf_lab_entries(tenant_id);

CREATE TABLE IF NOT EXISTS hla_donor_searches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_name TEXT NOT NULL, entry_type TEXT NOT NULL,
  hla_a TEXT, hla_b TEXT, hla_c TEXT, hla_drb1 TEXT, hla_dqb1 TEXT,
  typing_method TEXT, typing_resolution TEXT, registry_name TEXT, donor_id TEXT,
  match_score TEXT, workup_status TEXT,
  cord_blood_unit_id TEXT, cd34_count DOUBLE PRECISION, cryo_tank_id TEXT, viability_pct DOUBLE PRECISION,
  transplant_date TIMESTAMPTZ,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_hla_donor_tenant ON hla_donor_searches(tenant_id);

CREATE TABLE IF NOT EXISTS forensic_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, subject_name TEXT NOT NULL, case_type TEXT NOT NULL,
  case_number TEXT, collection_date TIMESTAMPTZ, collector_name TEXT,
  chain_of_custody_id TEXT, specimen_type TEXT, seal_intact BOOLEAN DEFAULT TRUE,
  screen_method TEXT, screen_result TEXT, confirm_method TEXT, confirm_result TEXT,
  substances_detected JSONB, cutoff_standard TEXT,
  mro_reviewed BOOLEAN DEFAULT FALSE, mro_decision TEXT,
  court_admissible BOOLEAN DEFAULT FALSE, reported_by TEXT,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_forensic_tenant ON forensic_cases(tenant_id);

CREATE TABLE IF NOT EXISTS genomics_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, consumer_name TEXT NOT NULL, consumer_phone TEXT NOT NULL,
  consumer_email TEXT, order_date TIMESTAMPTZ,
  kit_id TEXT, kit_dispatch_date TIMESTAMPTZ, kit_received_date TIMESTAMPTZ,
  test_panel TEXT, genotyping_platform TEXT, variants_analyzed INTEGER,
  risk_scores JSONB, ancestry_results JSONB, pharmacogenomics JSONB,
  report_generated_date TIMESTAMPTZ, report_delivered_via TEXT,
  counseling_booked BOOLEAN DEFAULT FALSE, consent_given BOOLEAN DEFAULT FALSE,
  data_processing_consent BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_genomics_tenant ON genomics_orders(tenant_id);
