-- ============================================
-- Fix 5 Old Features — DROP generic tables, recreate with proper fields
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

DROP TABLE IF EXISTS field_agents CASCADE;
DROP TABLE IF EXISTS route_plans CASCADE;
DROP TABLE IF EXISTS dicom_studies CASCADE;
DROP TABLE IF EXISTS radiologist_assignments CASCADE;
DROP TABLE IF EXISTS ob_growth_scans CASCADE;

CREATE TABLE field_agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, agent_name TEXT NOT NULL, agent_phone TEXT NOT NULL,
  agent_email TEXT, agent_id TEXT, dmlt_cert_no TEXT, dmlt_expiry TIMESTAMPTZ,
  designation TEXT, zone TEXT, city TEXT, pincodes_served TEXT,
  vehicle_type TEXT, vehicle_number TEXT, cold_box_assigned BOOLEAN DEFAULT FALSE,
  daily_capacity INTEGER, current_lat DOUBLE PRECISION, current_lng DOUBLE PRECISION,
  last_location_time TIMESTAMPTZ, samples_collected_today INTEGER DEFAULT 0,
  active_route_id TEXT, shift_start TEXT, shift_end TEXT, rating DOUBLE PRECISION,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX idx_field_agents_tenant ON field_agents(tenant_id);

CREATE TABLE route_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, route_name TEXT NOT NULL, route_date TIMESTAMPTZ NOT NULL,
  agent_id TEXT, agent_name TEXT, zone TEXT, start_location TEXT,
  total_stops INTEGER, completed_stops INTEGER DEFAULT 0,
  total_samples INTEGER, collected_samples INTEGER DEFAULT 0,
  stops JSONB, estimated_km DOUBLE PRECISION, actual_km DOUBLE PRECISION,
  estimated_time_min INTEGER, actual_time_min INTEGER,
  departure_time TIMESTAMPTZ, completion_time TIMESTAMPTZ,
  cold_chain_maintained BOOLEAN DEFAULT TRUE, handover_time TIMESTAMPTZ, handover_to TEXT,
  notes TEXT, status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX idx_route_plans_tenant ON route_plans(tenant_id);

CREATE TABLE dicom_studies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT,
  accession_number TEXT, study_instance_uid TEXT, study_date TIMESTAMPTZ,
  modality TEXT, study_description TEXT, body_part TEXT,
  series_count INTEGER, image_count INTEGER, storage_size TEXT,
  pacs_server_id TEXT, pacs_server_name TEXT, viewer_url TEXT,
  referring_doctor TEXT, performing_doctor TEXT, institution_name TEXT,
  report_status TEXT, reported_by TEXT, report_date TIMESTAMPTZ,
  critical_finding BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX idx_dicom_studies_tenant ON dicom_studies(tenant_id);

CREATE TABLE radiologist_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, radiologist_name TEXT NOT NULL, radiologist_id TEXT,
  mci_reg_no TEXT, specialization TEXT, modalities_handled TEXT,
  assigned_study_id TEXT, accession_number TEXT, patient_name TEXT,
  modality TEXT, priority TEXT, assigned_date TIMESTAMPTZ,
  read_start_time TIMESTAMPTZ, read_end_time TIMESTAMPTZ, tat_minutes INTEGER,
  report_status TEXT, critical_finding BOOLEAN DEFAULT FALSE,
  addendum TEXT, digital_signature BOOLEAN DEFAULT FALSE,
  workload_today INTEGER DEFAULT 0, daily_capacity INTEGER,
  remote_reading BOOLEAN DEFAULT FALSE, states_registered TEXT,
  notes TEXT, status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX idx_radiologist_assign_tenant ON radiologist_assignments(tenant_id);

CREATE TABLE ob_growth_scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, patient_id TEXT, patient_name TEXT NOT NULL, patient_age INTEGER,
  scan_date TIMESTAMPTZ NOT NULL, gestational_weeks INTEGER, gestational_days INTEGER,
  lmp_date TIMESTAMPTZ, edd_date TIMESTAMPTZ, scan_type TEXT, fetus_count INTEGER DEFAULT 1,
  bpd DOUBLE PRECISION, hc DOUBLE PRECISION, ac DOUBLE PRECISION, fl DOUBLE PRECISION,
  efw DOUBLE PRECISION, efw_percentile DOUBLE PRECISION, afi_cm DOUBLE PRECISION,
  placenta_position TEXT, placenta_grade TEXT, presentation TEXT,
  fetal_heart_rate INTEGER, cervical_length DOUBLE PRECISION,
  umbilical_artery_pi DOUBLE PRECISION, mca_pi DOUBLE PRECISION, cpr_ratio DOUBLE PRECISION,
  growth_restriction BOOLEAN DEFAULT FALSE, anomaly_detected BOOLEAN DEFAULT FALSE, anomaly_details TEXT,
  referring_doctor TEXT, sonologist TEXT, pndt_form_f_completed BOOLEAN DEFAULT FALSE,
  notes TEXT, status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX idx_ob_growth_scans_tenant ON ob_growth_scans(tenant_id);
