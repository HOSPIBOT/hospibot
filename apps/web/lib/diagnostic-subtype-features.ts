/**
 * HospiBot Diagnostic Portal — Subtype-Specific Tier Features
 *
 * Each diagnostic subtype has its own feature set per tier.
 * Features are clinically accurate and operationally relevant.
 *
 * Scale unit varies by subtype:
 *   - Pathology labs: samples/day
 *   - Radiology: scans/day
 *   - Home collection: field collections/day
 *   - Corporate wellness: employees/year
 *   - Tele-radiology: cases/day
 *   - Molecular: PCR runs/day
 */

export interface SubtypeTierConfig {
  scaleUnit: string;               // e.g. "samples", "scans", "collections"
  scaleIcon: string;               // emoji
  tiers: {
    small: TierFeatures;
    medium: TierFeatures;
    large: TierFeatures;
    enterprise: TierFeatures;
  };
}

export interface TierFeatures {
  scale: Record<string, string>;   // key: label, value: range
  features: string[];              // included features
  notIncluded: string[];           // excluded features (for transparency)
}

const SUBTYPE_CONFIG: Record<string, SubtypeTierConfig> = {

  /* ─────────────────────────────────────────────────────────────
   * 1. PATHOLOGY / BLOOD TEST LAB
   * ───────────────────────────────────────────────────────────── */
  'pathology-lab': {
    scaleUnit: 'samples', scaleIcon: '🧪',
    tiers: {
      small: {
        scale: { 'Daily Samples':'1–50', 'Staff':'1–5', 'Branches':'1', 'Monthly Tests':'Up to 1,500', 'WhatsApp Credits':'500/month' },
        features: [
          'Patient registration & UHR lookup',
          'Manual sample registration & labelling',
          'Routine test entry (CBC, biochemistry, urine)',
          'Reference range flagging (H/L/critical)',
          'PDF report with lab letterhead & logo',
          'WhatsApp report delivery to patient',
          'GST-compliant billing & UPI payment link',
          'Pre-loaded test catalog (500+ tests)',
          'Daily collection & pending report summary',
          'Email support',
        ],
        notIncluded: [
          'Home collection management',
          'Doctor CRM & referral tracking',
          'QC module (Westgard)',
          'NABL compliance documentation',
          'Analyser interface (HL7/ASTM)',
        ],
      },
      medium: {
        scale: { 'Daily Samples':'50–300', 'Staff':'5–25', 'Branches':'1–3', 'Monthly Tests':'Up to 9,000', 'WhatsApp Credits':'2,000/month' },
        features: [
          'Everything in Small Lab',
          'Home collection booking + agent GPS tracking',
          'Cold chain compliance alerts',
          'Doctor CRM — referral tracking & commission',
          'Corporate client billing & bulk orders',
          'TPA / insurance claim processing',
          'Test package & health checkup billing',
          'Delta check & critical value auto-alerts',
          'Reflex test ordering (auto-trigger follow-up)',
          'Reagent inventory & expiry tracking',
          'Chat + email support',
        ],
        notIncluded: [
          'QC module (Westgard / Levey-Jennings)',
          'NABL compliance documentation',
          'HL7/ASTM analyser interface',
          'Multi-branch chain analytics',
        ],
      },
      large: {
        scale: { 'Daily Samples':'300–2,000', 'Staff':'25–100', 'Branches':'3–15', 'Monthly Tests':'Up to 60,000', 'WhatsApp Credits':'5,000/month' },
        features: [
          'Everything in Medium Lab',
          'QC module — Westgard rules + Levey-Jennings charts',
          'NABL compliance documentation & audit trails',
          'HL7/ASTM analyser interface (Mindray, Sysmex, Roche)',
          'Multi-branch sample routing & inter-lab transfers',
          'Runner tracking & manifest management',
          'Staff HRMS — shifts, attendance & payroll',
          'EQAS / PT participation tracking',
          'Chain analytics & branch comparison dashboard',
          'Rate cards per client type (retail / corporate / TPA)',
          'Priority support with dedicated CSM',
        ],
        notIncluded: [
          'Franchise management & revenue sharing',
          'White-label portal capability',
          'API marketplace access',
          'ABHA/ABDM deep integration',
        ],
      },
      enterprise: {
        scale: { 'Daily Samples':'2,000+', 'Staff':'100+', 'Branches':'15+', 'Monthly Tests':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large Lab',
          'Franchise & hub-spoke network management',
          'Revenue sharing & royalty management engine',
          'White-label LIMS portal for franchise partners',
          'ABHA / ABDM HIP + HPR integration',
          'ICMR / NACO / Nikshay government reporting',
          'API marketplace — connect aggregators & EMRs',
          'Custom SLA per enterprise contract',
          'Dedicated implementation & account team',
          'On-premise deployment option',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 2. SAMPLE COLLECTION CENTER (PSC / PUP)
   * ───────────────────────────────────────────────────────────── */
  'sample-collection': {
    scaleUnit: 'collections', scaleIcon: '💉',
    tiers: {
      small: {
        scale: { 'Daily Collections':'1–40', 'Staff':'1–3', 'Parent Labs':'1', 'Monthly Collections':'Up to 1,200', 'WhatsApp Credits':'300/month' },
        features: [
          'Patient walk-in registration',
          'Barcode label printing (Zebra / TSC)',
          'Sample handover to parent lab with manifest',
          'WhatsApp test-ready notification to patients',
          'GST billing & UPI payment',
          'Daily collection summary report',
          'Parent lab report display to patient',
          'Email support',
        ],
        notIncluded: [
          'Multi-parent lab tie-ups',
          'Home collection scheduling',
          'Doctor referral CRM',
          'Cold chain monitoring',
          'Multi-center management',
        ],
      },
      medium: {
        scale: { 'Daily Collections':'40–150', 'Staff':'3–10', 'Parent Labs':'Up to 5', 'Monthly Collections':'Up to 4,500', 'WhatsApp Credits':'1,000/month' },
        features: [
          'Everything in Small',
          'Multi-parent lab tie-up routing (by test type)',
          'Home collection scheduling for nearby patients',
          'Doctor referral tracking & prescription scan',
          'Cold chain temperature log (manual entry)',
          'Corporate client sample pickup scheduling',
          'Center-wise revenue analytics',
          'Chat + email support',
        ],
        notIncluded: [
          'GPS home collection with auto-routing',
          'Multi-center management',
          'NABL compliance documentation',
          'Staff HRMS',
        ],
      },
      large: {
        scale: { 'Daily Collections':'150–500', 'Staff':'10–40', 'Centers':'3–10', 'Monthly Collections':'Up to 15,000', 'WhatsApp Credits':'3,000/month' },
        features: [
          'Everything in Medium',
          'Multi-center operations from single dashboard',
          'GPS home collection + route optimization',
          'Automated cold chain IoT sensor integration',
          'Inter-center sample transfer manifest',
          'Staff HRMS — phlebotomist shifts & tracking',
          'Corporate bulk pickup scheduling',
          'Priority support',
        ],
        notIncluded: [
          'Franchise center management',
          'White-label brand capability',
          'API aggregator connectivity',
        ],
      },
      enterprise: {
        scale: { 'Daily Collections':'500+', 'Staff':'40+', 'Centers':'10+', 'Monthly Collections':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'Franchise PSC network management',
          'White-label branded portal per franchise',
          'Aggregator API (1mg, Practo, Tata 1mg) connectivity',
          'Revenue sharing & commission settlement',
          'Dedicated account manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 3. HOME SAMPLE COLLECTION SERVICE
   * ───────────────────────────────────────────────────────────── */
  'home-collection': {
    scaleUnit: 'home collections', scaleIcon: '🏠',
    tiers: {
      small: {
        scale: { 'Daily Collections':'1–30', 'Field Agents':'1–5', 'City Coverage':'1 zone', 'Monthly Collections':'Up to 900', 'WhatsApp Credits':'400/month' },
        features: [
          'Online booking via WhatsApp or web link',
          'Agent assignment (manual)',
          'Patient address & time slot management',
          'WhatsApp booking confirmation & reminders',
          'Sample handover to lab with manifest',
          'Patient report notification on WhatsApp',
          'GST billing & UPI payment link',
          'Email support',
        ],
        notIncluded: [
          'GPS live tracking for patients',
          'Route optimization for agents',
          'Cold chain IoT monitoring',
          'Corporate client scheduling',
          'Multi-zone management',
        ],
      },
      medium: {
        scale: { 'Daily Collections':'30–120', 'Field Agents':'5–20', 'City Coverage':'2–5 zones', 'Monthly Collections':'Up to 3,600', 'WhatsApp Credits':'1,500/month' },
        features: [
          'Everything in Small',
          'GPS live tracking — patient can see agent en route',
          'Route optimization (nearest agent auto-assignment)',
          'Agent mobile app (check-in, sample photos)',
          'Cold chain temperature log alerts',
          'Corporate bulk collection scheduling',
          'Doctor prescription scan & upload by agent',
          'Zone-wise performance analytics',
          'Chat support',
        ],
        notIncluded: [
          'Cold chain IoT sensor integration',
          'Multi-city management',
          'Agent HRMS & payroll',
          'Franchise home collection management',
        ],
      },
      large: {
        scale: { 'Daily Collections':'120–500', 'Field Agents':'20–80', 'City Coverage':'Multi-city', 'Monthly Collections':'Up to 15,000', 'WhatsApp Credits':'4,000/month' },
        features: [
          'Everything in Medium',
          'Cold chain IoT sensor integration (probe temp)',
          'Multi-city operations from single dashboard',
          'Agent HRMS — attendance, payroll & incentives',
          'Fleet management & vehicle tracking',
          'Priority slot booking for premium patients',
          'Insurance & TPA approved home collection billing',
          'City-wise revenue & agent performance dashboard',
          'Priority support',
        ],
        notIncluded: [
          'Franchise home collection brand management',
          'White-label app for franchise partners',
          'Aggregator API connectivity',
        ],
      },
      enterprise: {
        scale: { 'Daily Collections':'500+', 'Field Agents':'80+', 'City Coverage':'Pan-India', 'Monthly Collections':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'Franchise home collection brand management',
          'White-label branded app for franchise',
          'Aggregator connectivity (1mg / Practo / Redcliffe)',
          'Centralized cold chain compliance reporting',
          'Dedicated operations manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 4. RADIOLOGY CENTER (X-Ray, CT, MRI)
   * ───────────────────────────────────────────────────────────── */
  'radiology-center': {
    scaleUnit: 'scans', scaleIcon: '📡',
    tiers: {
      small: {
        scale: { 'Daily Scans':'1–20', 'Staff':'2–6', 'Modalities':'1–2', 'Monthly Scans':'Up to 600', 'WhatsApp Credits':'300/month' },
        features: [
          'Scan appointment scheduling',
          'Patient registration & referral doctor capture',
          'Manual report entry & radiologist sign-off',
          'WhatsApp report PDF delivery to patient',
          'WhatsApp notification to referring doctor',
          'PNDT Form F (for ultrasound/prenatal)',
          'GST billing & UPI payment link',
          'Email support',
        ],
        notIncluded: [
          'DICOM / PACS viewer integration',
          'Multi-modality worklist',
          'Teleradiology read routing',
          'AI-assisted report drafts',
          'Multi-center management',
        ],
      },
      medium: {
        scale: { 'Daily Scans':'20–60', 'Staff':'6–20', 'Modalities':'2–4', 'Monthly Scans':'Up to 1,800', 'WhatsApp Credits':'1,000/month' },
        features: [
          'Everything in Small',
          'Multi-modality worklist (X-Ray, CT, MRI, USG)',
          'DICOM viewer link generation in report',
          'Radiologist priority queue & TAT tracking',
          'Corporate screening package billing',
          'Referring doctor portal (view their patients\' reports)',
          'Equipment slot & maintenance scheduling',
          'Chat + email support',
        ],
        notIncluded: [
          'Full PACS/RIS integration',
          'Teleradiology outsourcing workflow',
          'AI-assisted draft radiology reports',
          'Multi-center chain management',
        ],
      },
      large: {
        scale: { 'Daily Scans':'60–300', 'Staff':'20–80', 'Centers':'2–8', 'Monthly Scans':'Up to 9,000', 'WhatsApp Credits':'4,000/month' },
        features: [
          'Everything in Medium',
          'Full RIS/PACS integration (HL7 MWL / DICOM worklist)',
          'Teleradiology routing to empanelled radiologists',
          'PNDT compliance full — Form F, audit, state reporting',
          'Multi-center scan routing & load balancing',
          'Staff HRMS — radiographer shifts & payroll',
          'Chain analytics — modality-wise revenue & TAT',
          'Priority support',
        ],
        notIncluded: [
          'AI-assisted radiology report drafting',
          'Franchise radiology brand management',
          'White-label RIS capability',
        ],
      },
      enterprise: {
        scale: { 'Daily Scans':'300+', 'Staff':'80+', 'Centers':'8+', 'Monthly Scans':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'AI-assisted radiology report draft generation',
          'Franchise radiology center management',
          'White-label RIS portal for franchise',
          'National radiologist panel management',
          'ABHA / ABDM medical imaging sharing',
          'Dedicated radiology operations manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 5. ULTRASOUND CENTER
   * ───────────────────────────────────────────────────────────── */
  'ultrasound-center': {
    scaleUnit: 'scans', scaleIcon: '📊',
    tiers: {
      small: {
        scale: { 'Daily Scans':'1–15', 'Sonographers':'1–2', 'Machines':'1', 'Monthly Scans':'Up to 450', 'WhatsApp Credits':'300/month' },
        features: [
          'Scan appointment scheduling by machine',
          'OB/GYN patient referral capture',
          'PNDT Form F compliance (mandatory)',
          'Report entry by trimester / organ system',
          'WhatsApp report delivery to patient & referring doctor',
          'GST billing & UPI payment',
          'PNDT record book (Form F archive)',
          'Email support',
        ],
        notIncluded: [
          'Multi-machine scheduling',
          'OB protocol-guided report templates',
          'Corporate health screening packages',
          'PNDT state reporting',
        ],
      },
      medium: {
        scale: { 'Daily Scans':'15–50', 'Sonographers':'2–6', 'Machines':'2–4', 'Monthly Scans':'Up to 1,500', 'WhatsApp Credits':'800/month' },
        features: [
          'Everything in Small',
          'Multi-machine scheduling & worklist',
          'OB protocol templates (trimester-guided)',
          'Fetal biometry auto-calculation in report',
          'Gynaecology & obstetrics procedure tracking',
          'Referring gynaecologist CRM',
          'PNDT annual report auto-generation',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-center PNDT compliance reporting',
          'Staff HRMS',
          'Insurance / TPA billing',
        ],
      },
      large: {
        scale: { 'Daily Scans':'50–200', 'Sonographers':'6–25', 'Centers':'2–6', 'Monthly Scans':'Up to 6,000', 'WhatsApp Credits':'3,000/month' },
        features: [
          'Everything in Medium',
          'Multi-center PNDT compliance management',
          'State authority PNDT form F digital submission',
          'Insurance/TPA billing for obstetric scans',
          'Staff HRMS — sonographer scheduling',
          'Machine utilization analytics per center',
          'Priority support',
        ],
        notIncluded: [
          'White-label franchise management',
          'National PNDT reporting APIs',
        ],
      },
      enterprise: {
        scale: { 'Daily Scans':'200+', 'Sonographers':'25+', 'Centers':'6+', 'Monthly Scans':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'Franchise ultrasound center management',
          'National PNDT regulatory reporting APIs',
          'White-label portal for franchise centers',
          'ABHA integration for OB health records',
          'Dedicated account manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 6. MOLECULAR / PCR LAB
   * ───────────────────────────────────────────────────────────── */
  'molecular-lab': {
    scaleUnit: 'PCR runs', scaleIcon: '🔭',
    tiers: {
      small: {
        scale: { 'Daily PCR Runs':'1–20', 'Staff':'2–6', 'Test Panels':'1–5', 'Monthly Runs':'Up to 600', 'WhatsApp Credits':'400/month' },
        features: [
          'Sample registration with biosafety risk flag',
          'PCR batch setup & run sheet generation',
          'Result entry with Ct value recording',
          'Positive/negative/invalid result classification',
          'WhatsApp result delivery (with biosafety disclaimers)',
          'ICMR/NABL-format report generation',
          'GST billing & UPI payment',
          'Email support',
        ],
        notIncluded: [
          'Automated plate-reader import',
          'Multi-pathogen panel management',
          'NACO / ICMR government reporting',
          'Research sample tracking',
        ],
      },
      medium: {
        scale: { 'Daily PCR Runs':'20–80', 'Staff':'6–20', 'Test Panels':'5–15', 'Monthly Runs':'Up to 2,400', 'WhatsApp Credits':'1,200/month' },
        features: [
          'Everything in Small',
          'Multi-pathogen panel management (COVID, HIV, HBV, HCV etc.)',
          'Automated plate-reader data import (Excel/CSV)',
          'Batch QC controls tracking (positive/negative controls)',
          'RTPCR cycle threshold interpretation rules',
          'Referring clinician portal for result access',
          'Biosafety incident log',
          'Chat + email support',
        ],
        notIncluded: [
          'NACO / ICMR / NIKSHAY reporting APIs',
          'Next-gen sequencing (NGS) workflow',
          'Multi-lab network management',
        ],
      },
      large: {
        scale: { 'Daily PCR Runs':'80–400', 'Staff':'20–80', 'Sites':'2–6', 'Monthly Runs':'Up to 12,000', 'WhatsApp Credits':'4,000/month' },
        features: [
          'Everything in Medium',
          'NACO / ICMR / NIKSHAY government reporting APIs',
          'TB-NAAT / GeneXpert workflow module',
          'Multi-site PCR run coordination',
          'Instrument maintenance & calibration log',
          'Staff HRMS with biosafety training records',
          'Reagent lot management & QC acceptance',
          'Priority support',
        ],
        notIncluded: [
          'NGS bioinformatics pipeline integration',
          'Franchise molecular lab management',
          'Research LIMS capability',
        ],
      },
      enterprise: {
        scale: { 'Daily PCR Runs':'400+', 'Staff':'80+', 'Sites':'6+', 'Monthly Runs':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'NGS workflow & bioinformatics pipeline integration',
          'Research sample repository & LIMS',
          'Franchise molecular lab network management',
          'Government surveillance program management',
          'ABHA integration for infectious disease records',
          'Dedicated implementation & account team',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 7. HEALTH CHECKUP CENTER
   * ───────────────────────────────────────────────────────────── */
  'health-checkup': {
    scaleUnit: 'checkups', scaleIcon: '📋',
    tiers: {
      small: {
        scale: { 'Daily Checkups':'1–20', 'Staff':'2–8', 'Packages':'Up to 10', 'Monthly Checkups':'Up to 600', 'WhatsApp Credits':'500/month' },
        features: [
          'Health checkup package catalog (up to 10 packages)',
          'Online booking via WhatsApp',
          'Multi-department workflow coordination (lab + ECG + doctor)',
          'Consolidated multi-department report compilation',
          'WhatsApp report delivery with doctor summary',
          'GST billing & UPI payment link',
          'Appointment reminder automation',
          'Email support',
        ],
        notIncluded: [
          'Corporate tie-ups & bulk invoicing',
          'Insurance panel empanelment billing',
          'Home checkup team management',
          'Longitudinal health tracking across years',
        ],
      },
      medium: {
        scale: { 'Daily Checkups':'20–80', 'Staff':'8–30', 'Packages':'Up to 30', 'Monthly Checkups':'Up to 2,400', 'WhatsApp Credits':'2,000/month' },
        features: [
          'Everything in Small',
          'Corporate client billing & bulk invoicing',
          'Insurance / TPA empanelment billing (CGHS, ESI)',
          'Home checkup scheduling (doctor + phlebotomist)',
          'Executive health checkup premium packages',
          'Package upsell automation via WhatsApp',
          'Year-on-year health trend comparison reports',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-center checkup coordination',
          'National corporate program management',
          'Insurance claim processing automation',
        ],
      },
      large: {
        scale: { 'Daily Checkups':'80–300', 'Staff':'30–100', 'Centers':'2–8', 'Monthly Checkups':'Up to 9,000', 'WhatsApp Credits':'5,000/month' },
        features: [
          'Everything in Medium',
          'Multi-center checkup coordination & routing',
          'Automated insurance claim processing',
          'Occupational health checkup (pre-employment, annual)',
          'Staff HRMS for multi-department coordination',
          'Ambulance / transport integration for home teams',
          'Analytics — package popularity & revenue per package',
          'Priority support',
        ],
        notIncluded: [
          'National employer wellness program management',
          'White-label checkup center branding',
          'Franchise management',
        ],
      },
      enterprise: {
        scale: { 'Daily Checkups':'300+', 'Staff':'100+', 'Centers':'8+', 'Monthly Checkups':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'National employer wellness program management',
          'White-label checkup center portal branding',
          'Franchise health checkup center management',
          'ABHA integration for longitudinal health records',
          'Government health scheme empanelment management',
          'Dedicated account & implementation manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 8. CORPORATE WELLNESS SCREENING
   * ───────────────────────────────────────────────────────────── */
  'corporate-screening': {
    scaleUnit: 'employees screened', scaleIcon: '🏢',
    tiers: {
      small: {
        scale: { 'Employees/Year':'Up to 1,000', 'Corporate Clients':'1–3', 'Packages':'Up to 5', 'Monthly Capacity':'Up to 100', 'WhatsApp Credits':'500/month' },
        features: [
          'Corporate client account management',
          'Employee bulk upload & pre-registration',
          'On-site camp scheduling & logistics',
          'Employee sample collection at workplace',
          'Consolidated employer MIS report (PDF)',
          'Individual employee WhatsApp result delivery',
          'Corporate GST invoice & bulk billing',
          'Email support',
        ],
        notIncluded: [
          'Multi-corporate campaign management',
          'HR portal for employee self-service',
          'Insurance / TPA claim routing',
          'Follow-up wellness program automation',
          'National program management',
        ],
      },
      medium: {
        scale: { 'Employees/Year':'1,000–10,000', 'Corporate Clients':'3–15', 'Packages':'Up to 20', 'Monthly Capacity':'Up to 1,000', 'WhatsApp Credits':'2,000/month' },
        features: [
          'Everything in Small',
          'HR portal — employee self-service for results',
          'Multi-corporate campaign calendar management',
          'Insurance / TPA claim routing for employee benefits',
          'Follow-up wellness program automation via WhatsApp',
          'Abnormal employee follow-up alerts to HR & employee',
          'Year-on-year workforce health trend analytics',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-city national program management',
          'ESI / CGHS / government scheme integration',
          'Franchise wellness brand management',
        ],
      },
      large: {
        scale: { 'Employees/Year':'10,000–1,00,000', 'Corporate Clients':'15–50', 'Cities':'Multi-city', 'Monthly Capacity':'Up to 10,000', 'WhatsApp Credits':'5,000/month' },
        features: [
          'Everything in Medium',
          'Multi-city national program coordination',
          'ESI / CGHS government scheme integration & billing',
          'Occupation-specific health surveillance protocols',
          'Third-party lab network for pan-India execution',
          'C-suite health risk stratification reporting',
          'Priority support',
        ],
        notIncluded: [
          'White-label wellness brand for enterprise clients',
          'Insurance company tie-up management',
          'Franchise wellness center management',
        ],
      },
      enterprise: {
        scale: { 'Employees/Year':'1,00,000+', 'Corporate Clients':'50+', 'Cities':'Pan-India', 'Monthly Capacity':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'White-label wellness brand portal per enterprise client',
          'Insurance company data exchange & premium pricing API',
          'Franchise wellness center management',
          'ABHA-linked longitudinal employee health records',
          'Ministry of Health / DPDPA compliance reporting',
          'Dedicated national account & operations manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 9. TELE-RADIOLOGY SERVICE
   * ───────────────────────────────────────────────────────────── */
  'tele-radiology': {
    scaleUnit: 'cases', scaleIcon: '💻',
    tiers: {
      small: {
        scale: { 'Daily Cases':'1–30', 'Radiologists':'1–3', 'Client Centers':'1–5', 'Monthly Cases':'Up to 900', 'WhatsApp Credits':'300/month' },
        features: [
          'Case upload portal for referring centers',
          'DICOM image secure cloud storage & viewer',
          'Radiologist case assignment (manual)',
          'Report dictation & sign-off workflow',
          'Formatted radiology report PDF generation',
          'WhatsApp report notification to referring center',
          'Per-case billing & GST invoicing to client centers',
          'Email support',
        ],
        notIncluded: [
          'Automated TAT breach alerts',
          'Priority case routing (STAT/emergency)',
          'Multi-modality worklist management',
          'AI-assisted report draft generation',
          'Multi-radiologist load balancing',
        ],
      },
      medium: {
        scale: { 'Daily Cases':'30–100', 'Radiologists':'3–10', 'Client Centers':'5–20', 'Monthly Cases':'Up to 3,000', 'WhatsApp Credits':'1,000/month' },
        features: [
          'Everything in Small',
          'Automated TAT tracking & breach alerts',
          'STAT / Routine / Emergency priority routing',
          'Multi-modality worklist (X-Ray, CT, MRI, DSA)',
          'Multi-radiologist load balancing & workload dashboard',
          'Client center self-service case upload portal',
          'Sub-speciality routing (neuro, musculo, cardiac)',
          'Chat + email support',
        ],
        notIncluded: [
          'AI-assisted radiology draft generation',
          'Hospital system PACS/RIS direct integration',
          'National radiologist panel management',
        ],
      },
      large: {
        scale: { 'Daily Cases':'100–500', 'Radiologists':'10–50', 'Client Centers':'20–80', 'Monthly Cases':'Up to 15,000', 'WhatsApp Credits':'4,000/month' },
        features: [
          'Everything in Medium',
          'AI-assisted radiology draft report generation',
          'Hospital PACS/RIS direct HL7/DICOM integration',
          'Radiologist performance & quality audit dashboard',
          'Client center SLA management & penalty tracking',
          'Night & weekend emergency on-call roster',
          'NABH / NABL compliance documentation for tele-radiology',
          'Priority support',
        ],
        notIncluded: [
          'White-label tele-radiology SaaS capability',
          'International radiologist panel management',
          'Government radiology program APIs',
        ],
      },
      enterprise: {
        scale: { 'Daily Cases':'500+', 'Radiologists':'50+', 'Client Centers':'80+', 'Monthly Cases':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'White-label tele-radiology SaaS for hospitals',
          'International radiologist panel management',
          'Government / public hospital radiology program APIs',
          'ABHA / ABDM imaging record sharing',
          'Dedicated platform & operations manager',
        ],
        notIncluded: [],
      },
    },
  },

  /* ─────────────────────────────────────────────────────────────
   * 10. REFERENCE / CENTRAL LAB
   * ───────────────────────────────────────────────────────────── */
  'reference-lab': {
    scaleUnit: 'outsourced samples', scaleIcon: '🏭',
    tiers: {
      small: {
        scale: { 'Daily Samples':'50–200', 'Feeder Labs':'1–5', 'Staff':'5–15', 'Monthly Samples':'Up to 6,000', 'WhatsApp Credits':'1,000/month' },
        features: [
          'Feeder lab outsourcing portal (receive referred samples)',
          'Barcode reconciliation with feeder lab manifest',
          'Reference test catalog (specialized / esoteric)',
          'Result entry with interpretive comments',
          'Report PDF with referral chain tracking',
          'WhatsApp result delivery to feeder lab & patient',
          'Feeder lab billing & consolidated GST invoicing',
          'Email support',
        ],
        notIncluded: [
          'LIMS interface for feeder lab connectivity',
          'HL7 analyser interface',
          'Inter-lab sample transport tracking',
          'NABL compliance documentation',
        ],
      },
      medium: {
        scale: { 'Daily Samples':'200–800', 'Feeder Labs':'5–25', 'Staff':'15–50', 'Monthly Samples':'Up to 24,000', 'WhatsApp Credits':'3,000/month' },
        features: [
          'Everything in Small',
          'LIMS API for feeder lab direct result pushback',
          'HL7/ASTM analyser interface for esoteric analyzers',
          'Inter-lab sample transport manifest & chain of custody',
          'NABL compliance documentation',
          'Reagent & consumable inventory for reference tests',
          'Doctor/specialist consultation report integration',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-city reference hub management',
          'Revenue sharing with feeder labs',
          'Government reference lab reporting',
        ],
      },
      large: {
        scale: { 'Daily Samples':'800–3,000', 'Feeder Labs':'25–100', 'Cities':'Multi-city', 'Monthly Samples':'Up to 90,000', 'WhatsApp Credits':'10,000/month' },
        features: [
          'Everything in Medium',
          'Multi-city hub operations & routing',
          'Revenue sharing with feeder partner labs',
          'Frozen sample tracking & long-term storage log',
          'Government / research sample program support',
          'Staff HRMS for multi-department reference lab',
          'Chain analytics — feeder lab profitability',
          'Priority support',
        ],
        notIncluded: [
          'ICMR/NACO government reporting APIs',
          'White-label LIMS for feeder labs',
          'NGS research capability',
        ],
      },
      enterprise: {
        scale: { 'Daily Samples':'3,000+', 'Feeder Labs':'100+', 'Cities':'Pan-India', 'Monthly Samples':'Unlimited', 'WhatsApp Credits':'Unlimited' },
        features: [
          'Everything in Large',
          'White-label LIMS portal for feeder lab partners',
          'ICMR / NACO / NIKSHAY national lab reporting APIs',
          'NGS & proteomics research capability module',
          'ABHA/ABDM deep integration & HIE connectivity',
          'On-premise or dedicated cloud deployment',
          'Dedicated implementation & national account team',
        ],
        notIncluded: [],
      },
    },
  },
};

// Map subtype slugs to their config (handles all known diagnostic subtypes)
export function getSubtypeFeatures(subtypeSlug: string): SubtypeTierConfig {
  // Direct match
  if (SUBTYPE_CONFIG[subtypeSlug]) return SUBTYPE_CONFIG[subtypeSlug];

  // Fuzzy match for slugs that may vary
  const slug = subtypeSlug.toLowerCase();
  if (slug.includes('pathology') || slug.includes('blood'))     return SUBTYPE_CONFIG['pathology-lab'];
  if (slug.includes('collection-center') || slug.includes('psc')) return SUBTYPE_CONFIG['sample-collection'];
  if (slug.includes('home-collection') || slug.includes('home-sample')) return SUBTYPE_CONFIG['home-collection'];
  if (slug.includes('radiology') || slug.includes('x-ray') || slug.includes('ct') || slug.includes('mri')) return SUBTYPE_CONFIG['radiology-center'];
  if (slug.includes('ultrasound') || slug.includes('usg'))      return SUBTYPE_CONFIG['ultrasound-center'];
  if (slug.includes('molecular') || slug.includes('pcr') || slug.includes('naat')) return SUBTYPE_CONFIG['molecular-lab'];
  if (slug.includes('health-checkup') || slug.includes('checkup')) return SUBTYPE_CONFIG['health-checkup'];
  if (slug.includes('corporate') || slug.includes('wellness-screen')) return SUBTYPE_CONFIG['corporate-screening'];
  if (slug.includes('tele') || slug.includes('teleradiology'))  return SUBTYPE_CONFIG['tele-radiology'];
  if (slug.includes('reference') || slug.includes('central'))   return SUBTYPE_CONFIG['reference-lab'];

  // Default: pathology
  return SUBTYPE_CONFIG['pathology-lab'];
}
