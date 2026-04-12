-- Test Catalog
CREATE TABLE "test_catalog" (
  "id"                        TEXT NOT NULL,
  "tenant_id"                 TEXT NOT NULL,
  "code"                      TEXT NOT NULL,
  "name"                      TEXT NOT NULL,
  "category"                  TEXT NOT NULL,
  "price"                     INTEGER NOT NULL,
  "turnaround_hrs"            INTEGER NOT NULL DEFAULT 24,
  "sample_type"               TEXT NOT NULL DEFAULT 'Blood',
  "container_type"            TEXT,
  "normal_range"              TEXT,
  "unit"                      TEXT,
  "methodology"               TEXT,
  "is_active"                 BOOLEAN NOT NULL DEFAULT true,
  "is_home_collection_allowed" BOOLEAN NOT NULL DEFAULT true,
  "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                TIMESTAMP(3) NOT NULL,
  CONSTRAINT "test_catalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "test_catalog_tenant_id_code_key" ON "test_catalog"("tenant_id","code");

-- Home Collections
CREATE TABLE "home_collections" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "patient_id"       TEXT NOT NULL,
  "lab_order_id"     TEXT,
  "scheduled_at"     TIMESTAMP(3) NOT NULL,
  "address"          TEXT NOT NULL,
  "city"             TEXT NOT NULL,
  "pincode"          TEXT NOT NULL,
  "contact_phone"    TEXT NOT NULL,
  "technician_name"  TEXT,
  "technician_phone" TEXT,
  "status"           TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes"            TEXT,
  "collected_at"     TIMESTAMP(3),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "home_collections_pkey" PRIMARY KEY ("id")
);

-- Add report_url_public and whatsapp_sent columns to lab_orders
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "department_id" TEXT;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "wa_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "sample_barcode" TEXT;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "referring_doctor" TEXT;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "clinical_info" TEXT;
