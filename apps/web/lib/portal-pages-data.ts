export interface PortalSubtype {
  name: string;
  desc: string;
  icon: string;
}

export interface PortalFeature {
  title: string;
  desc: string;
  icon: string;
}

export interface PortalPricing {
  name: string;
  price: number | null;
  annual: number | null;
  desc: string;
  badge: string | null;
  features: string[];
}

export interface PortalPageData {
  slug: string;
  name: string;
  tagline: string;
  heroDesc: string;
  icon: string;
  color: string;
  loginPath: string;
  registerPath: string;
  stats: { value: string; label: string }[];
  audience: { title: string; desc: string; icon: string }[];
  features: PortalFeature[];
  benefits: { title: string; desc: string }[];
  growth: { title: string; desc: string; icon: string }[];
  subtypes: PortalSubtype[];
  pricing: PortalPricing[];
}

export const PORTALS: PortalPageData[] = [
  {
    slug: 'clinical',
    name: 'Clinical Portal',
    tagline: 'From solo doctors to 500-bed hospital chains',
    heroDesc: 'Complete hospital management — appointments, prescriptions, billing, WhatsApp patient engagement, multi-department operations, and AI-powered clinical tools. Built for every clinical setup in India.',
    icon: '🏥',
    color: '#0D7C66',
    loginPath: '/clinical/login',
    registerPath: '/register?portal=clinical',
    stats: [
      { value: '75', label: 'Subtypes supported' },
      { value: '60%', label: 'No-show reduction' },
      { value: '<7', label: 'Days to go live' },
      { value: '98%', label: 'WA open rate' },
    ],
    audience: [
      { title: 'Individual doctors & GPs', desc: 'Solo practitioners running OPD with 10-50 patients/day. Need simple appointment + prescription + billing.', icon: '👨‍⚕️' },
      { title: 'Multi-specialty clinics', desc: 'Clinics with 3-20 doctors across specialties. Need department scheduling, shared patient records, insurance billing.', icon: '🏥' },
      { title: 'Hospitals (30-500 beds)', desc: 'Mid to large hospitals with OPD + IPD, OT scheduling, bed management, pharmacy, lab integration.', icon: '🏢' },
      { title: 'Hospital chains & franchises', desc: 'Multi-location networks needing centralized analytics, standardized protocols, and franchise management.', icon: '🌐' },
      { title: 'AYUSH & alternative medicine', desc: 'Ayurveda, Homeopathy, Unani, Siddha, Yoga, Naturopathy — with therapy-specific prescription templates.', icon: '🧘' },
      { title: 'Dental, eye, ENT centers', desc: 'Specialty clinics with procedure-specific workflows, imaging integration, and follow-up protocols.', icon: '🦷' },
    ],
    features: [
      { title: 'WhatsApp appointment booking', desc: 'Patients book via WhatsApp chatbot. AI handles slot selection, confirmation, rescheduling, and reminders automatically.', icon: '💬' },
      { title: 'Smart prescription writer', desc: 'Voice-to-text in English, Hindi, Telugu, Tamil. Drug interaction alerts, dosage auto-fill, favorite templates.', icon: '📝' },
      { title: 'OPD & IPD management', desc: 'Patient queue, vitals entry, consultation notes, discharge summary. Complete outpatient and inpatient lifecycle.', icon: '🏥' },
      { title: 'Revenue cycle management', desc: 'GST billing, payment links, TPA/insurance, package pricing, refund management. Auto-reconciliation with Tally.', icon: '💰' },
      { title: 'Multi-department scheduling', desc: 'Manage doctors across cardiology, orthopedics, gynecology — each with custom time slots and consultation fees.', icon: '📅' },
      { title: 'Lab & pharmacy integration', desc: 'Order lab tests and prescriptions from consultation screen. Results auto-attach to patient records.', icon: '🔬' },
      { title: 'Patient health vault', desc: 'Universal health record accessible via mobile number. Cross-provider record sharing with patient consent.', icon: '🔒' },
      { title: 'Staff & HR management', desc: 'Doctor schedules, nurse rosters, attendance, leave management, payroll integration for large hospitals.', icon: '👥' },
    ],
    benefits: [
      { title: 'Zero training required', desc: 'Staff go live within hours. WhatsApp-based interface means patients need no app download or registration.' },
      { title: '40% more revenue', desc: 'Automated follow-ups, recall reminders, and package renewals turn one-time patients into recurring revenue.' },
      { title: 'Complete compliance', desc: 'NABH documentation, clinical audit trails, HIPAA/DPDPA data protection, consent management built-in.' },
      { title: 'Real-time analytics', desc: 'Revenue, footfall, doctor performance, department-wise metrics — all in one dashboard across all branches.' },
    ],
    growth: [
      { title: 'Patient retention engine', desc: 'Automated birthday wishes, health tips, vaccination reminders, and annual checkup recalls increase repeat visits by 45%.', icon: '📈' },
      { title: 'Doctor referral network', desc: 'Build and track referral relationships. Auto-notify referring doctors when their patients complete treatment.', icon: '🤝' },
      { title: 'Corporate wellness tie-ups', desc: 'Onboard corporate clients for employee health checkups. Automated scheduling, bulk billing, HR analytics.', icon: '🏢' },
      { title: 'Multi-branch expansion', desc: 'Clone your successful setup to new locations in minutes. Centralized protocols with local customization.', icon: '🌍' },
    ],
    subtypes: [
      { name: 'Individual Doctor / GP', desc: 'Solo practice with OPD', icon: '👨‍⚕️' },
      { name: 'Specialist Doctor', desc: 'Cardiology, neurology, ortho...', icon: '🫀' },
      { name: 'Multi-Specialty Clinic', desc: '3-20 doctors, shared ops', icon: '🏥' },
      { name: 'Polyclinic', desc: 'Walk-in multi-doctor clinic', icon: '🏪' },
      { name: 'Nursing Home (<30 beds)', desc: 'Small hospital with IPD', icon: '🛏️' },
      { name: 'Hospital (30-200 beds)', desc: 'Mid-size with departments', icon: '🏢' },
      { name: 'Hospital (200+ beds)', desc: 'Large with sub-specialties', icon: '🏗️' },
      { name: 'Super-Specialty Hospital', desc: 'Tertiary care center', icon: '⭐' },
      { name: 'Dental Clinic / Hospital', desc: 'General & cosmetic dentistry', icon: '🦷' },
      { name: 'Eye / Ophthalmology Center', desc: 'Cataract, LASIK, retina', icon: '👁️' },
      { name: 'IVF / Fertility Center', desc: 'ART procedures, embryology', icon: '🤰' },
      { name: 'Day Surgery Center', desc: 'Outpatient procedures', icon: '🔪' },
      { name: 'Psychiatry / Psychology', desc: 'Mental health services', icon: '🧠' },
      { name: 'Physiotherapy Clinic', desc: 'Rehab & sports medicine', icon: '💪' },
      { name: 'Ayurveda / Panchakarma', desc: 'Traditional Indian medicine', icon: '🌿' },
    ],
    pricing: [
      { name: 'Starter', price: 599, annual: 499, desc: 'Solo doctor or single-room clinic', badge: null, features: ['1 doctor, 1 branch', '50 appointments/day', 'WhatsApp report delivery', 'Basic billing (GST)', '500 WA messages/mo', 'Email support (48hr)'] },
      { name: 'Growth', price: 2999, annual: 2499, desc: 'Growing clinic with referrals', badge: 'Most popular', features: ['10 doctors, 3 branches', '300 appointments/day', 'WhatsApp chatbot + CRM', 'TPA/insurance billing', '5,000 WA messages/mo', 'Tally export', 'Priority support (24hr)'] },
      { name: 'Professional', price: 7999, annual: 6999, desc: 'Multi-specialty or nursing home', badge: null, features: ['50 doctors, 10 branches', '1,000 appointments/day', 'HRMS + staff scheduling', 'Advanced analytics', '25,000 WA messages/mo', 'NABH docs, QC module', '4hr SLA support'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'Hospital chains & franchises', badge: 'Contact sales', features: ['Unlimited doctors & branches', 'ABDM/ABHA integration', 'API marketplace & SSO', 'White-label option', 'Custom integrations', 'Dedicated account manager'] },
    ],
  },
  {
    slug: 'diagnostic',
    name: 'Diagnostic Portal',
    tagline: 'From single-room labs to national reference chains',
    heroDesc: 'Complete diagnostic lab management — sample tracking, result entry, QC, billing, NABL compliance, WhatsApp report delivery, and analyzer integration. 34 subtypes covering every diagnostic modality.',
    icon: '🔬',
    color: '#4F46E5',
    loginPath: '/diagnostic/login',
    registerPath: '/register?portal=diagnostic',
    stats: [
      { value: '34', label: 'Lab subtypes' },
      { value: '98%', label: 'Report delivery rate' },
      { value: '65+', label: 'API endpoints' },
      { value: '7', label: 'Compliance hard-blocks' },
    ],
    audience: [
      { title: 'Standalone pathology labs', desc: 'Blood test labs processing CBC, LFT, KFT, thyroid panels. 20-1,000+ tests/day.', icon: '🧪' },
      { title: 'Radiology & scan centers', desc: 'X-Ray, CT, MRI, ultrasound, PET-CT centers with DICOM viewer and radiologist workflows.', icon: '📡' },
      { title: 'Collection centers & PUPs', desc: 'Sample collection points and pickup counters inside pharmacies/clinics.', icon: '📦' },
      { title: 'Specialty labs', desc: 'Molecular/PCR, genetics, microbiology, histopathology, blood bank, forensic labs.', icon: '🧬' },
      { title: 'Health checkup centers', desc: 'Wellness screening packages, corporate health camps, preventive health programs.', icon: '❤️' },
      { title: 'Reference lab networks', desc: 'Hub-spoke operations managing 10-500+ franchise/partner centers.', icon: '🌐' },
    ],
    features: [
      { title: 'Sample barcode lifecycle', desc: '8-stage tracking from collection to dispatch. Barcode printing, runner dispatch, hub-spoke transfer.', icon: '📊' },
      { title: 'Result entry & approval', desc: 'Structured entry with reference ranges, critical value alerts, auto-validation rules, multi-level approval.', icon: '✅' },
      { title: 'WhatsApp report delivery', desc: 'PDF reports auto-delivered via WhatsApp with branded letterhead. 98% open rate vs 15% email.', icon: '💬' },
      { title: 'QC & NABL compliance', desc: 'Westgard rules, Levey-Jennings charts, EQAS tracking, NABL 112A documentation suite.', icon: '🏅' },
      { title: 'HL7/ASTM analyzer interface', desc: 'Auto-capture results from lab analyzers. Supports HL7 v2.x and ASTM E1394 protocols.', icon: '🔌' },
      { title: 'Regulatory hard-blocks', desc: 'PC-PNDT Form F, AERB dose log, NACO TTI, BMW waste log, ART Act consent — enforced by system.', icon: '🛡️' },
      { title: 'Doctor CRM & referrals', desc: 'Track referring doctors, auto-notify on report completion, revenue analytics per referrer.', icon: '👨‍⚕️' },
      { title: 'Home sample collection', desc: 'GPS agent tracking, slot booking, route optimization, cold chain monitoring, doorstep billing.', icon: '🏠' },
    ],
    benefits: [
      { title: '3x faster TAT', desc: 'Barcode tracking + auto-validation + digital approval eliminates manual bottlenecks in result processing.' },
      { title: 'Zero compliance risk', desc: '7 regulatory hard-blocks prevent non-compliant report release. Auto-generated government reports.' },
      { title: 'Grow without hiring', desc: 'WhatsApp chatbot handles patient queries, report requests, and booking — reducing front desk load by 70%.' },
      { title: 'Multi-branch visibility', desc: 'Real-time dashboard across all locations. Revenue, TAT, test volume, QC status in one screen.' },
    ],
    growth: [
      { title: 'Home collection expansion', desc: 'Launch doorstep phlebotomy with GPS tracking, slot booking, and route optimization. Tap the ₹5,000 Cr home collection market.', icon: '🏠' },
      { title: 'Corporate wellness contracts', desc: 'Onboard companies for annual health checkups. Employer portal, camp management, bulk invoicing.', icon: '🏢' },
      { title: 'Franchise model', desc: 'Turn your brand into a franchise network. Standardized SOPs, revenue sharing, centralized QC monitoring.', icon: '📊' },
      { title: 'Reference lab partnerships', desc: 'Become a reference lab. Route samples from partner centers, manage SLAs, share revenue.', icon: '🔬' },
    ],
    subtypes: [
      { name: 'Pathology / Blood Test Lab', desc: 'CBC, LFT, KFT, thyroid', icon: '🧪' },
      { name: 'Sample Collection Center', desc: 'Barcode, dispatch, hub-spoke', icon: '📦' },
      { name: 'Home Sample Collection', desc: 'GPS agents, slot booking', icon: '🏠' },
      { name: 'Radiology Center', desc: 'X-Ray, CT, MRI, DICOM', icon: '📡' },
      { name: 'Ultrasound Center', desc: 'USG, Doppler, PC-PNDT', icon: '🔊' },
      { name: 'PET Scan Center', desc: 'PET-CT, radiotracer log', icon: '⚛️' },
      { name: 'Cardiac Diagnostics', desc: 'ECG, Echo, TMT, Holter', icon: '❤️' },
      { name: 'Molecular / PCR Lab', desc: 'RT-PCR, viral load, NGS', icon: '🧬' },
      { name: 'Genetic Testing Lab', desc: 'BRCA, NIPT, karyotype', icon: '🔬' },
      { name: 'Blood Bank', desc: 'Donor mgmt, TTI, crossmatch', icon: '🩸' },
      { name: 'Health Checkup Center', desc: 'Packages, wellness screening', icon: '💚' },
      { name: 'Reference Lab Network', desc: 'Hub-spoke, franchise, SLA', icon: '🌐' },
    ],
    pricing: [
      { name: 'Starter', price: 1199, annual: 999, desc: 'Single-room lab or collection center', badge: null, features: ['5 users, 1 branch', '50 tests/day', 'Barcode tracking', 'PDF report + WhatsApp', '2,000 WA messages/mo', 'Email support'] },
      { name: 'Growth', price: 3499, annual: 2999, desc: 'Growing lab with referrals & TPA', badge: 'Most popular', features: ['20 users, 3 branches', '300 tests/day', 'Doctor CRM + referrals', 'TPA/insurance billing', '10,000 WA messages/mo', 'Analyzer interface (HL7)', 'Home collection module'] },
      { name: 'Professional', price: 8999, annual: 7999, desc: 'Multi-site lab with NABL', badge: null, features: ['75 users, 10 branches', '1,000 tests/day', 'QC (Westgard/LJ)', 'NABL document suite', '50,000 WA messages/mo', 'HRMS + staff mgmt', 'Priority 4hr SLA'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'Lab networks & franchises', badge: 'Contact sales', features: ['Unlimited users & branches', 'Hub-spoke routing', 'ABDM/ABHA integration', 'API marketplace & SSO', 'Franchise management', 'Dedicated account manager'] },
    ],
  },
  {
    slug: 'pharmacy',
    name: 'Pharmacy Portal',
    tagline: 'From neighborhood chemists to hospital pharmacies',
    heroDesc: 'Complete pharmacy management — inventory, billing, drug alerts, refill reminders, GST compliance, and delivery tracking. Purpose-built for Indian pharmacy regulations.',
    icon: '💊',
    color: '#D97706',
    loginPath: '/pharmacy/login',
    registerPath: '/register?portal=pharmacy',
    stats: [{ value: '14', label: 'Subtypes' }, { value: '40%', label: 'Faster billing' }, { value: '0', label: 'Expiry waste' }, { value: '3x', label: 'Refill revenue' }],
    audience: [
      { title: 'Retail pharmacy', desc: 'Neighborhood chemist shops with OTC + prescription drugs, 200-2,000 SKUs.', icon: '💊' },
      { title: 'Hospital pharmacy', desc: 'In-house pharmacies linked to IPD/OPD, controlled substance management.', icon: '🏥' },
      { title: 'Online pharmacy', desc: 'E-commerce with prescription upload, delivery management, D&C compliance.', icon: '📱' },
      { title: 'Wholesale distributor', desc: 'B2B ordering, multi-warehouse, batch tracking, GST invoicing at scale.', icon: '🏭' },
    ],
    features: [
      { title: 'Smart inventory management', desc: 'Auto-reorder, batch tracking, expiry alerts, rack/bin mapping, substitute suggestions.', icon: '📦' },
      { title: 'Drug schedule compliance', desc: 'Schedule H/H1/X alerts, prescription verification, controlled substance register (NDPS).', icon: '⚠️' },
      { title: 'WhatsApp refill reminders', desc: 'Auto-remind patients when prescriptions are due for refill. One-tap reorder via WhatsApp.', icon: '💬' },
      { title: 'GST billing & returns', desc: 'GSTIN auto-fill, HSN codes, batch-wise costing, credit notes, e-invoice, Tally export.', icon: '💰' },
      { title: 'Delivery management', desc: 'Rider dispatch, route optimization, real-time tracking, COD/prepaid settlement.', icon: '🚚' },
      { title: 'Supplier management', desc: 'Purchase orders, GRN, rate comparison, supplier ledger, payment tracking.', icon: '🤝' },
    ],
    benefits: [
      { title: 'Zero expiry waste', desc: 'FIFO alerts + auto-return + near-expiry discount campaigns eliminate expired stock write-offs.' },
      { title: '3x refill revenue', desc: 'WhatsApp reminders convert 45% of chronic medication patients into auto-refill subscribers.' },
      { title: 'Full D&C compliance', desc: 'Drug schedule alerts, prescription verification, purchase register — all regulatory needs covered.' },
      { title: 'Multi-store visibility', desc: 'Stock levels, sales, margins across all outlets in one dashboard. Inter-store stock transfer.' },
    ],
    growth: [
      { title: 'Chronic care programs', desc: 'Diabetes, hypertension, thyroid management programs with auto-refill and health monitoring.', icon: '📈' },
      { title: 'E-commerce expansion', desc: 'Launch online ordering via WhatsApp and web. Prescription upload, home delivery, recurring orders.', icon: '🛒' },
      { title: 'Franchise model', desc: 'Standardize operations across outlets. Centralized procurement, pricing, and compliance.', icon: '🏪' },
      { title: 'Generic substitution', desc: 'Suggest generics with equivalent molecules. Higher margins + patient savings = win-win.', icon: '💡' },
    ],
    subtypes: [
      { name: 'Retail Pharmacy', desc: 'Neighborhood chemist', icon: '💊' },
      { name: 'Hospital Pharmacy', desc: 'In-house OPD/IPD pharmacy', icon: '🏥' },
      { name: 'Online Pharmacy', desc: 'E-commerce delivery', icon: '📱' },
      { name: 'AYUSH Pharmacy', desc: 'Ayurvedic, homeopathic', icon: '🌿' },
      { name: 'Oncology Pharmacy', desc: 'Cancer drug management', icon: '⚕️' },
      { name: 'Wholesale Distributor', desc: 'B2B bulk supply', icon: '🏭' },
    ],
    pricing: [
      { name: 'Starter', price: 499, annual: 399, desc: 'Single retail pharmacy', badge: null, features: ['2 users, 1 location', '500 SKUs', 'Drug alerts', 'GST billing', '1K WA/mo', 'Email support'] },
      { name: 'Growth', price: 1799, annual: 1499, desc: 'Multi-counter with delivery', badge: 'Most popular', features: ['10 users, 3 locations', '5,000 SKUs', 'Refill reminders', 'Auto-reorder', '5K WA/mo', 'Delivery mgmt'] },
      { name: 'Professional', price: 4499, annual: 3999, desc: 'Hospital pharmacy or chain', badge: null, features: ['50 users, 10 locations', 'Unlimited SKUs', 'NDPS register', 'Expiry automation', '25K WA/mo', 'Tally export'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'Wholesale or franchise', badge: 'Contact sales', features: ['Unlimited everything', 'B2B portal', 'Multi-warehouse', 'Custom integrations', 'API access', 'Dedicated AM'] },
    ],
  },
  {
    slug: 'homecare',
    name: 'Home Care Portal',
    tagline: 'Bringing healthcare to the patient\'s doorstep',
    heroDesc: 'Complete home healthcare management — nurse scheduling, visit tracking, GPS monitoring, clinical documentation, and family communication. Built for India\'s booming home care industry.',
    icon: '🏠',
    color: '#7C3AED',
    loginPath: '/homecare/login',
    registerPath: '/register?portal=homecare',
    stats: [{ value: '12', label: 'Subtypes' }, { value: '45%', label: 'More visits/day' }, { value: '100%', label: 'GPS verified' }, { value: '24/7', label: 'Family updates' }],
    audience: [
      { title: 'Home nursing agencies', desc: 'Post-operative care, wound management, IV therapy, catheter care at patient homes.', icon: '👩‍⚕️' },
      { title: 'Physiotherapy at home', desc: 'Post-surgery rehab, stroke recovery, orthopedic exercises with progress tracking.', icon: '💪' },
      { title: 'Elder care services', desc: 'Geriatric care, companionship, medication management, fall prevention, vital monitoring.', icon: '👴' },
      { title: 'ICU at home', desc: 'Critical care setup at home with ventilator, monitors, trained ICU nurses, and doctor rounds.', icon: '🫁' },
    ],
    features: [
      { title: 'Smart scheduling', desc: 'Auto-assign nurses based on location, skill, and availability. Route optimization for multi-visit days.', icon: '📅' },
      { title: 'GPS visit verification', desc: 'Real-time nurse tracking, geo-fenced check-in/check-out, visit duration logging.', icon: '📍' },
      { title: 'Clinical documentation', desc: 'Vitals capture, wound photos, medication administration records, treatment progress notes.', icon: '📝' },
      { title: 'Family communication', desc: 'Auto WhatsApp updates to family members — visit completed, vitals recorded, next visit scheduled.', icon: '👨‍👩‍👧' },
      { title: 'Equipment tracking', desc: 'Track medical equipment deployed at patient homes — oxygen concentrators, hospital beds, monitors.', icon: '🔧' },
      { title: 'Billing & insurance', desc: 'Package-based billing, insurance claims, family wallet, auto-invoicing after each visit.', icon: '💰' },
    ],
    benefits: [
      { title: '45% more visits per nurse', desc: 'Route optimization + auto-scheduling eliminates travel waste and scheduling conflicts.' },
      { title: 'Family trust & retention', desc: 'Real-time WhatsApp updates build family confidence. 90% renewal rate on care packages.' },
      { title: 'Clinical quality assurance', desc: 'Standardized protocols, mandatory vitals entry, photo documentation, supervisor review.' },
      { title: 'Regulatory compliance', desc: 'Nurse qualification verification, insurance documentation, consent management, incident reporting.' },
    ],
    growth: [
      { title: 'Corporate contracts', desc: 'Partner with insurance companies and corporates for post-hospitalization home care packages.', icon: '🏢' },
      { title: 'Hospital discharge tie-ups', desc: 'Integrate with hospitals for seamless discharge-to-home-care transitions.', icon: '🏥' },
      { title: 'Elder care subscriptions', desc: 'Monthly wellness check packages for senior citizens — India\'s fastest growing healthcare segment.', icon: '👴' },
      { title: 'Multi-city expansion', desc: 'Replicate your model in new cities with centralized quality control and local nurse networks.', icon: '🌍' },
    ],
    subtypes: [
      { name: 'Home Nursing', desc: 'Post-op, wound care, IV therapy', icon: '👩‍⚕️' },
      { name: 'Physiotherapy at Home', desc: 'Rehab, exercises, mobility', icon: '💪' },
      { name: 'Elder Care', desc: 'Geriatric, companionship', icon: '👴' },
      { name: 'ICU at Home', desc: 'Critical care, ventilator', icon: '🫁' },
      { name: 'Ambulance Services', desc: 'BLS, ALS, patient transport', icon: '🚑' },
      { name: 'Palliative Care', desc: 'End-of-life comfort care', icon: '🕊️' },
    ],
    pricing: [
      { name: 'Starter', price: 799, annual: 649, desc: 'Small nursing agency', badge: null, features: ['5 nurses, 1 city', '20 visits/day', 'GPS tracking', 'Basic billing', '1K WA/mo', 'Email support'] },
      { name: 'Growth', price: 2499, annual: 1999, desc: 'Growing home care service', badge: 'Most popular', features: ['25 nurses, 3 cities', '100 visits/day', 'Route optimization', 'Family updates', '5K WA/mo', 'Equipment tracking'] },
      { name: 'Professional', price: 5999, annual: 4999, desc: 'Multi-city operations', badge: null, features: ['100 nurses, 10 cities', '500 visits/day', 'Clinical protocols', 'Insurance billing', '25K WA/mo', 'Priority support'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'National home care chain', badge: 'Contact sales', features: ['Unlimited nurses & cities', 'Hospital integrations', 'API access', 'White-label app', 'Custom protocols', 'Dedicated AM'] },
    ],
  },
  {
    slug: 'equipment',
    name: 'Equipment Portal',
    tagline: 'Medical devices from supplier to service',
    heroDesc: 'Complete medical equipment lifecycle management — cataloging, orders, installation, AMC/warranty, service requests, and spare parts. Built for India\'s ₹80,000 Cr medical device market.',
    icon: '🔧',
    color: '#DC2626',
    loginPath: '/equipment/login',
    registerPath: '/register?portal=equipment',
    stats: [{ value: '10', label: 'Subtypes' }, { value: '50%', label: 'Faster service' }, { value: '100%', label: 'AMC tracked' }, { value: '30%', label: 'More renewals' }],
    audience: [
      { title: 'Medical device distributors', desc: 'Companies distributing diagnostic, surgical, and imaging equipment to hospitals and labs.', icon: '🏭' },
      { title: 'Surgical instrument suppliers', desc: 'OT instruments, disposables, implants — with lot tracking and sterilization records.', icon: '🔪' },
      { title: 'Imaging equipment vendors', desc: 'X-Ray, CT, MRI, ultrasound machine sales and service with AERB compliance.', icon: '📡' },
      { title: 'Lab consumable distributors', desc: 'Reagents, glassware, consumables with batch tracking and cold chain requirements.', icon: '🧪' },
    ],
    features: [
      { title: 'Product catalog & CRM', desc: 'Digital catalog with specs, pricing, certifications. Lead tracking and sales pipeline management.', icon: '📋' },
      { title: 'Order & delivery management', desc: 'Quote generation, PO management, delivery tracking, installation scheduling.', icon: '📦' },
      { title: 'AMC & warranty tracking', desc: 'Contract management, service schedules, auto-renewal reminders, SLA monitoring.', icon: '📅' },
      { title: 'Service request management', desc: 'Ticket system for breakdowns, preventive maintenance, engineer dispatch with GPS.', icon: '🔧' },
      { title: 'Spare parts inventory', desc: 'Part number tracking, compatibility matrix, reorder points, vendor management.', icon: '⚙️' },
      { title: 'Regulatory compliance', desc: 'CDSCO registration, import licenses, calibration certificates, AERB for radiation equipment.', icon: '🛡️' },
    ],
    benefits: [
      { title: '50% faster service resolution', desc: 'Digital ticketing + engineer dispatch + spare parts tracking cuts service TAT in half.' },
      { title: '30% more AMC renewals', desc: 'Auto-renewal reminders via WhatsApp before contract expiry. Zero manual follow-up.' },
      { title: 'Complete traceability', desc: 'Every device tracked from procurement to decommissioning. Installation records, service history, calibration logs.' },
      { title: 'Dealer network management', desc: 'Multi-tier distributor management with territory mapping and performance analytics.' },
    ],
    growth: [
      { title: 'Service revenue expansion', desc: 'Transform from pure sales to service-led model. AMC, CAMC, per-call revenue streams.', icon: '📈' },
      { title: 'E-commerce for consumables', desc: 'Online ordering portal for hospitals to reorder reagents, disposables, spare parts.', icon: '🛒' },
      { title: 'Refurbished equipment market', desc: 'Buy-back, refurbish, resell pre-owned equipment with certified quality guarantees.', icon: '♻️' },
      { title: 'Training & certification', desc: 'Offer equipment training programs to hospital staff. Track certifications and renewals.', icon: '🎓' },
    ],
    subtypes: [
      { name: 'Diagnostic Equipment', desc: 'Analyzers, reagents, POCT', icon: '🔬' },
      { name: 'Imaging Equipment', desc: 'X-Ray, CT, MRI, USG machines', icon: '📡' },
      { name: 'Surgical Instruments', desc: 'OT instruments, implants', icon: '🔪' },
      { name: 'Dental Equipment', desc: 'Chairs, handpieces, materials', icon: '🦷' },
      { name: 'Lab Consumables', desc: 'Reagents, glassware, tips', icon: '🧪' },
      { name: 'Hospital Furniture', desc: 'Beds, trolleys, OT tables', icon: '🛏️' },
    ],
    pricing: [
      { name: 'Starter', price: 999, annual: 799, desc: 'Small distributor', badge: null, features: ['3 users', '100 products', 'Basic CRM', 'Order tracking', '1K WA/mo', 'Email support'] },
      { name: 'Growth', price: 2999, annual: 2499, desc: 'Growing equipment company', badge: 'Most popular', features: ['15 users', '1,000 products', 'AMC tracking', 'Service tickets', '5K WA/mo', 'Engineer dispatch'] },
      { name: 'Professional', price: 6999, annual: 5999, desc: 'Multi-city operations', badge: null, features: ['50 users', 'Unlimited products', 'Spare parts mgmt', 'Dealer network', '25K WA/mo', 'Priority support'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'National distributor', badge: 'Contact sales', features: ['Unlimited users', 'Multi-warehouse', 'API integrations', 'White-label portal', 'Custom workflows', 'Dedicated AM'] },
    ],
  },
  {
    slug: 'wellness',
    name: 'Wellness Portal',
    tagline: 'Fitness, yoga, nutrition & holistic health',
    heroDesc: 'Complete wellness center management — member subscriptions, class scheduling, trainer management, nutrition plans, progress tracking, and WhatsApp engagement.',
    icon: '🧘',
    color: '#059669',
    loginPath: '/wellness/login',
    registerPath: '/register?portal=wellness',
    stats: [{ value: '11', label: 'Subtypes' }, { value: '60%', label: 'Better retention' }, { value: '2x', label: 'Class bookings' }, { value: '45%', label: 'Upsell revenue' }],
    audience: [
      { title: 'Gyms & fitness centers', desc: 'Membership management, equipment booking, trainer scheduling, body composition tracking.', icon: '🏋️' },
      { title: 'Yoga studios', desc: 'Class scheduling, instructor management, membership packages, retreat bookings.', icon: '🧘' },
      { title: 'Nutrition clinics', desc: 'Diet planning, meal tracking, body metrics, follow-up scheduling, supplement management.', icon: '🥗' },
      { title: 'Spa & wellness resorts', desc: 'Treatment booking, therapist scheduling, package management, loyalty programs.', icon: '💆' },
    ],
    features: [
      { title: 'Member management', desc: 'Subscription plans, auto-renewal, freeze/pause, family memberships, referral tracking.', icon: '👥' },
      { title: 'Class & session booking', desc: 'Group classes, 1-on-1 sessions, trainer calendars, waitlist management, WhatsApp booking.', icon: '📅' },
      { title: 'Progress tracking', desc: 'Body measurements, workout logs, before/after photos, goal setting, milestone celebrations.', icon: '📊' },
      { title: 'Nutrition planning', desc: 'Customized meal plans, calorie tracking, macro/micro breakdowns, recipe suggestions.', icon: '🥗' },
      { title: 'WhatsApp engagement', desc: 'Workout reminders, class notifications, renewal alerts, motivational messages, progress updates.', icon: '💬' },
      { title: 'Revenue & analytics', desc: 'Membership revenue, retention rates, class utilization, trainer performance, peak hour analysis.', icon: '💰' },
    ],
    benefits: [
      { title: '60% better retention', desc: 'WhatsApp reminders + progress sharing + milestone rewards keep members coming back.' },
      { title: '2x class bookings', desc: 'WhatsApp-based booking eliminates call-and-wait. Members book in 10 seconds.' },
      { title: '45% upsell revenue', desc: 'Auto-suggest personal training, nutrition consults, and premium classes based on member goals.' },
      { title: 'Zero no-shows', desc: 'Automated reminders 2 hours before class. Waitlist auto-fills cancelled slots.' },
    ],
    growth: [
      { title: 'Corporate wellness', desc: 'Partner with companies for employee wellness programs. Group memberships, on-site classes.', icon: '🏢' },
      { title: 'Online classes', desc: 'Launch virtual yoga, meditation, fitness classes. Hybrid model for broader reach.', icon: '💻' },
      { title: 'Franchise model', desc: 'Standardize your brand across multiple locations with centralized management.', icon: '🏪' },
      { title: 'Wellness retreats', desc: 'Organize multi-day wellness retreats with integrated booking, meal planning, and activities.', icon: '🏔️' },
    ],
    subtypes: [
      { name: 'Gym / Fitness Center', desc: 'Strength, cardio, cross-fit', icon: '🏋️' },
      { name: 'Yoga Studio', desc: 'Hatha, vinyasa, ashtanga', icon: '🧘' },
      { name: 'Nutrition Clinic', desc: 'Diet planning, weight mgmt', icon: '🥗' },
      { name: 'Spa & Wellness', desc: 'Treatments, therapists', icon: '💆' },
      { name: 'Meditation Center', desc: 'Mindfulness, breathwork', icon: '🧘‍♂️' },
      { name: 'Naturopathy Center', desc: 'Natural healing therapies', icon: '🌿' },
    ],
    pricing: [
      { name: 'Starter', price: 499, annual: 399, desc: 'Small studio or clinic', badge: null, features: ['50 members', '1 location', 'Class booking', 'Basic billing', '500 WA/mo', 'Email support'] },
      { name: 'Growth', price: 1499, annual: 1249, desc: 'Growing wellness center', badge: 'Most popular', features: ['300 members', '3 locations', 'Trainer mgmt', 'Progress tracking', '3K WA/mo', 'Nutrition plans'] },
      { name: 'Professional', price: 3999, annual: 3499, desc: 'Multi-location chain', badge: null, features: ['1,000 members', '10 locations', 'Corporate wellness', 'Advanced analytics', '15K WA/mo', 'Priority support'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'Franchise network', badge: 'Contact sales', features: ['Unlimited members', 'White-label app', 'API integrations', 'Online classes', 'Custom branding', 'Dedicated AM'] },
    ],
  },
  {
    slug: 'services',
    name: 'Services Portal',
    tagline: 'Healthcare services & support ecosystem',
    heroDesc: 'Complete service management for healthcare support businesses — medical tourism, staffing, ambulance services, accreditation consulting, and health tech services.',
    icon: '🛎️',
    color: '#0369A1',
    loginPath: '/services/login',
    registerPath: '/register?portal=services',
    stats: [{ value: '8', label: 'Subtypes' }, { value: '35%', label: 'More bookings' }, { value: '24/7', label: 'Operations' }, { value: '50+', label: 'Integrations' }],
    audience: [
      { title: 'Medical tourism agencies', desc: 'International patient coordination, hospital tie-ups, travel+treatment packages.', icon: '✈️' },
      { title: 'Healthcare staffing', desc: 'Nurse placement, locum doctors, technician staffing for hospitals and home care.', icon: '👥' },
      { title: 'Ambulance services', desc: 'BLS/ALS fleet management, GPS dispatch, hospital tie-ups, government contracts.', icon: '🚑' },
      { title: 'Accreditation consultants', desc: 'NABH, NABL, JCI consulting — document management, gap analysis, mock audits.', icon: '📋' },
    ],
    features: [
      { title: 'Service booking & dispatch', desc: 'Online booking, auto-assignment, GPS tracking, real-time status updates via WhatsApp.', icon: '📅' },
      { title: 'Client management', desc: 'Hospital/clinic client database, contract management, SLA tracking, renewal alerts.', icon: '👥' },
      { title: 'Workforce management', desc: 'Staff scheduling, skill matching, availability tracking, performance reviews.', icon: '📊' },
      { title: 'Fleet & asset tracking', desc: 'Vehicle GPS, maintenance schedules, equipment deployment, utilization analytics.', icon: '🚗' },
      { title: 'Billing & contracts', desc: 'Service-based billing, contract management, milestone invoicing, payment tracking.', icon: '💰' },
      { title: 'WhatsApp communication', desc: 'Client updates, booking confirmations, status notifications, feedback collection.', icon: '💬' },
    ],
    benefits: [
      { title: '35% more bookings', desc: 'WhatsApp-based booking removes friction. Clients book services in seconds.' },
      { title: 'Operational efficiency', desc: 'Auto-dispatch, GPS tracking, and real-time dashboards eliminate manual coordination.' },
      { title: 'Client retention', desc: 'Automated follow-ups, service quality tracking, and proactive maintenance build long-term relationships.' },
      { title: 'Scalable operations', desc: 'Standardized workflows enable rapid expansion to new cities without quality compromise.' },
    ],
    growth: [
      { title: 'Platform marketplace', desc: 'List your services on HospiBot marketplace. Get discovered by hospitals and patients.', icon: '🛒' },
      { title: 'Government contracts', desc: 'Position for government health scheme partnerships — Ayushman Bharat, state health programs.', icon: '🏛️' },
      { title: 'Insurance partnerships', desc: 'Become a preferred provider for insurance companies. Cashless service delivery.', icon: '🛡️' },
      { title: 'Technology licensing', desc: 'White-label your service platform for other providers in different geographies.', icon: '💻' },
    ],
    subtypes: [
      { name: 'Medical Tourism', desc: 'International patient coordination', icon: '✈️' },
      { name: 'Healthcare Staffing', desc: 'Nurse, doctor placement', icon: '👥' },
      { name: 'Ambulance Services', desc: 'BLS/ALS fleet management', icon: '🚑' },
      { name: 'Accreditation Consulting', desc: 'NABH, NABL, JCI prep', icon: '📋' },
      { name: 'Medical Billing Services', desc: 'TPA, claims, coding', icon: '💰' },
      { name: 'Health Tech Services', desc: 'IT, EMR, integration', icon: '💻' },
    ],
    pricing: [
      { name: 'Starter', price: 599, annual: 499, desc: 'Small service business', badge: null, features: ['3 users', 'Basic CRM', 'Booking mgmt', 'GST billing', '1K WA/mo', 'Email support'] },
      { name: 'Growth', price: 1999, annual: 1699, desc: 'Growing service company', badge: 'Most popular', features: ['15 users', 'Client CRM', 'Workforce mgmt', 'GPS tracking', '5K WA/mo', 'Priority support'] },
      { name: 'Professional', price: 4999, annual: 4499, desc: 'Multi-city operations', badge: null, features: ['50 users', 'Fleet management', 'Contract mgmt', 'SLA monitoring', '25K WA/mo', 'Dedicated support'] },
      { name: 'Enterprise', price: null, annual: null, desc: 'National service chain', badge: 'Contact sales', features: ['Unlimited users', 'API integrations', 'White-label', 'Marketplace listing', 'Custom workflows', 'Dedicated AM'] },
    ],
  },
];
