/**
 * Portal Feature Flag System
 *
 * Central source of truth for what features are available based on:
 *   1. Portal family (diagnostic / clinical / pharmacy / etc.)
 *   2. Subtype within portal family (pathology-lab, radiology-center, etc.)
 *   3. Plan tier (small / medium / large / enterprise)
 *
 * Used by:
 *   - PortalLayout.tsx → conditional nav items
 *   - Dashboard → conditional widgets
 *   - Feature pages → gate access with upgrade prompts
 *   - Registration → set initial feature flags based on chosen tier
 */

import type { LabTier } from './diagnostic-tiers';
import type { DiagSubtype } from './diagnostic-subtype-features';

/** Hierarchy of tier levels — higher numbers include everything from lower */
const TIER_RANK: Record<LabTier, number> = {
  small: 1, medium: 2, large: 3, enterprise: 4,
};

/** Is a given tier at least the minimum required? */
export function tierMeetsMin(userTier: LabTier | undefined, minTier: LabTier): boolean {
  if (!userTier) return false;
  return TIER_RANK[userTier] >= TIER_RANK[minTier];
}

/* ============================================================
 * FEATURE FLAG DEFINITIONS — Diagnostic Portal
 *
 * Structure:
 *   flag name → {
 *     minTier: tier at which this becomes available
 *     allowedSubtypes?: restrict to specific subtypes (optional)
 *     blockedSubtypes?: exclude specific subtypes (optional)
 *   }
 * ============================================================ */

export interface FeatureGate {
  minTier: LabTier;
  allowedSubtypes?: DiagSubtype[];
  blockedSubtypes?: DiagSubtype[];
}

