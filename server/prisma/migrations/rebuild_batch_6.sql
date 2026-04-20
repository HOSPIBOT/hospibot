-- ============================================
-- HospiBot Rebuild Batch 6 Migration
-- 5 tables: Radiation Safety + Dental/Ophthalmic
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

-- 1. BARC/AERB Report
CREATE TABLE IF NOT EXISTS barc_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, report_type TEXT NOT NULL, report_title TEXT,
  reporting_period TEXT, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ,
  aerb_license_no TEXT, aerb_license_expiry TIMESTAMPTZ, elora_registration_id TEXT, facility_category TEXT,
  rso_name TEXT, rso_cert_level TEXT, rso_cert_no TEXT, rso_cert_expiry TIMESTAMPTZ,
  equipment_type TEXT, equipment_make TEXT, equipment_model TEXT, equipment_serial_no TEXT,
  installation_date TIMESTAMPTZ, last_qa_date TIMESTAMPTZ, next_qa_due TIMESTAMPTZ, qa_agency TEXT, qa_result TEXT,
  total_workers_monitored INTEGER, workers_exceeding_6msv INTEGER, workers_exceeding_20msv INTEGER,
  max_dose_recorded_msv DOUBLE PRECISION, avg_dose_msv DOUBLE PRECISION, tld_badge_provider TEXT,
  excessive_exposure_reported BOOLEAN DEFAULT FALSE, exposure_worker_name TEXT,
  exposure_dose_msv DOUBLE PRECISION, exposure_date TIMESTAMPTZ,
  investigation_done BOOLEAN DEFAULT FALSE, investigation_findings TEXT, corrective_action TEXT,
  room_shielding_adequate TEXT, last_shielding_survey TIMESTAMPTZ,
  submitted_to_aerb BOOLEAN DEFAULT FALSE, submission_date TIMESTAMPTZ, aerb_acknowledgement TEXT,
  notes TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_barc_reports_tenant ON barc_reports(tenant_id);

-- 2. OPG/CBCT Scan
CREATE TABLE IF NOT EXISTS opg_cbct_scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  scan_type TEXT NOT NULL, scan_date TIMESTAMPTZ NOT NULL,
  referring_dentist TEXT, referring_specialty TEXT, clinical_indication TEXT,
  equipment_name TEXT, equipment_make TEXT, field_of_view TEXT, voxel_size TEXT,
  kvp INTEGER, m_a INTEGER, exposure_time DOUBLE PRECISION, dose_estimate_micro_sv DOUBLE PRECISION,
  region_scanned TEXT, teeth_involved TEXT, findings TEXT, pathology_detected TEXT,
  bone_quality TEXT, implant_site_assessment TEXT, nerve_canal_proximity TEXT,
  sinus_assessment TEXT, tmj_assessment TEXT,
  reported_by TEXT, reporter_qualification TEXT, report_date TIMESTAMPTZ,
  pregnancy_screen_done BOOLEAN DEFAULT FALSE, lead_apron_used BOOLEAN DEFAULT FALSE, thyroid_shield_used BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_opg_cbct_tenant ON opg_cbct_scans(tenant_id);

-- 3. OCT Scan
CREATE TABLE IF NOT EXISTS oct_scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  eye TEXT NOT NULL, scan_date TIMESTAMPTZ NOT NULL, scan_protocol TEXT,
  referring_doctor TEXT, clinical_indication TEXT, platform TEXT, device_model TEXT,
  signal_strength INTEGER, signal_adequate BOOLEAN,
  rnfl_avg DOUBLE PRECISION, rnfl_superior DOUBLE PRECISION, rnfl_inferior DOUBLE PRECISION,
  rnfl_nasal DOUBLE PRECISION, rnfl_temporal DOUBLE PRECISION, rnfl_classification TEXT,
  central_subfield_thickness DOUBLE PRECISION, macular_volume DOUBLE PRECISION, macular_thickness_map JSONB,
  gcc_avg DOUBLE PRECISION, gcipl_avg DOUBLE PRECISION,
  cup_disc_ratio DOUBLE PRECISION, disc_area DOUBLE PRECISION, rim_area DOUBLE PRECISION,
  findings TEXT, diagnosis TEXT,
  subretinal_fluid BOOLEAN DEFAULT FALSE, intraretinal_fluid BOOLEAN DEFAULT FALSE,
  pigment_epithelial_detachment BOOLEAN DEFAULT FALSE, epiretinal_membrane BOOLEAN DEFAULT FALSE,
  macula_edema BOOLEAN DEFAULT FALSE, progression_from_prior TEXT, interpreted_by TEXT,
  notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_oct_scans_tenant ON oct_scans(tenant_id);

-- 4. Perimetry Test
CREATE TABLE IF NOT EXISTS perimetry_tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, eye TEXT NOT NULL,
  test_date TIMESTAMPTZ NOT NULL, test_type TEXT DEFAULT 'humphrey', test_pattern TEXT DEFAULT '24-2',
  strategy TEXT, device_name TEXT, referring_doctor TEXT, clinical_indication TEXT,
  fixation_losses_pct DOUBLE PRECISION, false_positive_pct DOUBLE PRECISION, false_negative_pct DOUBLE PRECISION,
  test_reliable BOOLEAN, test_duration_min DOUBLE PRECISION,
  mean_deviation DOUBLE PRECISION, pattern_std_dev DOUBLE PRECISION, visual_field_index DOUBLE PRECISION,
  scotomas TEXT, glaucoma_hemifield_test TEXT,
  arcuate_defect BOOLEAN DEFAULT FALSE, nasal_step BOOLEAN DEFAULT FALSE,
  paracentral BOOLEAN DEFAULT FALSE, generalized_depression BOOLEAN DEFAULT FALSE,
  progression_from_prior TEXT, interpretation TEXT, interpreted_by TEXT,
  notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_perimetry_tenant ON perimetry_tests(tenant_id);

-- 5. Fundus Photo
CREATE TABLE IF NOT EXISTS fundus_photos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  eye TEXT NOT NULL, photo_date TIMESTAMPTZ NOT NULL, camera_type TEXT, mydriatic BOOLEAN DEFAULT FALSE,
  image_quality TEXT, number_of_fields INTEGER, referring_doctor TEXT, clinical_indication TEXT,
  diabetes_status TEXT, diabetes_duration_years INTEGER, last_hba1c DOUBLE PRECISION,
  dr_grade TEXT, dme_present BOOLEAN DEFAULT FALSE,
  microaneurysms BOOLEAN DEFAULT FALSE, hemorrhages BOOLEAN DEFAULT FALSE, hemorrhage_type TEXT,
  hard_exudates BOOLEAN DEFAULT FALSE, cotton_wool_spots BOOLEAN DEFAULT FALSE,
  venous_beading BOOLEAN DEFAULT FALSE, irma BOOLEAN DEFAULT FALSE,
  neovascularization BOOLEAN DEFAULT FALSE, nv_location TEXT,
  vitreous_hemorrhage BOOLEAN DEFAULT FALSE, tractional_detachment BOOLEAN DEFAULT FALSE,
  disc_edema BOOLEAN DEFAULT FALSE, disc_pallor BOOLEAN DEFAULT FALSE,
  cup_disc_ratio DOUBLE PRECISION, macular_edema BOOLEAN DEFAULT FALSE, foveal_reflex TEXT,
  other_findings TEXT, referral_recommended BOOLEAN DEFAULT FALSE, referral_to TEXT,
  treatment_recommended TEXT, graded_by TEXT, screening_program TEXT,
  notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_fundus_photos_tenant ON fundus_photos(tenant_id);
