-- Universal Health Records (one per mobile number, no tenant_id)
CREATE TABLE "universal_health_records" (
  "id"                  TEXT NOT NULL,
  "mobile_number"       TEXT NOT NULL,
  "hospibot_health_id"  TEXT NOT NULL,
  "abha_id"             TEXT,
  "first_name"          TEXT NOT NULL,
  "last_name"           TEXT,
  "date_of_birth"       TIMESTAMP(3),
  "gender"              TEXT,
  "blood_group"         TEXT,
  "allergies"           TEXT[] DEFAULT ARRAY[]::TEXT[],
  "chronic_conditions"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "current_medications" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "emergency_contact"   JSONB NOT NULL DEFAULT '{}',
  "language"            TEXT NOT NULL DEFAULT 'en',
  "is_verified"         BOOLEAN NOT NULL DEFAULT false,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "universal_health_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uhr_mobile_number_key" ON "universal_health_records"("mobile_number");
CREATE UNIQUE INDEX "uhr_hospibot_health_id_key" ON "universal_health_records"("hospibot_health_id");

-- Health Records (individual records per visit/lab/etc)
CREATE TABLE "health_records" (
  "id"           TEXT NOT NULL,
  "uhr_id"       TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "tenant_name"  TEXT,
  "record_type"  TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "data"         JSONB NOT NULL DEFAULT '{}',
  "attachments"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "doctor_name"  TEXT,
  "notes"        TEXT,
  "record_date"  TIMESTAMP(3) NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "health_records_uhr_id_record_type_idx" ON "health_records"("uhr_id","record_type");
CREATE INDEX "health_records_tenant_id_idx" ON "health_records"("tenant_id");

-- Consent Grants
CREATE TABLE "consent_grants" (
  "id"                       TEXT NOT NULL,
  "uhr_id"                   TEXT NOT NULL,
  "requesting_tenant_id"     TEXT NOT NULL,
  "requesting_tenant_name"   TEXT,
  "scope"                    TEXT NOT NULL DEFAULT 'full',
  "granted_at"               TIMESTAMP(3),
  "expires_at"               TIMESTAMP(3),
  "revoked_at"               TIMESTAMP(3),
  "consent_method"           TEXT NOT NULL DEFAULT 'whatsapp',
  "requested_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"                   TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "consent_grants_uhr_id_tenant_id_key" ON "consent_grants"("uhr_id","requesting_tenant_id");

-- Consent Audit Log (immutable)
CREATE TABLE "consent_audit_log" (
  "id"               TEXT NOT NULL,
  "uhr_id"           TEXT NOT NULL,
  "consent_grant_id" TEXT,
  "action"           TEXT NOT NULL,
  "actor_type"       TEXT NOT NULL,
  "actor_id"         TEXT,
  "tenant_id"        TEXT,
  "scope"            TEXT,
  "reason"           TEXT,
  "ip_address"       TEXT,
  "timestamp"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_audit_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "consent_audit_log_uhr_id_timestamp_idx" ON "consent_audit_log"("uhr_id","timestamp");

-- Dependents (family linking)
CREATE TABLE "dependents" (
  "id"                TEXT NOT NULL,
  "primary_uhr_id"    TEXT NOT NULL,
  "dependent_uhr_id"  TEXT NOT NULL,
  "relationship"      TEXT NOT NULL,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dependents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dependents_primary_dependent_key" ON "dependents"("primary_uhr_id","dependent_uhr_id");

-- Foreign keys
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_uhr_id_fkey" FOREIGN KEY ("uhr_id") REFERENCES "universal_health_records"("id") ON DELETE RESTRICT;
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_uhr_id_fkey" FOREIGN KEY ("uhr_id") REFERENCES "universal_health_records"("id") ON DELETE RESTRICT;
ALTER TABLE "consent_audit_log" ADD CONSTRAINT "consent_audit_log_uhr_id_fkey" FOREIGN KEY ("uhr_id") REFERENCES "universal_health_records"("id") ON DELETE RESTRICT;
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_primary_uhr_id_fkey" FOREIGN KEY ("primary_uhr_id") REFERENCES "universal_health_records"("id") ON DELETE RESTRICT;
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_dependent_uhr_id_fkey" FOREIGN KEY ("dependent_uhr_id") REFERENCES "universal_health_records"("id") ON DELETE RESTRICT;