export const DIAGNOSTIC_FEATURES: Record<string, FeatureGate> = {
  // ─── Core features — available to all tiers & subtypes ───────────────────
  'dashboard':          { minTier: 'small' },
  'patients':           { minTier: 'small' },
  'lab-orders':         { minTier: 'small' },
  'billing':            { minTier: 'small' },
  'whatsapp-basic':     { minTier: 'small' },
  'reports-pdf':        { minTier: 'small' },
  'test-catalog':       { minTier: 'small' },
  'result-entry':       { minTier: 'small' },
  'settings':           { minTier: 'small' },

  // ─── Subtype-specific core features ──────────────────────────────────────
  // Only relevant for labs that physically collect samples
  'sample-collection':  {
    minTier: 'small',
    allowedSubtypes: ['pathology-lab','sample-collection','home-collection','molecular-lab','genetic-lab','reference-lab'],
  },
  // Only labs that produce images
  'dicom-viewer':       {
    minTier: 'small',
    allowedSubtypes: ['radiology-center','ultrasound-center','pet-scan','tele-radiology'],
  },
  // PC-PNDT is mandatory for centers doing pregnancy sonography
  'pndt-form-f':        {
    minTier: 'small',
    allowedSubtypes: ['radiology-center','ultrasound-center'],
  },
  // AERB is for radiation equipment
  'aerb-compliance':    {
    minTier: 'medium',
    allowedSubtypes: ['radiology-center','pet-scan'],
  },
  // Radiotracer management
  'radiotracer-log':    {
    minTier: 'small',
    allowedSubtypes: ['pet-scan'],
  },
  // Cardiac-specific
  'tmt-holter':         {
    minTier: 'medium',
    allowedSubtypes: ['cardiac-diagnostics'],
  },
  'cath-lab':           {
    minTier: 'large',
    allowedSubtypes: ['cardiac-diagnostics'],
  },
  // Genetic counseling
  'genetic-counseling': {
    minTier: 'small',
    allowedSubtypes: ['genetic-lab'],
  },
  'acmg-variant':       {
    minTier: 'medium',
    allowedSubtypes: ['genetic-lab'],
  },
  'ngs-workflow':       {
    minTier: 'medium',
    allowedSubtypes: ['genetic-lab','molecular-lab'],
  },
  // Home collection
  'home-collection-basic': {
    minTier: 'medium',
    allowedSubtypes: ['pathology-lab','home-collection','reference-lab'],
  },
  'home-collection-gps': {
    minTier: 'medium',
    allowedSubtypes: ['pathology-lab','home-collection','reference-lab'],
  },
  'home-collection-ai-route': {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','home-collection','reference-lab'],
  },

  // ─── Medium tier unlocks ─────────────────────────────────────────────────
  'critical-alerts':    { minTier: 'medium' },
  'delta-check':        { minTier: 'medium' },
  'reflex-testing':     { minTier: 'medium' },
  'doctor-crm':         { minTier: 'medium' },
  'corporate-clients':  { minTier: 'medium' },
  'tpa-claims':         { minTier: 'medium' },
  'package-billing':    { minTier: 'medium' },
  'analytics-basic':    { minTier: 'medium' },

  // ─── Large tier unlocks ──────────────────────────────────────────────────
  'hl7-astm':           {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab'],
  },
  'qc-westgard':        {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab'],
  },
  'nabl-compliance':    { minTier: 'large' },
  'multi-branch':       { minTier: 'large' },
  'staff-hrms':         { minTier: 'large' },
  'eqa-pt':             {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab'],
  },
  'ai-reading':         {
    minTier: 'large',
    allowedSubtypes: ['radiology-center','tele-radiology','cardiac-diagnostics','ultrasound-center'],
  },
  'tele-radiology-routing': {
    minTier: 'large',
    allowedSubtypes: ['radiology-center','tele-radiology'],
  },
  'inventory-reagents': {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab'],
  },
  'equipment-log':      { minTier: 'medium' },
  'pacs-integration':   {
    minTier: 'large',
    allowedSubtypes: ['radiology-center','tele-radiology','pet-scan'],
  },

  // ─── Enterprise tier unlocks ─────────────────────────────────────────────
  'franchise-mgmt':     { minTier: 'enterprise' },
  'revenue-sharing':    { minTier: 'enterprise' },
  'white-label':        { minTier: 'enterprise' },
  'api-marketplace':    { minTier: 'enterprise' },
  'abha-abdm':          { minTier: 'enterprise' },
  'gov-reporting':      {
    minTier: 'enterprise',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab'],
  },
  'dedicated-manager':  { minTier: 'enterprise' },
  'theranostics':       {
    minTier: 'enterprise',
    allowedSubtypes: ['pet-scan'],
  },
  'ep-study':           {
    minTier: 'enterprise',
    allowedSubtypes: ['cardiac-diagnostics'],
  },
  'biobank':            {
    minTier: 'enterprise',
    allowedSubtypes: ['genetic-lab','molecular-lab'],
  },
  'research-module':    { minTier: 'enterprise' },
  'hospital-hl7':       {
    minTier: 'enterprise',
    allowedSubtypes: ['radiology-center','tele-radiology','cardiac-diagnostics','reference-lab'],
  },
};

/**
 * Check if a feature is available for a given (subtype, tier) combination.
 */
export function isFeatureEnabled(
  feature: string,
  subtype?: string,
  tier?: LabTier,
): boolean {
  const gate = DIAGNOSTIC_FEATURES[feature];
  if (!gate) return true; // unknown features default to allowed

  // Tier check
  if (!tierMeetsMin(tier, gate.minTier)) return false;

  // Subtype check
  if (gate.allowedSubtypes && subtype) {
    if (!gate.allowedSubtypes.includes(subtype as DiagSubtype)) return false;
  }
  if (gate.blockedSubtypes && subtype) {
    if (gate.blockedSubtypes.includes(subtype as DiagSubtype)) return false;
  }

  return true;
}

/**
 * Build a feature flags map for a tenant.
 * Called at registration time and stored on tenant record, refreshed on login.
 */
