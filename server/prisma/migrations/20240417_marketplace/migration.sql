CREATE TABLE "marketplace_products" (
  "id"               TEXT NOT NULL, "tenant_id" TEXT NOT NULL, "tenant_name" TEXT NOT NULL,
  "portal_family"    TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "category"         TEXT NOT NULL, "subcategory" TEXT, "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "tags"             TEXT[] DEFAULT ARRAY[]::TEXT[], "price" INTEGER NOT NULL, "mrp" INTEGER,
  "currency"         TEXT NOT NULL DEFAULT 'INR', "price_unit" TEXT NOT NULL DEFAULT 'per unit',
  "in_stock"         BOOLEAN NOT NULL DEFAULT true, "quantity" INTEGER,
  "is_available"     BOOLEAN NOT NULL DEFAULT true, "is_home_delivery" BOOLEAN NOT NULL DEFAULT false,
  "delivery_days"    INTEGER, "specifications" JSONB NOT NULL DEFAULT '{}',
  "featured"         BOOLEAN NOT NULL DEFAULT false, "view_count" INTEGER NOT NULL DEFAULT 0,
  "order_count"      INTEGER NOT NULL DEFAULT 0,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_products_portal_category_idx" ON "marketplace_products"("portal_family","category");
CREATE INDEX "marketplace_products_tenant_idx" ON "marketplace_products"("tenant_id");

CREATE TABLE "marketplace_orders" (
  "id"               TEXT NOT NULL, "buyer_tenant_id" TEXT, "buyer_phone" TEXT NOT NULL,
  "buyer_name"       TEXT NOT NULL, "buyer_email" TEXT, "buyer_address" TEXT NOT NULL,
  "buyer_city"       TEXT NOT NULL, "buyer_pincode" TEXT NOT NULL,
  "order_number"     TEXT NOT NULL, "items" JSONB NOT NULL DEFAULT '[]',
  "total_amount"     INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "payment_status"   TEXT NOT NULL DEFAULT 'PENDING', "notes" TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_orders_order_number_key" ON "marketplace_orders"("order_number");
