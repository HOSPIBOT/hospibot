/**
 * Diagnostic Portal — Subtype-specific feature packages per tier
 *
 * Deep domain analysis based on industry standards:
 *   - NABL 112A (ISO 15189:2022) — Medical Laboratory Accreditation
 *   - PC-PNDT Act — Pre-Conception & Pre-Natal Diagnostic Techniques
 *   - AERB — Atomic Energy Regulatory Board (radiation safety)
 *   - ICMR / NACO / RNTCP-Nikshay — Government disease reporting
 *   - ABHA / ABDM — Ayushman Bharat Digital Mission (FHIR R4)
 *   - ACMG — American College of Medical Genetics (variant classification)
 *   - HL7 / DICOM — International healthcare interoperability standards
 *   - CAP — College of American Pathologists (for reference labs)
 *
 * Each subtype has 4 tiers (Small / Medium / Large / Enterprise) with:
 *   - Subtype-specific scale metrics (what "volume" means for that lab type)
 *   - Purpose-built feature list matching clinical workflows
 *   - Clear "Not in this plan" hierarchy showing upgrade path
 */

export type DiagSubtype =
  // Group A — Collection & Logistics
  | 'sample-collection-center' | 'pickup-point' | 'home-sample-collection'
  // Group B — Pathology & Lab Testing
  | 'pathology-lab' | 'histopathology-lab' | 'molecular-lab' | 'micro-lab' | 'genetic-lab' | 'blood-bank'
  // Group C — Imaging & Scans
  | 'radiology-center' | 'ultrasound-center' | 'pet-scan-center' | 'nuclear-medicine-center'
  | 'mammography-center' | 'dexa-center' | 'dental-radiology-center' | 'ophthalmic-center'
  // Group D — Physiological Testing
  | 'cardiac-diagnostics' | 'pft-center' | 'neurophysiology-center' | 'allergy-center'
  | 'sleep-lab' | 'audiology-center' | 'urodynamics-center' | 'endoscopy-center'
  // Group E — Health Packages
  | 'health-checkup' | 'corporate-screening'
  // Group F — Specialty & Advanced
  | 'ivf-embryology' | 'stem-cell-registry' | 'forensic-toxicology' | 'cancer-screening'
  // Group G — Hubs & Digital
  | 'reference-lab' | 'tele-radiology' | 'dtc-genomics';

export interface SubtypeTierData {
  scaleLabel: string;
  scaleUnit: string;
  tiers: {
    small:      SubtypeTier;
    medium:     SubtypeTier;
    large:      SubtypeTier;
    enterprise: SubtypeTier;
  };
}

export interface SubtypeTier {
  /** Operational scale indicators — what this tier handles */
  scale: { label: string; value: string }[];
  /** Features INCLUDED in this tier */
  features: string[];
  /** Features NOT in this tier (upgrade path) */
  notIncluded: string[];
}