export function buildFeatureFlags(
  subtype?: string,
  tier?: LabTier,
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const feature of Object.keys(DIAGNOSTIC_FEATURES)) {
    flags[feature] = isFeatureEnabled(feature, subtype, tier);
  }
  return flags;
}

/* ============================================================
 * SUBTYPE → NAV ITEMS MAPPING
 *
 * Base set of nav items for diagnostic portal, then refined
 * per-subtype to include only relevant items.
 * ============================================================ */

export interface SubtypeNavConfig {
  /** Label tweaks for this subtype (e.g. 'Lab Orders' → 'Scan Orders' for radiology) */
  labelOverrides?: Record<string, string>;
  /** Href suffixes of nav items to HIDE for this subtype */
  hideItems?: string[];
  /** Feature-specific items to SHOW for this subtype */
  extraItems?: Array<{ href: string; label: string; iconKey: string }>;
}

export const DIAG_SUBTYPE_NAV: Record<DiagSubtype, SubtypeNavConfig> = {
  'pathology-lab': {
    // Standard lab flow — keep everything
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
  },
  'sample-collection': {
    labelOverrides: { 'lab-orders': 'Sample Orders', 'collection': 'Walk-in Collection' },
    hideItems: ['qc','results','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory'],
    extraItems: [
      { href: 'dispatch',  label: 'Dispatch Manifest',   iconKey: 'Truck' },
      { href: 'cold-chain', label: 'Cold Chain Log',     iconKey: 'Shield' },
    ],
  },
  'home-collection': {
    labelOverrides: { 'collection': 'Home Visits', 'lab-orders': 'Bookings' },
    hideItems: ['qc','results','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory','equipment'],
    extraItems: [
      { href: 'agents',       label: 'Field Agents',     iconKey: 'UserCheck' },
      { href: 'routes',       label: 'Route Planning',   iconKey: 'Truck' },
      { href: 'cold-chain',   label: 'Cold Chain Log',   iconKey: 'Shield' },
    ],
  },
  'radiology-center': {
    labelOverrides: { 'lab-orders': 'Scan Orders', 'results': 'Radiology Reports', 'catalog': 'Modality Catalog' },
    hideItems: ['collection','qc','inventory','tmt-holter','cath-lab','radiotracer','genetic-counseling'],
    extraItems: [
      { href: 'dicom',        label: 'DICOM Viewer',     iconKey: 'Activity' },
      { href: 'pndt-register', label: 'PC-PNDT Register', iconKey: 'Shield' },
      { href: 'aerb-log',     label: 'AERB Radiation Log', iconKey: 'AlertTriangle' },
      { href: 'radiologists', label: 'Radiologist Panel', iconKey: 'Users' },
    ],
  },
  'ultrasound-center': {
    labelOverrides: { 'lab-orders': 'Scan Orders', 'results': 'USG Reports' },
    hideItems: ['collection','qc','inventory','tmt-holter','cath-lab','radiotracer','genetic-counseling'],
    extraItems: [
      { href: 'pndt-register', label: 'PC-PNDT Register', iconKey: 'Shield' },
      { href: 'ob-module',    label: 'OB / Growth Scan', iconKey: 'Heart' },
      { href: 'sonologists',  label: 'Sonologist Panel', iconKey: 'Users' },
    ],
  },
  'pet-scan': {
    labelOverrides: { 'lab-orders': 'Scan Orders', 'results': 'PET-CT Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'dicom',         label: 'DICOM Viewer',        iconKey: 'Activity' },
      { href: 'radiotracer',   label: 'Radiotracer Log',     iconKey: 'FlaskConical' },
      { href: 'aerb-log',      label: 'AERB Compliance',     iconKey: 'AlertTriangle' },
      { href: 'rso-dashboard', label: 'RSO Dashboard',       iconKey: 'Shield' },
    ],
  },
  'cardiac-diagnostics': {
    labelOverrides: { 'lab-orders': 'Cardiac Orders', 'results': 'Cardiac Reports' },
    hideItems: ['collection','qc','inventory','catalog','radiotracer','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'tmt-module',     label: 'TMT / Stress Test',   iconKey: 'Activity' },
      { href: 'holter',         label: 'Holter Allocation',   iconKey: 'Clock' },
      { href: 'abpm',           label: 'ABPM Reports',        iconKey: 'Activity' },
      { href: 'cath-lab',       label: 'Cath Lab Schedule',   iconKey: 'Heart' },
    ],
  },
  'molecular-lab': {
    labelOverrides: { 'results': 'PCR / NGS Results', 'catalog': 'Molecular Catalog' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab'],
    extraItems: [
      { href: 'batch',         label: 'Batch Processing',  iconKey: 'FlaskConical' },
      { href: 'biosafety',     label: 'Biosafety Log',     iconKey: 'Shield' },
      { href: 'gov-reporting', label: 'ICMR / NACO Rpts',  iconKey: 'FileText' },
    ],
  },
  'health-checkup': {
    labelOverrides: { 'lab-orders': 'Checkup Orders', 'packages': 'Checkup Packages' },
    hideItems: ['qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'hra',              label: 'Health Risk Assessment', iconKey: 'Activity' },
      { href: 'consult-schedule', label: 'Consult Schedule',        iconKey: 'Stethoscope' },
    ],
  },
  'corporate-screening': {
    labelOverrides: { 'lab-orders': 'Screening Orders', 'crm/corporates': 'Corporate Clients' },
    hideItems: ['qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','collection'],
    extraItems: [
      { href: 'camps',          label: 'Health Camps',          iconKey: 'Briefcase' },
      { href: 'employer-portal', label: 'Employer Portal',       iconKey: 'Building2' },
      { href: 'population-health', label: 'Population Health',   iconKey: 'TrendingUp' },
    ],
  },
  'genetic-lab': {
    labelOverrides: { 'results': 'Genetic Reports', 'catalog': 'Genetic Test Menu' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','qc'],
    extraItems: [
      { href: 'counseling',   label: 'Genetic Counseling',  iconKey: 'Users' },
      { href: 'pedigree',     label: 'Pedigree Builder',    iconKey: 'Users' },
      { href: 'variants',     label: 'Variant DB (ACMG)',   iconKey: 'FlaskConical' },
      { href: 'ngs-workflow', label: 'NGS Workflow',        iconKey: 'FlaskConical' },
    ],
  },
  'reference-lab': {
    labelOverrides: { 'lab-orders': 'Hub Orders' },
    extraItems: [
      { href: 'partner-labs', label: 'Partner Labs',        iconKey: 'Building2' },
      { href: 'hub-spoke',    label: 'Hub & Spoke Routing', iconKey: 'Truck' },
      { href: 'franchise',    label: 'Franchise Labs',      iconKey: 'Globe' },
    ],
  },
  'tele-radiology': {
    labelOverrides: { 'lab-orders': 'Study Queue', 'results': 'Radiology Reports' },
    hideItems: ['collection','qc','inventory','catalog','tmt-holter','cath-lab','radiotracer','genetic-counseling','pndt-register','equipment'],
    extraItems: [
      { href: 'dicom',          label: 'DICOM Viewer',        iconKey: 'Activity' },
      { href: 'worklist',       label: 'Reading Worklist',    iconKey: 'ClipboardList' },
      { href: 'radiologists',   label: 'Radiologist Panel',   iconKey: 'Users' },
      { href: 'client-centers', label: 'Client Centers',      iconKey: 'Building2' },
      { href: 'sla-monitor',    label: 'SLA Monitor',         iconKey: 'Clock' },
    ],
  },
};

/**
 * Get the customised nav config for a tenant's subtype.
 */
export function getSubtypeNavConfig(subtype?: string): SubtypeNavConfig {
  if (!subtype) return {};
  return DIAG_SUBTYPE_NAV[subtype as DiagSubtype] ?? {};
}
