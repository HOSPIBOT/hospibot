/**
 * SUBTYPE-SPECIFIC TIER FEATURES
 * 
 * Each subtype gets unique feature lists per tier, reflecting what's actually
 * relevant to that lab type. A Pathology Lab doesn't need DICOM viewer,
 * and a Radiology Center doesn't need Culture TAT tracking.
 * 
 * Structure: subtypeSlug → { category → Feature[] per tier }
 * If a subtype isn't listed, falls back to 'default' (generic diagnostic)
 */

export interface TierFeature {
  name: string;
  starter: boolean;
  growth: boolean;
  professional: boolean;
  enterprise: boolean;
}

export interface FeatureCategory {
  category: string;
  features: TierFeature[];
}

type SubtypeFeatureMap = Record<string, FeatureCategory[]>;

// ─── COMMON FEATURES (shared across ALL subtypes) ───────────────────────────
const COMMON_CORE: TierFeature[] = [
  { name: 'Patient registration & search', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'PDF report generation', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'Basic analytics dashboard', starter: true, growth: false, professional: false, enterprise: false },
  { name: 'Advanced KPI dashboard', starter: false, growth: true, professional: true, enterprise: true },
  { name: 'Multi-branch dashboard', starter: false, growth: false, professional: true, enterprise: true },
];

const COMMON_BILLING: TierFeature[] = [
  { name: 'GST invoicing', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'Walk-in cash billing', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'Razorpay payment links', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'TPA / insurance billing', starter: false, growth: true, professional: true, enterprise: true },
  { name: 'Tally accounting export', starter: false, growth: true, professional: true, enterprise: true },
  { name: 'Revenue sharing & franchise billing', starter: false, growth: false, professional: false, enterprise: true },
];

const COMMON_COMMS: TierFeature[] = [
  { name: 'Report delivery via WhatsApp', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'Appointment reminders', starter: true, growth: true, professional: true, enterprise: true },
  { name: 'Patient self-service chatbot', starter: false, growth: true, professional: true, enterprise: true },
  { name: 'Doctor referral notifications', starter: false, growth: true, professional: true, enterprise: true },
];

const COMMON_SUPPORT: TierFeature[] = [
  { name: 'Email support (48hr SLA)', starter: true, growth: false, professional: false, enterprise: false },
  { name: 'Email + chat support (24hr)', starter: false, growth: true, professional: false, enterprise: false },
  { name: 'Priority support (4hr SLA)', starter: false, growth: false, professional: true, enterprise: false },
  { name: 'Priority support (1hr SLA)', starter: false, growth: false, professional: false, enterprise: true },
  { name: 'Dedicated account manager', starter: false, growth: false, professional: false, enterprise: true },
];

// ─── SUBTYPE-SPECIFIC FEATURE MAPS ──────────────────────────────────────────

