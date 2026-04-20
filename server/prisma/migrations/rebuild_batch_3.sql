-- ============================================
-- HospiBot Rebuild Batch 3 Migration
-- 5 tables: Molecular/Genetic features
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

-- 1. Batch Run (PCR/NGS — NABL 112A)
CREATE TABLE IF NOT EXISTS batch_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  batch_type TEXT NOT NULL,
  test_name TEXT, target_gene TEXT,
  instrument_id TEXT, instrument_name TEXT,
  plate_layout JSONB, well_count INTEGER, sample_count INTEGER, control_count INTEGER,
  qc_level1_result TEXT, qc_level1_value TEXT,
  qc_level2_result TEXT, qc_level2_value TEXT, qc_passed BOOLEAN,
  positive_control_ct DOUBLE PRECISION, negative_control_ct TEXT, internal_control_ct DOUBLE PRECISION,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), run_start_time TIMESTAMPTZ, run_end_time TIMESTAMPTZ,
  protocol_name TEXT, protocol_version TEXT,
  reagent_lot_number TEXT, reagent_expiry TIMESTAMPTZ, master_mix_lot TEXT,
  positive_count INTEGER, negative_count INTEGER, indeterminate_count INTEGER, invalid_count INTEGER,
  biosafety_level TEXT DEFAULT 'BSL-2', decontamination_done BOOLEAN DEFAULT FALSE,
  performed_by TEXT, verified_by TEXT,
  notes TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_batch_runs_tenant ON batch_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_runs_type ON batch_runs(tenant_id, batch_type);

-- 2. ICMR/NACO Report (NACO NACP)
CREATE TABLE IF NOT EXISTS icmr_naco_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  report_type TEXT NOT NULL, report_title TEXT,
  reporting_period TEXT NOT NULL, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ,
  facility_name TEXT, facility_code TEXT, district_code TEXT, state_code TEXT,
  submitted_to TEXT, sacs_name TEXT,
  total_tested INTEGER, total_positive INTEGER, positivity_rate DOUBLE PRECISION,
  males_tested INTEGER, females_tested INTEGER, transgender_tested INTEGER,
  anc_tested INTEGER, anc_positive INTEGER,
  tb_patients_tested INTEGER, tb_patients_positive INTEGER,
  viral_load_samples_sent INTEGER, viral_load_suppressed INTEGER,
  eqas_panel_id TEXT, eqas_result TEXT, eqas_concordance DOUBLE PRECISION,
  notifiable_disease TEXT, cases_reported INTEGER, amr_data JSONB,
  submitted_date TIMESTAMPTZ, acknowledged_date TIMESTAMPTZ, acknowledged_by TEXT,
  notes TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_icmr_naco_tenant ON icmr_naco_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icmr_naco_type ON icmr_naco_reports(tenant_id, report_type);

-- 3. Genetic Counseling (ACMG/NSGC)
CREATE TABLE IF NOT EXISTS genetic_counselings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER, patient_gender TEXT,
  session_type TEXT NOT NULL, session_date TIMESTAMPTZ NOT NULL, session_duration_min INTEGER,
  counselor_name TEXT, counselor_certification TEXT, counselor_reg_no TEXT,
  ordering_physician TEXT NOT NULL, referral_reason TEXT, clinical_indication TEXT, family_history TEXT,
  test_ordered TEXT, test_category TEXT, expected_tat_days INTEGER,
  sample_collected BOOLEAN DEFAULT FALSE, sample_type TEXT,
  informed_consent_signed BOOLEAN DEFAULT FALSE, consent_date TIMESTAMPTZ,
  incidental_findings_consent TEXT,
  risk_explained BOOLEAN DEFAULT FALSE, limitations_explained BOOLEAN DEFAULT FALSE,
  psychosocial_assessment TEXT,
  result_disclosed BOOLEAN DEFAULT FALSE, result_disclosure_date TIMESTAMPTZ,
  variant_classification TEXT, vus_found BOOLEAN DEFAULT FALSE, vus_explained BOOLEAN DEFAULT FALSE,
  actionable_findings TEXT, recommended_follow_up TEXT, family_cascade_testing TEXT,
  session_notes TEXT, notes TEXT, status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_genetic_counseling_tenant ON genetic_counselings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_genetic_counseling_type ON genetic_counselings(tenant_id, session_type);

-- 4. Pedigree Record (NHGRI Notation)
CREATE TABLE IF NOT EXISTS pedigree_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  patient_id TEXT, proband_name TEXT NOT NULL, proband_age INTEGER, proband_gender TEXT,
  condition TEXT, gene_of_interest TEXT, inheritance_pattern TEXT,
  generations INTEGER, total_members INTEGER, affected_members INTEGER,
  carrier_members INTEGER, deceased_members INTEGER,
  family_data JSONB, consanguinity BOOLEAN DEFAULT FALSE, ethnic_background TEXT,
  referral_reason TEXT, counselor_name TEXT, geneticist_name TEXT,
  risk_assessment TEXT, recommended_testing TEXT,
  notes TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_pedigree_records_tenant ON pedigree_records(tenant_id);

-- 5. Variant Record (ACMG/AMP 5-Tier)
CREATE TABLE IF NOT EXISTS variant_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL,
  patient_id TEXT, patient_name TEXT,
  gene TEXT NOT NULL, transcript TEXT, hgvs_c TEXT, hgvs_p TEXT,
  genomic_position TEXT, chromosome TEXT, variant_type TEXT, zygosity TEXT,
  allele_frequency DOUBLE PRECISION,
  acmg_class TEXT NOT NULL, criteria_applied TEXT, evidence_strength TEXT,
  clinvar_id TEXT, clinvar_significance TEXT, dbsnp_id TEXT,
  gnomad_freq DOUBLE PRECISION, cosmic_id TEXT,
  in_silico_prediction TEXT, revel_score DOUBLE PRECISION, cadd_score DOUBLE PRECISION,
  conservation_score DOUBLE PRECISION,
  disease TEXT, inheritance_mode TEXT, phenotype TEXT,
  detection_method TEXT, sequencing_platform TEXT, coverage DOUBLE PRECISION,
  classified_by TEXT, classification_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), reviewed_by TEXT,
  notes TEXT, status TEXT DEFAULT 'classified',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_variant_records_tenant ON variant_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_gene ON variant_records(tenant_id, gene);
CREATE INDEX IF NOT EXISTS idx_variant_records_acmg ON variant_records(tenant_id, acmg_class);

-- ============================================
-- DONE — 5 tables created
-- ============================================
