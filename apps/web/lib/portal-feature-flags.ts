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
  'sample-collection-center':  {
    minTier: 'small',
    allowedSubtypes: ['pathology-lab','sample-collection-center','home-sample-collection','molecular-lab','genetic-lab','reference-lab'],
  },
  // Only labs that produce images
  'dicom-viewer':       {
    minTier: 'small',
    allowedSubtypes: ['radiology-center','ultrasound-center','pet-scan-center','tele-radiology'],
  },
  // PC-PNDT is mandatory for centers doing pregnancy sonography
  'pndt-form-f':        {
    minTier: 'small',
    allowedSubtypes: ['radiology-center','ultrasound-center'],
  },
  // AERB is for radiation equipment
  'aerb-compliance':    {
    minTier: 'medium',
    allowedSubtypes: ['radiology-center','pet-scan-center'],
  },
  // Radiotracer management
  'radiotracer-log':    {
    minTier: 'small',
    allowedSubtypes: ['pet-scan-center'],
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
    allowedSubtypes: ['pathology-lab','home-sample-collection','reference-lab'],
  },
  'home-collection-gps': {
    minTier: 'medium',
    allowedSubtypes: ['pathology-lab','home-sample-collection','reference-lab'],
  },
  'home-collection-ai-route': {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab','home-sample-collection','reference-lab'],
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
    allowedSubtypes: ['radiology-center','tele-radiology','pet-scan-center'],
  },

  // ─── Enterprise tier unlocks ─────────────────────────────────────────────
  'franchise-mgmt':     { minTier: 'enterprise' },
  'revenue-sharing':    { minTier: 'enterprise' },
  'white-label':        { minTier: 'enterprise' },
  'api-marketplace':    { minTier: 'enterprise' },
  'abha-abdm':          { minTier: 'enterprise' },
  'gov-reporting':      {
    minTier: 'enterprise',
    allowedSubtypes: ['pathology-lab','reference-lab','molecular-lab','micro-lab','forensic-toxicology'],
  },
  'dedicated-manager':  { minTier: 'enterprise' },
  'theranostics':       {
    minTier: 'enterprise',
    allowedSubtypes: ['pet-scan-center','nuclear-medicine-center'],
  },
  'ep-study':           {
    minTier: 'enterprise',
    allowedSubtypes: ['cardiac-diagnostics'],
  },
  'biobank':            {
    minTier: 'enterprise',
    allowedSubtypes: ['genetic-lab','molecular-lab','histopathology-lab'],
  },
  'research-module':    { minTier: 'enterprise' },
  'hospital-hl7':       {
    minTier: 'enterprise',
    allowedSubtypes: ['radiology-center','tele-radiology','cardiac-diagnostics','reference-lab','nuclear-medicine-center'],
  },

  // ─── Subtype-specific feature pages (Sprint 4+) ───────────────────────
  // Each maps to a real /diagnostic/<slug>/page.tsx and is gated by tier
  'dispatch': {
    minTier: 'small',
    allowedSubtypes: ['sample-collection-center','home-sample-collection','pickup-point','reference-lab'],
  },
  'cold-chain': {
    minTier: 'medium',
    allowedSubtypes: ['sample-collection-center','home-sample-collection','pickup-point','reference-lab'],
  },
  'culture': {
    minTier: 'small',
    allowedSubtypes: ['micro-lab','molecular-lab'],
  },
  'donors': {
    minTier: 'small',
    allowedSubtypes: ['blood-bank','stem-cell-registry'],
  },
  'crossmatch': {
    minTier: 'small',
    allowedSubtypes: ['blood-bank'],
  },
  'antibiogram': {
    minTier: 'medium',
    allowedSubtypes: ['micro-lab'],
  },
  'slide-scanning': {
    minTier: 'medium',
    allowedSubtypes: ['histopathology-lab'],
  },
  'ihc': {
    minTier: 'medium',
    allowedSubtypes: ['histopathology-lab'],
  },
  'frozen-section': {
    minTier: 'medium',
    allowedSubtypes: ['histopathology-lab'],
  },
  'bi-rads': {
    minTier: 'small',
    allowedSubtypes: ['mammography-center'],
  },
  'frax': {
    minTier: 'small',
    allowedSubtypes: ['dexa-center'],
  },
  'spirometry': {
    minTier: 'small',
    allowedSubtypes: ['pft-center'],
  },
  'waveforms': {
    minTier: 'small',
    allowedSubtypes: ['neurophysiology-center'],
  },
  'psg': {
    minTier: 'small',
    allowedSubtypes: ['sleep-lab'],
  },
  'cpap-titration': {
    minTier: 'medium',
    allowedSubtypes: ['sleep-lab'],
  },
  'audiometry': {
    minTier: 'small',
    allowedSubtypes: ['audiology-center'],
  },
  'bera': {
    minTier: 'medium',
    allowedSubtypes: ['audiology-center'],
  },
  'cycles': {
    minTier: 'small',
    allowedSubtypes: ['ivf-embryology'],
  },
  'cryopreservation': {
    minTier: 'small',
    allowedSubtypes: ['ivf-embryology'],
  },
  'casa': {
    minTier: 'medium',
    allowedSubtypes: ['ivf-embryology'],
  },
  'art-act': {
    minTier: 'small',
    allowedSubtypes: ['ivf-embryology'],
  },
  'chain-of-custody': {
    minTier: 'small',
    allowedSubtypes: ['forensic-toxicology'],
  },
  'gc-ms': {
    minTier: 'medium',
    allowedSubtypes: ['forensic-toxicology'],
  },
  'hla-typing': {
    minTier: 'small',
    allowedSubtypes: ['stem-cell-registry'],
  },
  'video-capture': {
    minTier: 'small',
    allowedSubtypes: ['endoscopy-center'],
  },
  'sedation-log': {
    minTier: 'small',
    allowedSubtypes: ['endoscopy-center'],
  },
  'tumor-markers': {
    minTier: 'small',
    allowedSubtypes: ['cancer-screening'],
  },
  'ai-scoring': {
    minTier: 'medium',
    allowedSubtypes: ['cancer-screening'],
  },
  'kits': {
    minTier: 'small',
    allowedSubtypes: ['dtc-genomics'],
  },
  'dtc-portal': {
    minTier: 'medium',
    allowedSubtypes: ['dtc-genomics'],
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

export const DIAG_SUBTYPE_NAV: Record<string, SubtypeNavConfig> = {
  'pathology-lab': {
    // Standard lab flow — keep everything
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
  },
  'sample-collection-center': {
    labelOverrides: { 'lab-orders': 'Sample Orders', 'collection': 'Walk-in Collection' },
    hideItems: ['qc','results','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory'],
    extraItems: [
      { href: 'dispatch',  label: 'Dispatch Manifest',   iconKey: 'Truck' },
      { href: 'cold-chain', label: 'Cold Chain Log',     iconKey: 'Shield' },
    ],
  },
  'home-sample-collection': {
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
  'pet-scan-center': {
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

  // ═════════════════════════════════════════════════════════════════════════
  // Group A — Collection & Logistics (pickup-point; other 2 covered above)
  // ═════════════════════════════════════════════════════════════════════════
  'pickup-point': {
    // Counter inside a pharmacy/clinic — minimalist handover flow, no processing.
    labelOverrides: { 'lab-orders': 'Sample Handover', 'collection': 'Handover Log' },
    hideItems: ['qc','results','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory','equipment','automation','rate-cards','packages'],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // Group B — Pathology & Lab Testing (histopathology, micro, blood-bank)
  // ═════════════════════════════════════════════════════════════════════════
  'histopathology-lab': {
    labelOverrides: { 'lab-orders': 'Tissue Specimens', 'results': 'Histology Reports', 'catalog': 'Panel Catalog' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'slide-scanning', label: 'Slide Scanning',   iconKey: 'Layers2' },
      { href: 'ihc',            label: 'IHC Workflow',     iconKey: 'FlaskConical' },
      { href: 'frozen-section', label: 'Frozen Section',   iconKey: 'Activity' },
    ],
  },
  'micro-lab': {
    labelOverrides: { 'lab-orders': 'Culture Orders', 'results': 'C&S Reports', 'catalog': 'Organism Panel' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'culture',    label: 'Culture Dashboard',  iconKey: 'FlaskConical' },
      { href: 'antibiogram',label: 'Antibiogram / AMR',  iconKey: 'Shield' },
      { href: 'biosafety',  label: 'Biosafety Log',      iconKey: 'ShieldCheck' },
    ],
  },
  'blood-bank': {
    labelOverrides: { 'lab-orders': 'Blood Orders', 'inventory': 'Blood Inventory', 'patients': 'Recipients' },
    hideItems: ['qc','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'donors',          label: 'Donor Registry',   iconKey: 'Heart' },
      { href: 'crossmatch',      label: 'Crossmatch',       iconKey: 'FlaskConical' },
      { href: 'dghs-reporting',  label: 'DGHS Reporting',   iconKey: 'FileText' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // Group C — Imaging & Scans (nuclear, mammo, dexa, dental, ophthalmic)
  // ═════════════════════════════════════════════════════════════════════════
  'nuclear-medicine-center': {
    labelOverrides: { 'lab-orders': 'Scan Orders', 'results': 'Nuclear Reports' },
    hideItems: ['collection','qc','catalog','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'radiotracer',  label: 'Radiotracer Log',   iconKey: 'FlaskConical' },
      { href: 'aerb-log',     label: 'AERB Log',          iconKey: 'AlertTriangle' },
      { href: 'barc',         label: 'BARC Reporting',    iconKey: 'Shield' },
    ],
  },
  'mammography-center': {
    labelOverrides: { 'lab-orders': 'Mammogram Orders', 'results': 'BI-RADS Reports' },
    hideItems: ['collection','qc','inventory','catalog','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'bi-rads',           label: 'BI-RADS Reports',  iconKey: 'ClipboardList' },
      { href: 'compliance/mammo',  label: 'Operator QC',      iconKey: 'ShieldCheck' },
      { href: 'aerb-log',          label: 'AERB Log',         iconKey: 'AlertTriangle' },
      { href: 'pndt-register',     label: 'PC-PNDT Register', iconKey: 'Shield' },
    ],
  },
  'dexa-center': {
    labelOverrides: { 'lab-orders': 'DEXA Orders', 'results': 'Bone Density Reports' },
    hideItems: ['collection','qc','inventory','catalog','radiotracer','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'frax', label: 'FRAX Assessment', iconKey: 'Activity' },
    ],
  },
  'dental-radiology-center': {
    labelOverrides: { 'lab-orders': 'Dental Scan Orders', 'results': 'Dental Reports' },
    hideItems: ['collection','qc','inventory','catalog','radiotracer','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'opg-cbct',  label: 'OPG / CBCT',  iconKey: 'Activity' },
      { href: 'aerb-log',  label: 'AERB Log',    iconKey: 'AlertTriangle' },
    ],
  },
  'ophthalmic-center': {
    labelOverrides: { 'lab-orders': 'Eye Scan Orders', 'results': 'Eye Reports' },
    hideItems: ['collection','qc','inventory','catalog','radiotracer','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'oct',          label: 'OCT Scans',           iconKey: 'Activity' },
      { href: 'perimetry',    label: 'Perimetry',           iconKey: 'Activity' },
      { href: 'fundus-photo', label: 'Fundus Photography',  iconKey: 'Activity' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // Group D — Physiological Testing (PFT, neuro, allergy, sleep, audio, uro, endo)
  // ═════════════════════════════════════════════════════════════════════════
  'pft-center': {
    labelOverrides: { 'lab-orders': 'PFT Bookings', 'results': 'PFT Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'spirometry', label: 'Spirometry', iconKey: 'Activity' },
    ],
  },
  'neurophysiology-center': {
    labelOverrides: { 'lab-orders': 'EEG/EMG Studies', 'results': 'Neurophysiology Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'waveforms', label: 'Waveform Viewer', iconKey: 'Activity' },
    ],
  },
  'allergy-center': {
    labelOverrides: { 'lab-orders': 'Allergy Tests', 'results': 'Allergy Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'allergen-panels', label: 'Allergen Panels',  iconKey: 'FlaskConical' },
      { href: 'immunotherapy',   label: 'Immunotherapy',    iconKey: 'Activity' },
    ],
  },
  'sleep-lab': {
    labelOverrides: { 'lab-orders': 'Sleep Studies', 'results': 'PSG Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'psg',            label: 'Polysomnography',  iconKey: 'Activity' },
      { href: 'cpap-titration', label: 'CPAP Titration',   iconKey: 'Activity' },
    ],
  },
  'audiology-center': {
    labelOverrides: { 'lab-orders': 'Hearing Tests', 'results': 'Audiology Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'audiometry', label: 'Audiometry',       iconKey: 'Activity' },
      { href: 'bera',       label: 'BERA / OAE',       iconKey: 'Activity' },
    ],
  },
  'urodynamics-center': {
    labelOverrides: { 'lab-orders': 'Urodynamic Bookings', 'results': 'Urodynamic Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'urodynamics', label: 'Urodynamic Studies', iconKey: 'Activity' },
    ],
  },
  'endoscopy-center': {
    labelOverrides: { 'lab-orders': 'Endoscopy Bookings', 'results': 'Endoscopy Reports' },
    hideItems: ['collection','qc','inventory','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'video-capture', label: 'Video Capture',  iconKey: 'Video' },
      { href: 'sedation-log',  label: 'Sedation Log',   iconKey: 'Clock' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // Group F — Specialty & Advanced (IVF, stem cell, forensic, cancer screening)
  // ═════════════════════════════════════════════════════════════════════════
  'ivf-embryology': {
    labelOverrides: { 'lab-orders': 'IVF Cycles', 'patients': 'Couples', 'results': 'Cycle Reports' },
    hideItems: ['collection','qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab'],
    extraItems: [
      { href: 'cycles',           label: 'Cycle Tracking',     iconKey: 'Calendar' },
      { href: 'cryopreservation', label: 'Cryopreservation',   iconKey: 'Shield' },
      { href: 'casa',             label: 'CASA (Andrology)',   iconKey: 'Activity' },
      { href: 'art-act',          label: 'ART Act Register',   iconKey: 'FileText' },
    ],
  },
  'stem-cell-registry': {
    labelOverrides: { 'lab-orders': 'Registry Orders', 'patients': 'Donors & Patients' },
    hideItems: ['collection','qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab'],
    extraItems: [
      { href: 'hla-typing', label: 'HLA Typing',   iconKey: 'FlaskConical' },
      { href: 'donors',     label: 'Donor Registry', iconKey: 'Users' },
      { href: 'wmda-sync',  label: 'WMDA Sync',    iconKey: 'Globe' },
    ],
  },
  'forensic-toxicology': {
    labelOverrides: { 'lab-orders': 'Forensic Samples', 'patients': 'Subjects', 'results': 'Forensic Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'chain-of-custody', label: 'Chain of Custody', iconKey: 'Lock' },
      { href: 'gc-ms',            label: 'GC-MS / LC-MS',    iconKey: 'FlaskConical' },
      { href: 'cdsco-reports',    label: 'CDSCO Reports',    iconKey: 'FileText' },
    ],
  },
  'cancer-screening': {
    labelOverrides: { 'lab-orders': 'Screening Orders', 'packages': 'Screening Packages' },
    hideItems: ['qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab'],
    extraItems: [
      { href: 'tumor-markers', label: 'Tumor Markers', iconKey: 'Activity' },
      { href: 'ai-scoring',    label: 'AI Risk Scoring', iconKey: 'TrendingUp' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // Group G — Hubs & Digital (DTC genomics; reference-lab + tele-rad above)
  // ═════════════════════════════════════════════════════════════════════════
  'dtc-genomics': {
    labelOverrides: { 'lab-orders': 'Kit Orders', 'patients': 'Customers', 'results': 'DNA Reports' },
    hideItems: ['qc','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','collection','inventory'],
    extraItems: [
      { href: 'kits',       label: 'Kit Logistics',       iconKey: 'Truck' },
      { href: 'dtc-portal', label: 'DTC Consumer Portal', iconKey: 'Globe' },
      { href: 'counseling', label: 'Genetic Counseling',  iconKey: 'Users' },
    ],
  },

  'pickup-point': {
    labelOverrides: { 'lab-orders': 'Handover Log' },
    hideItems: ['qc','results','catalog','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory','equipment','crm/doctors','crm/corporates','automation','rate-cards','tpa','analytics','staff','packages','compliance'],
  },
  'histopathology-lab': {
    labelOverrides: { 'lab-orders': 'Specimen Orders', 'results': 'Histopathology Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab'],
    extraItems: [
      { href: 'histopathology-lab', label: 'Grossing & Slides', iconKey: 'FlaskConical' },
      { href: 'ihc', label: 'IHC Panels', iconKey: 'FlaskConical' },
      { href: 'frozen-section', label: 'Frozen Section', iconKey: 'Clock' },
      { href: 'slide-scanning', label: 'Digital Slides', iconKey: 'Activity' },
    ],
  },
  'micro-lab': {
    labelOverrides: { 'lab-orders': 'Culture Orders', 'results': 'Sensitivity Reports' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'culture', label: 'Culture Tracking', iconKey: 'FlaskConical' },
      { href: 'antibiogram', label: 'Antibiogram', iconKey: 'Shield' },
      { href: 'icmr-naco', label: 'ICMR AMR Reports', iconKey: 'FileText' },
    ],
  },
  'blood-bank': {
    labelOverrides: { 'lab-orders': 'Blood Requests', 'patients': 'Donors & Recipients' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','catalog','qc'],
    extraItems: [
      { href: 'blood-bank', label: 'Blood Bank', iconKey: 'Heart' },
      { href: 'donors', label: 'Donor Management', iconKey: 'Users' },
      { href: 'crossmatch', label: 'Cross-Match', iconKey: 'Shield' },
      { href: 'icmr-naco', label: 'NACO Reporting', iconKey: 'FileText' },
    ],
  },
  'nuclear-medicine-center': {
    labelOverrides: { 'lab-orders': 'Study Orders', 'results': 'Nuclear Med Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','pndt-register'],
    extraItems: [
      { href: 'nuclear-medicine', label: 'Nuclear Medicine', iconKey: 'Activity' },
      { href: 'radiotracer-log', label: 'Isotope Log', iconKey: 'FlaskConical' },
      { href: 'rso-dashboard', label: 'RSO Dashboard', iconKey: 'Shield' },
      { href: 'barc-reporting', label: 'BARC Reports', iconKey: 'FileText' },
    ],
  },
  'mammography-center': {
    labelOverrides: { 'lab-orders': 'Mammography Orders', 'results': 'Mammography Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','radiotracer','pndt-register'],
    extraItems: [
      { href: 'bi-rads', label: 'BI-RADS Reporting', iconKey: 'Shield' },
      { href: 'compliance/mammo', label: 'Female Radiographer', iconKey: 'UserCheck' },
      { href: 'compliance/aerb', label: 'AERB Dose Log', iconKey: 'AlertTriangle' },
    ],
  },
  'dexa-center': {
    labelOverrides: { 'lab-orders': 'DEXA Orders', 'results': 'BMD Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','radiotracer','pndt-register','inventory'],
    extraItems: [
      { href: 'frax', label: 'FRAX Assessment', iconKey: 'Activity' },
    ],
  },
  'dental-radiology-center': {
    labelOverrides: { 'lab-orders': 'Scan Orders', 'results': 'Dental Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','radiotracer','pndt-register'],
    extraItems: [
      { href: 'opg-cbct', label: 'OPG / CBCT', iconKey: 'Activity' },
      { href: 'compliance/aerb', label: 'AERB Dose Log', iconKey: 'AlertTriangle' },
    ],
  },
  'ophthalmic-center': {
    labelOverrides: { 'lab-orders': 'Study Orders', 'results': 'Ophthalmic Reports' },
    hideItems: ['collection','qc','tmt-holter','cath-lab','genetic-counseling','radiotracer','pndt-register','inventory'],
    extraItems: [
      { href: 'oct-scans', label: 'OCT Scans', iconKey: 'Activity' },
      { href: 'perimetry', label: 'Visual Fields', iconKey: 'Activity' },
      { href: 'fundus-photo', label: 'Fundus Photo', iconKey: 'Activity' },
    ],
  },
  'pft-center': {
    labelOverrides: { 'lab-orders': 'PFT Orders', 'results': 'PFT Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','cath-lab','genetic-counseling','inventory'],
    extraItems: [
      { href: 'spirometry', label: 'Spirometry', iconKey: 'Activity' },
    ],
  },
  'neurophysiology-center': {
    labelOverrides: { 'lab-orders': 'Study Orders', 'results': 'Neuro Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','cath-lab','genetic-counseling','inventory'],
    extraItems: [
      { href: 'waveforms', label: 'Waveforms', iconKey: 'Activity' },
    ],
  },
  'allergy-center': {
    labelOverrides: { 'lab-orders': 'Test Orders', 'results': 'Allergy Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'allergen-panels', label: 'Allergen Panels', iconKey: 'FlaskConical' },
      { href: 'immunotherapy', label: 'Immunotherapy', iconKey: 'Shield' },
    ],
  },
  'sleep-lab': {
    labelOverrides: { 'lab-orders': 'PSG Orders', 'results': 'Sleep Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','cath-lab','genetic-counseling','inventory','catalog'],
    extraItems: [
      { href: 'psg', label: 'Sleep Studies', iconKey: 'Activity' },
      { href: 'cpap-titration', label: 'CPAP Titration', iconKey: 'Activity' },
    ],
  },
  'audiology-center': {
    labelOverrides: { 'lab-orders': 'Test Orders', 'results': 'Audiology Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory'],
    extraItems: [
      { href: 'audiometry', label: 'Audiometry', iconKey: 'Activity' },
      { href: 'bera', label: 'BERA / OAE', iconKey: 'Activity' },
    ],
  },
  'urodynamics-center': {
    labelOverrides: { 'lab-orders': 'Study Orders', 'results': 'Urodynamics Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','inventory','catalog'],
    extraItems: [
      { href: 'urodynamics', label: 'Urodynamics', iconKey: 'Activity' },
    ],
  },
  'endoscopy-center': {
    labelOverrides: { 'lab-orders': 'Procedure Orders', 'results': 'Endoscopy Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling'],
    extraItems: [
      { href: 'endoscopy-center', label: 'Endoscopy', iconKey: 'Activity' },
      { href: 'video-capture', label: 'Video Capture', iconKey: 'Video' },
      { href: 'sedation-log', label: 'Sedation Log', iconKey: 'Shield' },
    ],
  },
  'ivf-embryology': {
    labelOverrides: { 'lab-orders': 'IVF Orders', 'results': 'Embryology Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','qc','inventory'],
    extraItems: [
      { href: 'cycles', label: 'IVF Cycles', iconKey: 'Heart' },
      { href: 'ivf-embryology-lab', label: 'Embryology Lab', iconKey: 'FlaskConical' },
      { href: 'cryopreservation', label: 'Cryopreservation', iconKey: 'Shield' },
      { href: 'art-act', label: 'ART Act Compliance', iconKey: 'ShieldCheck' },
    ],
  },
  'stem-cell-registry': {
    labelOverrides: { 'lab-orders': 'HLA Orders', 'results': 'HLA Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','qc','inventory'],
    extraItems: [
      { href: 'hla-typing', label: 'HLA Typing', iconKey: 'FlaskConical' },
      { href: 'stem-cell-hla-lab', label: 'Stem Cell Lab', iconKey: 'FlaskConical' },
      { href: 'wmda-sync', label: 'WMDA/DATRI Sync', iconKey: 'Globe' },
    ],
  },
  'forensic-toxicology': {
    labelOverrides: { 'lab-orders': 'Case Orders', 'results': 'Toxicology Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','qc'],
    extraItems: [
      { href: 'chain-of-custody', label: 'Chain of Custody', iconKey: 'Shield' },
      { href: 'gc-ms', label: 'GC-MS / LC-MS', iconKey: 'FlaskConical' },
      { href: 'forensic-toxicology-lab', label: 'Toxicology Lab', iconKey: 'FlaskConical' },
    ],
  },
  'cancer-screening': {
    labelOverrides: { 'lab-orders': 'Screening Orders', 'packages': 'Screening Panels' },
    hideItems: ['dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','qc'],
    extraItems: [
      { href: 'tumor-markers', label: 'Tumor Markers', iconKey: 'FlaskConical' },
      { href: 'ai-scoring', label: 'AI Risk Scoring', iconKey: 'Star' },
    ],
  },
  'tele-radiology': {
    labelOverrides: { 'lab-orders': 'Reading Queue' },
    hideItems: ['collection','qc','inventory','tmt-holter','cath-lab','genetic-counseling','radiotracer','pndt-register','packages'],
    extraItems: [
      { href: 'reading-worklist', label: 'Reading Worklist', iconKey: 'ClipboardList' },
      { href: 'radiologist-panel', label: 'Radiologist Panel', iconKey: 'Users' },
      { href: 'dicom-viewer', label: 'DICOM Viewer', iconKey: 'Activity' },
      { href: 'sla-monitor', label: 'SLA Monitor', iconKey: 'Clock' },
      { href: 'client-centers', label: 'Client Centers', iconKey: 'Building2' },
    ],
  },
  'dtc-genomics': {
    labelOverrides: { 'lab-orders': 'Kit Orders', 'results': 'Genomics Reports' },
    hideItems: ['collection','dicom-viewer','pndt-register','radiotracer','tmt-holter','cath-lab','genetic-counseling','qc','inventory'],
    extraItems: [
      { href: 'kit-logistics', label: 'Kit Logistics', iconKey: 'Truck' },
      { href: 'dtc-consumer', label: 'Consumer Portal', iconKey: 'Globe' },
      { href: 'dtc-genomics', label: 'Genomics Lab', iconKey: 'FlaskConical' },
    ],
  },
};

/**
 * Get the customised nav config for a tenant's subtype.
 */
export function getSubtypeNavConfig(subtype?: string): SubtypeNavConfig {
  if (!subtype) return {};
  return DIAG_SUBTYPE_NAV[subtype] ?? {};
}