export const SUBTYPE_FEATURES: SubtypeFeatureMap = {

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP A: COLLECTION & LOGISTICS
  // ══════════════════════════════════════════════════════════════════════════

  'sample-collection-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Sample barcode printing & tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Runner dispatch & GPS tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Hub-spoke sample transfer log', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Franchise center management', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: [
      ...COMMON_COMMS,
      { name: 'Sample status SMS to patients', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Analytics & compliance', features: [
      { name: 'Daily collection volume reports', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Runner performance analytics', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Branch-wise collection reports', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'pickup-point': [
    { category: 'Core workflow', features: [
      { name: 'Minimal patient registration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Sample handover barcode scan', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'WhatsApp confirmation to patient', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Runner pickup scheduling', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      { name: 'Basic cash collection', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'UPI QR payment', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Daily settlement reports', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Analytics & compliance', features: [
      { name: 'Daily handover count', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'home-sample-collection': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Slot booking (time + location)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Phlebotomist GPS check-in/check-out', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Cold chain temperature log', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Route optimization (multi-stop)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Field agent mobile app', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      ...COMMON_BILLING,
      { name: 'Doorstep billing & digital receipt', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: [
      ...COMMON_COMMS,
      { name: 'Live ETA sharing with patient', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Analytics & compliance', features: [
      { name: 'Agent productivity reports', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Zone-wise demand heatmap', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP B: PATHOLOGY & LAB TESTING
  // ══════════════════════════════════════════════════════════════════════════

  'pathology-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Sample barcode tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Test catalog management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Result entry & approval workflow', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Critical value alerts', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Auto-validation rules', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Daily MIS summary', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Revenue + TAT reports', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'QC module (Westgard / Levey-Jennings)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'NABL document suite', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'EQAS external QC tracking', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'BMW daily waste log', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: [
      { name: 'HL7/ASTM analyzer interface', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Home collection module', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Doctor CRM & referral tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'HRMS & staff management', starter: false, growth: false, professional: true, enterprise: true },
      ...COMMON_SUPPORT,
    ]},
  ],

  'histopathology-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Specimen grossing & block/slide tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'IHC panel management', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Frozen section workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'CAP synoptic reporting (cancer)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Digital slide scanning integration', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Specimen TAT tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Block/slide inventory', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NABL histopathology accreditation docs', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'molecular-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Sample barcode + batch processing', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'RT-PCR / viral load result entry', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NGS workflow management', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'HPV genotyping panels', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Biosafety level declaration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Batch processing logs', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NABL molecular diagnostics docs', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Government reporting (IDSP, TB)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: [
      { name: 'HL7/ASTM analyzer interface', starter: false, growth: true, professional: true, enterprise: true },
      ...COMMON_SUPPORT,
    ]},
  ],

  'micro-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Culture inoculation & incubation tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Antibiogram (sensitivity reporting)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'AMR pattern tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Culture TAT tracking (24/48/72hr)', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'ICMR AMR notification compliance', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Biosafety waste management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NABL microbiology docs', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: [
      { name: 'HL7/ASTM analyzer interface', starter: false, growth: true, professional: true, enterprise: true },
      ...COMMON_SUPPORT,
    ]},
  ],

  'genetic-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Doctor-only test ordering', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Long TAT management (5-21 days)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Genetic counseling workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'ACMG variant classification', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Pedigree builder', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'NGS bioinformatics pipeline', starter: false, growth: false, professional: false, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Post-result counseling tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'VUS re-classification alerts', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Newborn screening panel config', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'blood-bank': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Donor registration & screening', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Blood group typing & antibody screen', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Component separation (PRBC/FFP/Platelets)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Cross-match & compatibility testing', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Transfusion dispatch & tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Blood camp management', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'TTI screening (HIV/HBV/HCV/Syphilis/Malaria)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NACO reporting compliance', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Blood expiry tracking & FIFO alerts', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Adverse transfusion reaction log', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP C: IMAGING & SCANS
  // ══════════════════════════════════════════════════════════════════════════

  'radiology-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Scan scheduling & equipment slots', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'DICOM viewer link integration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Radiologist sign-off workflow', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Reading worklist (pending reports)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Radiologist panel management', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'AERB radiation dose log (mandatory)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Equipment calibration tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'NABL radiology accreditation docs', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Dose reference level (DRL) monitoring', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: [
      { name: 'PACS/RIS integration', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Tele-radiology reporting', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Doctor CRM & referral tracking', starter: false, growth: true, professional: true, enterprise: true },
      ...COMMON_SUPPORT,
    ]},
  ],

  'ultrasound-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'USG scan scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Obstetric scan templates (NT/Anomaly/Growth)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Doppler study templates', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Sonologist panel & sign-off', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Compliance (PC-PNDT Act)', features: [
      { name: 'PC-PNDT Form F (MANDATORY hard-block)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Quarterly govt report export', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Pregnancy screening declaration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'PNDT register maintenance', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'pet-scan-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'PET-CT scan scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Radiotracer ordering & log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Blood glucose pre-check (FDG)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Isolation room scheduling', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'SUV calculation templates', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'AERB radiation dose log (mandatory)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Radiotracer inventory & decay log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'RSO (Radiation Safety Officer) dashboard', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'BARC reporting compliance', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'nuclear-medicine-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'SPECT/Gamma camera scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Thyroid uptake studies', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'I-131 therapy dose calculation', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Isolation room management', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'AERB dose log (mandatory)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Radioisotope inventory & decay tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'RSO dashboard', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'BARC reporting', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'mammography-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Mammography scan scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'BI-RADS structured reporting', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Annual screening recall system', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Tomosynthesis 3D imaging support', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Female radiographer enforcement (mandatory)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'AERB dose log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Mammography QC (ACR phantom)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Screening programme analytics', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'dexa-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'DEXA scan scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'BMD T-score & Z-score reporting', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'FRAX fracture risk assessment', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Body composition analysis', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Serial scan trending', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'WHO osteoporosis criteria compliance', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Equipment calibration tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'dental-radiology-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'OPG panoramic scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'CBCT 3D imaging workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Intraoral X-ray tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Dentist collaboration portal', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Lead apron & thyroid shield log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'AERB dose log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Pregnancy screening declaration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'ophthalmic-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'OCT retinal scan workflow', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Visual field perimetry', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Fundus photography & FFA', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'DR (Diabetic Retinopathy) grading', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'IOP tracking & glaucoma monitoring', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'IOLMaster biometry', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Signal strength quality checks', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Visual acuity trending', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP D: PHYSIOLOGICAL TESTING
  // ══════════════════════════════════════════════════════════════════════════

  'cardiac-diagnostics': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'ECG recording & interpretation', starter: true, growth: true, professional: true, enterprise: true },
      { name: '2D Echo scheduling & reporting', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'TMT Bruce protocol workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Holter monitor allocation (24/48h)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'ABPM (24hr blood pressure) reports', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Cath lab scheduling', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Device inventory (Holter/ABPM units)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Equipment cleaning/disinfection log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Defibrillator availability check', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Cardiologist review workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'pft-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Spirometry test & reporting', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'DLCO (diffusion capacity) testing', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'FeNO (exhaled nitric oxide)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'GOLD staging auto-calculation', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Pre/post bronchodilator comparison', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Serial PFT trending', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'ATS/ERS quality grading', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Equipment calibration log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Predicted vs actual auto-calc', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'neurophysiology-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'EEG study scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'EMG/NCS scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Evoked potential studies', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Waveform image upload & storage', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Neurologist review workflow', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Pre-study medication checklist', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Patient prep instruction delivery', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'allergy-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Skin prick test panel management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Patch test grid (48/72/96hr reads)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Specific IgE panel ordering', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Challenge test protocol workflow', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Immunotherapy planning & dosing', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Allergen extract expiry tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Anaphylaxis kit availability check', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'sleep-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Overnight PSG scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'AHI scoring & sleep staging', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'CPAP titration studies', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Home sleep testing (HST)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Sleep architecture report', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Room/bed allocation for overnight', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Equipment sanitization log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'audiology-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'PTA audiometry testing', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Tympanometry & impedance', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'BERA (brainstem evoked response)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'OAE (otoacoustic emissions)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'VNG (vestibular testing)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Hearing aid fitting & calibration', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Hearing loss grade classification', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Sound booth calibration log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'urodynamics-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Uroflowmetry testing', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Cystometry (filling/voiding)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Pressure-flow studies', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'BOOI index calculation', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'PVR (post-void residual) tracking', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Catheter sterilization log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'ICS standards compliance', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'endoscopy-center': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Upper GI endoscopy scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Colonoscopy scheduling', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'ERCP & bronchoscopy', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Video capture & image storage', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Biopsy tracking & histopath link', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Sedation log (dosage + monitoring)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Scope reprocessing/disinfection log', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Boston bowel prep score', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Adverse event documentation', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP E: HEALTH PACKAGES
  // ══════════════════════════════════════════════════════════════════════════

  'health-checkup': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Package builder (multi-test bundles)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Multi-test report compilation', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Doctor consultation slot booking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Annual recall & reminder system', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Health Risk Assessment (HRA) scoring', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Population health analytics', starter: false, growth: false, professional: false, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Package-wise revenue tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Seasonal package promotions', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'corporate-screening': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Employer portal & company onboarding', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Bulk employee booking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Health camp management', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Aggregate HR analytics (anonymized)', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Multi-company dashboard', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      ...COMMON_BILLING,
      { name: 'Per-company invoicing', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Employee utilization reports', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Data privacy compliance (anonymization)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP F: SPECIALTY & ADVANCED
  // ══════════════════════════════════════════════════════════════════════════

  'ivf-embryology': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'IVF cycle tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Semen analysis (count/motility/morphology)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'ICSI procedure logging', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Oocyte & embryo grading', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Cryopreservation tank management', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'CASA (computer-aided semen analysis)', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'ART Act 2021 compliance', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Witness verification for procedures', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Consent form management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Cryo tank temperature monitoring', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'stem-cell-registry': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'HLA typing (A/B/C/DRB1/DQB1)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Donor registry search (DATRI/WMDA)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'CD34+ cell count workflow', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Viability assay tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Cord blood banking workflow', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'WMDA data sync', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Cryopreservation logs', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'forensic-toxicology': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Chain of custody management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Seal integrity verification', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Drug screening (immunoassay)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'GC-MS/LC-MS confirmatory testing', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'MRO (Medical Review Officer) review', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Court-admissible report generation', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Evidence chain audit trail', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'NDPS Act compliance tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'cancer-screening': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Multi-test risk panel configuration', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'AI-assisted tumor marker scoring', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'BI-RADS / Bethesda integration', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Follow-up recall scheduling', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Population screening analytics', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: COMMON_BILLING },
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Cancer registry reporting', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'ICMR guidelines compliance', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP G: HUBS & DIGITAL
  // ══════════════════════════════════════════════════════════════════════════

  'reference-lab': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Hub-spoke sample routing', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Partner lab onboarding', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Franchise center management', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Client center portal', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Revenue sharing configuration', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'SLA monitoring per partner', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      ...COMMON_BILLING,
      { name: 'B2B invoicing (per partner lab)', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Multi-lab QC dashboard', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'NABL reference lab accreditation', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: [
      { name: 'HL7/ASTM from multiple analyzers', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'API marketplace for partner integration', starter: false, growth: false, professional: false, enterprise: true },
      ...COMMON_SUPPORT,
    ]},
  ],

  'tele-radiology': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Remote DICOM reading worklist', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Radiologist panel management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'State registration tracking per radiologist', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'SLA monitoring (report turnaround)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Auto-assignment based on modality/specialty', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      ...COMMON_BILLING,
      { name: 'Per-report billing to client centers', starter: false, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Report TAT monitoring', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Discrepancy tracking', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],

  'dtc-genomics': [
    { category: 'Core workflow', features: [
      ...COMMON_CORE,
      { name: 'Kit dispatch & tracking', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Saliva kit receive & barcode scan', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Consumer portal (results access)', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Ancestry results visualization', starter: false, growth: true, professional: true, enterprise: true },
      { name: 'Pharmacogenomics panel reports', starter: false, growth: false, professional: true, enterprise: true },
      { name: 'Wellness risk score dashboard', starter: false, growth: false, professional: true, enterprise: true },
    ]},
    { category: 'Billing & payments', features: [
      ...COMMON_BILLING,
      { name: 'E-commerce kit ordering', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'WhatsApp & comms', features: COMMON_COMMS },
    { category: 'Quality & compliance', features: [
      { name: 'Informed consent management', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Data privacy (genetic data)', starter: true, growth: true, professional: true, enterprise: true },
      { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
    ]},
    { category: 'Integrations & support', features: COMMON_SUPPORT },
  ],
};

// ─── DEFAULT FALLBACK (for any subtype not explicitly mapped) ────────────────
SUBTYPE_FEATURES['default'] = [
  { category: 'Core workflow', features: [
    ...COMMON_CORE,
    { name: 'Sample barcode tracking', starter: true, growth: true, professional: true, enterprise: true },
    { name: 'Test catalog management', starter: true, growth: true, professional: true, enterprise: true },
    { name: 'Result entry & approval', starter: true, growth: true, professional: true, enterprise: true },
  ]},
  { category: 'Billing & payments', features: COMMON_BILLING },
  { category: 'WhatsApp & comms', features: COMMON_COMMS },
  { category: 'Quality & compliance', features: [
    { name: 'Daily MIS summary', starter: true, growth: true, professional: true, enterprise: true },
    { name: 'Revenue reports', starter: true, growth: true, professional: true, enterprise: true },
    { name: 'NABL document suite', starter: false, growth: false, professional: true, enterprise: true },
    { name: 'Advanced analytics', starter: false, growth: true, professional: true, enterprise: true },
    { name: 'Regulatory guidance panel', starter: true, growth: true, professional: true, enterprise: true },
  ]},
  { category: 'Integrations & support', features: [
    { name: 'HL7/ASTM analyzer interface', starter: false, growth: true, professional: true, enterprise: true },
    { name: 'Home collection module', starter: false, growth: true, professional: true, enterprise: true },
    { name: 'Doctor CRM & referral tracking', starter: false, growth: true, professional: true, enterprise: true },
    ...COMMON_SUPPORT,
  ]},
];

/** Get features for a subtype, falling back to 'default' */
export function getSubtypeFeatures(subtypeSlug: string | null): FeatureCategory[] {
  if (!subtypeSlug) return SUBTYPE_FEATURES['default'];
  return SUBTYPE_FEATURES[subtypeSlug] || SUBTYPE_FEATURES['default'];
}
