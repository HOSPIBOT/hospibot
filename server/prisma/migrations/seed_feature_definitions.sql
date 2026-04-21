-- Feature Definitions — master list of all features in the system
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure table exists (should be created by Prisma)
CREATE TABLE IF NOT EXISTS feature_definitions (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'operations',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_definitions (id, key, name, description, category) VALUES
-- Core Workflow
(gen_random_uuid()::TEXT, 'patient-registration', 'Patient Registration & Search', 'Patient demographics, search, history', 'core'),
(gen_random_uuid()::TEXT, 'sample-barcode', 'Sample Barcode Tracking', 'Barcode generation, scanning, tracking', 'core'),
(gen_random_uuid()::TEXT, 'test-catalog', 'Test Catalog Management', 'Test master, pricing, profiles', 'core'),
(gen_random_uuid()::TEXT, 'result-entry', 'Result Entry & Approval', 'Data entry, validation, approval workflow', 'core'),
(gen_random_uuid()::TEXT, 'pdf-reports', 'PDF Report Generation', 'Auto-generated PDF with letterhead', 'core'),
(gen_random_uuid()::TEXT, 'basic-dashboard', 'Basic Analytics Dashboard', 'Daily summary, KPIs', 'core'),
(gen_random_uuid()::TEXT, 'advanced-dashboard', 'Advanced KPI Dashboard', 'Trends, comparisons, drill-down', 'core'),
(gen_random_uuid()::TEXT, 'multi-branch-dashboard', 'Multi-Branch Dashboard', 'Cross-branch analytics', 'core'),
(gen_random_uuid()::TEXT, 'critical-values', 'Critical Value Alerts', 'Auto-alert on critical results', 'core'),
(gen_random_uuid()::TEXT, 'auto-validation', 'Auto-Validation Rules', 'Rule-based result validation', 'core'),

-- Billing
(gen_random_uuid()::TEXT, 'gst-invoicing', 'GST Invoicing', 'GSTIN, HSN codes, e-invoice', 'billing'),
(gen_random_uuid()::TEXT, 'walkin-billing', 'Walk-in Cash Billing', 'Counter billing, receipt', 'billing'),
(gen_random_uuid()::TEXT, 'razorpay-links', 'Razorpay Payment Links', 'Online payment collection', 'billing'),
(gen_random_uuid()::TEXT, 'tpa-billing', 'TPA / Insurance Billing', 'Pre-auth, claims, settlement', 'billing'),
(gen_random_uuid()::TEXT, 'tally-export', 'Tally Accounting Export', 'Tally XML/JSON export', 'billing'),
(gen_random_uuid()::TEXT, 'franchise-billing', 'Revenue Sharing & Franchise Billing', 'B2B revenue split', 'billing'),

-- Communication
(gen_random_uuid()::TEXT, 'wa-report-delivery', 'WhatsApp Report Delivery', 'PDF via WhatsApp', 'communication'),
(gen_random_uuid()::TEXT, 'appointment-reminders', 'Appointment Reminders', 'SMS/WA reminders', 'communication'),
(gen_random_uuid()::TEXT, 'patient-chatbot', 'Patient Self-Service Chatbot', 'WhatsApp bot for patients', 'communication'),
(gen_random_uuid()::TEXT, 'doctor-referral-alerts', 'Doctor Referral Notifications', 'Alert referring doctors', 'communication'),

-- Quality & Compliance
(gen_random_uuid()::TEXT, 'daily-mis', 'Daily MIS Summary', 'Daily operational summary', 'compliance'),
(gen_random_uuid()::TEXT, 'revenue-reports', 'Revenue & TAT Reports', 'Financial + turnaround reports', 'compliance'),
(gen_random_uuid()::TEXT, 'qc-westgard', 'QC Module (Westgard / LJ)', 'Internal QC with Westgard rules', 'compliance'),
(gen_random_uuid()::TEXT, 'nabl-docs', 'NABL Document Suite', 'NABL 112A accreditation docs', 'compliance'),
(gen_random_uuid()::TEXT, 'eqas-tracking', 'EQAS External QC', 'External quality assessment', 'compliance'),
(gen_random_uuid()::TEXT, 'bmw-waste-log', 'BMW Daily Waste Log', 'Biomedical waste management', 'compliance'),
(gen_random_uuid()::TEXT, 'regulatory-panel', 'Regulatory Guidance Panel', 'In-app regulatory guidance', 'compliance'),
(gen_random_uuid()::TEXT, 'advanced-analytics', 'Advanced Trend Analytics', 'Trend analysis, forecasting', 'compliance'),
(gen_random_uuid()::TEXT, 'gov-reporting', 'Government Reporting (DGHS/ICMR)', 'Statutory report submission', 'compliance'),

-- Compliance Hard-blocks
(gen_random_uuid()::TEXT, 'pndt-form-f', 'PC-PNDT Form F (USG)', 'Mandatory Form F for ultrasound', 'regulatory'),
(gen_random_uuid()::TEXT, 'aerb-dose-log', 'AERB Radiation Dose Log', 'Mandatory radiation dose tracking', 'regulatory'),
(gen_random_uuid()::TEXT, 'female-radiographer', 'Female Radiographer Enforcement', 'Mammography operator requirement', 'regulatory'),
(gen_random_uuid()::TEXT, 'naco-tti', 'NACO TTI Screening', 'Blood bank TTI compliance', 'regulatory'),
(gen_random_uuid()::TEXT, 'biosafety-declaration', 'Biosafety Level Declaration', 'BSL declaration for molecular labs', 'regulatory'),
(gen_random_uuid()::TEXT, 'art-act-consent', 'ART Act Consent & Witness', 'IVF procedure compliance', 'regulatory'),
(gen_random_uuid()::TEXT, 'chain-of-custody', 'Chain of Custody Management', 'Forensic evidence chain', 'regulatory'),

-- Integrations
(gen_random_uuid()::TEXT, 'hl7-astm', 'HL7/ASTM Analyzer Interface', 'Analyzer auto-result capture', 'integration'),
(gen_random_uuid()::TEXT, 'home-collection', 'Home Collection Module', 'Phlebotomist dispatch, GPS', 'integration'),
(gen_random_uuid()::TEXT, 'doctor-crm', 'Doctor CRM & Referral Tracking', 'Referring doctor management', 'integration'),
(gen_random_uuid()::TEXT, 'hrms', 'HRMS & Staff Management', 'Staff scheduling, attendance', 'integration'),
(gen_random_uuid()::TEXT, 'pacs-ris', 'PACS/RIS Integration', 'DICOM storage & retrieval', 'integration'),
(gen_random_uuid()::TEXT, 'tele-radiology', 'Tele-Radiology Reporting', 'Remote reading service', 'integration'),
(gen_random_uuid()::TEXT, 'api-marketplace', 'API Marketplace & SSO', 'Third-party integrations', 'integration'),

-- Support Tiers
(gen_random_uuid()::TEXT, 'email-support-48h', 'Email Support (48hr SLA)', 'Basic email support', 'support'),
(gen_random_uuid()::TEXT, 'chat-support-24h', 'Email + Chat Support (24hr)', 'Enhanced support', 'support'),
(gen_random_uuid()::TEXT, 'priority-support-4h', 'Priority Support (4hr SLA)', 'Priority ticket handling', 'support'),
(gen_random_uuid()::TEXT, 'priority-support-1h', 'Priority Support (1hr SLA)', 'Urgent support', 'support'),
(gen_random_uuid()::TEXT, 'dedicated-am', 'Dedicated Account Manager', 'Named account manager', 'support'),

-- Subtype-specific
(gen_random_uuid()::TEXT, 'dicom-viewer', 'DICOM Viewer Integration', 'DICOM image viewing', 'imaging'),
(gen_random_uuid()::TEXT, 'scan-scheduling', 'Scan/Equipment Scheduling', 'Modality slot management', 'imaging'),
(gen_random_uuid()::TEXT, 'reading-worklist', 'Reading Worklist', 'Pending report queue', 'imaging'),
(gen_random_uuid()::TEXT, 'bi-rads-reporting', 'BI-RADS Structured Reporting', 'Mammography scoring', 'imaging'),
(gen_random_uuid()::TEXT, 'culture-tracking', 'Culture Inoculation Tracking', 'Microbiology workflow', 'pathology'),
(gen_random_uuid()::TEXT, 'antibiogram', 'Antibiogram Reporting', 'Sensitivity pattern reporting', 'pathology'),
(gen_random_uuid()::TEXT, 'genetic-counseling', 'Genetic Counseling Workflow', 'Pre/post-test counseling', 'pathology'),
(gen_random_uuid()::TEXT, 'variant-classification', 'ACMG Variant Classification', 'Genetic variant reporting', 'pathology'),
(gen_random_uuid()::TEXT, 'ivf-cycle-tracking', 'IVF Cycle Tracking', 'Cycle management + embryology', 'specialty'),
(gen_random_uuid()::TEXT, 'hla-typing', 'HLA Typing & Registry', 'Bone marrow donor matching', 'specialty'),
(gen_random_uuid()::TEXT, 'forensic-chain', 'Forensic Chain of Custody', 'Evidence tracking', 'specialty'),
(gen_random_uuid()::TEXT, 'package-builder', 'Health Package Builder', 'Multi-test bundles', 'packages'),
(gen_random_uuid()::TEXT, 'employer-portal', 'Employer/Corporate Portal', 'B2B wellness dashboard', 'packages'),
(gen_random_uuid()::TEXT, 'hub-spoke', 'Hub-Spoke Sample Routing', 'Reference lab routing', 'hub'),
(gen_random_uuid()::TEXT, 'franchise-mgmt', 'Franchise Center Management', 'Network management', 'hub'),
(gen_random_uuid()::TEXT, 'kit-logistics', 'DTC Kit Logistics', 'Consumer kit dispatch/receive', 'hub')

ON CONFLICT (key) DO NOTHING;
