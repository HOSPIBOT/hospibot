-- ============================================
-- Analyzer Interface (HL7/ASTM) Migration
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS analyzer_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, name TEXT NOT NULL, manufacturer TEXT, analyzer_model TEXT,
  serial_number TEXT, department TEXT, protocol TEXT DEFAULT 'hl7',
  hl7_version TEXT, connection_type TEXT DEFAULT 'tcp', host TEXT, port INTEGER,
  sending_application TEXT, is_active BOOLEAN DEFAULT TRUE,
  test_mappings JSONB, notes TEXT, last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_analyzer_configs_tenant ON analyzer_configs(tenant_id);

CREATE TABLE IF NOT EXISTS analyzer_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, protocol TEXT NOT NULL, direction TEXT DEFAULT 'inbound',
  message_type TEXT, trigger_event TEXT, sending_application TEXT,
  message_control_id TEXT, raw_message TEXT NOT NULL,
  patient_id TEXT, patient_name TEXT, accession_number TEXT,
  result_count INTEGER DEFAULT 0, matched_count INTEGER DEFAULT 0, unmatched_count INTEGER DEFAULT 0,
  parse_errors TEXT, processed_status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analyzer_msgs_tenant ON analyzer_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_msgs_status ON analyzer_messages(tenant_id, processed_status);

CREATE TABLE IF NOT EXISTS analyzer_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, analyzer_message_id TEXT NOT NULL,
  observation_id TEXT, observation_name TEXT, value TEXT, numeric_value DOUBLE PRECISION,
  units TEXT, reference_range TEXT, abnormal_flag TEXT, result_status TEXT,
  is_critical BOOLEAN DEFAULT FALSE, analyzer_name TEXT, matched_test_id TEXT,
  approved_by TEXT, approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analyzer_results_tenant ON analyzer_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_results_msg ON analyzer_results(tenant_id, analyzer_message_id);
