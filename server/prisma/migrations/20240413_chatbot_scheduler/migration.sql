-- WhatsApp Templates
CREATE TABLE "whatsapp_templates" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT,
  "name"             TEXT NOT NULL,
  "display_name"     TEXT NOT NULL,
  "category"         TEXT NOT NULL,
  "language"         TEXT NOT NULL DEFAULT 'en',
  "status"           TEXT NOT NULL DEFAULT 'PENDING',
  "header_text"      TEXT,
  "body_text"        TEXT NOT NULL,
  "footer_text"      TEXT,
  "buttons"          JSONB NOT NULL DEFAULT '[]',
  "variables"        TEXT[] DEFAULT ARRAY[]::TEXT[],
  "meta_template_id" TEXT,
  "rejection_reason" TEXT,
  "usage_count"      INTEGER NOT NULL DEFAULT 0,
  "is_default"       BOOLEAN NOT NULL DEFAULT false,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_templates_name_tenant_id_key" ON "whatsapp_templates"("name","tenant_id");

-- Chatbot State
CREATE TABLE "chatbot_states" (
  "id"              TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "flow"            TEXT,
  "step"            TEXT,
  "data"            JSONB NOT NULL DEFAULT '{}',
  "expires_at"      TIMESTAMP(3) NOT NULL,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chatbot_states_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chatbot_states_conversation_id_key" ON "chatbot_states"("conversation_id");

-- Automation Jobs
CREATE TABLE "automation_jobs" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "rule_id"      TEXT NOT NULL,
  "patient_id"   TEXT NOT NULL,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "action"       JSONB NOT NULL,
  "attempts"     INTEGER NOT NULL DEFAULT 0,
  "last_error"   TEXT,
  "executed_at"  TIMESTAMP(3),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "automation_jobs_scheduled_at_status_idx" ON "automation_jobs"("scheduled_at","status");
CREATE INDEX "automation_jobs_tenant_id_patient_id_idx" ON "automation_jobs"("tenant_id","patient_id");
