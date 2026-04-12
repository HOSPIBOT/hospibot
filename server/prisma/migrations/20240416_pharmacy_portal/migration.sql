-- Pharmacy Products
CREATE TABLE "pharmacy_products" (
  "id"                     TEXT NOT NULL,
  "tenant_id"              TEXT NOT NULL,
  "name"                   TEXT NOT NULL,
  "generic_name"           TEXT,
  "manufacturer"           TEXT,
  "category"               TEXT NOT NULL DEFAULT 'General',
  "composition"            TEXT,
  "strength"               TEXT,
  "form"                   TEXT NOT NULL DEFAULT 'Tablet',
  "schedule"               TEXT,
  "hs_code"                TEXT,
  "mrp"                    INTEGER NOT NULL,
  "cost_price"             INTEGER NOT NULL DEFAULT 0,
  "selling_price"          INTEGER NOT NULL,
  "gst_rate"               DOUBLE PRECISION NOT NULL DEFAULT 12,
  "current_stock"          INTEGER NOT NULL DEFAULT 0,
  "minimum_stock"          INTEGER NOT NULL DEFAULT 10,
  "unit"                   TEXT NOT NULL DEFAULT 'Strip',
  "units_per_pack"         INTEGER NOT NULL DEFAULT 10,
  "storage_condition"      TEXT,
  "is_active"              BOOLEAN NOT NULL DEFAULT true,
  "requires_prescription"  BOOLEAN NOT NULL DEFAULT false,
  "is_controlled_substance" BOOLEAN NOT NULL DEFAULT false,
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pharmacy_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pharmacy_products_tenant_name_strength_key" ON "pharmacy_products"("tenant_id","name","strength");
CREATE INDEX "pharmacy_products_tenant_category_idx" ON "pharmacy_products"("tenant_id","category");

-- Pharmacy Batches (for expiry tracking)
CREATE TABLE "pharmacy_batches" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "product_id"        TEXT NOT NULL,
  "batch_number"      TEXT NOT NULL,
  "expiry_date"       TIMESTAMP(3) NOT NULL,
  "quantity"          INTEGER NOT NULL,
  "remaining"         INTEGER NOT NULL,
  "cost_price"        INTEGER NOT NULL,
  "selling_price"     INTEGER NOT NULL,
  "supplier_id"       TEXT,
  "purchase_order_id" TEXT,
  "received_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pharmacy_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pharmacy_batches_tenant_product_expiry_idx" ON "pharmacy_batches"("tenant_id","product_id","expiry_date");

-- Dispensing Orders
CREATE TABLE "dispensing_orders" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "patient_id"      TEXT NOT NULL,
  "prescription_id" TEXT,
  "order_number"    TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "total_amount"    INTEGER NOT NULL DEFAULT 0,
  "discount_amount" INTEGER NOT NULL DEFAULT 0,
  "gst_amount"      INTEGER NOT NULL DEFAULT 0,
  "bill_amount"     INTEGER NOT NULL DEFAULT 0,
  "payment_status"  TEXT NOT NULL DEFAULT 'UNPAID',
  "notes"           TEXT,
  "dispensed_at"    TIMESTAMP(3),
  "dispensed_by"    TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dispensing_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dispensing_orders_tenant_order_number_key" ON "dispensing_orders"("tenant_id","order_number");

-- Dispensing Items
CREATE TABLE "dispensing_items" (
  "id"                  TEXT NOT NULL,
  "dispensing_order_id" TEXT NOT NULL,
  "product_id"          TEXT NOT NULL,
  "batch_id"            TEXT,
  "quantity"            INTEGER NOT NULL,
  "unit_price"          INTEGER NOT NULL,
  "total_price"         INTEGER NOT NULL,
  "gst_rate"            DOUBLE PRECISION NOT NULL DEFAULT 12,
  "gst_amount"          INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "dispensing_items_pkey" PRIMARY KEY ("id")
);

-- Suppliers
CREATE TABLE "suppliers" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "contact_person" TEXT,
  "phone"          TEXT,
  "email"          TEXT,
  "address"        TEXT,
  "gst_number"     TEXT,
  "drug_licence"   TEXT,
  "is_active"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Purchase Orders
CREATE TABLE "purchase_orders" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "supplier_id"  TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'DRAFT',
  "items"        JSONB NOT NULL DEFAULT '[]',
  "total_amount" INTEGER NOT NULL DEFAULT 0,
  "notes"        TEXT,
  "ordered_at"   TIMESTAMP(3),
  "expected_at"  TIMESTAMP(3),
  "received_at"  TIMESTAMP(3),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "purchase_orders_tenant_order_number_key" ON "purchase_orders"("tenant_id","order_number");

-- Foreign keys
ALTER TABLE "pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "pharmacy_products"("id");
ALTER TABLE "dispensing_orders" ADD CONSTRAINT "dispensing_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");
ALTER TABLE "dispensing_items" ADD CONSTRAINT "dispensing_items_dispensing_order_id_fkey" FOREIGN KEY ("dispensing_order_id") REFERENCES "dispensing_orders"("id");
ALTER TABLE "dispensing_items" ADD CONSTRAINT "dispensing_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "pharmacy_products"("id");
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");
