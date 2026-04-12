-- ============================================================
-- HospiBot Migration: Multi-Portal Architecture
-- Adds PortalFamily, TenantSubType, PortalTheme, PlatformAsset
-- Updates Tenant with portalFamilyId + subTypeId
-- ============================================================

-- Portal Families (7 families, DB-driven)
CREATE TABLE "portal_families" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon"        TEXT NOT NULL,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "portal_families_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "portal_families_name_key" ON "portal_families"("name");
CREATE UNIQUE INDEX "portal_families_slug_key" ON "portal_families"("slug");

-- Sub-types (75+ sub-types, feature-flag controlled)
CREATE TABLE "tenant_sub_types" (
  "id"               TEXT NOT NULL,
  "portal_family_id" TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "description"      TEXT,
  "icon"             TEXT,
  "feature_flags"    JSONB NOT NULL DEFAULT '{}',
  "reg_fields"       JSONB NOT NULL DEFAULT '{}',
  "sort_order"       INTEGER NOT NULL DEFAULT 0,
  "is_active"        BOOLEAN NOT NULL DEFAULT true,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenant_sub_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenant_sub_types_portalFamilyId_slug_key"
  ON "tenant_sub_types"("portal_family_id", "slug");

-- Portal Themes (per-family color config, Super Admin editable)
CREATE TABLE "portal_themes" (
  "id"               TEXT NOT NULL,
  "portal_family_id" TEXT NOT NULL,
  "primary_color"    TEXT NOT NULL DEFAULT '#0D7C66',
  "primary_dark"     TEXT NOT NULL DEFAULT '#0A5E4F',
  "primary_light"    TEXT NOT NULL DEFAULT '#E8F5F0',
  "accent_color"     TEXT NOT NULL DEFAULT '#F59E0B',
  "sidebar_bg"       TEXT NOT NULL DEFAULT '#063A31',
  "login_bg"         TEXT NOT NULL DEFAULT '#0D7C66',
  "login_gradient"   TEXT NOT NULL DEFAULT '#0A5E4F',
  "updated_at"       TIMESTAMP(3) NOT NULL,
  "updated_by"       TEXT,

  CONSTRAINT "portal_themes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "portal_themes_portal_family_id_key"
  ON "portal_themes"("portal_family_id");

-- Platform Assets (logo, tagline — Super Admin controlled)
CREATE TABLE "platform_assets" (
  "id"          TEXT NOT NULL DEFAULT 'singleton',
  "logo_url"    TEXT,
  "logo_alt"    TEXT NOT NULL DEFAULT 'HospiBot',
  "favicon_url" TEXT,
  "tagline"     TEXT NOT NULL DEFAULT 'Connect 24*7...',
  "updated_at"  TIMESTAMP(3) NOT NULL,
  "updated_by"  TEXT,

  CONSTRAINT "platform_assets_pkey" PRIMARY KEY ("id")
);

-- Add portal fields to Tenant
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "portal_family_id" TEXT,
  ADD COLUMN IF NOT EXISTS "sub_type_id"      TEXT;

-- Foreign keys
ALTER TABLE "tenant_sub_types"
  ADD CONSTRAINT "tenant_sub_types_portal_family_id_fkey"
    FOREIGN KEY ("portal_family_id")
    REFERENCES "portal_families"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portal_themes"
  ADD CONSTRAINT "portal_themes_portal_family_id_fkey"
    FOREIGN KEY ("portal_family_id")
    REFERENCES "portal_families"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenants"
  ADD CONSTRAINT IF NOT EXISTS "tenants_portal_family_id_fkey"
    FOREIGN KEY ("portal_family_id")
    REFERENCES "portal_families"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tenants"
  ADD CONSTRAINT IF NOT EXISTS "tenants_sub_type_id_fkey"
    FOREIGN KEY ("sub_type_id")
    REFERENCES "tenant_sub_types"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Auto-migrate existing tenants → portalFamilyId ───────────────────────────
-- Run AFTER seed so portal_families rows exist.
-- This is handled by the seed script itself via a separate step.
-- Uncomment and run manually if needed after seed:
--
-- UPDATE tenants t SET portal_family_id = pf.id
-- FROM portal_families pf
-- WHERE pf.slug = CASE t.type
--   WHEN 'HOSPITAL'         THEN 'clinical'
--   WHEN 'CLINIC'           THEN 'clinical'
--   WHEN 'DOCTOR'           THEN 'clinical'
--   WHEN 'IVF_CENTER'       THEN 'clinical'
--   WHEN 'DIAGNOSTIC_CENTER' THEN 'diagnostic'
--   WHEN 'PHARMACY'         THEN 'pharmacy'
--   WHEN 'HOME_HEALTHCARE'  THEN 'homecare'
--   WHEN 'EQUIPMENT_VENDOR' THEN 'equipment'
--   ELSE 'clinical'
-- END;
