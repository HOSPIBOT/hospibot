// Diagnostic Portal — Tier & Feature Matrix
// Blueprint: Portal Family > Subtype > Size Tier > Features + Pricing

export type LabTier = 'small' | 'medium' | 'large' | 'enterprise';

export interface TierConfig {
  id: LabTier;
  label: string;
  tagline: string;
  dailySamples: string;
  staff: string;
  branches: string;
  monthlyTests: string;
  price: string;
  priceNote: string;
  color: string;
  badge?: string;
  features: string[];
  notIncluded: string[];
  formExtras: string[];
}

export const DIAGNOSTIC_TIERS: TierConfig[] = [
  {
    id: 'small',
    label: 'Small Lab',
    tagline: 'Perfect for solo-run labs and PSCs just getting started',
    dailySamples: '1–50',
    staff: '1–5',
    branches: '1',
    monthlyTests: 'Up to 1,500',
    price: '₹999',
    priceNote: 'per month',
    color: '#0369A1',
    features: [
      'WhatsApp report delivery (500 free/month)',
      'Sample tracking — basic lifecycle',
      'GST-compliant billing & invoicing',
      'Test catalog (500+ pre-loaded tests)',
      'PDF report generation with letterhead',
      'Patient registration & lookup',
      'Basic dashboard & daily summary',
      'Email support',
    ],
    notIncluded: [
      'Home collection management',
      'Doctor CRM & referrals',
      'QC module',
      'NABL compliance tools',
      'Multi-branch management',
    ],
    formExtras: [],
  },
  {
    id: 'medium',
    label: 'Medium Lab',
    tagline: 'For growing diagnostic centers handling 50–200 samples/day',
    dailySamples: '50–200',
    staff: '5–20',
    branches: '1–3',
    monthlyTests: '1,500–6,000',
    price: '₹2,999',
    priceNote: 'per month',
    color: '#0D7C66',
    badge: 'Most Popular',
    features: [
      'Everything in Small Lab',
      'Home collection management + GPS',
      'Doctor CRM & referral tracking',
      'Corporate wellness screening',
      'TPA / insurance claim processing',
      'Advanced billing — packages & combos',
      '2,000 WhatsApp credits/month',
      'Chat + email support',
    ],
    notIncluded: [
      'QC / Westgard module',
      'NABL compliance tools',
      'Multi-branch management',
      'Staff HRMS & payroll',
      'HL7/ASTM analyser interface',
    ],
    formExtras: [
      'gstNumber',
      'collectionPoints',
    ],
  },
  {
    id: 'large',
    label: 'Large Lab',
    tagline: 'For city-level chains with NABL accreditation needs',
    dailySamples: '200–1,000',
    staff: '20–100',
    branches: '3–15',
    monthlyTests: '6,000–30,000',
    price: '₹7,999',
    priceNote: 'per month',
    color: '#7C3AED',
    features: [
      'Everything in Medium Lab',
      'QC module — Westgard + Levey-Jennings',
      'NABL compliance documentation',
      'Multi-branch management & consolidation',
      'Staff HRMS, attendance & payroll',
      'HL7/ASTM analyser interface',
      'Chain analytics dashboard',
      '5,000 WhatsApp credits/month',
      'Priority support',
    ],
    notIncluded: [
      'Franchise management',
      'Hub-and-spoke routing',
      'Revenue sharing engine',
      'White-label capability',
      'Dedicated account manager',
    ],
    formExtras: [
      'gstNumber',
      'nabl',
      'branchCount',
      'analyserBrands',
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    tagline: 'For reference labs, hospital networks, and franchise chains',
    dailySamples: '1,000+',
    staff: '100+',
    branches: '15+',
    monthlyTests: '30,000+',
    price: 'Custom',
    priceNote: 'contact us',
    color: '#1E293B',
    badge: 'Contact Sales',
    features: [
      'Everything in Large Lab',
      'Franchise & hub-spoke management',
      'Revenue sharing engine',
      'White-label portal capability',
      'API marketplace access',
      'Unlimited WhatsApp credits',
      'ABHA/ABDM deep integration',
      'Dedicated account manager',
      'SLA-backed uptime guarantee',
      'Custom integrations on request',
    ],
    notIncluded: [],
    formExtras: [
      'gstNumber',
      'nabl',
      'branchCount',
      'analyserBrands',
      'groupName',
      'isFranchise',
      'existingSoftware',
      'monthlyVolume',
    ],
  },
];

export const TIER_FEATURES_DETAIL: Record<LabTier, { module: string; features: string[] }[]> = {
  small: [
    { module: 'WhatsApp', features: ['Report delivery on WhatsApp', 'Appointment reminders', 'Basic chatbot for FAQs'] },
    { module: 'Lab Operations', features: ['Sample registration', 'Result entry', 'Report PDF generation', 'Test catalog — 500 tests'] },
    { module: 'Billing', features: ['GST invoicing', 'UPI/cash billing', 'Daily collection report'] },
    { module: 'Dashboard', features: ['Daily samples summary', 'Pending reports', 'Revenue today'] },
  ],
  medium: [
    { module: 'WhatsApp', features: ['Report delivery', 'Appointment + collection reminders', 'Chatbot with department routing', 'Campaign broadcasts'] },
    { module: 'Lab Operations', features: ['8-stage sample tracking', 'Home collection with GPS', 'Batch processing', 'Critical value alerts', 'Delta check', '3,000+ test catalog'] },
    { module: 'Billing', features: ['GST invoicing + e-receipts', 'Package billing', 'TPA/insurance claims', 'Doctor commission management'] },
    { module: 'CRM', features: ['Doctor referral tracking', 'Corporate client management', 'Health checkup packages'] },
    { module: 'Analytics', features: ['TAT analysis', 'Test volume trends', 'Revenue by category', 'Doctor-wise referral report'] },
  ],
  large: [
    { module: 'WhatsApp', features: ['Full automation suite', 'Multi-number support', 'Broadcast with segmentation'] },
    { module: 'Lab Operations', features: ['Everything in Medium', 'Multi-branch sample routing', 'NABL audit documentation', 'QC — Westgard + Levey-Jennings', 'Reagent management', 'Equipment log'] },
    { module: 'Billing', features: ['Multi-branch billing', 'Consolidated MIS', 'Rate cards per client type', 'TPA pre-auth + claims'] },
    { module: 'HRMS', features: ['Staff roster & shifts', 'Attendance tracking', 'Payroll processing', 'PF/ESI deductions'] },
    { module: 'Analytics', features: ['Chain-level dashboards', 'Branch comparison', 'Cost centre reporting', 'NABL QC metrics'] },
    { module: 'Integrations', features: ['HL7/ASTM analyser interface', 'Webhook outbound', 'Aggregator inbound API'] },
  ],
  enterprise: [
    { module: 'WhatsApp', features: ['Unlimited credits', 'Multi-brand numbers', 'White-label chatbot'] },
    { module: 'Lab Operations', features: ['Everything in Large', 'Hub-spoke sample routing', 'Runner tracking app', 'Inter-branch transfer manifest', 'Reference lab integration'] },
    { module: 'Franchise', features: ['Franchise dashboard', 'Revenue sharing rules', 'Royalty management', 'White-label portal per franchise'] },
    { module: 'Enterprise Billing', features: ['Multi-entity billing', 'Group MIS & P&L', 'Insurer tie-up management'] },
    { module: 'Compliance', features: ['ABHA/ABDM HIP + HPR', 'ICMR/NACO reporting', 'EQA/PT tracking', 'NABL full audit module'] },
    { module: 'API & Platform', features: ['API marketplace', 'Custom webhook builder', 'Developer portal access', 'Dedicated infra option'] },
  ],
};