const SUBTYPE_DATA: Record<DiagSubtype, SubtypeTierData> = {

  /* ================================================================
   * PATHOLOGY / BLOOD TEST LAB
   *   Core LIS workflow: registration -> phlebotomy -> barcode -> analyser
   *   -> result entry -> pathologist validation -> report -> delivery
   * ================================================================ */
  'pathology-lab': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',  value:'1 – 50'},
          {label:'Staff',          value:'1 – 5'},
          {label:'Analysers',      value:'1 – 2'},
          {label:'Monthly Tests',  value:'Up to 1,500'},
          {label:'WA Credits',     value:'500 / month'},
        ],
        features: [
          // Patient & sample
          'Walk-in patient registration with ABHA ID lookup',
          'Barcode-based sample labelling & tracking',
          'Pre-loaded test catalog — 500+ routine tests (CBC, LFT, KFT, lipid, thyroid, HbA1c)',
          'Sample accessioning with fasting/non-fasting flag',
          // Result processing
          'Manual result entry with age & gender-specific reference ranges',
          'Automatic H/L (high/low) flagging against normal ranges',
          'Pathologist single-step digital sign-off',
          // Reporting
          'NABL-format PDF report with lab letterhead & QR verification',
          'WhatsApp report delivery to patient (500 credits/month)',
          'Referring doctor WhatsApp notification',
          // Billing
          'GST-compliant invoice with HSN codes',
          'UPI payment link on WhatsApp (Razorpay/PhonePe)',
          'Cash / card payment POS billing',
          // Ops
          'Daily samples & revenue dashboard',
          'Email support (24h response)',
        ],
        notIncluded: [
          'Analyser HL7 / ASTM auto-import (manual entry only)',
          'Critical value auto-alert to doctor',
          'Delta check (previous vs current result comparison)',
          'Reflex testing (auto-add related panels)',
          'Home sample collection with GPS',
          'Doctor CRM & commission tracking',
          'Corporate wellness package billing',
          'QC module (Westgard / Levey-Jennings)',
          'NABL ISO 15189 compliance documentation',
          'Multi-branch lab management',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',  value:'50 – 200'},
          {label:'Staff',          value:'5 – 20'},
          {label:'Analysers',      value:'2 – 5'},
          {label:'Monthly Tests',  value:'Up to 6,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Small Lab',
          // Extended catalog
          'Expanded catalog — 3,000+ tests with LOINC codes',
          'Panel / profile billing (Lipid, Liver, Thyroid profiles)',
          'Package deals (health checkup, diabetic profile)',
          // Clinical intelligence
          'Critical value auto-alert (SMS + WhatsApp + phone call)',
          'Delta check — flag significant change from previous result',
          'Reflex testing (e.g. ANA positive → ENA panel auto-add)',
          'Dependent test validation (e.g. HbA1c needs fasting flag)',
          // Home collection
          'Online home collection booking via WhatsApp',
          'Phlebotomist mobile app with GPS route',
          'Call-masking for patient-phlebotomist privacy',
          // Doctor engagement
          'Doctor CRM with referral tracking',
          'Doctor commission auto-calculation & settlement',
          'Doctor performance dashboard (tests, commission, trend)',
          'Doctor-specific rate cards',
          // Corporate
          'Corporate client onboarding & contracts',
          'Bulk employee camp registration (CSV import)',
          'Corporate consolidated invoicing',
          // Insurance
          'TPA / cashless insurance claim submission',
          'Pre-authorization workflow',
          // Analytics
          'TAT (turnaround time) analytics per test type',
          'Test volume trends & seasonality reports',
          'Chat + email support',
        ],
        notIncluded: [
          'HL7 / ASTM analyser auto-import (bi-directional)',
          'QC module — Westgard rules & Levey-Jennings charts',
          'NABL ISO 15189 compliance documentation',
          'Reagent & consumable inventory management',
          'Multi-branch lab network management',
          'Staff HRMS & payroll processing',
          'EQA / PT (external quality assurance) tracking',
          'Franchise lab management',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',  value:'200 – 1,000'},
          {label:'Staff',          value:'20 – 100'},
          {label:'Analysers',      value:'5 – 20'},
          {label:'Monthly Tests',  value:'Up to 30,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium Lab',
          // Analyser integration
          'HL7 / ASTM bi-directional analyser interface',
          'Pre-populated worklist sent to analyser',
          'Auto result import from Sysmex, Beckman, Roche, Erba, Mindray',
          'Unified result validation across 200+ analyser models',
          // Quality & compliance
          'QC module — Westgard multi-rule evaluation',
          'Levey-Jennings charts with SD, CV, mean trend',
          'Daily QC failure alerts with RCA workflow',
          'EQA / PT tracking (CAP, EQAS, AIIMS PT cycles)',
          'NABL ISO 15189:2022 full documentation suite',
          'Document control (SOPs, Method Validation, CAPA)',
          'Internal audit scheduling & checklist',
          // Multi-branch
          'Multi-branch lab management console',
          'Inter-branch sample routing with manifest',
          'Centralised test catalog & rate master',
          'Branch-wise performance comparison',
          // Operations
          'Reagent & consumable inventory with min-max reorder',
          'Expiry tracking with FEFO (first-expiry-first-out) dispensing',
          'Equipment calibration & PM schedule',
          'Temperature monitoring log (refrigerators, freezers)',
          // HRMS
          'Staff attendance with biometric / face-auth',
          'Shift roster & leave management',
          'Payroll with PF / ESI / TDS',
          'CME credit & competency tracking',
          // Pathologist workflow
          'Multi-level pathologist sign-off (tech → lab incharge → MD)',
          'AI-assisted interpretation drafting',
          'Flag samples with analytical errors (haemolysis, lipemia)',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Franchise / partner lab network management',
          'Hub-spoke sample routing between owned & franchise labs',
          'Revenue sharing & royalty engine',
          'White-label reports (partner lab branding)',
          'ABHA / ABDM HIP integration (FHIR R4)',
          'Government disease reporting (ICMR, NACO, Nikshay)',
          'API marketplace for aggregator partnerships',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',  value:'1,000+'},
          {label:'Staff',          value:'100+'},
          {label:'Analysers',      value:'20+'},
          {label:'Monthly Tests',  value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large Lab',
          // Franchise
          'Franchise / partner lab onboarding workflow',
          'Hub-and-spoke sample routing engine',
          'Runner tracking app with barcode handoff',
          'Inter-branch / franchise transfer manifest',
          'Revenue sharing & royalty rules engine',
          'White-label reports with franchise branding',
          'Franchise performance scorecard & audit',
          // Compliance
          'ABHA / ABDM HIP integration (FHIR R4 resources)',
          'HPR (Health Professional Registry) doctor linking',
          'ICMR disease surveillance reporting',
          'NACO HIV viral load reporting',
          'RNTCP Nikshay TB reporting',
          'IDSP / IHIP notifiable disease submission',
          // Enterprise integration
          'API marketplace (1mg, Practo, MediBuddy, Apollo 24/7)',
          'Aggregator inbound order API with SLA',
          'Hospital HIS outbound HL7 feed',
          'Custom webhook builder for events',
          // Premium support
          'Dedicated account manager',
          'Quarterly business review (QBR)',
          'SLA-backed 99.9% uptime guarantee',
          'Custom integrations on request',
          'Priority feature roadmap input',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * SAMPLE COLLECTION CENTER (PSC / PUP)
   *   Satellite centers that collect samples and dispatch to parent lab.
   *   Focus: fast registration, cold chain, dispatch manifest, no testing.
   * ================================================================ */
  'sample-collection-center': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',   value:'1 – 30'},
          {label:'Staff',           value:'1 – 3'},
          {label:'Partner Labs',    value:'1'},
          {label:'Monthly Orders',  value:'Up to 900'},
          {label:'WA Credits',      value:'300 / month'},
        ],
        features: [
          'Walk-in patient registration with ABHA lookup',
          'Barcode generation & label printing (Zebra, TSC printers)',
          'Pre-loaded test menu from single parent lab',
          'Sample collection checklist (tube type, fasting, volume)',
          'Phlebotomy SOP adherence log',
          'Sample packaging & dispatch manifest (DMLT signed)',
          'Status tracking: Collected → Packaged → Dispatched',
          'WhatsApp collection confirmation to patient',
          'Patient bill receipt (pass-through from parent lab rates)',
          'Daily dispatch summary with sample count',
          'Email support',
        ],
        notIncluded: [
          'Temperature-controlled cold chain monitoring',
          'Online pre-booking for walk-ins',
          'Multi-lab routing (send samples to best lab)',
          'Runner / transport vehicle tracking',
          'Referring doctor notification & CRM',
          'Corporate camp management',
          'Multi-branch PSC operations',
          'NABL-compliant collection center audit trail',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',   value:'30 – 150'},
          {label:'Staff',           value:'3 – 10'},
          {label:'Partner Labs',    value:'1 – 3'},
          {label:'Monthly Orders',  value:'Up to 4,500'},
          {label:'WA Credits',      value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          // Cold chain
          'Cold chain temperature log (ice pack, dry ice, -20°C)',
          'Reefer box / vaccine carrier SOP checklist',
          'Temperature excursion flagging with RCA',
          'Sample rejection register',
          // Booking & routing
          'Online pre-booking via WhatsApp / mini-website',
          'Multi-lab routing (auto-select best lab by test & TAT)',
          'Parent lab rate card with center margin',
          'Lab-wise settlement tracking',
          // Transport
          'Runner assignment & pickup schedule',
          'Vehicle tracking (driver phone GPS)',
          'Pickup confirmation with barcode scan',
          'Trip sheet with samples per trip',
          // Patient
          'Report download via WhatsApp link (from partner lab)',
          'Sample status notifications (collected → report ready)',
          'Family booking with linked profiles',
          // Doctor
          'Referring doctor WhatsApp notification on sample collection',
          'Doctor portal to view own-patient reports',
          'Doctor commission settlement',
          // Business
          'Corporate camp registration',
          'TPA orders from empanelled corporates',
          'Monthly MIS report for center owner',
          'Chat + email support',
        ],
        notIncluded: [
          'Full QC cold-chain IoT integration',
          'NABL 111 collection center audit compliance',
          'Multi-branch PSC network management',
          'Staff HRMS with biometric attendance',
          'Franchise PSC operations',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',   value:'150 – 500'},
          {label:'Staff',           value:'10 – 40'},
          {label:'Partner Labs',    value:'3 – 10'},
          {label:'Monthly Orders',  value:'Up to 15,000'},
          {label:'WA Credits',      value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // Multi-branch
          'Multi-branch PSC management console',
          'Centralised order dashboard across all branches',
          'Branch-level user access & permissions',
          'Inter-branch sample transfer',
          'Consolidated MIS for group',
          // Compliance
          'NABL 111 sample collection center audit trail',
          'SOP version control with sign-off',
          'DMLT / phlebotomist certificate tracking',
          'Needle disposal & biomedical waste register',
          // SLA & escalations
          'SLA tracking per partner lab (TAT adherence)',
          'Automated escalation on delayed reports',
          'Lab-wise performance scorecard',
          // HRMS
          'Staff attendance (biometric / face-auth)',
          'Shift roster & leave management',
          'Payroll with PF / ESI',
          // Analytics
          'Collection efficiency (samples per phlebotomist)',
          'Test mix analysis (profitable vs loss-making)',
          'Zone / locality heat-map for expansion',
          'Priority support',
        ],
        notIncluded: [
          'Franchise PSC network onboarding',
          'Revenue sharing with franchise owners',
          'White-label patient-facing experience',
          'AI-powered zone expansion suggestions',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',   value:'500+'},
          {label:'Staff',           value:'40+'},
          {label:'Partner Labs',    value:'10+'},
          {label:'Monthly Orders',  value:'Unlimited'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // Franchise
          'Franchise PSC onboarding with agreement workflow',
          'Franchise royalty & revenue-sharing engine',
          'Territory protection & non-compete enforcement',
          'Franchise owner dashboard (own revenue, performance)',
          'Franchise audit checklist',
          // Aggregator & partnerships
          'Aggregator inbound API (1mg, Practo, MediBuddy)',
          'Hospital HIS outbound orders',
          'White-label PSC mobile app',
          // AI
          'AI-powered zone heat-map for new PSC locations',
          'Demand forecasting per zone',
          'Phlebotomist assignment optimizer',
          // Enterprise
          'Dedicated account manager',
          'Custom SLA & compliance reports',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * HOME SAMPLE COLLECTION
   *   Doorstep phlebotomy service — booking, dispatch, route, cold chain.
   * ================================================================ */
  'home-sample-collection': {
    scaleLabel: 'Daily Bookings', scaleUnit: 'bookings/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Bookings',  value:'1 – 20'},
          {label:'Agents',          value:'1 – 3'},
          {label:'Zones',           value:'1'},
          {label:'Monthly',         value:'Up to 600'},
          {label:'WA Credits',      value:'300 / month'},
        ],
        features: [
          'Online booking via WhatsApp chatbot',
          'Basic slot management (morning / afternoon slots)',
          'Manual phlebotomist assignment',
          'Patient pre-collection instructions (fasting, etc.)',
          'Sample collection checklist on agent phone',
          'Manual cold-chain log (ice pack temperature)',
          'Collection confirmation WhatsApp to patient',
          'Barcode handoff to partner lab at sample drop',
          'UPI / cash payment at doorstep',
          'Basic daily booking dashboard',
          'Email support',
        ],
        notIncluded: [
          'Real-time GPS tracking of phlebotomist',
          'ETA sharing with patient via WhatsApp',
          'Call-masking for privacy',
          'Dedicated phlebotomist mobile app',
          'Multi-zone dynamic routing',
          'Cold-chain IoT monitoring',
          'Corporate home collection contracts',
          'Family / group booking',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Bookings',  value:'20 – 100'},
          {label:'Agents',          value:'3 – 15'},
          {label:'Zones',           value:'2 – 5'},
          {label:'Monthly',         value:'Up to 3,000'},
          {label:'WA Credits',      value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          // Tech upgrades
          'Live GPS tracking of phlebotomist shared with patient',
          'ETA countdown in WhatsApp chat',
          'Call-masking (Exotel / Knowlarity style privacy)',
          'Dedicated phlebotomist Android app',
          // Scheduling
          'Multi-zone booking with smart agent assignment',
          'Automated route suggestion per agent',
          'Slot-based capacity management',
          'Reschedule / cancel flow via WhatsApp',
          // Family bookings
          'Family booking — multiple members in one visit',
          'Add-on test recommendation (upsell)',
          'Prescription upload for eligible test review',
          // Cold chain
          'Cold-chain temperature log with timestamp',
          'Sample rejection flow with refund',
          // Business
          'Corporate home collection contracts',
          'Camp-mode for on-site corporate drives',
          'Report ready WhatsApp notification',
          'Repeat booking reminder (chronic patients)',
          'Chat + email support',
        ],
        notIncluded: [
          'AI-powered route optimization (real traffic)',
          'Fleet & fuel management',
          'Multi-city operations',
          'NABL-compliant cold chain audit trail',
          'Franchise agent network',
          'White-label patient app',
        ],
      },
      large: {
        scale: [
          {label:'Daily Bookings',  value:'100 – 500'},
          {label:'Agents',          value:'15 – 75'},
          {label:'Zones',           value:'5 – 20'},
          {label:'Monthly',         value:'Up to 15,000'},
          {label:'WA Credits',      value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // AI routing
          'AI-powered dynamic route optimization (traffic-aware)',
          'Cluster booking optimizer (pickup nearby patients together)',
          'Surge slot pricing (peak hours)',
          'Predictive booking volume per zone',
          // Fleet
          'Agent fleet management (bikes / cars)',
          'Fuel reimbursement tracking',
          'Vehicle maintenance logs',
          'Accident / incident reporting',
          // Multi-city
          'Multi-city / multi-hub operations',
          'City manager dashboards',
          'Cross-city transfer for specialty tests',
          // Compliance
          'NABL 111-compliant cold chain documentation',
          'IoT temperature sensor integration (Blulog, CryoBox)',
          'Temperature excursion alerts',
          'Sample integrity audit trail',
          // HRMS
          'Agent HRMS with biometric attendance',
          'Incentive calculation (per pickup, distance, rating)',
          'Performance-based leaderboard',
          'CME / training tracking',
          // Analytics
          'Agent productivity scorecard',
          'Zone heat-map for demand forecasting',
          'NPS & patient rating analytics',
          'Priority support',
        ],
        notIncluded: [
          'Franchise home-collection agent network',
          'Revenue sharing with franchise operators',
          'White-label branded patient app',
          'Aggregator API marketplace',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Bookings',  value:'500+'},
          {label:'Agents',          value:'75+'},
          {label:'Zones',           value:'City-wide / Multi-city'},
          {label:'Monthly',         value:'Unlimited'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // Franchise
          'Franchise agent network (rider aggregation)',
          'Revenue share per booking rules engine',
          'Territory management with GPS fencing',
          // White-label
          'White-label patient-facing mobile app (iOS + Android)',
          'Custom branding (logo, color, domain)',
          'Google Play / App Store publishing support',
          // Integration
          'Aggregator inbound API (1mg, Practo, Apollo 24/7, MediBuddy)',
          'Hospital-chain outbound integration',
          'Insurance aggregator home-check API',
          // Premium
          'Dedicated account manager',
          'SLA dashboards for enterprise clients',
          'Custom integrations on request',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * RADIOLOGY CENTER (X-Ray, CT, MRI, Mammography)
   *   RIS + PACS workflow: order -> schedule -> acquire -> interpret -> report
   *   Compliance: PC-PNDT (for USG included), AERB (radiation safety)
   * ================================================================ */
  'radiology-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',      value:'1 – 20'},
          {label:'Modalities',       value:'1 – 2 (X-Ray, USG)'},
          {label:'Radiologists',     value:'1 – 2'},
          {label:'Monthly Scans',    value:'Up to 600'},
          {label:'WA Credits',       value:'300 / month'},
        ],
        features: [
          // Scheduling
          'Scan appointment booking (online + walk-in)',
          'Modality-wise slot management',
          'Patient preparation instructions via WhatsApp',
          'Priority scheduling (STAT / routine)',
          // Workflow
          'Patient registration with referring doctor info',
          'Order entry with test & clinical indication',
          'Technician worklist by modality',
          // Reporting
          'Pre-built report templates (X-Ray chest, KUB, bones)',
          'Basic USG templates (abdomen, pelvis)',
          'Voice dictation to text (basic)',
          'Radiologist digital sign-off',
          'PDF report with lab letterhead & seal',
          // Delivery
          'WhatsApp report delivery with QR verification',
          'Referring doctor WhatsApp notification',
          // Billing
          'GST-compliant billing with HSN',
          'UPI payment link',
          'TPA / insurance basic workflow',
          // Compliance (basic)
          'PC-PNDT Form F digital register (for USG centers)',
          // Ops
          'Daily scan & revenue dashboard',
          'Email support',
        ],
        notIncluded: [
          'DICOM viewer link in report',
          'DICOM cloud storage',
          'CT / MRI specific report templates',
          'Tele-radiology routing to remote radiologists',
          'AI-assisted preliminary read',
          'Referring doctor portal',
          'Multi-radiologist worklist distribution',
          'PC-PNDT Form F digital submission & audit trail',
          'AERB radiation monitoring records',
          'Equipment utilization analytics',
          'Multi-branch radiology management',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',      value:'20 – 80'},
          {label:'Modalities',       value:'2 – 5 (X-Ray, USG, CT, MRI)'},
          {label:'Radiologists',     value:'2 – 8'},
          {label:'Monthly Scans',    value:'Up to 2,400'},
          {label:'WA Credits',       value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          // Multi-modality scheduling
          'Multi-modality slot optimization (X-Ray, USG, CT, MRI, Mammo)',
          'Equipment-wise appointment grid',
          'Contrast study workflow (pre-med, consent, monitoring)',
          'Patient prep reminder chain (24h / 2h / 30min)',
          // DICOM
          'DICOM viewer link in every report (web viewer)',
          'DICOM image upload from modality (via MWL / C-STORE)',
          'Basic DICOM cloud storage (90 days)',
          'Prior study access for comparison',
          // Radiologist workflow
          'Multi-radiologist worklist distribution',
          'Case urgency flag (STAT / routine)',
          'Radiologist dictation with speech-to-text',
          'Digital signature & credentialing',
          // Templates
          'CT specific templates (brain, chest, abdomen, angiography)',
          'MRI specific templates (brain, spine, joints, body)',
          'Mammography BI-RADS reporting',
          // Compliance
          'PC-PNDT Form F full digital workflow',
          'Form F monthly auto-submission to CA',
          'Pregnancy sonography pre-test counseling log',
          // Referring doctor
          'Referring doctor portal (orders, results)',
          'Doctor CRM with commission tracking',
          'Critical findings phone-call documentation',
          // Business
          'Corporate radiology packages',
          'TPA / insurance detailed workflow',
          'Pre-authorization for CT / MRI',
          'Chat + email support',
        ],
        notIncluded: [
          'Full DICOM PACS integration (Orthanc, dcm4chee)',
          'Long-term DICOM archive (5+ years)',
          'Tele-radiology routing to external radiologists',
          'AI-assisted preliminary read (chest, brain)',
          'Multi-branch radiology chain management',
          'AERB radiation monitoring & compliance',
          'Equipment utilization analytics',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',      value:'80 – 300'},
          {label:'Modalities',       value:'5+ (full radiology suite)'},
          {label:'Radiologists',     value:'8 – 30'},
          {label:'Monthly Scans',    value:'Up to 9,000'},
          {label:'WA Credits',       value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // PACS
          'Full DICOM PACS integration (Orthanc / dcm4chee / proprietary)',
          'Long-term DICOM archive (5+ years, redundant storage)',
          'DICOM routing rules by modality',
          'Prior study matching across time',
          'VNA (vendor neutral archive) support',
          'Hanging protocols per modality',
          // Tele-radiology
          'Tele-radiology routing to external radiologist panel',
          'Sub-specialty routing (neuro, MSK, chest, body, breast)',
          'Turnaround time SLA per urgency',
          '24/7 on-call radiologist management',
          // AI
          'AI-assisted preliminary read (chest X-Ray, brain CT)',
          'AI flagging of potential abnormalities',
          'AI second opinion tool',
          // Compliance
          'AERB-compliant radiation exposure records',
          'Radiology equipment QA log (DQE, CTDI, SNR)',
          'Radiation worker TLD badge management',
          'Pregnancy screening before CT (10-day rule)',
          'PC-PNDT full audit suite (CA report, Form E, F, G, H)',
          // Multi-branch
          'Multi-branch radiology chain management',
          'Centralised radiologist pool across branches',
          'Branch-wise utilization analytics',
          // HRMS
          'Staff HRMS with CME credit tracking',
          'Radiologist productivity reports',
          'Technologist competency matrix',
          // Analytics
          'Equipment utilization & downtime dashboard',
          'TAT per modality & radiologist',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Multi-site federated PACS',
          'Advanced AI diagnostic modules (mammography, bone age)',
          'Franchise radiology network',
          'White-label radiology portal',
          'NABH imaging accreditation documentation',
          'Hospital HIS deep integration (HL7 / FHIR)',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',      value:'300+'},
          {label:'Modalities',       value:'10+ locations, full suite'},
          {label:'Radiologists',     value:'30+'},
          {label:'Monthly Scans',    value:'Unlimited'},
          {label:'WA Credits',       value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // Federated PACS
          'Multi-site federated PACS with image replication',
          'Cloud + on-prem hybrid DICOM storage',
          'Disaster recovery with hot-standby',
          // Advanced AI
          'Advanced AI diagnostic suite — mammography (BI-RADS)',
          'AI bone age estimation',
          'AI chest X-ray auto-triage',
          'AI stroke detection for CT',
          'AI lung nodule detection',
          // Franchise
          'Franchise radiology network management',
          'White-label branded patient portal',
          'Franchise owner revenue dashboard',
          // Hospital integration
          'HL7 / FHIR R4 bi-directional integration with hospital HIS',
          'ORM / ORU / MDM message handling',
          'Outbound reports to hospital EMR',
          // Compliance
          'NABH imaging department accreditation suite',
          'AERB regulatory reporting automation',
          'ABHA / ABDM DICOM submission (when applicable)',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed 99.9% uptime',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * ULTRASOUND CENTER
   *   Focus: PC-PNDT compliance is critical; OB/GYN workflows dominate.
   * ================================================================ */
  'ultrasound-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',   value:'1 – 15'},
          {label:'Sonologists',   value:'1 – 2'},
          {label:'Machines',      value:'1'},
          {label:'Monthly',       value:'Up to 450'},
          {label:'WA Credits',    value:'300 / month'},
        ],
        features: [
          // Scheduling
          'USG appointment booking (walk-in + online)',
          'Patient prep instructions via WhatsApp (water intake, bladder)',
          'Modality slot management (convex, linear probe)',
          // Templates
          'Structured USG templates — abdomen, pelvis, KUB',
          'Basic obstetric templates (LMP, EDD calculation)',
          'Thyroid, breast, musculoskeletal templates',
          // Workflow
          'Digital sign-off by sonologist',
          'PDF report with letterhead & digital seal',
          'WhatsApp report delivery',
          // PC-PNDT (critical)
          'PC-PNDT Form F digital register',
          'Pregnancy declaration form (basic)',
          // Business
          'GST billing',
          'UPI payment link',
          'Referring doctor notification',
          'Email support',
        ],
        notIncluded: [
          'Full PC-PNDT digital compliance suite',
          'Form F monthly auto-submission to CA',
          '4D / Doppler structured templates',
          'Growth scan with auto-biometry',
          'BPP (Biophysical Profile) module',
          'Referring OBGYN portal',
          'Multi-machine slot optimization',
          'NABL compliance documentation',
          'Multi-branch ultrasound management',
          'AI fetal anomaly screening',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',   value:'15 – 60'},
          {label:'Sonologists',   value:'2 – 5'},
          {label:'Machines',      value:'1 – 3'},
          {label:'Monthly',       value:'Up to 1,800'},
          {label:'WA Credits',    value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          // PC-PNDT deep
          'PC-PNDT Form F — full digital submission to CA',
          'Monthly auto-submission cycle',
          'Pre-test counseling form (PNDT Form G)',
          'Patient declaration form (Form H)',
          'Audit trail with tamper-proof logs',
          'Sex determination auto-blocking (hard-coded)',
          'Referring doctor PNDT license verification',
          // OB specific
          'OB first trimester screening template (NT, nasal bone)',
          'OB anomaly scan (TIFFA, level 2)',
          'Growth scan with auto-biometry (BPD, HC, AC, FL)',
          'BPP (biophysical profile) scoring',
          'Doppler report templates (umbilical, MCA, uterine)',
          '4D USG capture with snapshots',
          // Other specialties
          'Echo (basic cardiac USG) templates',
          'Breast USG with BI-RADS',
          'Interventional USG (aspiration, biopsy) log',
          // Referring doctors
          'Referring doctor portal (view own patient reports)',
          'OBGYN referral commission tracking',
          'Critical finding phone-call log',
          // Business
          'Maternity package billing (5-scan, 7-scan bundles)',
          'Corporate empanelment',
          'TPA / cashless maternity claims',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-machine optimization across USG rooms',
          'NABL ISO 15189 for ultrasound',
          'PC-PNDT CA audit-ready report generation',
          'Multi-branch USG operations',
          'Staff HRMS',
          'AI fetal anomaly screening tools',
          'Franchise USG network',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',   value:'60 – 200'},
          {label:'Sonologists',   value:'5 – 20'},
          {label:'Machines',      value:'3 – 10'},
          {label:'Monthly',       value:'Up to 6,000'},
          {label:'WA Credits',    value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // PC-PNDT enterprise
          'Full PC-PNDT audit suite — CA quarterly report export',
          'Form E (pregnancy test record), Form F, G, H auto-fill',
          'Multi-location PC-PNDT compliance dashboard',
          'Internal audit checklist for PNDT',
          'CA inspection preparedness module',
          'Automatic SMS/email alert on compliance gaps',
          // Operations
          'Multi-machine slot optimization across USG rooms',
          'Sonologist worklist with priority queue',
          'Probe maintenance & PM schedule',
          'QC for USG (IQ phantom test log)',
          // Multi-branch
          'Multi-branch ultrasound center management',
          'Centralised sonologist pool',
          'Branch-level CA registration tracking',
          // HRMS
          'Staff HRMS with biometric attendance',
          'Sonologist credentialing (FOGSI, MCI certificates)',
          'CME credit & training tracker',
          // Accreditation
          'NABL-style QC for ultrasound',
          'Equipment calibration records',
          'Report template version control',
          // Analytics
          'Equipment utilization per room',
          'TAT per scan type',
          'Sonologist productivity & revenue contribution',
          'Priority support',
        ],
        notIncluded: [
          'AI fetal anomaly screening',
          'Franchise USG network',
          'White-label patient app',
          'Hospital OBGYN HIS integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',   value:'200+'},
          {label:'Sonologists',   value:'20+'},
          {label:'Machines',      value:'10+'},
          {label:'Monthly',       value:'Unlimited'},
          {label:'WA Credits',    value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // AI
          'AI fetal anomaly screening (NT, congenital heart, spine)',
          'AI biometry auto-measurement',
          'AI breast lesion classification',
          // Franchise
          'Franchise USG center network',
          'Franchise CA registration assistance workflow',
          'Revenue sharing engine',
          'White-label patient portal',
          // Hospital
          'Hospital OBGYN HIS deep integration',
          'Maternity hospital network orders',
          // Compliance
          'Central PNDT compliance officer role',
          'National-level CA audit readiness',
          'Dedicated compliance advisor included',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed uptime',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * PET SCAN CENTER
   *   Nuclear medicine — radiotracer ordering, dosing, AERB, SUV analysis
   * ================================================================ */
  'pet-scan-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',      value:'1 – 5'},
          {label:'Staff',            value:'3 – 8'},
          {label:'Machines',         value:'1 (PET-CT)'},
          {label:'Monthly',          value:'Up to 100'},
          {label:'WA Credits',       value:'200 / month'},
        ],
        features: [
          // Booking
          'PET-CT appointment booking with pre-scan consult',
          'Patient prep checklist (fasting, hydration, blood glucose)',
          'Pregnancy screening pre-scan',
          // Radiotracer
          'Radiotracer dose log (FDG, PSMA, DOTATATE)',
          'Injection time, dose, kit lot tracking',
          'Residual activity log',
          // Scanning
          'Scan acquisition parameters (uptake time, bed position)',
          'Basic PET-CT report templates (oncology, cardiac, neuro)',
          'Nuclear medicine physician digital sign-off',
          // Reporting
          'PDF report with oncologist distribution',
          'WhatsApp report delivery',
          // Radiation safety (basic)
          'Staff TLD badge record',
          'Waste disposal log',
          // Business
          'GST billing',
          'Referring oncologist notification',
          'Email support',
        ],
        notIncluded: [
          'DICOM PACS for PET-CT images',
          'Multi-tracer inventory management',
          'AERB full compliance automation',
          'Tele-nuclear medicine reading',
          'Therapy response assessment (PERCIST, RECIST)',
          'AI-based SUV quantification',
          'Theranostics workflow',
          'Multi-machine / multi-center operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',      value:'5 – 15'},
          {label:'Staff',            value:'8 – 20'},
          {label:'Machines',         value:'1 – 2'},
          {label:'Monthly',          value:'Up to 300'},
          {label:'WA Credits',       value:'600 / month'},
        ],
        features: [
          'Everything in Small',
          // DICOM
          'DICOM viewer link in every report',
          'DICOM cloud archive (90 days)',
          'Fusion image handling (PET + CT)',
          // Tracer management
          'Multi-tracer inventory (FDG, Ga-68, F-18 variants)',
          'Cyclotron / supplier integration for delivery schedule',
          'Per-patient dose calculation & calibration',
          'Expiry alerts & kit wastage tracking',
          // Radiation safety
          'AERB-prescribed radiation exposure records',
          'Area monitoring log',
          'Effluent decay & disposal log',
          'Radiation worker dosimetry (TLD / pocket dosimeter)',
          // Clinical
          'Therapy response templates (PERCIST, RECIST 1.1)',
          'SUVmax, SUVmean measurement log',
          'Oncologist CRM with referral tracking',
          'Tumor board preparation module',
          // Business
          'Insurance / TPA PET-CT pre-auth',
          'Package billing (staging, restaging, response)',
          'Chat + email support',
        ],
        notIncluded: [
          'Full DICOM PACS (long-term archive)',
          'Multi-machine scheduling',
          'AI-based SUV quantification',
          'Theranostics (Lu-177 PSMA) workflow',
          'Multi-center nuclear medicine network',
          'Cardiac PET viability module',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',      value:'15 – 40'},
          {label:'Staff',            value:'20 – 60'},
          {label:'Machines',         value:'2 – 4'},
          {label:'Monthly',          value:'Up to 1,000'},
          {label:'WA Credits',       value:'2,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // PACS
          'Full PET-CT DICOM PACS (long-term archive)',
          'Multi-modality fusion (PET + MRI, PET + CT)',
          'Prior study comparison & tumor burden tracking',
          // Operations
          'Multi-machine slot optimization',
          'Uptake room scheduling',
          'Hot lab management',
          // Clinical depth
          'Cardiac PET viability module',
          'Neuro-PET (dementia, epilepsy) templates',
          'AI-assisted lesion detection & quantification',
          'Auto SUV calculation with normalization',
          // AERB compliance
          'Full AERB compliance documentation',
          'Area survey reports with handheld monitor integration',
          'Patient-release criteria verification',
          'RSO (Radiation Safety Officer) dashboard',
          // Multi-center
          'Multi-hospital referring center management',
          'Centralised nuclear med physician pool',
          'Report turnaround SLA tracking',
          // HRMS
          'Staff HRMS with radiation worker badges',
          'Nuclear med technologist competency matrix',
          'Priority support',
        ],
        notIncluded: [
          'Theranostics (Lu-177 PSMA, I-131 MIBG) workflow',
          'Multi-center franchise network',
          'AERB national reporting automation',
          'Research / clinical trial module',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',      value:'40+'},
          {label:'Staff',            value:'60+'},
          {label:'Machines',         value:'4+'},
          {label:'Monthly',          value:'Unlimited'},
          {label:'WA Credits',       value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // Theranostics
          'Theranostics workflow (Lu-177 PSMA, DOTATATE therapy)',
          'I-131 thyroid ablation workflow',
          'Therapy planning with dosimetry',
          // National network
          'Multi-center nuclear medicine network',
          'Centralised RSO & compliance officer',
          'Hospital oncology network integration',
          'AERB national regulatory reporting automation',
          // Research
          'Clinical trial module (patient recruitment, protocol)',
          'Research data export for academic use',
          'IRB / ethics committee documentation',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed uptime guarantee',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * CARDIAC DIAGNOSTICS
   *   ECG, Echo, TMT, Holter, ABPM, Cath lab, EP study
   * ================================================================ */
  'cardiac-diagnostics': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Patients', value:'1 – 25'},
          {label:'Cardiologists',  value:'1 – 2'},
          {label:'Equipment',      value:'ECG + basic Echo'},
          {label:'Monthly',        value:'Up to 750'},
          {label:'WA Credits',     value:'400 / month'},
        ],
        features: [
          // Booking
          'Cardiac appointment booking (ECG, Echo, TMT)',
          'Patient history capture (cardiac, diabetes, hypertension)',
          'Drug history (beta-blocker, anticoagulant holds for TMT)',
          // Templates
          'ECG report with interpretation (sinus rhythm, axis, intervals)',
          'Basic 2D Echo template (chambers, valves, EF)',
          'Color Doppler basic (regurgitation grading)',
          // Workflow
          'Cardiologist digital sign-off',
          'PDF report with institutional letterhead',
          'WhatsApp report delivery',
          // Referring doc
          'Referring physician WhatsApp notification',
          'Critical findings phone-call log',
          // Business
          'GST billing',
          'UPI payment link',
          'Email support',
        ],
        notIncluded: [
          'TMT / Stress Echo dedicated workflow',
          'Holter monitor allocation & 24/48h analysis',
          'ABPM (ambulatory BP monitoring)',
          'ICAD / ABI (ankle-brachial index) templates',
          'Pediatric cardiology templates',
          'Cardiac risk stratification (Framingham, ASCVD)',
          'Cath lab scheduling',
          'EP (electrophysiology) study module',
          'Multi-cardiologist worklist',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Patients', value:'25 – 100'},
          {label:'Cardiologists',  value:'2 – 8'},
          {label:'Equipment',      value:'ECG, Echo, TMT, Holter, ABPM'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          // TMT
          'TMT (Treadmill Test) dedicated workflow',
          'Bruce protocol / modified Bruce stage tracker',
          'METs achieved, target HR, duration log',
          'TMT interpretation (positive/negative/inconclusive)',
          'Pre-TMT medication hold reminder',
          // Stress Echo
          'Stress Echo (dobutamine / exercise)',
          'Wall motion abnormality scoring',
          // Holter
          'Holter monitor allocation & device tracking',
          '24 / 48 / 72-hour Holter analysis report',
          'Arrhythmia quantification (PVCs, PACs, AF burden)',
          'Heart rate variability analysis',
          // ABPM
          'ABPM (24-hour BP monitoring) report',
          'Daytime / nighttime BP averaging',
          'Dipper / non-dipper classification',
          // Vascular
          'ICAD / ABI template',
          'Carotid Doppler with IMT measurement',
          'Venous Doppler for DVT',
          // Clinical
          'Cardiac risk stratification (Framingham, ASCVD, QRISK)',
          'Pediatric cardiology templates',
          // Business
          'Corporate cardiac screening packages',
          'TPA / cashless for cardiac procedures',
          'Doctor CRM with commission tracking',
          'Chat + email support',
        ],
        notIncluded: [
          'Cath lab scheduling & procedure logs',
          'EP study (electrophysiology) templates',
          'Cardiac rehab program management',
          'Multi-branch cardiac center management',
          'AI ECG interpretation',
          'National cardiac registry integration',
        ],
      },
      large: {
        scale: [
          {label:'Daily Patients', value:'100 – 300'},
          {label:'Cardiologists',  value:'8 – 30'},
          {label:'Equipment',      value:'Full cardiac lab + Cath'},
          {label:'Monthly',        value:'Up to 9,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // Cath lab
          'Cath lab scheduling (angio, angioplasty, valve)',
          'Pre-procedure consent & coagulation workup',
          'Procedure log (access site, contrast, stents, devices)',
          'Complication & adverse event register',
          'Post-procedure observation & discharge',
          // EP study
          'EP study (electrophysiology) templates',
          'Ablation procedure log',
          'Pacemaker / ICD / CRT device tracking',
          'Device interrogation records',
          // Cardiac rehab
          'Cardiac rehabilitation program enrollment',
          'Session-wise progress tracking',
          'Exercise prescription & monitoring',
          // Multi-branch
          'Multi-branch cardiac center management',
          'Centralised cardiologist pool',
          'Branch-wise performance dashboard',
          // HRMS
          'Staff HRMS with CME tracking',
          'Cardiologist credentialing',
          // Insurance
          'Insurance & TPA — cardiac procedure codes (CPT)',
          'Bundled pricing per procedure',
          'Priority support',
        ],
        notIncluded: [
          'AI ECG / Echo interpretation',
          'National cardiac registry integration (CCTV, ACC)',
          'Hospital-grade FHIR integration',
          'Multi-hospital network management',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Patients', value:'300+'},
          {label:'Cardiologists',  value:'30+'},
          {label:'Equipment',      value:'Full suite + multiple Cath'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // AI
          'AI ECG interpretation assistance',
          'AI Echo automated measurement (EF, strain)',
          'AI arrhythmia detection for Holter',
          // Registries
          'National cardiac registry submission (CSI, ACC)',
          'STEMI registry participation',
          'Device implant registry (ICD, pacemaker)',
          // Hospital
          'Hospital HIS HL7 / FHIR R4 integration',
          'Multi-hospital network management',
          'Inter-hospital patient transfer workflow',
          // Clinical outcomes
          'MACE (major adverse cardiac events) tracking',
          '30-day readmission analysis',
          'Outcomes dashboard by cardiologist',
          // Premium
          'Dedicated account manager',
          'Custom integrations',
          'Quarterly business review',
          'SLA-backed uptime',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * MOLECULAR / PCR LAB
   *   Biosafety, batch processing, RT-PCR, NGS, gov reporting
   * ================================================================ */
  'molecular-lab': {
    scaleLabel: 'Daily PCR Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Samples',  value:'1 – 20'},
          {label:'Staff',          value:'2 – 5'},
          {label:'Equipment',      value:'1 PCR machine'},
          {label:'Monthly',        value:'Up to 500'},
          {label:'WA Credits',     value:'300 / month'},
        ],
        features: [
          // Sample handling
          'Sample registration with specimen type (swab, blood, tissue)',
          'Biosafety level log (BSL-2) & SOP checklist',
          'Sample rejection criteria & register',
          'Pre-analytical time tracking',
          // Testing
          'PCR test catalog (COVID, TB, HIV, HBV, HCV, HPV, STI panels)',
          'Manual batch plate setup (layout, controls)',
          'Ct value entry & interpretation',
          'Positive / negative / equivocal / invalid result logic',
          // QC basics
          'Positive & negative controls with each batch',
          'Internal control verification',
          // Reporting
          'PDF molecular test report with Ct values',
          'WhatsApp result delivery',
          // Ops
          'GST billing',
          'Email support',
        ],
        notIncluded: [
          'ICMR RT-PCR COVID reporting (automated)',
          'Multi-target / multiplex PCR panel',
          'Real-time PCR instrument integration',
          'Reflex testing logic',
          'NABL molecular accreditation',
          'NACO / Nikshay disease reporting',
          'NGS (next-gen sequencing) workflow',
          'High-throughput automation',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Samples',  value:'20 – 100'},
          {label:'Staff',          value:'5 – 15'},
          {label:'Equipment',      value:'2 – 4 PCR instruments'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          // Gov reporting
          'ICMR RT-PCR reporting (automated submission)',
          'ICMR patient registration with specimen referral form',
          'COVID positive reporting to state health',
          // Advanced PCR
          'Multi-target / multiplex panels (viral respiratory, STI)',
          'Reflex testing (positive → subtype/genotype)',
          'Viral load quantification reports',
          'Cycle threshold (Ct) trend across patients',
          // QC
          'Batch-level QC acceptance criteria',
          'Cross-contamination prevention workflow',
          'Equipment calibration log',
          // Business
          'Corporate / government bulk order management',
          'Travel test package (pre-departure PCR)',
          'TPA / insurance coverage for PCR',
          // Ops
          'TAT SLA per urgency (routine / urgent / STAT)',
          'Critical result auto-notification',
          'Chat + email support',
        ],
        notIncluded: [
          'RT-PCR instrument bi-directional integration',
          'NABL ISO 15189 for molecular',
          'NACO HIV viral load reporting',
          'Nikshay TB reporting',
          'NGS panel workflow',
          'Automation (extraction robots, liquid handlers)',
        ],
      },
      large: {
        scale: [
          {label:'Daily Samples',  value:'100 – 500'},
          {label:'Staff',          value:'15 – 50'},
          {label:'Equipment',      value:'4 – 15 instruments + automation'},
          {label:'Monthly',        value:'Up to 15,000'},
          {label:'WA Credits',     value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // Automation
          'RT-PCR instrument bi-directional integration (QuantStudio, CFX)',
          'Automated extraction instrument integration (QIAsymphony, Hamilton)',
          'Liquid handler protocol management',
          'Plate map auto-generation',
          // NABL molecular
          'NABL ISO 15189:2022 molecular discipline compliance',
          'Method validation protocols',
          'Performance evaluation records',
          'EQA / PT participation (CMC Vellore, AIIMS)',
          // Gov reporting
          'NACO HIV viral load & early infant diagnosis reporting',
          'Nikshay RNTCP TB reporting (CBNAAT, TrueNat)',
          'IDSP / IHIP notifiable disease reporting',
          // Sequencing
          'Sanger sequencing result upload',
          'Targeted sequencing panel result',
          // Ops
          'Multi-batch tracking across shifts (AM / PM / Night)',
          'Reagent lot tracking & re-use prevention',
          'Staff HRMS with biosafety certification tracker',
          'Biomedical waste tracking (autoclave logs)',
          'Priority support',
        ],
        notIncluded: [
          'NGS (WES / WGS / panel) workflow management',
          'Bioinformatics pipeline integration',
          'Franchise molecular lab network',
          'Research & clinical trial module',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Samples',  value:'500+'},
          {label:'Staff',          value:'50+'},
          {label:'Equipment',      value:'15+ instruments + high throughput'},
          {label:'Monthly',        value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // NGS
          'NGS workflow (WES, WGS, targeted panels)',
          'Library prep & sequencing run tracking',
          'Quality metrics (Q30, coverage, read depth)',
          'Variant calling & VCF import',
          // Bioinformatics
          'Bioinformatics pipeline integration (GATK, DNAnexus)',
          'Variant annotation (ClinVar, HGMD, COSMIC)',
          'Cloud compute orchestration',
          // Gov reporting
          'Multi-program reporting (ICMR, NACO, Nikshay, IDSP)',
          'WHO protocol compliance (ISP, GLI)',
          'State Health Department portal integration',
          // Franchise
          'Franchise molecular lab onboarding',
          'Hub-spoke sample routing',
          'Revenue sharing engine',
          // Research
          'Research collaboration module',
          'Biobank with consent management',
          'Clinical trial sample tracking',
          'IRB documentation',
          // Integration
          'API for hospital LIS integration',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed uptime',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * HEALTH CHECKUP CENTER
   *   Preventive health — packages, multi-dept coordination, HRA
   * ================================================================ */
  'health-checkup': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Patients', value:'1 – 30'},
          {label:'Staff',          value:'2 – 8'},
          {label:'Packages',       value:'3 – 5 pre-built'},
          {label:'Monthly',        value:'Up to 900'},
          {label:'WA Credits',     value:'400 / month'},
        ],
        features: [
          // Packages
          'Pre-built packages (Basic, Standard, Comprehensive, Executive)',
          'Gender-specific packages (Men, Women)',
          'Age-band packages (Youth, Adult, Senior)',
          // Booking
          'Package booking via WhatsApp',
          'Fasting & pre-checkup instructions',
          'Single-day / multi-day checkup slot booking',
          // Multi-dept
          'Department coordination (pathology, radiology, ECG, consult)',
          'Patient journey tracking (station to station)',
          'Pending test / consultation alerts',
          // Reporting
          'Consolidated health checkup PDF report (all tests together)',
          'Doctor summary & recommendations section',
          'WhatsApp report delivery',
          // Business
          'GST billing with package rates',
          'Referring physician notification',
          'Email support',
        ],
        notIncluded: [
          'Custom package builder',
          'Health risk assessment (HRA) scoring',
          'Automated follow-up recommendations',
          'Corporate wellness package management',
          'Year-on-year health trend comparison',
          'AI health summary generation',
          'Population health analytics',
          'Multi-branch checkup operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Patients', value:'30 – 100'},
          {label:'Staff',          value:'8 – 25'},
          {label:'Packages',       value:'10 – 20 custom'},
          {label:'Monthly',        value:'Up to 3,000'},
          {label:'WA Credits',     value:'2,000 / month'},
        ],
        features: [
          'Everything in Small',
          // Package builder
          'Custom package builder (any tests + services)',
          'Add-on tests (upsell at time of booking)',
          'Seasonal / campaign packages',
          'Package comparison table (patient-facing)',
          // HRA
          'Health Risk Assessment (HRA) questionnaire',
          'HRA scoring with risk category (Low/Med/High)',
          'Personalized recommendations based on HRA',
          // Follow-ups
          'Automated follow-up by abnormal results',
          'Chronic disease enrolment (diabetes, hypertension)',
          'Next checkup reminder (annual, 6-monthly)',
          // Year-on-year
          'Y-o-Y health trend comparison charts',
          'Parameter-wise improvement/decline',
          'Personal health dashboard',
          // Corporate
          'Corporate wellness package bundling',
          'Employer bulk billing',
          'Camp-mode on-site checkups',
          // Consultations
          'Doctor / consultant CRM',
          'Post-checkup consultation slot booking',
          // Insurance
          'TPA / cashless health checkup',
          'Ayushman Bharat wellness workflow',
          'Chat + email support',
        ],
        notIncluded: [
          'Population health analytics dashboard',
          'Multi-branch checkup management',
          'White-label health report for corporates',
          'AI-generated health summary',
          'Franchise checkup network',
        ],
      },
      large: {
        scale: [
          {label:'Daily Patients', value:'100 – 400'},
          {label:'Staff',          value:'25 – 100'},
          {label:'Packages',       value:'20+ custom'},
          {label:'Monthly',        value:'Up to 12,000'},
          {label:'WA Credits',     value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // Population health
          'Population health analytics dashboard',
          'Disease prevalence by age / gender / zone',
          'Trends over time (checkup cohorts)',
          'Public health intelligence reports',
          // Multi-branch
          'Multi-branch checkup center management',
          'Centralised package catalog & rates',
          'Branch-wise comparison',
          'Patient transfer between branches',
          // Hospital tie-ups
          'Hospital / specialist tie-up referral module',
          'Referral commission tracking',
          'Co-branded packages',
          // HRMS
          'Staff HRMS (nurse, lab tech, consultant coordinator)',
          'Consultant credentialing',
          'CME & training tracker',
          // Compliance
          'NABL compliance for pathology components',
          'NABH entry-level for checkup center',
          'Priority support',
        ],
        notIncluded: [
          'White-label employer wellness portal',
          'AI health summary & risk stratification',
          'Franchise checkup network',
          'Government scheme deep integration',
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
          // White-label
          'White-label corporate health portal (employer brand)',
          'Custom domain for each enterprise client',
          'Employer-specific packages & rates',
          // AI
          'AI-generated health summary per patient',
          'AI risk stratification (cardio, diabetic, cancer)',
          'Personalized action plan via AI',
          // Franchise
          'Franchise checkup center network',
          'Revenue sharing engine',
          'Co-branded patient experience',
          // Government schemes
          'Ayushman Bharat PM-JAY full workflow',
          'ESIC wellness program integration',
          'CGHS / state health scheme integration',
          // API
          'Employer HRMS integration (Workday, SAP, Darwinbox)',
          'Health insurance portal sync',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed uptime',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * CORPORATE WELLNESS SCREENING
   *   On-site / bulk employee health camps
   * ================================================================ */
  'corporate-screening': {
    scaleLabel: 'Employees / Month', scaleUnit: 'employees/month',
    tiers: {
      small: {
        scale: [
          {label:'Employees/Month',  value:'50 – 500'},
          {label:'Corporate Clients', value:'1 – 5'},
          {label:'Staff',             value:'3 – 10'},
          {label:'Packages',          value:'3 – 5'},
          {label:'WA Credits',        value:'500 / month'},
        ],
        features: [
          // Bulk booking
          'Corporate employee bulk registration (CSV upload)',
          'Employee ID + department mapping',
          'Group slot booking (camp mode)',
          'Employee self-booking link per company',
          // On-site operations
          'On-site camp execution checklist',
          'Station-wise workflow (registration, sample, ECG, consult)',
          'Camp-day logistics tracker',
          'Consent & liability form capture',
          // Reports
          'Individual employee PDF report (sealed & confidential)',
          'Consolidated employer aggregate summary',
          'Abnormal cases highlighted report',
          'WhatsApp delivery to employee',
          // Billing
          'Corporate GST invoice (single invoice per company)',
          'Pro-forma & final settlement',
          'Email support',
        ],
        notIncluded: [
          'Custom employer HR portal',
          'Year-on-year employee health trends',
          'Multiple corporate contract management',
          'TPA group insurance billing',
          'Population health dashboards',
          'AI risk stratification',
          'Multi-city camp management',
          'HRMS integration',
        ],
      },
      medium: {
        scale: [
          {label:'Employees/Month',  value:'500 – 3,000'},
          {label:'Corporate Clients', value:'5 – 20'},
          {label:'Staff',             value:'10 – 30'},
          {label:'Packages',          value:'10 – 20'},
          {label:'WA Credits',        value:'2,000 / month'},
        ],
        features: [
          'Everything in Small',
          // Employer portal
          'Employer HR portal (view team-level reports)',
          'Department-wise dashboards',
          'Abnormal case management for HR',
          'Employee engagement tracking',
          // Y-o-Y
          'Year-on-year employee health trends',
          'Cohort health improvement metrics',
          'Risk migration analytics (how many moved risk category)',
          // Contracts
          'Multiple corporate contract management',
          'Contract renewal tracker',
          'Package customization per corporate',
          'Rate card per corporate client',
          // Insurance
          'TPA / group insurance billing',
          'Policy-wise claim tracking',
          // Camp mgmt
          'Multi-day multi-location camp scheduling',
          'Vendor / logistics coordination',
          'On-site coordinator dashboard',
          // Compliance
          'Confidentiality safeguards (no group WhatsApp)',
          'Consent management audit trail',
          'Chat + email support',
        ],
        notIncluded: [
          'Population health analytics (disease prevalence)',
          'AI risk stratification',
          'Multi-city operations',
          'HRMS API integration',
          'White-label employer portal',
        ],
      },
      large: {
        scale: [
          {label:'Employees/Month',  value:'3,000 – 15,000'},
          {label:'Corporate Clients', value:'20 – 100'},
          {label:'Staff',             value:'30 – 100'},
          {label:'Packages',          value:'Unlimited'},
          {label:'WA Credits',        value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // Population health
          'Population health analytics (disease prevalence by dept)',
          'Risk zones by zipcode / BU',
          'Lifestyle disease trends',
          'Occupational health indicators',
          // AI
          'AI risk stratification report (cardiovascular, metabolic)',
          'Preventive recommendations at scale',
          'Intervention effectiveness tracking',
          // Multi-city
          'Multi-city camp coordination',
          'Regional vendor management',
          'Travel & logistics orchestration',
          // HRMS API
          'HRMS integration (Workday, SAP SuccessFactors, Darwinbox)',
          'Employee master sync',
          'Status updates back to HR system',
          // HRMS (own)
          'Staff HRMS & field coordinator management',
          'Camp staff deployment scheduler',
          'Priority support',
        ],
        notIncluded: [
          'White-label employer wellness app',
          'Franchise wellness screening network',
          'Government scheme integration (ESIC, Ayushman)',
        ],
      },
      enterprise: {
        scale: [
          {label:'Employees/Month',  value:'15,000+'},
          {label:'Corporate Clients', value:'100+'},
          {label:'Staff',             value:'100+'},
          {label:'Packages',          value:'Unlimited'},
          {label:'WA Credits',        value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // White-label
          'White-label employer wellness app (client branding)',
          'Custom domain per client',
          'Employer-specific benefits display',
          'Family member coverage workflow',
          // Franchise
          'Franchise wellness screening network',
          'Revenue sharing engine',
          'Pan-India execution model',
          // Government
          'Ayushman Bharat PM-JAY integration',
          'ESIC corporate wellness workflow',
          'State-level health scheme integration',
          // National accounts
          'National corporate account management',
          'Pan-India camp coordination',
          'Centralised SLA dashboards',
          // Premium
          'Dedicated account manager',
          'SLA-backed reporting timelines',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * GENETIC TESTING LAB
   *   Highly specialized — pre/post-test counseling, ACMG, confidentiality
   * ================================================================ */
  'genetic-lab': {
    scaleLabel: 'Monthly Tests', scaleUnit: 'tests/month',
    tiers: {
      small: {
        scale: [
          {label:'Monthly Tests',   value:'Up to 100'},
          {label:'Staff',           value:'2 – 5'},
          {label:'Counselors',      value:'1'},
          {label:'Test Types',      value:'Karyotype, basic panels'},
          {label:'WA Credits',      value:'200 / month'},
        ],
        features: [
          // Sample
          'Genetic sample registration (blood, buccal swab, tissue)',
          'Specialized sample handling (DNA stabilisation)',
          'Chain of custody tracking',
          // Counseling
          'Pre-test genetic counseling appointment scheduling',
          'Informed consent capture (test-specific)',
          'Family history capture (basic)',
          // Testing
          'Karyotyping (G-banded) report templates',
          'FISH (fluorescence in-situ hybridization) templates',
          'Carrier screening report (single gene)',
          'Paternity / maternity testing workflow',
          // Confidentiality
          'Encrypted PDF reports (password-protected)',
          'Direct counselor-to-patient delivery only',
          'Result disclosure appointment mandated',
          'No group WhatsApp / no doctor auto-CC',
          // Business
          'GST billing',
          'Email support',
        ],
        notIncluded: [
          'NGS gene panel workflow',
          'ACMG variant classification tools',
          'Family pedigree capture & visualization',
          'Cascade testing (family members)',
          'Prenatal testing (NIPT, CVS, amnio)',
          'WES / WGS workflow',
          'Bioinformatics pipeline integration',
          'Pharmacogenomics reports',
          'Research collaboration tools',
          'Biobank management',
        ],
      },
      medium: {
        scale: [
          {label:'Monthly Tests',   value:'100 – 500'},
          {label:'Staff',           value:'5 – 15'},
          {label:'Counselors',      value:'2 – 5'},
          {label:'Test Types',      value:'NGS panels, array CGH'},
          {label:'WA Credits',      value:'800 / month'},
        ],
        features: [
          'Everything in Small',
          // NGS
          'NGS gene panel workflow (hereditary cancer, cardiac, neuro)',
          'Library prep & sequencing run tracking',
          'Variant calling result import',
          // ACMG
          'ACMG variant classification (P/LP/VUS/LB/B)',
          'ClinVar / HGMD database integration',
          'Variant interpretation workflow (3-tier review)',
          'Classification evidence log',
          // Family
          'Family pedigree capture (proband, parents, siblings)',
          'Pedigree visualization tool',
          'Cascade testing workflow (relative testing)',
          'Family member linking & shared records',
          // Prenatal
          'NIPT (non-invasive prenatal) protocol',
          'CVS (chorionic villus sampling) workflow',
          'Amniocentesis workflow',
          'High-risk pregnancy counseling',
          // Clinical
          'Referring physician result communication',
          'Tumor board integration (oncology panels)',
          'Chat + email support',
        ],
        notIncluded: [
          'WES (whole exome) / WGS (whole genome) workflow',
          'Advanced bioinformatics pipeline (VCF → variant)',
          'Pharmacogenomics reports',
          'Research biobank & consent management',
          'Rare disease registry integration',
          'Franchise genetic lab network',
        ],
      },
      large: {
        scale: [
          {label:'Monthly Tests',   value:'500 – 2,000'},
          {label:'Staff',           value:'15 – 50'},
          {label:'Counselors',      value:'5 – 15'},
          {label:'Test Types',      value:'WES, WGS, PGx'},
          {label:'WA Credits',      value:'2,000 / month'},
        ],
        features: [
          'Everything in Medium',
          // WES / WGS
          'WES (whole exome sequencing) workflow',
          'WGS (whole genome sequencing) workflow',
          'Coverage & quality metrics per run',
          // Bioinformatics
          'Bioinformatics pipeline (VCF file import)',
          'Variant annotation (VEP, ANNOVAR)',
          'Variant filtering & prioritization',
          'In-silico pathogenicity prediction',
          // Pharmacogenomics
          'Pharmacogenomics (PGx) panel reports',
          'Drug-gene interaction database',
          'CYP450 phenotype reports',
          'Physician-facing PGx recommendations',
          // Multi-site
          'Multi-site lab management',
          'Genetic counselor pool across sites',
          'Centralised variant interpretation queue',
          // HRMS
          'Staff HRMS with certification tracking',
          'Geneticist / counselor credentialing (ABMG, ABGC)',
          'CME & training tracker',
          'Priority support',
        ],
        notIncluded: [
          'Research biobank & consent management',
          'Rare disease registry integration',
          'Multi-hospital genetic counseling network',
          'Clinical trial module',
          'IRB / ethics documentation automation',
          'Franchise genetic lab network',
        ],
      },
      enterprise: {
        scale: [
          {label:'Monthly Tests',   value:'2,000+'},
          {label:'Staff',           value:'50+'},
          {label:'Counselors',      value:'15+'},
          {label:'Test Types',      value:'Full genomics suite'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          // Research
          'Research biobank with consent management',
          'Specimen tracking for research studies',
          'Rare disease registry integration (ORDO, Orphanet)',
          'Clinical trial sample tracking',
          'IRB / ethics committee documentation automation',
          // Hospital network
          'Multi-hospital genetic counseling network',
          'Tele-genetic counseling platform',
          'Hospital HIS integration for ordering',
          // Government
          'CSIR / DBT grant project tracking',
          'Genomic surveillance reporting',
          // Premium
          'Dedicated account manager',
          'Custom integrations on request',
          'SLA-backed uptime',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * REFERENCE / CENTRAL LAB
   *   Hub labs — receive from many centers, high-complexity esoteric tests
   * ================================================================ */
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
          // Hub operations
          'Hub sample receiving from partner labs',
          'Multi-partner sample manifest verification',
          'Inter-lab transfer with barcode handoff',
          'Complex test catalog (esoteric panels, send-outs)',
          // Analytics
          'Batch processing & analyser integration',
          'Turnaround time SLA per test',
          // Partner
          'Partner lab account management',
          'Rate card per partner',
          'Partner-specific report branding (basic)',
          // Reporting
          'PDF reports returned to referring lab',
          'WhatsApp patient report delivery',
          // Settlement
          'Partner lab billing & month-end settlement',
          'Partner lab credit / debit notes',
          'Chat + email support',
        ],
        notIncluded: [
          'NABL ISO 15189 accreditation documentation',
          'QC module (Westgard / Levey-Jennings)',
          'HL7 / ASTM auto-import from all analysers',
          'EQA / PT tracking (CAP, EQAS)',
          'Franchise lab management',
          'Revenue sharing with franchises',
          'White-label reporting for franchise',
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
          // NABL
          'NABL ISO 15189:2022 full documentation suite',
          'Method validation per test',
          'Measurement uncertainty calculations',
          'Document control system',
          'Internal & external audit scheduling',
          // QC
          'Full QC module (Westgard, Levey-Jennings, Cumulative Sum)',
          'Daily QC acceptance criteria',
          'RCA & CAPA workflow',
          // Analysers
          'HL7 / ASTM bi-directional with all analysers (200+ models)',
          'Unified worklist distribution',
          'Multi-analyser result aggregation',
          // Logistics
          'Runner / courier tracking for sample pickups',
          'Partner lab pickup scheduling',
          'Cold chain compliance for transport',
          // Performance
          'Partner lab performance dashboard',
          'SLA adherence reports',
          'Rejection rate analytics',
          // Ops
          'Reagent inventory & consumable management',
          'Critical reagent backup SKUs',
          'Priority support',
        ],
        notIncluded: [
          'Franchise lab onboarding & management',
          'Revenue sharing engine',
          'White-label reporting for franchise partners',
          'EQA / PT module (CAP, EQAS, AIIMS)',
          'ABHA / ABDM HIP integration',
          'Government disease reporting (ICMR, NACO, Nikshay)',
          'API marketplace',
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
          // Franchise
          'Franchise lab onboarding workflow (agreement, training)',
          'Franchise lab dashboard & audit',
          'Territory protection & non-compete enforcement',
          // Revenue sharing
          'Revenue sharing rules engine',
          'Royalty calculation per test',
          'Partner margin management',
          // White-label
          'White-label reports for franchise partners',
          'Franchise-specific letterhead & seal',
          'Partner-branded patient experience',
          // EQA / PT
          'EQA / PT module (CAP, EQAS, NEQAS, AIIMS PT)',
          'PT participation tracking',
          'PT performance report analysis',
          'Corrective action for PT failures',
          // Accreditation
          'NABL ISO 15189 full cycle',
          'CAP accreditation (for very high-end labs)',
          'CLIA-ready documentation',
          // HRMS
          'Staff HRMS with departments',
          'Payroll with all statutory deductions',
          'Geneticist / Pathologist credentialing',
          // Regulatory
          'NABL, ISO 15189 submission automation',
          'Dedicated account manager',
        ],
        notIncluded: [
          'ABHA / ABDM HIP + HPR integration (FHIR R4)',
          'Government disease reporting (ICMR, NACO, Nikshay, IDSP)',
          'API marketplace (aggregator, hospital LIS)',
          'National lab network management',
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
          // ABHA
          'ABHA / ABDM HIP integration (FHIR R4)',
          'HPR (Health Professional Registry) doctor linking',
          'Abha report submission automation',
          // Gov reporting
          'ICMR disease surveillance reporting',
          'NACO HIV viral load reporting',
          'RNTCP Nikshay TB reporting',
          'IDSP / IHIP notifiable disease reporting',
          // API marketplace
          'API marketplace (aggregator partnerships)',
          'Aggregator inbound order API (1mg, Practo, MediBuddy)',
          'Hospital HIS outbound HL7 feed',
          'Custom webhook builder',
          // National network
          'National lab network management',
          'State-level operation hubs',
          'Pan-India logistics orchestration',
          // Custom
          'Custom SLA contracts per partner tier',
          'SLA-backed 99.9% uptime guarantee',
          'Custom integrations on request',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * TELE-RADIOLOGY SERVICE
   *   Remote image interpretation — receive, route, report, return
   * ================================================================ */
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
          // DICOM receive
          'DICOM image upload portal for client centers',
          'Manual study import from C-STORE',
          'Basic web-based DICOM viewer (zoom, pan, W/L)',
          // Worklist
          'Radiologist worklist with priority flag',
          'Case assignment (manual)',
          'Status tracking (assigned → draft → signed)',
          // Reporting
          'Structured templates per modality (X-Ray, CT, MRI, USG)',
          'Macro / snippet library for common findings',
          'Digital signature with credentialing display',
          // Return
          'PDF report return to client center',
          'WhatsApp delivery to patient (where applicable)',
          // Business
          'Client center billing (per-report or monthly)',
          'TAT tracking per study',
          'Email support',
        ],
        notIncluded: [
          'DICOM cloud PACS (long-term archive)',
          'Sub-specialty routing (neuro, MSK, chest, body)',
          '24/7 on-call radiologist management',
          'AI preliminary read tools',
          'Client center portal (self-service upload)',
          'Multi-country timezone handling',
          'Radiologist credentialing & compliance module',
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
          // PACS basics
          'DICOM cloud archive (1-year retention)',
          'Prior study matching & comparison',
          'Multi-series handling for CT / MRI',
          'Hanging protocols per modality',
          // Routing
          'Sub-specialty routing (neuro, MSK, chest, body, breast)',
          'Radiologist expertise tags & auto-match',
          'Timezone-aware assignment',
          'Urgency-based queue (STAT / routine)',
          // On-call
          '24/7 on-call radiologist pool management',
          'Shift roster & coverage',
          'Escalation rules for unread cases',
          // Client portal
          'Client center self-service portal',
          'Upload DICOM / view reports / download',
          'TAT dashboard for client',
          'SLA adherence per center',
          // Reporting
          'Voice-to-text dictation',
          'Addendum / amendment workflow',
          'Peer review / second opinion',
          'Chat + email support',
        ],
        notIncluded: [
          'AI preliminary read integration',
          'PACS integration with client hospital HIS (HL7)',
          'Multi-country operations',
          'Advanced radiologist credentialing module',
          'NABH / ACR accreditation documentation',
          'White-label client portal',
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
          // AI
          'AI preliminary read (chest X-Ray, brain CT, bone fracture)',
          'AI auto-triage (flag critical cases to top of queue)',
          'AI second-opinion tool',
          'AI quality check on radiologist reports',
          // Hospital integration
          'PACS integration with client hospital HIS (HL7)',
          'ORM (order) / ORU (result) / MDM message handling',
          'Bi-directional study lifecycle sync',
          // Multi-country
          'Multi-country operations (India, Middle East, SE Asia)',
          'Timezone-aware coverage (24/7 follow-the-sun)',
          'Country-specific templates & languages',
          'Multi-currency billing',
          // Credentialing
          'Radiologist credentialing module',
          'MCI / state medical council verification',
          'CME / certification tracker',
          'Continuing competency program',
          // Peer review
          'Structured peer review workflow',
          'Discrepancy tracking & RCA',
          'Quality scorecard per radiologist',
          // Ops
          'Staff HRMS with shift roster',
          'Radiologist productivity & compensation',
          'TAT analytics per modality & radiologist',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Franchise teleradiology network management',
          'AI diagnostic automation (auto-preliminary reports)',
          'White-label client portal',
          'NABH / ACR / JCI accreditation suite',
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
          // Franchise
          'Franchise teleradiology network',
          'Partner radiology company integration',
          'Revenue sharing engine',
          'Franchise radiologist onboarding',
          // White-label
          'White-label client portal (custom branding per client)',
          'Custom domain per enterprise client',
          'Client-specific SLA dashboards',
          // Accreditation
          'NABH imaging accreditation documentation',
          'ACR (American College of Radiology) compliance',
          'JCI documentation (for international clients)',
          // Advanced AI
          'Full AI diagnostic automation (auto-preliminary drafts)',
          'AI modality QA feedback to source technologists',
          'AI worklist prioritization',
          // National / international
          'National / international radiology network',
          'Cross-border teleradiology contracts',
          'Multi-language report generation',
          // Premium
          'Dedicated account manager',
          'Custom SLA contracts',
          'Custom integrations on request',
          'SLA-backed 99.9% uptime',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

/* ================================================================
   * PICKUP POINT (PUP)
   *   Counter inside pharmacy/clinic — minimal handover flow.
   * ================================================================ */
  'pickup-point': {
    scaleLabel: 'Daily Handovers', scaleUnit: 'handovers/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Handovers', value:'1 – 15'},
          {label:'Staff',           value:'1'},
          {label:'Parent Lab',      value:'1'},
          {label:'WA Credits',      value:'200 / month'},
        ],
        features: [
          'Patient registration with phone-number lookup',
          'Sample handover checklist (tube type, volume, label)',
          'Barcode label printing for parent lab compatibility',
          'Handover manifest generation (PDF)',
          'WhatsApp receipt to patient',
          'Basic billing (pass-through from parent lab)',
          'Daily handover summary',
        ],
        notIncluded: [
          'Temperature monitoring',
          'Multi-lab routing',
          'Runner tracking',
          'Doctor referral CRM',
          'Insurance / TPA billing',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Handovers', value:'15 – 50'},
          {label:'Staff',           value:'1 – 3'},
          {label:'Parent Labs',     value:'1 – 2'},
          {label:'WA Credits',      value:'500 / month'},
        ],
        features: [
          'Everything in Small',
          'Temperature log for sample storage (manual entry)',
          'Multi-lab routing (route by test type)',
          'Runner pickup scheduling',
          'Referring doctor notification on collection',
          'Patient report delivery via WhatsApp link',
          'Monthly MIS for counter owner',
          'Chat + email support',
        ],
        notIncluded: [
          'Cold chain IoT monitoring',
          'Staff HRMS',
          'Multi-branch management',
          'Franchise operations',
        ],
      },
      large: {
        scale: [
          {label:'Daily Handovers', value:'50 – 200'},
          {label:'Staff',           value:'3 – 10'},
          {label:'Parent Labs',     value:'2 – 5'},
          {label:'WA Credits',      value:'1,500 / month'},
        ],
        features: [
          'Everything in Medium',
          'Cold chain temperature log with excursion alerts',
          'Multi-branch PUP management console',
          'Staff attendance tracking',
          'NABL-compliant sample handling audit trail',
          'Lab-wise TAT & SLA tracking',
          'Zone-wise performance analytics',
          'Priority support',
        ],
        notIncluded: [
          'Franchise PUP network',
          'White-label patient app',
          'API integrations',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Handovers', value:'200+'},
          {label:'Staff',           value:'10+'},
          {label:'Parent Labs',     value:'5+'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Franchise PUP onboarding & agreement workflow',
          'Revenue sharing engine',
          'White-label patient-facing experience',
          'Aggregator inbound API',
          'Dedicated account manager',
          'Custom SLA & compliance reports',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * HISTOPATHOLOGY & CYTOPATHOLOGY LAB
   *   Tissue biopsies, IHC, FNAC, Pap smears, frozen sections.
   * ================================================================ */
  'histopathology-lab': {
    scaleLabel: 'Daily Specimens', scaleUnit: 'specimens/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Specimens', value:'1 – 20'},
          {label:'Staff',           value:'1 – 5'},
          {label:'Pathologists',    value:'1'},
          {label:'Monthly Cases',   value:'Up to 600'},
          {label:'WA Credits',      value:'500 / month'},
        ],
        features: [
          'Specimen registration with clinical history capture',
          'Gross examination template & dictation',
          'Cassette & slide tracking with barcode',
          'H&E stain workflow with block tracking',
          'Microscopy result entry with free-text or template',
          'Pathologist single-step digital sign-off',
          'NABL-format PDF report with lab letterhead',
          'WhatsApp report delivery to clinician & patient',
          'GST-compliant invoice with HSN codes',
          'Daily specimen & revenue dashboard',
          'Email support',
        ],
        notIncluded: [
          'IHC (immunohistochemistry) panel workflow',
          'Frozen section intra-operative module',
          'Digital slide scanning integration',
          'Synoptic cancer reporting (CAP templates)',
          'Multi-site operations',
          'NABL ISO 15189 documentation suite',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Specimens', value:'20 – 80'},
          {label:'Staff',           value:'5 – 15'},
          {label:'Pathologists',    value:'1 – 3'},
          {label:'Monthly Cases',   value:'Up to 2,400'},
          {label:'WA Credits',      value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'IHC panel ordering & result capture',
          'Special stains workflow (PAS, GMS, AFB, reticulin)',
          'Frozen section module with intra-op timer & OT notification',
          'Synoptic cancer reporting with CAP-style templates',
          'FNAC / cytology grading (Bethesda, WHO)',
          'Pap smear screening with TBS classification',
          'Clinician referral CRM & commission tracking',
          'TPA / insurance pre-authorization',
          'TAT analytics per specimen type',
          'Critical diagnosis auto-alert to surgeon',
          'Chat + email support',
        ],
        notIncluded: [
          'Digital pathology / whole-slide imaging',
          'Molecular IHC scoring (Ki-67 AI, ER/PR quantification)',
          'Multi-branch operations',
          'NABL compliance documentation',
          'Staff HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Specimens', value:'80 – 300'},
          {label:'Staff',           value:'15 – 50'},
          {label:'Pathologists',    value:'3 – 10'},
          {label:'Monthly Cases',   value:'Up to 9,000'},
          {label:'WA Credits',      value:'4,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Digital slide scanning integration (Leica, Hamamatsu, 3DHISTECH)',
          'AI-assisted Ki-67, ER/PR, HER2 scoring',
          'Telepathology for second-opinion workflow',
          'Multi-branch lab management console',
          'NABL ISO 15189:2022 documentation suite',
          'Reagent & consumable inventory with min-max reorder',
          'Equipment calibration & PM schedule (microtome, processor)',
          'Staff HRMS — attendance, payroll, CME tracking',
          'Cancer registry data export (ICMR / NCDIR format)',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'AI-based tumour classification (CNN models)',
          'Research biobank specimen tracking',
          'Franchise lab operations',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Specimens', value:'300+'},
          {label:'Staff',           value:'50+'},
          {label:'Pathologists',    value:'10+'},
          {label:'Monthly Cases',   value:'Unlimited'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'AI tumour classification & grading assistance',
          'Research biobank specimen tracking (SPREC coded)',
          'Franchise / partner lab onboarding',
          'Hub-spoke slide routing between sites',
          'ABDM HIP integration (FHIR R4)',
          'Hospital HIS / EMR integration (HL7)',
          'Dedicated account manager',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * MICROBIOLOGICAL LABORATORY
   *   Culture, sensitivity, AMR reporting.
   * ================================================================ */
  'micro-lab': {
    scaleLabel: 'Daily Cultures', scaleUnit: 'cultures/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Cultures', value:'1 – 30'},
          {label:'Staff',          value:'1 – 5'},
          {label:'Incubators',     value:'1 – 3'},
          {label:'Monthly Tests',  value:'Up to 900'},
          {label:'WA Credits',     value:'500 / month'},
        ],
        features: [
          'Specimen registration with source & clinical indication',
          'Culture plate tracking (blood, urine, wound, sputum)',
          'Organism identification with manual entry',
          'Antibiotic sensitivity reporting (disk diffusion)',
          'MIC (minimum inhibitory concentration) entry',
          'Pathologist digital sign-off',
          'NABL-format PDF report with organism & sensitivity panel',
          'WhatsApp report delivery',
          'GST-compliant billing',
          'BSL-2 biosafety checklist (daily)',
          'Email support',
        ],
        notIncluded: [
          'VITEK / Phoenix automated ID & AST import',
          'Antibiogram generation',
          'MDRO / AMR surveillance',
          'CLSI breakpoint auto-update',
          'Blood culture system integration',
          'Multi-site operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Cultures', value:'30 – 150'},
          {label:'Staff',          value:'5 – 15'},
          {label:'Incubators',     value:'3 – 10'},
          {label:'Monthly Tests',  value:'Up to 4,500'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'VITEK / Phoenix automated ID & AST result import',
          'Blood culture system integration (BacT/ALERT, BACTEC)',
          'CLSI / EUCAST breakpoint tables with auto-interpretation',
          'Antibiogram generation (hospital-wide / ICU-specific)',
          'MDRO flagging (MRSA, VRE, ESBL, CRE)',
          'Infection control alerts to hospital IC nurse',
          'AFB smear & TB culture tracking (RNTCP-Nikshay ready)',
          'Fungal culture & sensitivity module',
          'Clinician CRM with referral tracking',
          'TPA / insurance billing',
          'TAT analytics by culture type',
          'Chat + email support',
        ],
        notIncluded: [
          'AMR stewardship dashboard',
          'Molecular resistance gene detection (mecA, KPC, NDM)',
          'NABL ISO 15189 documentation',
          'Multi-branch operations',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Cultures', value:'150 – 500'},
          {label:'Staff',          value:'15 – 40'},
          {label:'Incubators',     value:'10+'},
          {label:'Monthly Tests',  value:'Up to 15,000'},
          {label:'WA Credits',     value:'4,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'AMR stewardship dashboard with DOT / DDD metrics',
          'Molecular resistance gene detection integration',
          'NABL ISO 15189:2022 documentation suite',
          'BSL-2 / BSL-3 biosafety compliance register',
          'Multi-branch lab management console',
          'Reagent & media inventory with expiry tracking',
          'Equipment calibration schedule (autoclave, BSC)',
          'Staff HRMS — attendance, payroll, competency',
          'ICMR AMR surveillance data export',
          'Government disease reporting (IDSP, IHIP)',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Whole-genome sequencing workflow',
          'Outbreak cluster analysis (phylogenetics)',
          'Franchise lab operations',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Cultures', value:'500+'},
          {label:'Staff',          value:'40+'},
          {label:'Incubators',     value:'20+'},
          {label:'Monthly Tests',  value:'Unlimited'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'WGS (whole-genome sequencing) pipeline integration',
          'Outbreak cluster analysis & phylogenetic tree',
          'WHO GLASS AMR data submission',
          'Franchise / partner lab onboarding',
          'Hospital HIS / EMR integration (HL7)',
          'ABDM HIP integration (FHIR R4)',
          'Dedicated account manager',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * BLOOD BANK & TRANSFUSION CENTER
   *   Collection, component separation, crossmatch, dispatch.
   * ================================================================ */
  'blood-bank': {
    scaleLabel: 'Daily Units', scaleUnit: 'units/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Units',     value:'1 – 20'},
          {label:'Staff',           value:'2 – 8'},
          {label:'Storage Capacity',value:'Up to 500 units'},
          {label:'Monthly Donations',value:'Up to 600'},
          {label:'WA Credits',      value:'500 / month'},
        ],
        features: [
          'Donor registration with eligibility screening (NACO criteria)',
          'Pre-donation questionnaire & deferral tracking',
          'Donation recording (whole blood, date, volume, bag ID)',
          'ABO / Rh typing with forward & reverse grouping',
          'Component separation tracking (PRBC, FFP, platelets, cryo)',
          'Inventory management with bag-level barcode',
          'Crossmatch request processing',
          'Issue-on-crossmatch with compatibility record',
          'DGHS Form 12 monthly reporting',
          'WhatsApp donation certificate to donor',
          'GST-compliant billing (processing fee)',
          'Email support',
        ],
        notIncluded: [
          'Antibody screening & identification',
          'Donor recall campaigns (WhatsApp / SMS)',
          'Component therapy advisory',
          'Platelet apheresis tracking',
          'Multi-site blood bank operations',
          'Hemovigilance adverse-event reporting',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Units',     value:'20 – 80'},
          {label:'Staff',           value:'8 – 20'},
          {label:'Storage Capacity',value:'Up to 2,000 units'},
          {label:'Monthly Donations',value:'Up to 2,400'},
          {label:'WA Credits',      value:'2,000 / month'},
        ],
        features: [
          'Everything in Small',
          'Antibody screening panel (3-cell, 11-cell)',
          'Antibody identification with panel interpretation',
          'Coombs test (DAT / IAT) result tracking',
          'Platelet apheresis procedure log',
          'Donor recall campaigns via WhatsApp (blood group shortages)',
          'Replacement donor tracking per patient',
          'Component therapy advisory (RBC, FFP, cryo, platelet dose)',
          'Transfusion reaction reporting & follow-up',
          'Hospital blood requisition interface',
          'NACO HIV / HBV / HCV / syphilis / malaria TTI tracking',
          'TPA / insurance billing for processing fees',
          'Chat + email support',
        ],
        notIncluded: [
          'Extended antigen typing (Kell, Duffy, Kidd)',
          'NAT (nucleic acid testing) integration',
          'Multi-site blood bank management',
          'Hemovigilance module (SHOT criteria)',
          'NABL / NABH blood bank accreditation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Units',     value:'80 – 300'},
          {label:'Staff',           value:'20 – 60'},
          {label:'Storage Capacity',value:'Up to 8,000 units'},
          {label:'Monthly Donations',value:'Up to 9,000'},
          {label:'WA Credits',      value:'5,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Extended antigen phenotyping (Kell, Duffy, Kidd, MNS)',
          'NAT (nucleic acid testing) result import',
          'Multi-site blood bank management console',
          'Inter-site unit transfer with cold-chain log',
          'Hemovigilance module (SHOT classification)',
          'Massive transfusion protocol (MTP) activation',
          'NABL / NABH blood bank accreditation documentation',
          'Blood drive / camp management',
          'Equipment calibration (centrifuge, serology analyser)',
          'Staff HRMS — attendance, payroll, CME',
          'Advanced DGHS reporting (quarterly, annual)',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Rare blood group registry',
          'Stem cell / cord blood banking',
          'Government blood bank network integration',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Units',     value:'300+'},
          {label:'Staff',           value:'60+'},
          {label:'Storage Capacity',value:'8,000+'},
          {label:'Monthly Donations',value:'Unlimited'},
          {label:'WA Credits',      value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Rare blood group registry & national search',
          'Cord blood / stem cell banking module',
          'Government / Red Cross blood bank network API',
          'eBloodBanking national repository sync',
          'ABDM HIP integration (FHIR R4)',
          'Hospital HIS transfusion order interface',
          'Dedicated account manager',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * NUCLEAR MEDICINE CENTER
   *   SPECT, gamma camera, thyroid uptake, radioisotope therapy.
   * ================================================================ */
  'nuclear-medicine-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans',  value:'1 – 10'},
          {label:'Staff',        value:'2 – 6'},
          {label:'Gamma Cameras',value:'1'},
          {label:'Monthly Scans',value:'Up to 300'},
          {label:'WA Credits',   value:'500 / month'},
        ],
        features: [
          'Patient registration with nuclear medicine requisition',
          'Radiopharmaceutical (radiotracer) administration log',
          'Dose calibrator reading & residual activity recording',
          'SPECT / planar scan order & protocol selection',
          'Nuclear medicine report entry with templates',
          'Nuclear physician digital sign-off',
          'NABL-format PDF report with scan images',
          'WhatsApp report delivery',
          'AERB radiation dose register (patient & staff)',
          'AERB personnel TLD badge reading log',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'Radiotracer inventory management (half-life decay calc)',
          'SPECT-CT fusion report templates',
          'Thyroid uptake & scan module',
          'BARC radioisotope order management',
          'Multi-site operations',
          'RSO compliance dashboard',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans',  value:'10 – 30'},
          {label:'Staff',        value:'6 – 15'},
          {label:'Gamma Cameras',value:'1 – 2'},
          {label:'Monthly Scans',value:'Up to 900'},
          {label:'WA Credits',   value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'Radiotracer inventory with half-life decay calculation',
          'Elution log for Tc-99m generator',
          'SPECT-CT / SPECT-MRI fusion report templates',
          'Thyroid uptake & scan reporting module',
          'Renal DTPA / DMSA scan protocol templates',
          'Bone scan reporting with ROI templates',
          'BARC radioisotope order tracking',
          'RSO (Radiation Safety Officer) compliance dashboard',
          'Referring doctor CRM & notifications',
          'TPA / insurance billing',
          'Chat + email support',
        ],
        notIncluded: [
          'Theranostics (Lu-177, I-131 therapy) module',
          'Radioactive waste disposal log',
          'Multi-branch operations',
          'NABL accreditation documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans',  value:'30 – 80'},
          {label:'Staff',        value:'15 – 40'},
          {label:'Gamma Cameras',value:'2 – 5'},
          {label:'Monthly Scans',value:'Up to 2,400'},
          {label:'WA Credits',   value:'4,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Theranostics module (Lu-177 PSMA, I-131 therapy)',
          'Therapy dose planning & post-therapy dosimetry',
          'Radioactive waste disposal log & decay-in-storage',
          'Isolation room occupancy tracking (I-131 patients)',
          'Multi-branch management console',
          'NABL ISO 15189 documentation suite',
          'Equipment QC (uniformity, linearity, resolution)',
          'Staff HRMS — attendance, payroll, dose limits',
          'AERB annual compliance report generation',
          'BARC annual radioisotope usage report',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Research protocol management',
          'Clinical trial dosimetry module',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans',  value:'80+'},
          {label:'Staff',        value:'40+'},
          {label:'Gamma Cameras',value:'5+'},
          {label:'Monthly Scans',value:'Unlimited'},
          {label:'WA Credits',   value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Clinical trial dosimetry & research protocol management',
          'PET radiopharmacy production log (cyclotron)',
          'ABDM HIP integration (FHIR R4)',
          'Hospital RIS / HIS integration',
          'Dedicated account manager',
          'Quarterly business review',
          'Custom integrations on request',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * MAMMOGRAPHY CENTER
   *   Screening & diagnostic mammography with BI-RADS, AERB, PC-PNDT.
   * ================================================================ */
  'mammography-center': {
    scaleLabel: 'Daily Mammograms', scaleUnit: 'mammograms/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Mammograms', value:'5 – 20'},
          {label:'Staff',            value:'2 – 5'},
          {label:'Units',            value:'1'},
          {label:'Monthly Exams',    value:'Up to 600'},
          {label:'WA Credits',       value:'500 / month'},
        ],
        features: [
          'Patient registration with breast history questionnaire',
          'Mammogram order (screening / diagnostic)',
          'BI-RADS category (0–6) structured reporting',
          'Female radiographer certification tracking',
          'AERB radiation dose register (per exposure)',
          'Operator daily phantom QC log with pass/fail',
          'PC-PNDT Form F for applicable patients',
          'Radiologist digital sign-off',
          'NABL-format report with mammogram images',
          'WhatsApp report delivery',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'Tomosynthesis (3D mammography) reporting',
          'AI-based breast density assessment',
          'Screening recall campaign management',
          'Multi-site operations',
          'NABL accreditation documentation',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Mammograms', value:'20 – 50'},
          {label:'Staff',            value:'5 – 12'},
          {label:'Units',            value:'1 – 2'},
          {label:'Monthly Exams',    value:'Up to 1,500'},
          {label:'WA Credits',       value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'Digital breast tomosynthesis (DBT) reporting',
          'Contrast-enhanced mammography (CEM) templates',
          'BI-RADS audit — recall, cancer detection rate, PPV',
          'Annual screening recall via WhatsApp (age-appropriate)',
          'Referring doctor CRM with commission',
          'Corporate breast screening camp management',
          'TPA / insurance billing',
          'TAT analytics per exam type',
          'Chat + email support',
        ],
        notIncluded: [
          'AI breast density (ACR a/b/c/d) auto-classification',
          'Multi-branch operations',
          'NABL ISO 15189 documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Mammograms', value:'50 – 150'},
          {label:'Staff',            value:'12 – 30'},
          {label:'Units',            value:'2 – 5'},
          {label:'Monthly Exams',    value:'Up to 4,500'},
          {label:'WA Credits',       value:'4,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'AI-assisted breast density classification (ACR categories)',
          'AI suspicious-lesion detection with confidence overlay',
          'Multi-branch management console',
          'NABL ISO 15189:2022 documentation suite',
          'Equipment QC schedule (compression, AEC, artifact check)',
          'Staff HRMS — attendance, payroll, certification tracking',
          'Population-level screening analytics (by age, density)',
          'National cancer screening program (NCD) data export',
          'Priority support with 4h SLA',
        ],
        notIncluded: [
          'Research cohort tracking',
          'Genetic risk integration (BRCA1/2)',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Mammograms', value:'150+'},
          {label:'Staff',            value:'30+'},
          {label:'Units',            value:'5+'},
          {label:'Monthly Exams',    value:'Unlimited'},
          {label:'WA Credits',       value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research cohort tracking with follow-up alerts',
          'BRCA1/2 genetic risk integration',
          'Tele-mammography reporting for remote centers',
          'ABDM HIP integration (FHIR R4)',
          'Hospital RIS / HIS integration',
          'Dedicated account manager',
          'Quarterly business review',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * DEXA / BONE DENSITY CENTER
   *   Bone mineral density, body composition, FRAX assessment.
   * ================================================================ */
  'dexa-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans', value:'3 – 15'},
          {label:'Staff',       value:'1 – 3'},
          {label:'DEXA Units',  value:'1'},
          {label:'WA Credits',  value:'300 / month'},
        ],
        features: [
          'Patient registration with osteoporosis risk factors',
          'DEXA scan order (spine, hip, forearm, total body)',
          'T-score / Z-score reporting',
          'WHO FRAX fracture risk calculation',
          'Body composition analysis (lean mass, fat mass, %)',
          'Physician digital sign-off',
          'PDF report with scan images',
          'WhatsApp report delivery',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'Serial BMD comparison with LSC (least significant change)',
          'Trabecular bone score (TBS)',
          'Vertebral fracture assessment (VFA)',
          'Referring doctor CRM',
          'Multi-site operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans', value:'15 – 40'},
          {label:'Staff',       value:'3 – 8'},
          {label:'DEXA Units',  value:'1 – 2'},
          {label:'WA Credits',  value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          'Serial BMD comparison with % change & LSC trending',
          'Trabecular bone score (TBS) integration',
          'Vertebral fracture assessment (VFA) from lateral scan',
          'Treatment monitoring templates (bisphosphonate, denosumab)',
          'Referring doctor CRM & notifications',
          'Corporate wellness screening integration',
          'TPA / insurance billing',
          'Chat + email support',
        ],
        notIncluded: [
          'Multi-branch operations',
          'Paediatric growth Z-score charts',
          'NABL documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans', value:'40 – 100'},
          {label:'Staff',       value:'8 – 20'},
          {label:'DEXA Units',  value:'2 – 4'},
          {label:'WA Credits',  value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'Paediatric bone density with age-matched Z-scores',
          'Multi-branch management console',
          'NABL ISO 15189 documentation suite',
          'Equipment QC (phantom scan, cross-calibration)',
          'Staff HRMS — attendance, payroll',
          'Population-level osteoporosis analytics',
          'Priority support',
        ],
        notIncluded: [
          'Research DXA protocols',
          'ABDM / FHIR integration',
        ],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans', value:'100+'},
          {label:'Staff',       value:'20+'},
          {label:'DEXA Units',  value:'4+'},
          {label:'WA Credits',  value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research protocol support',
          'ABDM HIP integration (FHIR R4)',
          'Hospital RIS integration',
          'Dedicated account manager',
          'Custom integrations',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * DENTAL RADIOLOGY CENTER
   *   OPG panoramic, CBCT 3D, intraoral imaging.
   * ================================================================ */
  'dental-radiology-center': {
    scaleLabel: 'Daily Scans', scaleUnit: 'scans/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Scans', value:'5 – 30'},
          {label:'Staff',       value:'1 – 4'},
          {label:'Units',       value:'1 – 2'},
          {label:'WA Credits',  value:'500 / month'},
        ],
        features: [
          'Patient registration with dental chart',
          'OPG (panoramic) scan ordering & reporting',
          'Cephalometric analysis template',
          'Intraoral periapical (IOPA) tracking',
          'AERB radiation dose register',
          'Radiologist / dentist digital sign-off',
          'PDF report with dental images',
          'WhatsApp report delivery to referring dentist',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'CBCT 3D imaging workflow',
          'Implant planning integration',
          'Orthodontic cephalometric tracing (AI)',
          'Referring dentist CRM',
          'Multi-site operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Scans', value:'30 – 80'},
          {label:'Staff',       value:'4 – 10'},
          {label:'Units',       value:'2 – 4'},
          {label:'WA Credits',  value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'CBCT (cone-beam CT) 3D imaging & MPR views',
          'Implant planning module with cross-sections',
          'TMJ analysis templates',
          'AI-assisted cephalometric tracing',
          'Referring dentist CRM with commission',
          'TPA billing for dental insurance',
          'Chat + email support',
        ],
        notIncluded: [
          'DICOM 3D rendering & STL export',
          'Multi-branch operations',
          'NABL documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Scans', value:'80 – 250'},
          {label:'Staff',       value:'10 – 25'},
          {label:'Units',       value:'4 – 8'},
          {label:'WA Credits',  value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'DICOM 3D rendering with STL export for printing',
          'Multi-branch management console',
          'NABL documentation suite',
          'Equipment QC schedule',
          'Staff HRMS — attendance, payroll',
          'Priority support',
        ],
        notIncluded: ['Research protocols', 'ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [
          {label:'Daily Scans', value:'250+'},
          {label:'Staff',       value:'25+'},
          {label:'Units',       value:'8+'},
          {label:'WA Credits',  value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research protocol support',
          'ABDM HIP integration (FHIR R4)',
          'Dental college / hospital HIS integration',
          'Dedicated account manager',
          'Custom integrations',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * OPHTHALMIC DIAGNOSTIC IMAGING CENTER
   *   OCT, perimetry, fundus photography, ERG, IOLMaster.
   * ================================================================ */
  'ophthalmic-center': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Patients', value:'5 – 25'},
          {label:'Staff',          value:'2 – 5'},
          {label:'Devices',        value:'1 – 3'},
          {label:'WA Credits',     value:'500 / month'},
        ],
        features: [
          'Patient registration with ophthalmic history',
          'OCT scan ordering (macula, RNFL, anterior segment)',
          'Perimetry / visual field test ordering (Humphrey / Octopus)',
          'Fundus photography with colour & red-free modes',
          'IOLMaster / biometry for cataract pre-op',
          'Ophthalmologist digital sign-off',
          'PDF report with retinal images',
          'WhatsApp report delivery',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'FFA (fundus fluorescein angiography) module',
          'ICG angiography reporting',
          'Glaucoma progression analysis (GPA)',
          'DR (diabetic retinopathy) AI screening',
          'Multi-site operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Patients', value:'25 – 60'},
          {label:'Staff',          value:'5 – 12'},
          {label:'Devices',        value:'3 – 6'},
          {label:'WA Credits',     value:'1,500 / month'},
        ],
        features: [
          'Everything in Small',
          'FFA reporting with phase-wise annotation',
          'ICG angiography module',
          'Glaucoma progression analysis (GPA / trend-based)',
          'OCT-A (angiography) reporting',
          'ERG / VEP electrophysiology result capture',
          'Referring ophthalmologist CRM',
          'TPA / insurance billing',
          'Chat + email support',
        ],
        notIncluded: [
          'AI DR screening (ETDRS / ICDR grading)',
          'AI glaucoma risk scoring',
          'Multi-branch operations',
          'NABL documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Patients', value:'60 – 200'},
          {label:'Staff',          value:'12 – 30'},
          {label:'Devices',        value:'6 – 15'},
          {label:'WA Credits',     value:'4,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'AI-assisted DR screening (ETDRS / ICDR grading)',
          'AI glaucoma risk scoring from RNFL / GCC analysis',
          'Multi-branch management console',
          'NABL ISO 15189 documentation suite',
          'Equipment calibration schedule',
          'Staff HRMS — attendance, payroll',
          'Population-level DR / glaucoma screening analytics',
          'Priority support with 4h SLA',
        ],
        notIncluded: ['Research imaging protocols', 'ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [
          {label:'Daily Patients', value:'200+'},
          {label:'Staff',          value:'30+'},
          {label:'Devices',        value:'15+'},
          {label:'WA Credits',     value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research imaging protocol management',
          'ABDM HIP integration (FHIR R4)',
          'Eye hospital HIS / EMR integration',
          'Tele-ophthalmology reporting for rural camps',
          'Dedicated account manager',
          'Custom integrations',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * PFT (PULMONARY FUNCTION TESTING) CENTER
   *   Spirometry, DLCO, FeNO, ABG, body plethysmography.
   * ================================================================ */
  'pft-center': {
    scaleLabel: 'Daily Tests', scaleUnit: 'tests/day',
    tiers: {
      small: {
        scale: [
          {label:'Daily Tests', value:'3 – 15'},
          {label:'Staff',       value:'1 – 3'},
          {label:'PFT Units',   value:'1'},
          {label:'WA Credits',  value:'300 / month'},
        ],
        features: [
          'Patient registration with respiratory history',
          'Spirometry test with FEV1, FVC, FEV1/FVC, PEF',
          'Pre- and post-bronchodilator comparison',
          'ATS/ERS acceptability & repeatability criteria',
          'GOLD classification for COPD staging',
          'Predicted values (GLI-2012 / Knudson)',
          'Pulmonologist digital sign-off',
          'PDF report with flow-volume loops',
          'WhatsApp report delivery',
          'GST-compliant billing',
          'Email support',
        ],
        notIncluded: [
          'DLCO (diffusion capacity) testing',
          'FeNO (fractional exhaled nitric oxide)',
          'Bronchial provocation testing (methacholine)',
          'Body plethysmography (lung volumes)',
          'Referring doctor CRM',
          'Multi-site operations',
        ],
      },
      medium: {
        scale: [
          {label:'Daily Tests', value:'15 – 40'},
          {label:'Staff',       value:'3 – 8'},
          {label:'PFT Units',   value:'1 – 2'},
          {label:'WA Credits',  value:'1,000 / month'},
        ],
        features: [
          'Everything in Small',
          'DLCO testing & interpretation',
          'FeNO measurement for asthma monitoring',
          'Bronchial provocation testing (methacholine / exercise)',
          'Lung volume measurement (plethysmography or N2 washout)',
          'ABG result import & interpretation template',
          'Serial PFT trending (year-over-year decline)',
          'Referring doctor CRM & notifications',
          'Occupational health PFT screening',
          'TPA / insurance billing',
          'Chat + email support',
        ],
        notIncluded: [
          'Cardiopulmonary exercise testing (CPET)',
          'Multi-branch operations',
          'NABL documentation',
          'HRMS & payroll',
        ],
      },
      large: {
        scale: [
          {label:'Daily Tests', value:'40 – 100'},
          {label:'Staff',       value:'8 – 20'},
          {label:'PFT Units',   value:'2 – 4'},
          {label:'WA Credits',  value:'3,000 / month'},
        ],
        features: [
          'Everything in Medium',
          'CPET (cardiopulmonary exercise testing) module',
          'Multi-branch management console',
          'NABL ISO 15189 documentation suite',
          'Equipment calibration (syringe, gas analyser)',
          'Staff HRMS — attendance, payroll',
          'Corporate occupational PFT camp management',
          'Priority support',
        ],
        notIncluded: ['Research protocols', 'ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [
          {label:'Daily Tests', value:'100+'},
          {label:'Staff',       value:'20+'},
          {label:'PFT Units',   value:'4+'},
          {label:'WA Credits',  value:'Unlimited'},
        ],
        features: [
          'Everything in Large',
          'Research protocol support (clinical trials)',
          'ABDM HIP integration (FHIR R4)',
          'Hospital HIS integration',
          'Dedicated account manager',
          'Custom integrations',
        ],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * NEUROPHYSIOLOGY (EEG/EMG) CENTER
   * ================================================================ */
  'neurophysiology-center': {
    scaleLabel: 'Daily Studies', scaleUnit: 'studies/day',
    tiers: {
      small: {
        scale: [{label:'Daily Studies',value:'1 – 10'},{label:'Staff',value:'1 – 4'},{label:'EEG/EMG Units',value:'1 – 2'},{label:'WA Credits',value:'300 / month'}],
        features: ['Patient registration with neurological history','EEG recording order with montage selection','EMG / NCS (nerve conduction study) reporting','Evoked potentials (VEP, BAEP, SSEP) capture','Neurologist digital sign-off','PDF report with waveform snapshots','WhatsApp report delivery','GST-compliant billing','Email support'],
        notIncluded: ['Video-EEG monitoring','Intra-operative neuro-monitoring (IONM)','Multi-site operations','NABL documentation','HRMS'],
      },
      medium: {
        scale: [{label:'Daily Studies',value:'10 – 30'},{label:'Staff',value:'4 – 10'},{label:'EEG/EMG Units',value:'2 – 4'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Everything in Small','Video-EEG monitoring with seizure annotation','Quantitative EEG (qEEG) mapping','Repetitive nerve stimulation (RNS) for myasthenia','Blink reflex & H-reflex studies','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['IONM (intra-operative monitoring)','Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Studies',value:'30 – 80'},{label:'Staff',value:'10 – 25'},{label:'EEG/EMG Units',value:'4 – 8'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Medium','Intra-operative neuro-monitoring (IONM) module','Long-term monitoring (LTM) bed tracking','Multi-branch management console','NABL ISO 15189 documentation','Equipment calibration schedule','Staff HRMS — attendance, payroll','Priority support'],
        notIncluded: ['Research EEG protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Studies',value:'80+'},{label:'Staff',value:'25+'},{label:'EEG/EMG Units',value:'8+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research EEG / EMG protocol management','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * ALLERGY TESTING CENTER
   * ================================================================ */
  'allergy-center': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [{label:'Daily Patients',value:'3 – 15'},{label:'Staff',value:'1 – 4'},{label:'WA Credits',value:'300 / month'}],
        features: ['Patient registration with allergy history','Skin prick test (SPT) panel ordering','Patch test (contact dermatitis) tracking','Specific IgE panel request & result entry','Allergen panel management (respiratory, food, drug, insect)','Allergist digital sign-off','PDF report with allergen grid','WhatsApp report delivery','GST-compliant billing','Email support'],
        notIncluded: ['Bronchial / nasal provocation testing','Allergen immunotherapy dose scheduling','Drug desensitization protocols','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Patients',value:'15 – 40'},{label:'Staff',value:'4 – 10'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Everything in Small','Component-resolved diagnostics (CRD) panels','Bronchial / nasal provocation test tracking','Allergen immunotherapy dose schedule & adherence','Drug desensitization protocol management','Oral food challenge (OFC) tracking','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Patients',value:'40 – 100'},{label:'Staff',value:'10 – 20'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Medium','Multi-branch management console','NABL ISO 15189 documentation','Equipment calibration & extract lot tracking','Staff HRMS — attendance, payroll','Population-level sensitization analytics','Priority support'],
        notIncluded: ['Research allergen trial protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Patients',value:'100+'},{label:'Staff',value:'20+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research allergen trial protocol management','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * SLEEP LAB / POLYSOMNOGRAPHY
   * ================================================================ */
  'sleep-lab': {
    scaleLabel: 'Daily Studies', scaleUnit: 'studies/day',
    tiers: {
      small: {
        scale: [{label:'Beds / Channels',value:'1 – 4'},{label:'Staff',value:'1 – 4'},{label:'Monthly Studies',value:'Up to 120'},{label:'WA Credits',value:'300 / month'}],
        features: ['Patient registration with sleep questionnaire (ESS, STOP-BANG)','Level 1 PSG (polysomnography) order & scheduling','Sleep technologist checklist (electrode placement, bio-cal)','AASM scoring summary entry (AHI, sleep stages, arousals)','Sleep physician digital sign-off','PDF report with hypnogram','WhatsApp report delivery','CPAP titration study tracking','GST-compliant billing','Email support'],
        notIncluded: ['MSLT / MWT (multiple sleep latency / wakefulness)','Home sleep test (HST) device management','Automated AASM scoring AI','CPAP compliance monitoring','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Beds / Channels',value:'4 – 10'},{label:'Staff',value:'4 – 10'},{label:'Monthly Studies',value:'Up to 300'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Everything in Small','MSLT / MWT studies for narcolepsy & hypersomnolence','Home sleep test (HST) device inventory & dispatch','Split-night study protocol','PAP (CPAP / BiPAP / ASV) compliance data import','Actigraphy data review','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['AI-assisted AASM scoring','Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Beds / Channels',value:'10 – 30'},{label:'Staff',value:'10 – 25'},{label:'Monthly Studies',value:'Up to 900'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Medium','AI-assisted AASM event scoring','Multi-branch management console','NABL ISO 15189 documentation','Equipment calibration schedule','Staff HRMS — attendance, payroll','Corporate sleep screening programs','Priority support'],
        notIncluded: ['Research sleep protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Beds / Channels',value:'30+'},{label:'Staff',value:'25+'},{label:'Monthly Studies',value:'Unlimited'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research sleep protocol management','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * AUDIOLOGY & ENT DIAGNOSTIC CENTER
   * ================================================================ */
  'audiology-center': {
    scaleLabel: 'Daily Patients', scaleUnit: 'patients/day',
    tiers: {
      small: {
        scale: [{label:'Daily Patients',value:'5 – 20'},{label:'Staff',value:'1 – 4'},{label:'Booths / Units',value:'1 – 2'},{label:'WA Credits',value:'300 / month'}],
        features: ['Patient registration with ENT / hearing history','Pure-tone audiometry (PTA) with audiogram generation','Speech audiometry (SRT, SDS)','Tympanometry & acoustic reflex','OAE (otoacoustic emissions) — TEOAE / DPOAE','Audiologist digital sign-off','PDF report with audiogram','WhatsApp report delivery','GST-compliant billing','Email support'],
        notIncluded: ['BERA (brainstem evoked response audiometry)','VNG / ENG (videonystagmography)','Newborn hearing screening program','Hearing aid fitment & verification','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Patients',value:'20 – 50'},{label:'Staff',value:'4 – 10'},{label:'Booths / Units',value:'2 – 4'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Everything in Small','BERA / ABR with threshold & neuro-diagnostic','ASSR (auditory steady-state response)','VNG / ENG for vertigo & balance assessment','VEMP (vestibular evoked myogenic potential)','Newborn hearing screening register','Hearing aid fitment & real-ear measurement','Cochlear implant candidacy assessment','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['Multi-branch operations','NABL documentation','HRMS & payroll','Industrial audiometry screening programs'],
      },
      large: {
        scale: [{label:'Daily Patients',value:'50 – 150'},{label:'Staff',value:'10 – 25'},{label:'Booths / Units',value:'4 – 8'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Medium','Multi-branch management console','Industrial noise-exposure audiometry screening','NABL ISO 15189 documentation','Booth calibration & equipment QC schedule','Staff HRMS — attendance, payroll','Population hearing-loss analytics','Priority support'],
        notIncluded: ['Research audiology protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Patients',value:'150+'},{label:'Staff',value:'25+'},{label:'Booths / Units',value:'8+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research audiology protocol management','Tele-audiology for rural camps','ABDM HIP integration (FHIR R4)','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * URODYNAMICS DIAGNOSTIC CENTER
   * ================================================================ */
  'urodynamics-center': {
    scaleLabel: 'Daily Studies', scaleUnit: 'studies/day',
    tiers: {
      small: {
        scale: [{label:'Daily Studies',value:'1 – 8'},{label:'Staff',value:'1 – 3'},{label:'Urodynamic Units',value:'1'},{label:'WA Credits',value:'200 / month'}],
        features: ['Patient registration with urogynecology history','Uroflowmetry with flow rate & voided volume','Post-void residual (PVR) recording','Cystometrogram (CMG) filling phase reporting','Pressure-flow study (PFS) analysis','Urologist digital sign-off','PDF report with pressure-flow traces','WhatsApp report delivery','GST-compliant billing','Email support'],
        notIncluded: ['Video-urodynamics','Ambulatory urodynamics','EMG sphincter study','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Studies',value:'8 – 20'},{label:'Staff',value:'3 – 8'},{label:'Urodynamic Units',value:'1 – 2'},{label:'WA Credits',value:'500 / month'}],
        features: ['Everything in Small','Video-urodynamics with fluoroscopy correlation','EMG sphincter activity during filling & voiding','Ambulatory urodynamics tracking','Leak point pressure (LPP) measurement','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Studies',value:'20 – 50'},{label:'Staff',value:'8 – 15'},{label:'Urodynamic Units',value:'2 – 3'},{label:'WA Credits',value:'2,000 / month'}],
        features: ['Everything in Medium','Multi-branch management console','NABL ISO 15189 documentation','Equipment calibration schedule','Staff HRMS — attendance, payroll','Priority support'],
        notIncluded: ['Research urodynamic protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Studies',value:'50+'},{label:'Staff',value:'15+'},{label:'Urodynamic Units',value:'3+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research urodynamic protocol management','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * ENDOSCOPY DIAGNOSTIC CENTER
   *   Upper GI, colonoscopy, bronchoscopy with video capture & sedation.
   * ================================================================ */
  'endoscopy-center': {
    scaleLabel: 'Daily Procedures', scaleUnit: 'procedures/day',
    tiers: {
      small: {
        scale: [{label:'Daily Procedures',value:'3 – 12'},{label:'Staff',value:'2 – 6'},{label:'Scopes',value:'2 – 4'},{label:'WA Credits',value:'500 / month'}],
        features: ['Patient registration with procedure consent','Upper GI endoscopy (EGD) reporting with templates','Colonoscopy reporting with polyp mapping','Bronchoscopy report templates','Video capture with still-image annotation','Pre-procedure sedation checklist (ASA class)','Conscious sedation monitoring log','Recovery scoring (Aldrete / PADSS)','Gastroenterologist digital sign-off','PDF report with endoscopic images','WhatsApp report delivery','GST-compliant billing','Email support'],
        notIncluded: ['ERCP reporting module','EUS (endoscopic ultrasound)','Capsule endoscopy tracking','Scope reprocessing audit trail','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Procedures',value:'12 – 30'},{label:'Staff',value:'6 – 15'},{label:'Scopes',value:'4 – 8'},{label:'WA Credits',value:'1,500 / month'}],
        features: ['Everything in Small','ERCP report templates with cannulation & stone extraction','EUS (endoscopic ultrasound) reporting','Capsule endoscopy event tracking','Quality indicators (CIR, ADR, withdrawal time)','Scope reprocessing audit trail (washer-disinfector log)','Helicobacter pylori RUT (rapid urease test) logging','Biopsy tracking with histopathology correlation','Referring doctor CRM & commission','TPA / insurance billing','Chat + email support'],
        notIncluded: ['AI-assisted polyp detection','Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Procedures',value:'30 – 80'},{label:'Staff',value:'15 – 35'},{label:'Scopes',value:'8 – 20'},{label:'WA Credits',value:'4,000 / month'}],
        features: ['Everything in Medium','AI-assisted polyp detection overlay','Multi-branch management console','NABL ISO 15189 documentation','Scope inventory with serial tracking & repair log','Anaesthesia integration for deep sedation / GA','Staff HRMS — attendance, payroll','Procedure volume & complication analytics','Priority support with 4h SLA'],
        notIncluded: ['Research endoscopy protocols','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Procedures',value:'80+'},{label:'Staff',value:'35+'},{label:'Scopes',value:'20+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research endoscopy protocol management','AI-powered quality scoring & benchmarking','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * IVF / EMBRYOLOGY & ANDROLOGY LAB
   *   Cycles, ICSI, cryo, CASA — ART Act 2021 compliant.
   * ================================================================ */
  'ivf-embryology': {
    scaleLabel: 'Monthly Cycles', scaleUnit: 'cycles/month',
    tiers: {
      small: {
        scale: [{label:'Monthly Cycles',value:'2 – 15'},{label:'Staff',value:'3 – 8'},{label:'Embryologists',value:'1 – 2'},{label:'Cryo Tanks',value:'1 – 2'},{label:'WA Credits',value:'500 / month'}],
        features: ['Couple registration with infertility work-up','IVF cycle creation with stimulation protocol','Follicular monitoring diary (USG + E2/LH)','OPU (oocyte pickup) recording with oocyte grading','ICSI / IVF insemination log','Embryo development grading (Day 1–5, Gardner / Istanbul)','Embryo transfer (ET) recording','Luteal phase support schedule','Pregnancy outcome tracking (beta-hCG, clinical pregnancy)','Semen analysis with WHO criteria','Cryopreservation log (embryo / oocyte / sperm) with straw ID','ART Act 2021 — National Registry data fields','NABL-format cycle summary report','WhatsApp updates to couple','GST-compliant billing','Email support'],
        notIncluded: ['CASA (computer-assisted semen analysis) integration','Time-lapse incubator integration','PGT (pre-implantation genetic testing) workflow','Donor gamete management','Surrogacy case management','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Monthly Cycles',value:'15 – 50'},{label:'Staff',value:'8 – 20'},{label:'Embryologists',value:'2 – 5'},{label:'Cryo Tanks',value:'2 – 5'},{label:'WA Credits',value:'2,000 / month'}],
        features: ['Everything in Small','CASA integration (motility, morphology, concentration)','Time-lapse incubator data import','PGT-A / PGT-M / PGT-SR workflow tracking','Donor gamete management (egg / sperm bank)','Witness system for specimen identification','Thaw survival & re-vitrification tracking','FET (frozen embryo transfer) cycle protocol','IUI cycle management','Andrology lab module (DNA fragmentation, ROS, MACS)','Referring doctor CRM & commission','TPA / insurance billing','Outcome analytics (clinical pregnancy rate, live birth rate)','Chat + email support'],
        notIncluded: ['Surrogacy case management (ART Act compliant)','Multi-branch operations','NABL documentation suite','HRMS & payroll','AI embryo grading'],
      },
      large: {
        scale: [{label:'Monthly Cycles',value:'50 – 150'},{label:'Staff',value:'20 – 50'},{label:'Embryologists',value:'5 – 12'},{label:'Cryo Tanks',value:'5 – 15'},{label:'WA Credits',value:'5,000 / month'}],
        features: ['Everything in Medium','Surrogacy case management (ART Act 2021 compliant)','AI-assisted embryo grading (morphokinetics)','Multi-branch management console','NABL / NABH accreditation documentation','Cryo audit — annual straw reconciliation','Equipment calibration (incubator, centrifuge, laser)','Staff HRMS — attendance, payroll, certification','ICMR ART registry quarterly data submission','Outcome benchmarking (SART / ESHRE standards)','Priority support with 4h SLA'],
        notIncluded: ['Fertility tourism / international patient module','Stem cell integration','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Monthly Cycles',value:'150+'},{label:'Staff',value:'50+'},{label:'Embryologists',value:'12+'},{label:'Cryo Tanks',value:'15+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Fertility tourism & international patient module','Stem cell research integration','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Franchise / partner clinic onboarding','Dedicated account manager','Quarterly business review','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * STEM CELL & HLA / BONE MARROW REGISTRY
   * ================================================================ */
  'stem-cell-registry': {
    scaleLabel: 'Daily Specimens', scaleUnit: 'specimens/day',
    tiers: {
      small: {
        scale: [{label:'Daily Specimens',value:'1 – 10'},{label:'Staff',value:'2 – 6'},{label:'WA Credits',value:'300 / month'}],
        features: ['Donor registration with HLA consent','HLA typing order (Class I: A, B, C; Class II: DRB1, DQB1)','Result entry from reference lab','Donor registry with search by HLA type','Cord blood unit registration & storage log','WMDA (World Marrow Donor Association) data fields','Physician sign-off','PDF report','WhatsApp donor notifications','GST-compliant billing','Email support'],
        notIncluded: ['High-resolution HLA typing workflow','Match probability scoring','Stem cell processing & QC','Multi-site operations','NABL documentation'],
      },
      medium: {
        scale: [{label:'Daily Specimens',value:'10 – 30'},{label:'Staff',value:'6 – 15'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Everything in Small','High-resolution (allele-level) HLA typing','Match probability & permissive mismatch scoring','Stem cell collection (PBSC / BM) procedure tracking','CD34+ cell count & viability recording','Cryopreservation log with bag / straw tracking','Donor health screening follow-up','Referring doctor CRM','TPA / insurance billing','Chat + email support'],
        notIncluded: ['Cell processing (T-cell depletion, CD34 selection)','Multi-site operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Specimens',value:'30 – 100'},{label:'Staff',value:'15 – 35'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Medium','Cell processing module (T-cell depletion, CD34+ selection)','Multi-site management console','NABL ISO 15189 documentation','Cryo storage audit & annual inventory reconciliation','Equipment calibration (flow cytometer, freezer, separator)','Staff HRMS — attendance, payroll','WMDA search request & donor workup tracking','Priority support'],
        notIncluded: ['CAR-T cell therapy tracking','International donor registry API','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Specimens',value:'100+'},{label:'Staff',value:'35+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','CAR-T cell manufacturing & infusion tracking','International donor registry API integration (WMDA SEARCH)','ABDM HIP integration (FHIR R4)','Hospital HIS integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * FORENSIC / DRUG TESTING / TOXICOLOGY LAB
   *   GC-MS/LC-MS, chain-of-custody, CDSCO reporting.
   * ================================================================ */
  'forensic-toxicology': {
    scaleLabel: 'Daily Samples', scaleUnit: 'samples/day',
    tiers: {
      small: {
        scale: [{label:'Daily Samples',value:'5 – 30'},{label:'Staff',value:'2 – 6'},{label:'Instruments',value:'1 – 2'},{label:'WA Credits',value:'500 / month'}],
        features: ['Specimen registration with chain-of-custody (CoC) log','Tamper-evident seal verification & photo capture','Specimen splitting (A & B samples) tracking','Drug-of-abuse screening panel (immunoassay)','Confirmation testing order (GC-MS / LC-MS)','MRO (Medical Review Officer) review workflow','CoC audit trail — every custody transfer logged','PDF report with specimen integrity attestation','GST-compliant billing','Email support'],
        notIncluded: ['Workplace drug testing program management','Quantitative LC-MS/MS method tracking','CDSCO controlled substance reporting','Hair / nail drug testing','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Samples',value:'30 – 100'},{label:'Staff',value:'6 – 15'},{label:'Instruments',value:'2 – 5'},{label:'WA Credits',value:'1,500 / month'}],
        features: ['Everything in Small','Workplace drug testing program management (employer portal)','Quantitative LC-MS/MS method & analyte tracking','Hair / nail drug testing workflow','CDSCO controlled substance register','Doping control (WADA code) sample management','Court-admissible report generation with digital signature','Employer CRM with contract management','TPA billing for occupational screening','Chat + email support'],
        notIncluded: ['Multi-branch operations','NABL documentation','HRMS & payroll','Custom analyte method validation'],
      },
      large: {
        scale: [{label:'Daily Samples',value:'100 – 300'},{label:'Staff',value:'15 – 40'},{label:'Instruments',value:'5 – 10'},{label:'WA Credits',value:'4,000 / month'}],
        features: ['Everything in Medium','Custom analyte method validation & uncertainty documentation','Multi-branch management console','NABL ISO 17025 / 15189 documentation','Instrument calibration & maintenance schedule','Staff HRMS — attendance, payroll, competency','Government contract compliance reporting','Priority support with 4h SLA'],
        notIncluded: ['Reference material & standard preparation tracking','Research / clinical trial toxicology','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Samples',value:'300+'},{label:'Staff',value:'40+'},{label:'Instruments',value:'10+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Reference material & standard preparation tracking','Clinical trial toxicology module','ABDM HIP integration (FHIR R4)','Government forensic lab network integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * CANCER SCREENING / EARLY DETECTION CENTER
   *   AI-scored tumor markers + imaging + clinician review.
   * ================================================================ */
  'cancer-screening': {
    scaleLabel: 'Daily Screenings', scaleUnit: 'screenings/day',
    tiers: {
      small: {
        scale: [{label:'Daily Screenings',value:'5 – 25'},{label:'Staff',value:'2 – 6'},{label:'WA Credits',value:'500 / month'}],
        features: ['Patient registration with cancer risk questionnaire','Pre-defined screening packages (breast, cervical, colorectal, prostate, lung)','Tumor marker panel ordering (PSA, CA-125, CEA, AFP, CA-19-9)','Result entry with reference ranges & trend from prior visits','Risk score computation (age, family history, markers)','Clinician review & recommendation','PDF screening report with risk summary','WhatsApp report delivery & recall reminders','GST-compliant billing','Email support'],
        notIncluded: ['AI-assisted cancer risk scoring','Multi-cancer early detection (MCED) test integration','Screening program cohort management','Imaging correlation (mammography, LDCT, colonoscopy)','Referring doctor CRM','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Daily Screenings',value:'25 – 80'},{label:'Staff',value:'6 – 15'},{label:'WA Credits',value:'2,000 / month'}],
        features: ['Everything in Small','AI-assisted multi-marker cancer risk scoring','Imaging correlation (auto-link mammography, LDCT results)','Annual screening recall campaigns via WhatsApp','Genetic risk integration (BRCA, Lynch, Li-Fraumeni markers)','Screening program cohort management & follow-up','Corporate cancer screening camps','Referring doctor CRM & commission','TPA / insurance billing','Chat + email support'],
        notIncluded: ['MCED (multi-cancer early detection) integration','National Cancer Screening Programme (NCSP) reporting','Multi-branch operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Daily Screenings',value:'80 – 250'},{label:'Staff',value:'15 – 35'},{label:'WA Credits',value:'5,000 / month'}],
        features: ['Everything in Medium','MCED test result integration','National Cancer Screening Programme (NCSP) data export','Multi-branch management console','NABL ISO 15189 documentation','Staff HRMS — attendance, payroll','Population-level cancer incidence analytics','Priority support with 4h SLA'],
        notIncluded: ['Research screening trial management','Cancer registry integration (ICMR NCDIR)','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Daily Screenings',value:'250+'},{label:'Staff',value:'35+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research screening trial management','Cancer registry data export (ICMR NCDIR format)','ABDM HIP integration (FHIR R4)','Hospital HIS / tumour board integration','Dedicated account manager','Custom integrations'],
        notIncluded: [],
      },
    },
  },

  /* ================================================================
   * PREVENTIVE GENOMICS / DTC TESTING PLATFORM
   *   Direct-to-consumer saliva-kit genetic wellness.
   * ================================================================ */
  'dtc-genomics': {
    scaleLabel: 'Monthly Kits', scaleUnit: 'kits/month',
    tiers: {
      small: {
        scale: [{label:'Monthly Kits',value:'50 – 500'},{label:'Staff',value:'2 – 6'},{label:'WA Credits',value:'1,000 / month'}],
        features: ['Customer registration with consent & terms acceptance','Kit order management (barcode, shipping, return tracking)','Sample receipt & DNA extraction log','Genotyping / sequencing order to partner lab','Variant result import & interpretation pipeline','Consumer report generation (ancestry, traits, wellness)','Pharmacogenomics (PGx) report section','Consumer portal — view reports, download PDF','WhatsApp kit status notifications','Genetic counseling appointment scheduling','GST-compliant billing','Email support'],
        notIncluded: ['Custom white-label consumer portal','Health risk polygenic scoring','Carrier screening module','API for third-party wellness apps','Multi-site operations'],
      },
      medium: {
        scale: [{label:'Monthly Kits',value:'500 – 2,000'},{label:'Staff',value:'6 – 15'},{label:'WA Credits',value:'3,000 / month'}],
        features: ['Everything in Small','Health risk polygenic risk scores (PRS)','Carrier screening module (200+ conditions)','Nutrigenomics & fitness report sections','White-label consumer portal customization','Kit logistics integration (courier API)','Genetic counselor CRM & session notes','B2B corporate wellness genomics','TPA / insurance billing for health tests','Chat + email support'],
        notIncluded: ['Whole-genome sequencing (WGS) offering','API marketplace for wellness apps','Multi-site operations','NABL documentation','HRMS & payroll'],
      },
      large: {
        scale: [{label:'Monthly Kits',value:'2,000 – 10,000'},{label:'Staff',value:'15 – 40'},{label:'WA Credits',value:'8,000 / month'}],
        features: ['Everything in Medium','Whole-genome sequencing (WGS) offering','API marketplace for third-party wellness apps','Multi-site management console','NABL ISO 15189 documentation','Biobank consent & sample archival tracking','Staff HRMS — attendance, payroll','Customer cohort analytics & engagement','Priority support with 4h SLA'],
        notIncluded: ['Research genomics platform','Pharma partnership data API','ABDM / FHIR integration'],
      },
      enterprise: {
        scale: [{label:'Monthly Kits',value:'10,000+'},{label:'Staff',value:'40+'},{label:'WA Credits',value:'Unlimited'}],
        features: ['Everything in Large','Research genomics platform & data warehouse','Pharma partnership de-identified data API','ABDM HIP integration (FHIR R4)','Dedicated account manager','Quarterly business review','Custom integrations'],
        notIncluded: [],
      },
    },
  },
};

// Fallback for unknown subtypes — generic diagnostic lab (uses pathology)
const GENERIC_FALLBACK: SubtypeTierData = SUBTYPE_DATA['pathology-lab'];

export function getSubtypeFeatures(subtype: string): SubtypeTierData {
  return (SUBTYPE_DATA as Record<string, SubtypeTierData>)[subtype] ?? GENERIC_FALLBACK;
}

export { SUBTYPE_DATA };
