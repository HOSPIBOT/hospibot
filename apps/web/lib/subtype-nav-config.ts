/**
 * SUBTYPE-SPECIFIC NAVIGATION
 * 
 * Controls which sidebar items each diagnostic subtype sees.
 * Items not listed are hidden. Order determines sidebar order.
 * 
 * 'label' overrides the default menu label (e.g., "Scans" instead of "Lab Orders")
 */

export interface NavItem {
  path: string;
  label?: string;     // override default label
  icon?: string;       // override default icon
  tierMin?: 'small' | 'medium' | 'large' | 'enterprise'; // minimum tier to see this item
}

type SubtypeNavMap = Record<string, NavItem[]>;

// Common items all subtypes get
const COMMON: NavItem[] = [
  { path: '/diagnostic/dashboard' },
  { path: '/diagnostic/patients' },
  { path: '/diagnostic/billing' },
  { path: '/diagnostic/analytics' },
  { path: '/diagnostic/whatsapp' },
  { path: '/diagnostic/staff', tierMin: 'medium' },
  { path: '/diagnostic/settings' },
];

export const SUBTYPE_NAV: SubtypeNavMap = {

  // ── COLLECTION ─────────────────────────────────────────────────────────
  'sample-collection-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/collection', label: 'Sample Collection' },
    { path: '/diagnostic/dispatch', label: 'Runner Dispatch' },
    { path: '/diagnostic/route-planning', label: 'Route Planning', tierMin: 'large' },
    { path: '/diagnostic/hub-spoke', label: 'Hub-Spoke Transfer', tierMin: 'medium' },
    { path: '/diagnostic/franchise-labs', label: 'Franchise Centers', tierMin: 'large' },
    ...COMMON.slice(2),
  ],

  'pickup-point': [
    { path: '/diagnostic/dashboard' },
    { path: '/diagnostic/patients' },
    { path: '/diagnostic/collection', label: 'Sample Handover' },
    { path: '/diagnostic/billing' },
    { path: '/diagnostic/whatsapp' },
    { path: '/diagnostic/settings' },
  ],

  'home-sample-collection': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/collection', label: 'Bookings' },
    { path: '/diagnostic/field-agents', label: 'Field Agents' },
    { path: '/diagnostic/route-planning', label: 'Routes', tierMin: 'large' },
    { path: '/diagnostic/cold-chain', label: 'Cold Chain Log', tierMin: 'medium' },
    ...COMMON.slice(2),
  ],

  // ── PATHOLOGY ──────────────────────────────────────────────────────────
  'pathology-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Lab Orders' },
    { path: '/diagnostic/catalog', label: 'Test Catalog' },
    { path: '/diagnostic/results', label: 'Results' },
    { path: '/diagnostic/qc', label: 'Quality Control', tierMin: 'large' },
    { path: '/diagnostic/collection', label: 'Sample Collection' },
    { path: '/diagnostic/crm/doctors', label: 'Doctor CRM', tierMin: 'medium' },
    { path: '/diagnostic/rate-cards', label: 'Rate Cards' },
    { path: '/diagnostic/tpa', label: 'TPA/Insurance', tierMin: 'medium' },
    { path: '/diagnostic/inventory', label: 'Reagent Inventory', tierMin: 'large' },
    { path: '/diagnostic/equipment', label: 'Equipment' },
    { path: '/diagnostic/analyzer-interface', label: 'Analyzer Interface', tierMin: 'medium' },
    { path: '/diagnostic/compliance', label: 'Compliance' },
    ...COMMON.slice(2),
  ],

  'histopathology-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Specimen Orders' },
    { path: '/diagnostic/histopathology-lab', label: 'Grossing & Slides' },
    { path: '/diagnostic/ihc', label: 'IHC Panels', tierMin: 'medium' },
    { path: '/diagnostic/frozen-section', label: 'Frozen Section', tierMin: 'medium' },
    { path: '/diagnostic/slide-scanning', label: 'Digital Slides', tierMin: 'large' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'molecular-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'PCR Orders' },
    { path: '/diagnostic/batch-processing', label: 'Batch Processing' },
    { path: '/diagnostic/results', label: 'Results' },
    { path: '/diagnostic/ngs-workflow', label: 'NGS Workflow', tierMin: 'large' },
    { path: '/diagnostic/biosafety', label: 'Biosafety' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/gov-reporting', label: 'Gov Reporting', tierMin: 'large' },
    { path: '/diagnostic/analyzer-interface', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'micro-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Culture Orders' },
    { path: '/diagnostic/culture', label: 'Culture Tracking' },
    { path: '/diagnostic/antibiogram', label: 'Antibiogram' },
    { path: '/diagnostic/results' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/biosafety' },
    { path: '/diagnostic/icmr-naco', label: 'ICMR/AMR Reporting', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'genetic-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Test Orders' },
    { path: '/diagnostic/genetic-counseling', label: 'Counseling' },
    { path: '/diagnostic/results' },
    { path: '/diagnostic/pedigree-builder', label: 'Pedigree Builder', tierMin: 'large' },
    { path: '/diagnostic/variant-database', label: 'Variant Database', tierMin: 'large' },
    { path: '/diagnostic/ngs-workflow', label: 'NGS Pipeline', tierMin: 'large' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'blood-bank': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/blood-bank', label: 'Blood Bank' },
    { path: '/diagnostic/donors', label: 'Donor Management' },
    { path: '/diagnostic/crossmatch', label: 'Cross-Match' },
    { path: '/diagnostic/dispatch', label: 'Transfusion Dispatch' },
    { path: '/diagnostic/icmr-naco', label: 'NACO Reporting' },
    { path: '/diagnostic/health-camps', label: 'Blood Camps', tierMin: 'medium' },
    { path: '/diagnostic/inventory', label: 'Blood Inventory' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  // ── IMAGING ────────────────────────────────────────────────────────────
  'radiology-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Scan Orders' },
    { path: '/diagnostic/dicom-viewer', label: 'DICOM Viewer' },
    { path: '/diagnostic/reading-worklist', label: 'Reading Worklist', tierMin: 'medium' },
    { path: '/diagnostic/radiologist-panel', label: 'Radiologist Panel', tierMin: 'medium' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment', label: 'Equipment/Modalities' },
    { path: '/diagnostic/compliance/aerb', label: 'AERB Dose Log' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'ultrasound-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'USG Bookings' },
    { path: '/diagnostic/ob-growth-scan', label: 'Obstetric Scans' },
    { path: '/diagnostic/sonologist-panel', label: 'Sonologist Panel', tierMin: 'medium' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/pndt-register', label: 'PNDT Register' },
    { path: '/diagnostic/compliance/form-f', label: 'Form F (PC-PNDT)' },
    { path: '/diagnostic/compliance/pregnancy', label: 'Pregnancy Screening' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'pet-scan-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'PET Bookings' },
    { path: '/diagnostic/radiotracer-log', label: 'Radiotracer Log' },
    { path: '/diagnostic/rso-dashboard', label: 'RSO Dashboard', tierMin: 'medium' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance/aerb', label: 'AERB Dose Log' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'nuclear-medicine-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Study Bookings' },
    { path: '/diagnostic/nuclear-medicine', label: 'Nuclear Medicine' },
    { path: '/diagnostic/radiotracer-log', label: 'Isotope Log' },
    { path: '/diagnostic/rso-dashboard', label: 'RSO Dashboard', tierMin: 'medium' },
    { path: '/diagnostic/barc-reporting', label: 'BARC Reports', tierMin: 'large' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance/aerb', label: 'AERB Dose Log' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'mammography-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Mammography Bookings' },
    { path: '/diagnostic/bi-rads', label: 'BI-RADS Reporting' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance/mammo', label: 'Female Radiographer' },
    { path: '/diagnostic/compliance/aerb', label: 'AERB Dose Log' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'dexa-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'DEXA Bookings' },
    { path: '/diagnostic/frax', label: 'FRAX Assessment' },
    { path: '/diagnostic/results', label: 'BMD Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'dental-radiology-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Scan Bookings' },
    { path: '/diagnostic/opg-cbct', label: 'OPG / CBCT' },
    { path: '/diagnostic/dental-radiology', label: 'Dental Imaging' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance/aerb', label: 'AERB Dose Log' },
    { path: '/diagnostic/compliance/pregnancy', label: 'Pregnancy Screen' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'ophthalmic-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Study Bookings' },
    { path: '/diagnostic/oct-scans', label: 'OCT Scans' },
    { path: '/diagnostic/perimetry', label: 'Visual Fields' },
    { path: '/diagnostic/fundus-photo', label: 'Fundus Photo', tierMin: 'medium' },
    { path: '/diagnostic/ophthalmic-diagnostics', label: 'All Studies' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  // ── PHYSIOLOGICAL ──────────────────────────────────────────────────────
  'cardiac-diagnostics': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Study Bookings' },
    { path: '/diagnostic/tmt-stress', label: 'TMT / Stress Test', tierMin: 'medium' },
    { path: '/diagnostic/holter-allocation', label: 'Holter/ABPM', tierMin: 'medium' },
    { path: '/diagnostic/abpm-reports', label: 'ABPM Reports', tierMin: 'medium' },
    { path: '/diagnostic/cath-lab-schedule', label: 'Cath Lab', tierMin: 'large' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'pft-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'PFT Bookings' },
    { path: '/diagnostic/spirometry', label: 'Spirometry' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'neurophysiology-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Study Bookings' },
    { path: '/diagnostic/waveforms', label: 'Waveforms' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'allergy-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Test Bookings' },
    { path: '/diagnostic/allergen-panels', label: 'Allergen Panels' },
    { path: '/diagnostic/immunotherapy', label: 'Immunotherapy', tierMin: 'large' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/inventory', label: 'Allergen Inventory', tierMin: 'large' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'sleep-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'PSG Bookings' },
    { path: '/diagnostic/psg', label: 'Sleep Studies' },
    { path: '/diagnostic/cpap-titration', label: 'CPAP Titration', tierMin: 'medium' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'audiology-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Test Bookings' },
    { path: '/diagnostic/audiometry', label: 'Audiometry' },
    { path: '/diagnostic/bera', label: 'BERA/OAE', tierMin: 'medium' },
    { path: '/diagnostic/audiology-center', label: 'All Tests' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'urodynamics-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Study Bookings' },
    { path: '/diagnostic/urodynamics', label: 'Urodynamics' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'endoscopy-center': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Procedure Bookings' },
    { path: '/diagnostic/endoscopy-center', label: 'Endoscopy' },
    { path: '/diagnostic/video-capture', label: 'Video Capture', tierMin: 'medium' },
    { path: '/diagnostic/sedation-log', label: 'Sedation Log' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/equipment' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  // ── PACKAGES ───────────────────────────────────────────────────────────
  'health-checkup': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/packages', label: 'Health Packages' },
    { path: '/diagnostic/lab-orders', label: 'Bookings' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/hra', label: 'Health Risk Score', tierMin: 'large' },
    { path: '/diagnostic/consult-schedule', label: 'Doctor Consult', tierMin: 'medium' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/population-health', label: 'Population Health', tierMin: 'enterprise' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'corporate-screening': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/packages', label: 'Screening Packages' },
    { path: '/diagnostic/employer-portal', label: 'Employer Portal', tierMin: 'medium' },
    { path: '/diagnostic/health-camps', label: 'Health Camps', tierMin: 'medium' },
    { path: '/diagnostic/lab-orders', label: 'Bookings' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/crm/corporates', label: 'Corporate CRM', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  // ── SPECIALTY ──────────────────────────────────────────────────────────
  'ivf-embryology': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/cycles', label: 'IVF Cycles' },
    { path: '/diagnostic/ivf-embryology-lab', label: 'Embryology Lab' },
    { path: '/diagnostic/casa', label: 'Semen Analysis', tierMin: 'large' },
    { path: '/diagnostic/cryopreservation', label: 'Cryopreservation', tierMin: 'medium' },
    { path: '/diagnostic/art-act', label: 'ART Act Compliance' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'stem-cell-registry': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/hla-typing', label: 'HLA Typing' },
    { path: '/diagnostic/stem-cell-hla-lab', label: 'Stem Cell Lab' },
    { path: '/diagnostic/wmda-sync', label: 'WMDA/DATRI Sync', tierMin: 'large' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'forensic-toxicology': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/lab-orders', label: 'Case Orders' },
    { path: '/diagnostic/chain-of-custody', label: 'Chain of Custody' },
    { path: '/diagnostic/gc-ms', label: 'GC-MS/LC-MS', tierMin: 'medium' },
    { path: '/diagnostic/forensic-toxicology-lab', label: 'Toxicology Lab' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'cancer-screening': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/packages', label: 'Screening Panels' },
    { path: '/diagnostic/tumor-markers', label: 'Tumor Markers' },
    { path: '/diagnostic/ai-scoring', label: 'AI Risk Scoring', tierMin: 'medium' },
    { path: '/diagnostic/lab-orders', label: 'Bookings' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/crm/doctors', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  // ── HUBS & DIGITAL ────────────────────────────────────────────────────
  'reference-lab': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/hub-spoke', label: 'Hub-Spoke' },
    { path: '/diagnostic/partner-labs', label: 'Partner Labs', tierMin: 'medium' },
    { path: '/diagnostic/client-centers', label: 'Client Centers', tierMin: 'medium' },
    { path: '/diagnostic/franchise-labs', label: 'Franchise Mgmt', tierMin: 'large' },
    { path: '/diagnostic/sla-monitor', label: 'SLA Monitor', tierMin: 'large' },
    { path: '/diagnostic/lab-orders' },
    { path: '/diagnostic/results' },
    { path: '/diagnostic/catalog' },
    { path: '/diagnostic/qc', tierMin: 'large' },
    { path: '/diagnostic/analyzer-interface', tierMin: 'medium' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'tele-radiology': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/reading-worklist', label: 'Reading Worklist' },
    { path: '/diagnostic/radiologist-panel', label: 'Radiologist Panel' },
    { path: '/diagnostic/dicom-viewer', label: 'DICOM Viewer' },
    { path: '/diagnostic/sla-monitor', label: 'SLA Monitor', tierMin: 'medium' },
    { path: '/diagnostic/client-centers', label: 'Client Centers', tierMin: 'medium' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],

  'dtc-genomics': [
    ...COMMON.slice(0, 2),
    { path: '/diagnostic/kit-logistics', label: 'Kit Logistics' },
    { path: '/diagnostic/dtc-consumer', label: 'Consumer Portal', tierMin: 'medium' },
    { path: '/diagnostic/dtc-genomics', label: 'Genomics Lab' },
    { path: '/diagnostic/lab-orders', label: 'Kit Orders' },
    { path: '/diagnostic/results', label: 'Reports' },
    { path: '/diagnostic/compliance' },
    ...COMMON.slice(2),
  ],
};

/** Get nav items for a subtype, with tier filtering */
export function getNavForSubtype(subtypeSlug: string | null, tierKey: string | null): NavItem[] {
  const tierOrder = { small: 0, medium: 1, large: 2, enterprise: 3 };
  const currentTier = tierOrder[tierKey as keyof typeof tierOrder] ?? 0;

  const nav = subtypeSlug && SUBTYPE_NAV[subtypeSlug]
    ? SUBTYPE_NAV[subtypeSlug]
    : SUBTYPE_NAV['pathology-lab']; // default fallback

  return nav.filter(item => {
    if (!item.tierMin) return true;
    return currentTier >= (tierOrder[item.tierMin] ?? 0);
  });
}
