-- ============================================================================
-- HospiBot Diagnostic Portal — Complete Schema Migration
-- Blueprint v2.1 — All 25 new tables + LabOrder extensions
-- Run: npx prisma migrate dev --name diagnostic_portal_complete
-- ============================================================================

-- ── New Enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SampleStatus" AS ENUM ('REGISTERED','COLLECTED','DISPATCHED','RECEIVED','IN_PROGRESS','RESULTED','VALIDATED','RELEASED','REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ResultFlag" AS ENUM ('NORMAL','LOW','HIGH','CRITICAL_LOW','CRITICAL_HIGH','TEXT','ABNORMAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryChannel" AS ENUM ('WHATSAPP','SMS','EMAIL','DOWNLOAD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletType" AS ENUM ('SUBSCRIPTION','WHATSAPP','SMS','STORAGE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTxType" AS ENUM ('CREDIT_TOPUP','CREDIT_PLAN_ALLOCATION','DEBIT_USAGE','DEBIT_RENEWAL','DEBIT_ADJUSTMENT','REFUND');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Extend LabOrderStatus enum ────────────────────────────────────────────────

ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'RECEIVED_AT_LAB';
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'RESULTED';
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'VALIDATED';
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- ── Extend lab_orders table ───────────────────────────────────────────────────

ALTER TABLE "lab_orders"
  ADD COLUMN IF NOT EXISTS "branch_id"                TEXT,
  ADD COLUMN IF NOT EXISTS "collection_mode"          TEXT NOT NULL DEFAULT 'WALKIN',
  ADD COLUMN IF NOT EXISTS "referring_doctor_crm_id"  TEXT,
  ADD COLUMN IF NOT EXISTS "corporate_client_id"      TEXT,
  ADD COLUMN IF NOT EXISTS "clinical_info"            TEXT,
  ADD COLUMN IF NOT EXISTS "is_stat"                  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_after_hours"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "version"                  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "stat_premium"             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_amount"             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paid_amount"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dispatched_at"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "received_at_lab_at"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "released_at"              TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "wa_sent"                  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "remarks"                  TEXT;

-- ── Order Items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"            TEXT NOT NULL,
  "tenant_id"     TEXT NOT NULL,
  "lab_order_id"  TEXT NOT NULL,
  "test_id"       TEXT,
  "test_code"     TEXT NOT NULL,
  "test_name"     TEXT NOT NULL,
  "department"    TEXT,
  "status"        "SampleStatus" NOT NULL DEFAULT 'REGISTERED',
  "is_outsourced" BOOLEAN NOT NULL DEFAULT false,
  "outsourced_to" TEXT,
  "is_stat"       BOOLEAN NOT NULL DEFAULT false,
  "tat_deadline"  TIMESTAMP(3),
  "price"         INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "order_items_lab_order_id_idx" ON "order_items"("lab_order_id");
CREATE INDEX IF NOT EXISTS "order_items_tenant_status_idx" ON "order_items"("tenant_id", "status");

-- ── Samples ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "samples" (
  "id"                    TEXT NOT NULL,
  "tenant_id"             TEXT NOT NULL,
  "lab_order_id"          TEXT NOT NULL,
  "barcode"               TEXT NOT NULL,
  "tube_type"             TEXT,
  "container_type"        TEXT,
  "collected_at"          TIMESTAMP(3),
  "collected_by"          TEXT,
  "status"                "SampleStatus" NOT NULL DEFAULT 'REGISTERED',
  "rejection_reason"      TEXT,
  "cold_chain_required"   BOOLEAN NOT NULL DEFAULT false,
  "storage_location"      TEXT,
  "retain_until"          TIMESTAMP(3),
  "disposed_at"           TIMESTAMP(3),
  "photo_url"             TEXT,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "samples_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "samples_barcode_key" UNIQUE ("barcode"),
  CONSTRAINT "samples_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "samples_lab_order_id_idx" ON "samples"("lab_order_id");
CREATE INDEX IF NOT EXISTS "samples_tenant_status_idx"  ON "samples"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "sample_status_logs" (
  "id"           TEXT NOT NULL,
  "sample_id"    TEXT NOT NULL,
  "from_status"  TEXT,
  "to_status"    TEXT NOT NULL,
  "user_id"      TEXT,
  "notes"        TEXT,
  "location"     TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sample_status_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ssl_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "sample_status_logs_sample_id_idx" ON "sample_status_logs"("sample_id");

-- ── Reference Ranges ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "reference_ranges" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "test_code"       TEXT NOT NULL,
  "age_min_years"   INTEGER,
  "age_max_years"   INTEGER,
  "gender"          TEXT,
  "lower_normal"    DOUBLE PRECISION,
  "upper_normal"    DOUBLE PRECISION,
  "lower_critical"  DOUBLE PRECISION,
  "upper_critical"  DOUBLE PRECISION,
  "unit"            TEXT,
  "interpretation"  TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reference_ranges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reference_ranges_tenant_code_idx" ON "reference_ranges"("tenant_id", "test_code");

-- ── Result Entries ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "result_entries" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "order_item_id"   TEXT NOT NULL,
  "lab_order_id"    TEXT NOT NULL,
  "numeric_value"   DOUBLE PRECISION,
  "text_value"      TEXT,
  "unit"            TEXT,
  "flag"            "ResultFlag" NOT NULL DEFAULT 'NORMAL',
  "lower_normal"    DOUBLE PRECISION,
  "upper_normal"    DOUBLE PRECISION,
  "lower_critical"  DOUBLE PRECISION,
  "upper_critical"  DOUBLE PRECISION,
  "interpretation"  TEXT,
  "is_draft"        BOOLEAN NOT NULL DEFAULT true,
  "entered_by"      TEXT,
  "entered_at"      TIMESTAMP(3),
  "validated_by"    TEXT,
  "validated_at"    TIMESTAMP(3),
  "signed_by"       TEXT,
  "signed_at"       TIMESTAMP(3),
  "version"         INTEGER NOT NULL DEFAULT 1,
  "amend_reason"    TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "result_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "result_entries_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "result_entries_order_item_id_idx" ON "result_entries"("order_item_id");
CREATE INDEX IF NOT EXISTS "result_entries_lab_order_id_idx" ON "result_entries"("lab_order_id");

-- ── Critical Value Alerts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "critical_value_alerts" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "result_entry_id"   TEXT NOT NULL,
  "lab_order_id"      TEXT NOT NULL,
  "patient_id"        TEXT NOT NULL,
  "doctor_id"         TEXT,
  "test_code"         TEXT NOT NULL,
  "test_name"         TEXT NOT NULL,
  "critical_value"    TEXT NOT NULL,
  "threshold"         TEXT NOT NULL,
  "alert_sent_at"     TIMESTAMP(3),
  "acknowledged_by"   TEXT,
  "acknowledged_at"   TIMESTAMP(3),
  "escalated_to"      TEXT,
  "escalated_at"      TIMESTAMP(3),
  "sms_fallback_sent" BOOLEAN NOT NULL DEFAULT false,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "critical_value_alerts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cva_result_entry_id_fkey" FOREIGN KEY ("result_entry_id") REFERENCES "result_entries"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "critical_value_alerts_lab_order_id_idx" ON "critical_value_alerts"("lab_order_id");
CREATE INDEX IF NOT EXISTS "critical_value_alerts_tenant_id_idx" ON "critical_value_alerts"("tenant_id");

-- ── Diagnostic Reports ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "diagnostic_reports" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "lab_order_id"    TEXT NOT NULL,
  "pdf_url"         TEXT,
  "s3_key"          TEXT,
  "generated_at"    TIMESTAMP(3),
  "released_at"     TIMESTAMP(3),
  "signed_by"       TEXT,
  "signature_hash"  TEXT,
  "report_type"     TEXT NOT NULL DEFAULT 'lab',
  "version"         INTEGER NOT NULL DEFAULT 1,
  "is_amended"      BOOLEAN NOT NULL DEFAULT false,
  "amend_reason"    TEXT,
  "supersedes_id"   TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "diagnostic_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dr_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "diagnostic_reports_lab_order_id_idx" ON "diagnostic_reports"("lab_order_id");
CREATE INDEX IF NOT EXISTS "diagnostic_reports_tenant_id_idx"     ON "diagnostic_reports"("tenant_id");

CREATE TABLE IF NOT EXISTS "report_deliveries" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "report_id"        TEXT NOT NULL,
  "lab_order_id"     TEXT NOT NULL,
  "channel"          "DeliveryChannel" NOT NULL,
  "recipient_type"   TEXT NOT NULL,
  "recipient_mobile" TEXT,
  "delivered_at"     TIMESTAMP(3),
  "read_at"          TIMESTAMP(3),
  "status"           TEXT NOT NULL DEFAULT 'PENDING',
  "failure_reason"   TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rd_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "diagnostic_reports"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "report_deliveries_report_id_idx" ON "report_deliveries"("report_id");

-- ── Collection Agents & Runners ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "collection_agents" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "user_id"           TEXT NOT NULL,
  "zones"             JSONB NOT NULL DEFAULT '[]',
  "vehicle_type"      TEXT,
  "daily_capacity"    INTEGER NOT NULL DEFAULT 20,
  "earnings_rate"     INTEGER NOT NULL DEFAULT 5000,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "current_lat"       DOUBLE PRECISION,
  "current_lng"       DOUBLE PRECISION,
  "last_location_at"  TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collection_agents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "collection_agents_tenant_id_idx" ON "collection_agents"("tenant_id");

CREATE TABLE IF NOT EXISTS "runners" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "user_id"         TEXT NOT NULL,
  "vehicle_number"  TEXT,
  "is_active"       BOOLEAN NOT NULL DEFAULT true,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "runners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "runner_manifests" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "runner_id"       TEXT NOT NULL,
  "route_date"      TIMESTAMP(3) NOT NULL,
  "pickup_points"   JSONB NOT NULL DEFAULT '[]',
  "expected_count"  INTEGER NOT NULL DEFAULT 0,
  "actual_count"    INTEGER NOT NULL DEFAULT 0,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "departed_at"     TIMESTAMP(3),
  "arrived_at"      TIMESTAMP(3),
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "runner_manifests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rm_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "runners"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "runner_manifests_tenant_route_idx" ON "runner_manifests"("tenant_id", "route_date");

-- ── Doctor CRM ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "doctor_crm" (
  "id"                      TEXT NOT NULL,
  "tenant_id"               TEXT NOT NULL,
  "doctor_id"               TEXT,
  "name"                    TEXT NOT NULL,
  "specialty"               TEXT,
  "clinic_name"             TEXT,
  "clinic_address"          TEXT,
  "mobile"                  TEXT NOT NULL,
  "mci_number"              TEXT,
  "email"                   TEXT,
  "rate_card_id"            TEXT,
  "incentive_rate"          INTEGER,
  "referral_volume_mtd"     INTEGER NOT NULL DEFAULT 0,
  "last_contact_date"       TIMESTAMP(3),
  "notes"                   TEXT,
  "is_active"               BOOLEAN NOT NULL DEFAULT true,
  "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_crm_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "doctor_crm_tenant_mobile_idx" ON "doctor_crm"("tenant_id", "mobile");

-- ── Corporate Clients ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "corporate_clients" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "company_name"        TEXT NOT NULL,
  "gstin"               TEXT,
  "billing_address"     TEXT,
  "hr_contact_name"     TEXT,
  "hr_contact_mobile"   TEXT NOT NULL,
  "hr_contact_email"    TEXT,
  "rate_card_id"        TEXT,
  "credit_limit"        INTEGER NOT NULL DEFAULT 0,
  "credit_days"         INTEGER NOT NULL DEFAULT 30,
  "contract_expiry"     TIMESTAMP(3),
  "is_active"           BOOLEAN NOT NULL DEFAULT true,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "corporate_clients_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "corporate_clients_tenant_id_idx" ON "corporate_clients"("tenant_id");

-- ── Reagent Inventory ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "reagent_inventory" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "branch_id"         TEXT,
  "name"              TEXT NOT NULL,
  "manufacturer"      TEXT,
  "lot_number"        TEXT,
  "expiry_date"       TIMESTAMP(3),
  "storage_temp"      TEXT,
  "current_stock"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "min_stock_level"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit"              TEXT NOT NULL DEFAULT 'units',
  "linked_test_codes" JSONB NOT NULL DEFAULT '[]',
  "supplier"          TEXT,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reagent_inventory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reagent_inventory_tenant_id_idx"       ON "reagent_inventory"("tenant_id");
CREATE INDEX IF NOT EXISTS "reagent_inventory_tenant_expiry_idx"   ON "reagent_inventory"("tenant_id", "expiry_date");

CREATE TABLE IF NOT EXISTS "reagent_transactions" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "reagent_id"      TEXT NOT NULL,
  "tx_type"         TEXT NOT NULL,
  "quantity"        DOUBLE PRECISION NOT NULL,
  "balance_after"   DOUBLE PRECISION NOT NULL,
  "reference_type"  TEXT,
  "reference_id"    TEXT,
  "user_id"         TEXT,
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reagent_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reagent_transactions_reagent_id_idx" ON "reagent_transactions"("reagent_id");

-- ── Equipment Log ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "equipment_logs" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "branch_id"         TEXT,
  "equipment_name"    TEXT NOT NULL,
  "model"             TEXT,
  "serial_number"     TEXT,
  "department"        TEXT,
  "event_type"        TEXT NOT NULL,
  "event_date"        TIMESTAMP(3) NOT NULL,
  "resolved_at"       TIMESTAMP(3),
  "reported_by"       TEXT,
  "description"       TEXT,
  "downtime_hours"    DOUBLE PRECISION,
  "next_calibration"  TIMESTAMP(3),
  "certificate_url"   TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "equipment_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "equipment_logs_tenant_id_idx" ON "equipment_logs"("tenant_id");

-- ── QC Results ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "qc_results" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "branch_id"       TEXT,
  "test_code"       TEXT NOT NULL,
  "analyser_id"     TEXT,
  "lot_number"      TEXT,
  "control_level"   TEXT NOT NULL,
  "expected_value"  DOUBLE PRECISION NOT NULL,
  "actual_value"    DOUBLE PRECISION NOT NULL,
  "mean"            DOUBLE PRECISION,
  "sd"              DOUBLE PRECISION,
  "cv_percent"      DOUBLE PRECISION,
  "westgard_flags"  JSONB NOT NULL DEFAULT '[]',
  "is_pass"         BOOLEAN NOT NULL DEFAULT true,
  "run_date"        TIMESTAMP(3) NOT NULL,
  "technician_id"   TEXT,
  "capa_id"         TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qc_results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "qc_results_tenant_code_idx" ON "qc_results"("tenant_id", "test_code");
CREATE INDEX IF NOT EXISTS "qc_results_tenant_run_idx"  ON "qc_results"("tenant_id", "run_date");

-- ── Automation Rules ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "diagnostic_automation_rules" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "test_code"       TEXT,
  "trigger_event"   TEXT NOT NULL,
  "condition_json"  JSONB,
  "wait_days"       INTEGER NOT NULL DEFAULT 90,
  "template_code"   TEXT NOT NULL,
  "message_text"    TEXT,
  "is_active"       BOOLEAN NOT NULL DEFAULT true,
  "created_by"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "diagnostic_automation_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "diagnostic_automation_rules_tenant_id_idx" ON "diagnostic_automation_rules"("tenant_id");

CREATE TABLE IF NOT EXISTS "diagnostic_automation_executions" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "rule_id"             TEXT NOT NULL,
  "patient_id"          TEXT NOT NULL,
  "patient_mobile"      TEXT NOT NULL,
  "triggered_at"        TIMESTAMP(3) NOT NULL,
  "scheduled_for"       TIMESTAMP(3) NOT NULL,
  "sent_at"             TIMESTAMP(3),
  "response"            TEXT,
  "converted_order_id"  TEXT,
  "status"              TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "diagnostic_automation_executions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dae_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "diagnostic_automation_rules"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "dae_tenant_status_idx" ON "diagnostic_automation_executions"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "dae_scheduled_for_idx" ON "diagnostic_automation_executions"("scheduled_for");

-- ── Tenant Wallets ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_wallets" (
  "id"                          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"                   TEXT NOT NULL,
  "subscription_balance_paise"  INTEGER NOT NULL DEFAULT 0,
  "wa_credits"                  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sms_credits"                 INTEGER NOT NULL DEFAULT 0,
  "storage_gb_purchased"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "auto_recharge_wa_enabled"    BOOLEAN NOT NULL DEFAULT false,
  "auto_recharge_wa_threshold"  INTEGER NOT NULL DEFAULT 500,
  "auto_recharge_wa_pack_id"    TEXT,
  "auto_recharge_pm_id"         TEXT,
  "updated_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_wallets_tenant_id_key" UNIQUE ("tenant_id")
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"       TEXT NOT NULL,
  "wallet_id"       TEXT NOT NULL,
  "wallet_type"     "WalletType" NOT NULL,
  "tx_type"         "WalletTxType" NOT NULL,
  "amount"          DOUBLE PRECISION NOT NULL,
  "balance_before"  DOUBLE PRECISION NOT NULL,
  "balance_after"   DOUBLE PRECISION NOT NULL,
  "reference_type"  TEXT,
  "reference_id"    TEXT,
  "description"     TEXT NOT NULL,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wt_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "tenant_wallets"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "wallet_transactions_tenant_type_idx" ON "wallet_transactions"("tenant_id", "wallet_type");
CREATE INDEX IF NOT EXISTS "wallet_transactions_created_at_idx"  ON "wallet_transactions"("created_at");

CREATE TABLE IF NOT EXISTS "recharge_packs" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "pack_type"         "WalletType" NOT NULL,
  "name"              TEXT NOT NULL,
  "credits_or_units"  DOUBLE PRECISION NOT NULL,
  "price_incl_gst"    INTEGER NOT NULL,
  "price_excl_gst"    INTEGER NOT NULL,
  "gst_rate"          DOUBLE PRECISION NOT NULL DEFAULT 0.18,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "sort_order"        INTEGER NOT NULL DEFAULT 0,
  "plan_restriction"  JSONB,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recharge_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hospibot_invoices" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "invoice_number"    TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "invoice_type"      TEXT NOT NULL,
  "line_items"        JSONB NOT NULL,
  "subtotal_paise"    INTEGER NOT NULL,
  "gst_paise"         INTEGER NOT NULL,
  "total_paise"       INTEGER NOT NULL,
  "hospibot_gstin"    TEXT,
  "tenant_gstin"      TEXT,
  "irn"               TEXT,
  "paid_at"           TIMESTAMP(3),
  "payment_id"        TEXT,
  "pdf_url"           TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hospibot_invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hospibot_invoices_invoice_number_key" UNIQUE ("invoice_number")
);
CREATE INDEX IF NOT EXISTS "hospibot_invoices_tenant_id_idx" ON "hospibot_invoices"("tenant_id");

CREATE TABLE IF NOT EXISTS "razorpay_payments" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"           TEXT NOT NULL,
  "razorpay_order_id"   TEXT NOT NULL,
  "razorpay_payment_id" TEXT,
  "razorpay_signature"  TEXT,
  "amount_paise"        INTEGER NOT NULL,
  "currency"            TEXT NOT NULL DEFAULT 'INR',
  "pack_id"             TEXT,
  "wallet_type"         "WalletType",
  "status"              TEXT NOT NULL DEFAULT 'CREATED',
  "failure_reason"      TEXT,
  "payment_method"      TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "razorpay_payments_razorpay_order_id_key" UNIQUE ("razorpay_order_id")
);
CREATE INDEX IF NOT EXISTS "razorpay_payments_tenant_id_idx" ON "razorpay_payments"("tenant_id");

CREATE TABLE IF NOT EXISTS "saved_payment_methods" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"         TEXT NOT NULL,
  "method_type"       TEXT NOT NULL,
  "razorpay_token"    TEXT,
  "mandate_id"        TEXT,
  "display_name"      TEXT NOT NULL,
  "is_default"        BOOLEAN NOT NULL DEFAULT false,
  "expires_at"        TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "saved_payment_methods_tenant_id_idx" ON "saved_payment_methods"("tenant_id");

CREATE TABLE IF NOT EXISTS "message_usage_logs" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"           TEXT NOT NULL,
  "branch_id"           TEXT,
  "message_type"        TEXT NOT NULL,
  "template_code"       TEXT,
  "recipient_mobile"    TEXT NOT NULL,
  "direction"           TEXT NOT NULL DEFAULT 'OUTBOUND',
  "credits_charged"     DOUBLE PRECISION NOT NULL,
  "wa_delivery_status"  TEXT,
  "failure_reason"      TEXT,
  "sms_fallback_sent"   BOOLEAN NOT NULL DEFAULT false,
  "lab_order_id"        TEXT,
  "automation_rule_id"  TEXT,
  "sent_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_usage_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "message_usage_logs_tenant_type_idx"  ON "message_usage_logs"("tenant_id", "message_type");
CREATE INDEX IF NOT EXISTS "message_usage_logs_tenant_sent_idx"  ON "message_usage_logs"("tenant_id", "sent_at");
