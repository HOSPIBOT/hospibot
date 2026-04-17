/**
 * Diagnostic Portal — Subtype-specific feature sets per tier
 * Deep domain analysis: each subtype has unique clinical workflows,
 * compliance needs, and operational scale metrics.
 */

export type DiagSubtype =
  | 'pathology-lab' | 'sample-collection' | 'home-collection'
  | 'radiology-center' | 'ultrasound-center' | 'pet-scan'
  | 'cardiac-diagnostics' | 'molecular-lab' | 'health-checkup'
  | 'corporate-screening' | 'genetic-lab' | 'reference-lab'
  | 'tele-radiology';

export interface SubtypeTierData {
  scaleLabel: string;       // what "volume" means for this subtype (samples/scans/patients)
  scaleUnit: string;
  tiers: {
    small:      SubtypeTier;
    medium:     SubtypeTier;
    large:      SubtypeTier;
    enterprise: SubtypeTier;
  };
}

export interface SubtypeTier {
  scale: { label: string; value: string }[];
  features: string[];
  notIncluded: string[];
}

const SUBTYPE_DATA: Record<DiagSubtype, SubtypeTierData> = {

  // ─── PATHOLOGY / BLOOD TEST LAB ─────────────────────────────────────────────
  'pathology-lab': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',  value:'1 – 50'},
          {label:'Staff',          value:'1 – 5'},
          {label:'Analyzers',      value:'1 – 2'},
          {label:'Monthly Tests',  value:'Up to 1,500'},
          {label:'WA Credits',     value:'500 / month'},
        ],
        features: [
          'Test catalog — 500+ pre-loaded tests',
          'Sample registration & barcode printing',
          'Manual result entry with reference ranges',
          'Abnormal result flagging (H/L)',
          'PDF report with lab letterhead',
          'WhatsApp report delivery to patient',
          'GST-compliant billing & invoicing',
          'Daily collection & pending report',
          'Basic dashboard (today\'s samples)',
          'Email support',
        ],
        notIncluded: [
          'Analyser auto-import (HL7/ASTM)',
          'Critical value auto-alert',
          'Delta check (previous vs current)',
          'Home collection management',
          'Doctor CRM & referral tracking',
          'QC module (Westgard / Levey-Jennings)',
          'NABL compliance documentation',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',  value:'50 – 200'},
          {label:'Staff',          value:'5 – 20'},
          {label:'Analyzers',      value:'2 – 5'},
          {label:'Monthly Tests',  value:'Up to 6,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Small Lab',
          'Test catalog — 3,000+ tests with LOINC codes',
          'Critical value auto-alert to patient & doctor',
          'Delta check — previous vs current comparison',
          'Reflex testing (auto-add related tests)',
          'Panel & profile billing (CBC, LFT, KFT, lipid)',
          'Home collection management + GPS',
          'Doctor CRM & referral tracking',
          'Corporate wellness screening & bulk orders',
          'TPA / insurance claim submission',
          'Advanced analytics — TAT, test volume, revenue',
          'Chat + email support',
        ],
        notIncluded: [
          'Analyser HL7/ASTM interface',
          'QC module (Westgard / Levey-Jennings)',
          'NABL compliance documentation',
          'Multi-branch management',
          'Staff HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',  value:'200 – 1,000'},
          {label:'Staff',          value:'20 – 100'},
          {label:'Analyzers',      value:'5 – 20'},
          {label:'Monthly Tests',  value:'Up to 30,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium Lab',
          'HL7 / ASTM analyser auto-import',
          'QC module — Westgard rules + Levey-Jennings chart',
          'NABL compliance documentation & audit trail',
          'Multi-branch sample management',
          'Inter-branch test routing & transfer',
          'Reagent & consumable inventory management',
          'Staff HRMS, attendance & payroll',
          'Pathologist digital sign-off workflow',
          'EQA / PT tracking (external quality assurance)',
          'Chain analytics — branch comparison dashboard',
          'Priority support',
        ],
        notIncluded: [
          'Franchise management',
          'Hub-spoke partner lab routing',
          'Revenue sharing engine',
          'White-label reports',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',  value:'1,000+'},
          {label:'Staff',          value:'100+'},
          {label:'Analyzers',      value:'20+'},
          {label:'Monthly Tests',  value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large Lab',
          'Franchise & partner lab network management',
          'Hub-spoke sample routing & runner tracking',
          'Revenue sharing & royalty management',
          'White-label reports (partner lab branding)',
          'ABHA / ABDM health record submission',
          'ICMR / NACO / Nikshay government reporting',
          'API marketplace for aggregator integrations',
          'Dedicated account manager',
          'SLA-backed uptime guarantee',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── SAMPLE COLLECTION CENTER (PSC / PUP) ───────────────────────────────────
  'sample-collection': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',  value:'1 – 30'},
          {label:'Staff',          value:'1 – 3'},
          {label:'Partner Labs',   value:'1'},
          {label:'Monthly Orders', value:'Up to 900'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'Order receipt from walk-in patients',
          'Patient registration & barcode generation',
          'Sample packaging checklist',
          'Dispatch manifest to parent lab',
          'Status tracking — collected to dispatched',
          'WhatsApp collection confirmation to patient',
          'GST billing (pass-through to parent lab)',
          'Daily dispatch summary report',
          'Email support',
        ],
        notIncluded: [
          'Cold chain temperature monitoring',
          'Multi-lab routing',
          'Runner / transport tracking',
          'Online booking integration',
          'Doctor CRM',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',  value:'30 – 150'},
          {label:'Staff',          value:'3 – 10'},
          {label:'Partner Labs',   value:'1 – 3'},
          {label:'Monthly Orders', value:'Up to 4,500'},
          {label:'WA Credits',     value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          'Cold chain temperature monitoring log',
          'Online pre-booking for walk-in patients',
          'Multi-lab order routing (send to best lab)',
          'Runner assignment & transport tracking',
          'Report download by patient via WhatsApp link',
          'Referring doctor WhatsApp notification on report',
          'Package / profile booking (CBC, LFT, etc.)',
          'TPA orders from empanelled corporates',
          'Chat + email support',
        ],
        notIncluded: [
          'Full QC module',
          'NABL documentation',
          'Multi-branch management',
          'Staff HRMS',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',  value:'150 – 500'},
          {label:'Staff',          value:'10 – 40'},
          {label:'Partner Labs',   value:'3 – 10'},
          {label:'Monthly Orders', value:'Up to 15,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Multi-branch collection center management',
          'Centralized order dashboard across centers',
          'SLA tracking per partner lab',
          'Automated escalation on delayed reports',
          'Staff HRMS, shifts & attendance',
          'Collection efficiency analytics',
          'Priority support',
        ],
        notIncluded: [
          'Franchise management',
          'Revenue sharing',
          'White-label reports',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',  value:'500+'},
          {label:'Staff',          value:'40+'},
          {label:'Partner Labs',   value:'10+'},
          {label:'Monthly Orders', value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Franchise PSC network management',
          'Revenue sharing with franchise owners',
          'White-label patient-facing experience',
          'AI-powered route & zone optimization',
          'Aggregator (1mg, Practo) inbound API',
          'Dedicated account manager',
          'Custom SLA & compliance reporting',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── HOME COLLECTION ─────────────────────────────────────────────────────────
  'home-collection': {
    scaleLabel: 'Daily Bookings', scaleUnit: 'bookings/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Bookings', value:'1 – 20'},
          {label:'Agents',         value:'1 – 3'},
          {label:'Zones',          value:'1'},
          {label:'Monthly',        value:'Up to 600'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'Online booking via WhatsApp',
          'Slot management (morning / afternoon)',
          'Agent assignment & daily schedule',
          'Sample collection checklist',
          'Cold chain basic log (manual)',
          'Collection confirmation WhatsApp to patient',
          'Barcode handoff to partner lab',
          'GST billing & payment links on WhatsApp',
          'Email support',
        ],
        notIncluded: [
          'Real-time GPS tracking',
          'Multi-zone routing',
          'Automated route optimization',
          'Cold chain IoT monitoring',
          'Fleet management',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Bookings', value:'20 – 100'},
          {label:'Agents',         value:'3 – 15'},
          {label:'Zones',          value:'2 – 5'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'Real-time agent GPS tracking (shared with patient)',
          'Multi-zone booking & agent assignment',
          'Automated route suggestion for agents',
          'Cold chain temperature monitoring',
          'Agent mobile app (Android)',
          'Family booking (multiple members one visit)',
          'Report notification when ready',
          'Corporate home collection contracts',
          'Chat + email support',
        ],
        notIncluded: [
          'Advanced route optimization (AI)',
          'Fleet management',
          'Multi-city operations',
          'Franchise management',
        ],
      },
      large: {
        scale: [
          {label:'Daily Bookings', value:'100 – 500'},
          {label:'Agents',         value:'15 – 75'},
          {label:'Zones',          value:'5 – 20'},
          {label:'Monthly',        value:'Up to 15,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'AI-powered route optimization',
          'Fleet management & fuel tracking',
          'Multi-city / multi-hub operations',
          'Agent performance analytics',
          'Staff HRMS, attendance & incentive management',
          'NABL-compliant cold chain documentation',
          'Priority support',
        ],
        notIncluded: [
          'Franchise agent network',
          'Revenue sharing',
          'White-label patient app',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Bookings', value:'500+'},
          {label:'Agents',         value:'75+'},
          {label:'Zones',          value:'City-wide'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Franchise agent network management',
          'Revenue sharing per booking',
          'White-label patient-facing app',
          'Aggregator API integration (1mg, Practo)',
          'Dedicated account manager',
          'SLA dashboards for enterprise clients',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── RADIOLOGY CENTER ─────────────────────────────────────────────────────────
  'radiology-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',    value:'1 – 20'},
          {label:'Equipment',      value:'1 – 2 modalities'},
          {label:'Radiologists',   value:'1 – 2'},
          {label:'Monthly Scans',  value:'Up to 600'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'Scan appointment booking & scheduling',
          'Patient registration & preparation instructions',
          'Modality-wise slot management (X-Ray, USG)',
          'Report dictation → typed report template',
          'PDF radiology report with letterhead',
          'WhatsApp report delivery to patient & doctor',
          'PNDT Form F — basic digital register',
          'GST billing & payment links',
          'Email support',
        ],
        notIncluded: [
          'DICOM viewer integration',
          'Tele-radiology reporting',
          'Multiple radiologist workflow',
          'CT / MRI specific templates',
          'PNDT digital compliance audit trail',
          'Equipment utilization analytics',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',    value:'20 – 80'},
          {label:'Equipment',      value:'2 – 5 modalities'},
          {label:'Radiologists',   value:'2 – 8'},
          {label:'Monthly Scans',  value:'Up to 2,400'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'Multi-modality scheduling (X-Ray, USG, CT, MRI)',
          'DICOM viewer link in report (web viewer)',
          'Multiple radiologist assignment & worklist',
          'Radiologist sign-off & digital signature',
          'CT / MRI specific report templates',
          'PNDT Form F — full digital submission & audit trail',
          'Equipment-wise appointment slots',
          'Referring doctor portal & notification',
          'Corporate contract billing',
          'Chat + email support',
        ],
        notIncluded: [
          'DICOM PACS integration',
          'Tele-radiology routing',
          'AI-assisted reporting tools',
          'Multi-branch radiology',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',    value:'80 – 300'},
          {label:'Equipment',      value:'5+ modalities'},
          {label:'Radiologists',   value:'8 – 30'},
          {label:'Monthly Scans',  value:'Up to 9,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'DICOM PACS integration (Orthanc, dcm4chee)',
          'Tele-radiology routing to remote radiologists',
          'AI-assisted preliminary report flagging',
          'Full PNDT compliance — PC-PNDT Form F, audit, CA reports',
          'Equipment utilization & downtime analytics',
          'Multi-branch radiology management',
          'Staff HRMS & radiologist productivity reports',
          'Priority support',
        ],
        notIncluded: [
          'Multi-site PACS',
          'AI diagnostic modules',
          'Franchise radiology network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',    value:'300+'},
          {label:'Equipment',      value:'10+'},
          {label:'Radiologists',   value:'30+'},
          {label:'Monthly Scans',  value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Multi-site PACS & image archive',
          'AI diagnostic assistance (chest, bone age, mammography)',
          'Franchise radiology network management',
          'Hospital system integration (HL7/FHIR)',
          'AERB compliance documentation',
          'Dedicated account manager',
          'Custom integrations (HIS, RIS, PACS)',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── ULTRASOUND CENTER ────────────────────────────────────────────────────────
  'ultrasound-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',    value:'1 – 15'},
          {label:'Sonologists',    value:'1 – 2'},
          {label:'Machines',       value:'1'},
          {label:'Monthly',        value:'Up to 450'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'USG appointment scheduling',
          'Patient preparation instructions via WhatsApp',
          'Structured USG report templates (Abdomen, OB, Pelvis)',
          'PNDT Form F — digital basic register',
          'PDF report with letterhead & seal',
          'WhatsApp report delivery',
          'GST billing',
          'Email support',
        ],
        notIncluded: [
          '4D / Doppler specific templates',
          'Full PNDT digital compliance',
          'OB module with LMP / EDD calculator',
          'Referring doctor CRM',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',    value:'15 – 60'},
          {label:'Sonologists',    value:'2 – 5'},
          {label:'Machines',       value:'1 – 3'},
          {label:'Monthly',        value:'Up to 1,800'},
          {label:'WA Credits',     value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          'OB module — LMP / EDD / growth chart',
          'Doppler & 4D report templates',
          'PNDT Form F — digital submission + audit trail',
          'PC-PNDT compliance alert (declaration form)',
          'Referring doctor portal & CRM',
          'Multi-sonologist worklist & sign-off',
          'Corporate & maternity package billing',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-machine scheduling optimization',
          'NABL documentation',
          'Multi-branch management',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',    value:'60 – 200'},
          {label:'Sonologists',    value:'5 – 20'},
          {label:'Machines',       value:'3 – 10'},
          {label:'Monthly',        value:'Up to 6,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Multi-machine slot optimization',
          'NABL compliance documentation for USG',
          'Full PC-PNDT compliance suite (CA reports, Form F audit)',
          'Multi-branch ultrasound management',
          'Equipment utilization dashboard',
          'Staff HRMS',
          'Priority support',
        ],
        notIncluded: [
          'AI fetal anomaly screening tools',
          'Franchise network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',    value:'200+'},
          {label:'Sonologists',    value:'20+'},
          {label:'Machines',       value:'10+'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Franchise ultrasound network',
          'AI fetal anomaly screening tools',
          'Hospital-grade PNDT compliance reporting',
          'Dedicated account manager & compliance officer',
          'API integration with hospital systems',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── PET SCAN CENTER ─────────────────────────────────────────────────────────
  'pet-scan': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',    value:'1 – 5'},
          {label:'Staff',          value:'3 – 8'},
          {label:'Machines',       value:'1'},
          {label:'Monthly',        value:'Up to 100'},
          {label:'WA Credits',     value:'200 / month'},
        ],
        features: [
          'PET/CT scan appointment booking',
          'Patient prep instructions (fasting, blood glucose)',
          'Radiotracer dose log (FDG, other isotopes)',
          'Structured PET/CT report templates (oncology, cardiology, neurology)',
          'PDF report delivery via WhatsApp',
          'Referring oncologist / physician notification',
          'GST billing',
          'Radiation safety log (basic)',
          'Email support',
        ],
        notIncluded: [
          'DICOM PACS integration',
          'Multi-tracer inventory management',
          'AERB compliance automation',
          'Tele-nuclear medicine reading',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',    value:'5 – 15'},
          {label:'Staff',          value:'8 – 20'},
          {label:'Machines',       value:'1 – 2'},
          {label:'Monthly',        value:'Up to 300'},
          {label:'WA Credits',     value:'600 / month'},
        ],
        features: [
          'Everything in Small',
          'DICOM viewer link in report',
          'Multi-tracer inventory & dose management',
          'AERB radiation safety record keeping',
          'Oncologist CRM & referral tracking',
          'Insurance / TPA claims for PET-CT',
          'Therapy response assessment templates',
          'Chat + email support',
        ],
        notIncluded: [
          'DICOM PACS integration',
          'AI-assisted SUV analysis tools',
          'Multi-machine management',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',    value:'15 – 40'},
          {label:'Staff',          value:'20 – 60'},
          {label:'Machines',       value:'2 – 4'},
          {label:'Monthly',        value:'Up to 1,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'DICOM PACS integration',
          'Multi-machine scheduling optimization',
          'AERB full compliance documentation',
          'Nuclear medicine technologist workflow',
          'Multi-hospital referring center management',
          'Staff HRMS & dosimetry records',
          'Priority support',
        ],
        notIncluded: [
          'AI quantification tools',
          'Theranostics workflow',
          'Multi-center network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',    value:'40+'},
          {label:'Staff',          value:'60+'},
          {label:'Machines',       value:'4+'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'AI-assisted SUV quantification tools',
          'Theranostics (PSMA, DOTATATE) workflow',
          'Multi-center nuclear medicine network',
          'Hospital oncology center integration',
          'Dedicated account manager',
          'AERB national reporting automation',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── CARDIAC DIAGNOSTICS ─────────────────────────────────────────────────────
  'cardiac-diagnostics': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Patients', value:'1 – 25'},
          {label:'Cardiologists',  value:'1 – 2'},
          {label:'Equipment',      value:'ECG + basic'},
          {label:'Monthly',        value:'Up to 750'},
          {label:'WA Credits',     value:'400 / month'},
        ],
        features: [
          'Cardiac appointment booking (ECG, Echo, TMT)',
          'Structured ECG report templates',
          'Basic Echo report templates',
          'PDF report with cardiologist sign-off',
          'WhatsApp report delivery to patient & physician',
          'GST billing',
          'Referring cardiologist notification',
          'Email support',
        ],
        notIncluded: [
          'Holter monitoring workflow',
          'Stress test (TMT) dedicated module',
          'Cath lab scheduling',
          'ICAD / ABI vascular study templates',
          'Cardiac risk stratification tools',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Patients', value:'25 – 100'},
          {label:'Cardiologists',  value:'2 – 8'},
          {label:'Equipment',      value:'ECG, Echo, TMT, Holter'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'TMT / Stress Echo — dedicated workflow & templates',
          'Holter monitor allocation & 24/48h report',
          'ICAD / ABI vascular study templates',
          'Multi-cardiologist worklist management',
          'Cardiac risk stratification scoring (Framingham)',
          'TPA / cashless claims for cardiac procedures',
          'Referral CRM — cardiologists, physicians, GPs',
          'Chat + email support',
        ],
        notIncluded: [
          'Cath lab scheduling',
          'EP study templates',
          'Multi-branch management',
        ],
      },
      large: {
        scale: [
          {label:'Daily Patients', value:'100 – 300'},
          {label:'Cardiologists',  value:'8 – 30'},
          {label:'Equipment',      value:'Full cardiac lab'},
          {label:'Monthly',        value:'Up to 9,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Cath lab scheduling & procedure logs',
          'EP study (electrophysiology) templates',
          'Cardiac rehab program management',
          'Multi-branch cardiac center management',
          'Staff HRMS, CME tracking',
          'Insurance & TPA — cardiac procedure codes',
          'Priority support',
        ],
        notIncluded: [
          'Cardiac registry integration',
          'AI ECG reading',
          'Hospital network integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Patients', value:'300+'},
          {label:'Cardiologists',  value:'30+'},
          {label:'Equipment',      value:'Full suite + Cath'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'AI ECG interpretation assistance',
          'National cardiac registry integration',
          'Hospital-grade FHIR integration',
          'Multi-hospital network management',
          'Dedicated account manager',
          'Clinical outcomes analytics',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── MOLECULAR / PCR LAB ─────────────────────────────────────────────────────
  'molecular-lab': {
    scaleLabel: 'Daily PCR Runs', scaleUnit: 'runs/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Runs',     value:'1 – 20 samples'},
          {label:'Staff',          value:'2 – 5'},
          {label:'Equipment',      value:'1 PCR machine'},
          {label:'Monthly',        value:'Up to 500'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'Sample registration (swab, blood, tissue)',
          'PCR test catalog (COVID, TB, STI panels)',
          'Biosafety level log & SOP checklist',
          'Batch processing (plate setup)',
          'Result interpretation — positive/negative/equivocal',
          'PDF report with Ct values',
          'WhatsApp report delivery',
          'GST billing',
          'Email support',
        ],
        notIncluded: [
          'ICMR / government reporting',
          'RT-PCR automation integration',
          'Multi-target panel management',
          'NABL molecular compliance',
          'NACO / Nikshay reporting',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Runs',     value:'20 – 100 samples'},
          {label:'Staff',          value:'5 – 15'},
          {label:'Equipment',      value:'2 – 4 PCR machines'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          'ICMR COVID reporting (automated)',
          'Multi-target panel management (mPCR)',
          'Reflex testing logic (positive → subtype)',
          'Turnaround time SLA per test type',
          'Critical result auto-notification',
          'Corporate & government bulk orders',
          'Chat + email support',
        ],
        notIncluded: [
          'RT-PCR instrument integration',
          'NABL molecular compliance',
          'NACO / Nikshay reporting',
          'Next-gen sequencing workflow',
        ],
      },
      large: {
        scale: [
          {label:'Daily Runs',     value:'100 – 500 samples'},
          {label:'Staff',          value:'15 – 50'},
          {label:'Equipment',      value:'4 – 15 instruments'},
          {label:'Monthly',        value:'Up to 15,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'RT-PCR / digital PCR instrument integration',
          'NABL molecular accreditation compliance',
          'NACO HIV reporting & NIKSHAY TB reporting',
          'Sequencing result upload & reporting',
          'Multi-batch tracking (AM / PM runs)',
          'Staff HRMS & biosafety certification tracker',
          'Priority support',
        ],
        notIncluded: [
          'NGS workflow management',
          'Bioinformatics pipeline integration',
          'Franchise molecular lab network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Runs',     value:'500+ samples'},
          {label:'Staff',          value:'50+'},
          {label:'Equipment',      value:'15+ instruments'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'NGS (WES / WGS / panel) workflow management',
          'Bioinformatics pipeline result import',
          'Multi-government reporting (ICMR, NACO, Nikshay, IDSP)',
          'Franchise molecular lab network',
          'Dedicated account manager',
          'Research collaboration module',
          'API for hospital LIS integration',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── HEALTH CHECKUP CENTER ────────────────────────────────────────────────────
  'health-checkup': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Patients', value:'1 – 30'},
          {label:'Staff',          value:'2 – 8'},
          {label:'Packages',       value:'3 – 5 checkup pkgs'},
          {label:'Monthly',        value:'Up to 900'},
          {label:'WA Credits',     value:'400 / month'},
        ],
        features: [
          'Pre-built checkup packages (Basic, Standard, Comprehensive)',
          'Patient appointment & fasting instruction via WhatsApp',
          'Multi-department coordination (pathology, radiology, ECG)',
          'Consolidated health checkup PDF report',
          'Doctor remarks & recommendations section',
          'WhatsApp report delivery',
          'GST billing & package invoicing',
          'Email support',
        ],
        notIncluded: [
          'Custom package builder',
          'Health risk assessment (HRA) tool',
          'Follow-up recommendation engine',
          'Corporate package management',
          'AI health summary generation',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Patients', value:'30 – 100'},
          {label:'Staff',          value:'8 – 25'},
          {label:'Packages',       value:'10 – 20 pkgs'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Small',
          'Custom package builder (any tests + any services)',
          'Health risk assessment (HRA) scoring',
          'Automated follow-up recommendations by report abnormals',
          'Corporate wellness packages & bulk billing',
          'Year-on-year health trend comparison',
          'Referring doctor & consultant CRM',
          'TPA / insurance cashless health checkups',
          'Chat + email support',
        ],
        notIncluded: [
          'Population health analytics',
          'Multi-branch checkup management',
          'White-label health reports',
        ],
      },
      large: {
        scale: [
          {label:'Daily Patients', value:'100 – 400'},
          {label:'Staff',          value:'25 – 100'},
          {label:'Packages',       value:'20+ custom pkgs'},
          {label:'Monthly',        value:'Up to 12,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Population health analytics dashboard',
          'Multi-branch checkup center management',
          'Hospital / specialist tie-up referral module',
          'Staff HRMS, nurse & technician management',
          'NABL compliance for checkup components',
          'Priority support',
        ],
        notIncluded: [
          'White-label health portal for corporate clients',
          'AI health summary & risk stratification',
          'Franchise network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Patients', value:'400+'},
          {label:'Staff',          value:'100+'},
          {label:'Packages',       value:'Unlimited'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'White-label corporate health portal (employer branding)',
          'AI-generated health summary & risk stratification',
          'Franchise checkup center network',
          'Insurance & government scheme integration (Ayushman Bharat)',
          'Dedicated account manager',
          'API for employer HRMS integration',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── CORPORATE WELLNESS SCREENING ────────────────────────────────────────────
  'corporate-screening': {
    scaleLabel: 'Employees / Month', scaleUnit: 'employees/month',
    tiers: {
      small: {
        scale: [
          {label:'Employees/Month', value:'50 – 500'},
          {label:'Corporate Clients',value:'1 – 5'},
          {label:'Staff',           value:'3 – 10'},
          {label:'Packages',        value:'3 – 5'},
          {label:'WA Credits',      value:'500 / month'},
        ],
        features: [
          'Bulk employee booking management',
          'Group appointment scheduling (camp mode)',
          'Corporate-specific test packages',
          'Individual PDF report per employee',
          'Employer aggregate summary report',
          'WhatsApp individual report delivery',
          'Corporate GST invoice (single invoice for all)',
          'Email support',
        ],
        notIncluded: [
          'Custom employer health portal',
          'Year-on-year trend analytics',
          'Multiple corporate contract management',
          'TPA billing for group insurance',
          'Population health dashboards',
        ],
      },
      medium: {
        scale: [
          {label:'Employees/Month', value:'500 – 3,000'},
          {label:'Corporate Clients',value:'5 – 20'},
          {label:'Staff',           value:'10 – 30'},
          {label:'Packages',        value:'10 – 20'},
          {label:'WA Credits',      value:'2,000 / month'},
        ],
        features: [
          'Everything in Small',
          'Employer HR portal (view team reports)',
          'Year-on-year employee health trend reports',
          'Multiple corporate contract management',
          'TPA billing for group health insurance',
          'Custom packages per corporate client',
          'On-site camp coordination module',
          'Chat + email support',
        ],
        notIncluded: [
          'Population health analytics (disease prevalence)',
          'AI risk stratification',
          'Multi-city camp management',
        ],
      },
      large: {
        scale: [
          {label:'Employees/Month', value:'3,000 – 15,000'},
          {label:'Corporate Clients',value:'20 – 100'},
          {label:'Staff',           value:'30 – 100'},
          {label:'Packages',        value:'Unlimited'},
          {label:'WA Credits',      value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Population health analytics (disease prevalence by dept)',
          'AI-based risk stratification report for HR',
          'Multi-city camp coordination & vendor management',
          'HRMS integration via API (Workday, SAP, Darwinbox)',
          'Staff HRMS & field coordinator management',
          'Priority support',
        ],
        notIncluded: [
          'White-label employer wellness app',
          'Franchise wellness screening network',
          'Government scheme integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Employees/Month', value:'15,000+'},
          {label:'Corporate Clients',value:'100+'},
          {label:'Staff',           value:'100+'},
          {label:'Packages',        value:'Unlimited'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'White-label employer wellness app (client branding)',
          'Franchise wellness screening network',
          'Ayushman Bharat / ESIC scheme integration',
          'National corporate account management',
          'Dedicated account manager',
          'SLA-backed reporting timelines',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── GENETIC TESTING LAB ─────────────────────────────────────────────────────
  'genetic-lab': {
    scaleLabel: 'Monthly Tests', scaleUnit: 'tests/month',
    tiers: {
      small: {
        scale: [
          {label:'Monthly Tests',  value:'Up to 100'},
          {label:'Staff',          value:'2 – 5'},
          {label:'Counselors',     value:'1'},
          {label:'Test Types',     value:'Karyotype, basic panels'},
          {label:'WA Credits',     value:'200 / month'},
        ],
        features: [
          'Genetic test sample registration',
          'Pre-test genetic counseling appointment',
          'Confidential patient record management',
          'Karyotyping & FISH report templates',
          'Carrier screening report templates',
          'Encrypted PDF report delivery',
          'Result disclosure appointment scheduling',
          'Sensitive communication workflows (no reports in group WA)',
          'GST billing',
          'Email support',
        ],
        notIncluded: [
          'NGS panel result workflows',
          'ACMG variant classification tools',
          'Family history pedigree capture',
          'Research collaboration tools',
        ],
      },
      medium: {
        scale: [
          {label:'Monthly Tests',  value:'100 – 500'},
          {label:'Staff',          value:'5 – 15'},
          {label:'Counselors',     value:'2 – 5'},
          {label:'Test Types',     value:'NGS panels + array CGH'},
          {label:'WA Credits',     value:'800 / month'},
        ],
        features: [
          'Everything in Small',
          'NGS gene panel result workflows',
          'ACMG variant classification (P/LP/VUS/LB/B)',
          'Family history pedigree capture',
          'Cascade testing family member linking',
          'Prenatal testing protocol (NIPT, CVS, amnio)',
          'Referring physician result communication',
          'Chat + email support',
        ],
        notIncluded: [
          'WES / WGS workflows',
          'Bioinformatics report import',
          'Pharmacogenomics modules',
          'Research biobank management',
        ],
      },
      large: {
        scale: [
          {label:'Monthly Tests',  value:'500 – 2,000'},
          {label:'Staff',          value:'15 – 50'},
          {label:'Counselors',     value:'5 – 15'},
          {label:'Test Types',     value:'WES / WGS / pharmacogenomics'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'WES / WGS result workflow & report builder',
          'Bioinformatics pipeline result import (VCF)',
          'Pharmacogenomics module (PGx panel reports)',
          'Multi-site lab & genetic counselor management',
          'Staff CME & certification tracking',
          'Priority support',
        ],
        notIncluded: [
          'Research biobank & consent management',
          'Rare disease registry integration',
          'Franchise genetic lab network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Monthly Tests',  value:'2,000+'},
          {label:'Staff',          value:'50+'},
          {label:'Counselors',     value:'15+'},
          {label:'Test Types',     value:'Full genomics suite'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research biobank & consent management',
          'Rare disease registry integration',
          'Multi-hospital genetic counseling network',
          'Government / CSIR reporting',
          'Dedicated account manager',
          'IRB / ethics committee documentation',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── REFERENCE / CENTRAL LAB ──────────────────────────────────────────────────
  'reference-lab': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',  value:'100 – 300'},
          {label:'Staff',          value:'20 – 50'},
          {label:'Partner Labs',   value:'2 – 5'},
          {label:'Monthly Tests',  value:'Up to 9,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Hub sample receiving from partner labs',
          'Inter-lab transfer manifest',
          'High-complexity test catalog (esoteric panels)',
          'Batch processing & analyser integration',
          'Turnaround time SLA per test',
          'PDF reports returned to referring lab',
          'WhatsApp patient report delivery',
          'Partner lab billing & settlement',
          'Chat + email support',
        ],
        notIncluded: [
          'NABL accreditation documentation',
          'QC module (Westgard)',
          'Franchise lab network management',
          'HL7/ASTM auto-import',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',  value:'300 – 800'},
          {label:'Staff',          value:'50 – 120'},
          {label:'Partner Labs',   value:'5 – 20'},
          {label:'Monthly Tests',  value:'Up to 24,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Small',
          'NABL accreditation documentation',
          'QC module — Westgard + Levey-Jennings',
          'HL7/ASTM analyser auto-import',
          'Runner / courier tracking for sample pickups',
          'Partner lab performance dashboard',
          'Reagent & consumable management',
          'Priority support',
        ],
        notIncluded: [
          'Franchise lab management',
          'Revenue sharing engine',
          'White-label reporting for franchises',
          'EQA/PT module',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',  value:'800 – 3,000'},
          {label:'Staff',          value:'120 – 300'},
          {label:'Partner Labs',   value:'20 – 100'},
          {label:'Monthly Tests',  value:'Up to 90,000'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Medium',
          'Franchise lab management (onboard new labs)',
          'Revenue sharing engine',
          'White-label reports for franchise partners',
          'EQA / PT tracking (CAP, EQAS, NEQAS)',
          'Staff HRMS, departments & payroll',
          'Regulatory submissions (NABL, ISO 15189)',
          'Dedicated account manager',
        ],
        notIncluded: [
          'ABHA/ABDM integration',
          'ICMR / Govt reporting',
          'API marketplace',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',  value:'3,000+'},
          {label:'Staff',          value:'300+'},
          {label:'Partner Labs',   value:'100+'},
          {label:'Monthly Tests',  value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'ABHA / ABDM integration (HIP + HPR)',
          'ICMR / NACO / Nikshay government reporting',
          'API marketplace (aggregator, hospital LIS)',
          'National lab network management',
          'Custom SLA contracts per partner tier',
          'SLA-backed uptime guarantee',
        ],
        notIncluded: [],
      },
    },
  },

  // ─── TELE-RADIOLOGY SERVICE ───────────────────────────────────────────────────
  'tele-radiology': {
    scaleLabel: 'Reports / Day', scaleUnit: 'reports/day',
    tiers: {
      small: {
        scale: [
          {label:'Reports/Day',    value:'5 – 30'},
          {label:'Radiologists',   value:'1 – 3'},
          {label:'Client Centers', value:'1 – 5'},
          {label:'Monthly',        value:'Up to 600'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          'DICOM image upload by client center',
          'Radiologist worklist & image viewer',
          'Structured report templates (X-Ray, CT, MRI, USG)',
          'Report approval & digital signature',
          'PDF report return to client center',
          'WhatsApp report delivery to patient',
          'Client center billing',
          'Turnaround time tracking',
          'Email support',
        ],
        notIncluded: [
          'DICOM PACS / cloud archive',
          'Sub-specialty routing (neuro, musculo, etc.)',
          '24/7 on-call radiologist management',
          'AI preliminary read tools',
          'Multi-country operations',
        ],
      },
      medium: {
        scale: [
          {label:'Reports/Day',    value:'30 – 100'},
          {label:'Radiologists',   value:'3 – 15'},
          {label:'Client Centers', value:'5 – 25'},
          {label:'Monthly',        value:'Up to 2,500'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'DICOM cloud archive (studies stored securely)',
          'Sub-specialty routing (neuro, MSK, chest, body)',
          '24/7 on-call radiologist management',
          'TAT SLA per urgency tier (STAT/routine)',
          'Client center portal (upload, track, download)',
          'Radiologist performance & volume analytics',
          'Chat + email support',
        ],
        notIncluded: [
          'AI preliminary read integration',
          'PACS integration with client hospital HIS',
          'Multi-country operations',
          'Radiologist credentialing module',
        ],
      },
      large: {
        scale: [
          {label:'Reports/Day',    value:'100 – 500'},
          {label:'Radiologists',   value:'15 – 60'},
          {label:'Client Centers', value:'25 – 100'},
          {label:'Monthly',        value:'Up to 12,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'AI preliminary read tools (chest, brain, bone)',
          'PACS integration with client hospital HIS (HL7)',
          'Radiologist credentialing & CME tracking',
          'Multi-country timezone-aware routing',
          'Sub-specialist on-call scheduler',
          'Staff HRMS & quality assurance module',
          'Priority support',
        ],
        notIncluded: [
          'Franchise teleradiology network',
          'AI diagnostic automation',
          'White-label client portal',
        ],
      },
      enterprise: {
        scale: [
          {label:'Reports/Day',    value:'500+'},
          {label:'Radiologists',   value:'60+'},
          {label:'Client Centers', value:'100+'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Franchise teleradiology network management',
          'White-label client portal (custom branding)',
          'AI diagnostic automation (auto-preliminary reports)',
          'National / international radiology network',
          'NABH / ACR accreditation documentation',
          'Dedicated account manager',
          'Custom SLA contracts',
        ],
        notIncluded: [],
      },
    },
  },
};

// Fallback for unknown subtypes — generic diagnostic lab
const GENERIC_FALLBACK: SubtypeTierData = SUBTYPE_DATA['pathology-lab'];

export function getSubtypeFeatures(subtype: string): SubtypeTierData {
  return (SUBTYPE_DATA as Record<string, SubtypeTierData>)[subtype] ?? GENERIC_FALLBACK;
}

export { SUBTYPE_DATA };
