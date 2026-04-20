-- ============================================
-- HospiBot Rebuild Batch 8 (FINAL) Migration
-- 2 tables: Kit Logistics + DTC Consumer
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS kit_inventories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, item_name TEXT NOT NULL, item_code TEXT,
  category TEXT DEFAULT 'reagent', item_type TEXT, manufacturer TEXT, supplier TEXT, catalog_number TEXT,
  lot_number TEXT, batch_number TEXT, manufacturing_date TIMESTAMPTZ, expiry_date TIMESTAMPTZ, expiry_alert TEXT,
  quantity_received INTEGER, quantity_on_hand INTEGER, quantity_used INTEGER DEFAULT 0,
  unit_of_measure TEXT, reorder_level INTEGER, reorder_quantity INTEGER,
  storage_condition TEXT, storage_temperature_min DOUBLE PRECISION, storage_temperature_max DOUBLE PRECISION,
  cold_chain_required BOOLEAN DEFAULT FALSE, storage_location TEXT,
  coa_verified BOOLEAN DEFAULT FALSE, acceptance_test_done BOOLEAN DEFAULT FALSE,
  acceptance_test_result TEXT, acceptance_test_date TIMESTAMPTZ,
  segregation_status TEXT DEFAULT 'untested',
  received_date TIMESTAMPTZ, received_by TEXT, po_number TEXT,
  unit_cost DOUBLE PRECISION, total_cost DOUBLE PRECISION,
  linked_equipment TEXT, linked_test TEXT,
  notes TEXT, status TEXT DEFAULT 'in-stock',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_kit_inv_tenant ON kit_inventories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kit_inv_expiry ON kit_inventories(tenant_id, expiry_alert);

CREATE TABLE IF NOT EXISTS dtc_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL, order_number TEXT NOT NULL,
  consumer_name TEXT NOT NULL, consumer_phone TEXT NOT NULL, consumer_email TEXT,
  consumer_age INTEGER, consumer_gender TEXT, consumer_address TEXT, consumer_city TEXT, consumer_pincode TEXT,
  order_date TIMESTAMPTZ NOT NULL, order_source TEXT DEFAULT 'website',
  package_name TEXT, tests_ordered JSONB, test_count INTEGER,
  collection_type TEXT DEFAULT 'home-collection', collection_date TIMESTAMPTZ,
  collection_time_slot TEXT, phlebotomist_assigned TEXT,
  sample_collected BOOLEAN DEFAULT FALSE, sample_barcode TEXT,
  consent_given BOOLEAN DEFAULT FALSE, consent_date TIMESTAMPTZ,
  data_processing_consent BOOLEAN DEFAULT FALSE, marketing_consent BOOLEAN DEFAULT FALSE,
  total_amount DOUBLE PRECISION, discount_amount DOUBLE PRECISION, net_amount DOUBLE PRECISION,
  payment_method TEXT, payment_status TEXT DEFAULT 'pending', payment_date TIMESTAMPTZ, transaction_id TEXT,
  results_ready BOOLEAN DEFAULT FALSE, results_delivered_via TEXT, results_delivered_date TIMESTAMPTZ,
  abnormal_results BOOLEAN DEFAULT FALSE, follow_up_recommended BOOLEAN DEFAULT FALSE, follow_up_doctor_name TEXT,
  customer_rating DOUBLE PRECISION, customer_feedback TEXT,
  promo_code TEXT, referral_source TEXT,
  notes TEXT, order_status TEXT DEFAULT 'placed',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_dtc_orders_tenant ON dtc_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dtc_orders_status ON dtc_orders(tenant_id, order_status);
