'use client';

import { useState } from 'react';

interface Props {
  familySlug: string;
  subtypeSlug: string | null;
  value: string | null;
  billingCycle: 'monthly' | 'annual';
  onChange: (tierKey: string) => void;
  onBillingCycleChange?: (cycle: 'monthly' | 'annual') => void;
}

interface Feature { name: string; included: boolean }
interface FeatureCategory { [category: string]: Feature[] }

interface PlanData {
  key: string;
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  badge: string | null;
  volume: string;
  staff: string;
  branches: string;
  wa: string;
  sms: string;
  storage: string;
  features: FeatureCategory;
}

const PLANS: PlanData[] = [
  {
    key: 'small', name: 'Starter',
    tagline: 'Solo practitioner or single-room setup',
    monthlyPrice: 999, annualPrice: 833, badge: null,
    volume: 'Up to 50/day', staff: '5 users', branches: '1 branch',
    wa: '2K WA/mo', sms: '500 SMS/mo', storage: '10 GB',
    features: {
      'Core workflow': [
        { name: 'Patient registration & search', included: true },
        { name: 'Sample barcode tracking', included: true },
        { name: 'Test catalog management', included: true },
        { name: 'Result entry & approval', included: true },
        { name: 'PDF report generation', included: true },
        { name: 'Basic analytics dashboard', included: true },
      ],
      'Billing & payments': [
        { name: 'GST invoicing', included: true },
        { name: 'Walk-in cash billing', included: true },
        { name: 'Razorpay payment links', included: true },
        { name: 'TPA / insurance billing', included: false },
        { name: 'Tally accounting export', included: false },
      ],
      'WhatsApp & comms': [
        { name: 'Report delivery via WhatsApp', included: true },
        { name: 'Appointment reminders', included: true },
        { name: 'Patient self-service bot', included: false },
        { name: 'Doctor referral alerts', included: false },
      ],
      'Analytics & compliance': [
        { name: 'Daily MIS summary', included: true },
        { name: 'Revenue reports', included: true },
        { name: 'NABL document suite', included: false },
        { name: 'Advanced trend analytics', included: false },
        { name: 'Regulatory guidance panel', included: true },
      ],
      'Integrations & support': [
        { name: 'HL7/ASTM analyzer interface', included: false },
        { name: 'Home collection module', included: false },
        { name: 'Doctor CRM & referral tracking', included: false },
        { name: 'Email support (48hr)', included: true },
        { name: 'Priority support', included: false },
        { name: 'Dedicated account manager', included: false },
      ],
    },
  },
  {
    key: 'medium', name: 'Growth',
    tagline: 'Growing lab with referrals & insurance billing',
    monthlyPrice: 2999, annualPrice: 2499, badge: 'Most popular',
    volume: '50–300/day', staff: '20 users', branches: '3 branches',
    wa: '10K WA/mo', sms: '2K SMS/mo', storage: '50 GB',
    features: {
      'Core workflow': [
        { name: 'Patient registration & search', included: true },
        { name: 'Sample barcode tracking', included: true },
        { name: 'Test catalog management', included: true },
        { name: 'Result entry & approval', included: true },
        { name: 'PDF report + letterhead', included: true },
        { name: 'Advanced KPI dashboard', included: true },
      ],
      'Billing & payments': [
        { name: 'GST invoicing', included: true },
        { name: 'Walk-in + credit billing', included: true },
        { name: 'Razorpay payment links', included: true },
        { name: 'TPA / insurance billing', included: true },
        { name: 'Tally accounting export', included: true },
      ],
      'WhatsApp & comms': [
        { name: 'Report delivery via WhatsApp', included: true },
        { name: 'Appointment reminders', included: true },
        { name: 'Patient self-service bot', included: true },
        { name: 'Doctor referral alerts', included: true },
      ],
      'Analytics & compliance': [
        { name: 'Daily MIS summary', included: true },
        { name: 'Revenue + TAT reports', included: true },
        { name: 'NABL document suite', included: false },
        { name: 'Advanced trend analytics', included: true },
        { name: 'Regulatory guidance panel', included: true },
      ],
      'Integrations & support': [
        { name: 'HL7/ASTM analyzer interface', included: true },
        { name: 'Home collection module', included: true },
        { name: 'Doctor CRM & referral tracking', included: true },
        { name: 'Email + chat support (24hr)', included: true },
        { name: 'Priority support', included: false },
        { name: 'Dedicated account manager', included: false },
      ],
    },
  },
  {
    key: 'large', name: 'Professional',
    tagline: 'Multi-site operations with NABL accreditation',
    monthlyPrice: 7999, annualPrice: 6666, badge: null,
    volume: '300–1,000/day', staff: '75 users', branches: '10 branches',
    wa: '50K WA/mo', sms: '10K SMS/mo', storage: '500 GB',
    features: {
      'Core workflow': [
        { name: 'Patient registration & search', included: true },
        { name: 'Sample barcode tracking', included: true },
        { name: 'Test catalog management', included: true },
        { name: 'Result entry & approval', included: true },
        { name: 'White-label PDF reports', included: true },
        { name: 'Multi-branch dashboards', included: true },
      ],
      'Billing & payments': [
        { name: 'GST invoicing', included: true },
        { name: 'Walk-in + credit billing', included: true },
        { name: 'Razorpay payment links', included: true },
        { name: 'TPA / insurance billing', included: true },
        { name: 'Tally + B2B invoicing', included: true },
      ],
      'WhatsApp & comms': [
        { name: 'Report delivery via WhatsApp', included: true },
        { name: 'Appointment reminders', included: true },
        { name: 'Patient self-service bot', included: true },
        { name: 'Doctor referral alerts', included: true },
      ],
      'Analytics & compliance': [
        { name: 'Daily MIS summary', included: true },
        { name: 'Revenue, TAT & QC reports', included: true },
        { name: 'NABL document suite', included: true },
        { name: 'Advanced analytics + trends', included: true },
        { name: 'Regulatory guidance panel', included: true },
      ],
      'Integrations & support': [
        { name: 'HL7/ASTM analyzer interface', included: true },
        { name: 'Home collection module', included: true },
        { name: 'Doctor CRM & referral tracking', included: true },
        { name: 'HRMS & staff management', included: true },
        { name: 'Priority support (4hr SLA)', included: true },
        { name: 'Dedicated account manager', included: false },
      ],
    },
  },
  {
    key: 'enterprise', name: 'Enterprise',
    tagline: 'Lab networks, franchises & hospital chains',
    monthlyPrice: null, annualPrice: null, badge: 'Contact sales',
    volume: '1,000+/day', staff: 'Unlimited', branches: 'Unlimited',
    wa: 'Unlimited', sms: 'Unlimited', storage: 'Unlimited',
    features: {
      'Core workflow': [
        { name: 'Patient registration & search', included: true },
        { name: 'Sample barcode tracking', included: true },
        { name: 'Test catalog management', included: true },
        { name: 'Result entry & approval', included: true },
        { name: 'Fully white-label platform', included: true },
        { name: 'Franchise-level dashboards', included: true },
      ],
      'Billing & payments': [
        { name: 'GST invoicing', included: true },
        { name: 'All billing modes', included: true },
        { name: 'Razorpay payment links', included: true },
        { name: 'TPA / insurance billing', included: true },
        { name: 'Revenue sharing + franchise billing', included: true },
      ],
      'WhatsApp & comms': [
        { name: 'Report delivery via WhatsApp', included: true },
        { name: 'Appointment reminders', included: true },
        { name: 'Patient self-service bot', included: true },
        { name: 'Doctor referral alerts', included: true },
      ],
      'Analytics & compliance': [
        { name: 'Daily MIS summary', included: true },
        { name: 'Enterprise BI + custom reports', included: true },
        { name: 'NABL + ABDM compliance suite', included: true },
        { name: 'Government reporting (IDSP, TB)', included: true },
        { name: 'Regulatory guidance panel', included: true },
      ],
      'Integrations & support': [
        { name: 'HL7/ASTM analyzer interface', included: true },
        { name: 'Home collection module', included: true },
        { name: 'Doctor CRM & referral tracking', included: true },
        { name: 'API marketplace, SSO, HRMS', included: true },
        { name: 'Priority support (1hr SLA)', included: true },
        { name: 'Dedicated account manager', included: true },
      ],
    },
  },
];

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-[1px]">
    <circle cx="7.5" cy="7.5" r="7.5" fill="#E8F5F0" />
    <path d="M4.5 7.5l2 1.8 3.5-3.6" stroke="#0D7C66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XMark = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-[1px] opacity-30">
    <circle cx="7.5" cy="7.5" r="7.5" fill="#F1F5F9" />
    <path d="M5 5l5 5M10 5l-5 5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export default function Step4TierPicker({ familySlug, subtypeSlug, value, billingCycle, onChange, onBillingCycleChange }: Props) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (key: string) => {
    setExpandedCats(prev => ({ ...prev, [key]: prev[key] === false ? true : prev[key] === undefined ? false : !prev[key] }));
  };

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-center text-gray-900 mb-1">
        Choose your scale of operations
      </h1>
      <p className="text-[13px] text-gray-500 text-center mb-4 max-w-lg mx-auto leading-relaxed">
        Every plan includes the full diagnostic workflow. Pick the tier that matches your lab&apos;s volume — upgrade anytime.
      </p>

      {/* Billing Toggle */}
      {onBillingCycleChange && (
        <div className="flex justify-center mb-5">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {(['monthly', 'annual'] as const).map(c => (
              <button key={c} onClick={() => onBillingCycleChange(c)}
                className={`px-5 py-2 rounded-lg text-xs font-medium transition-all ${
                  billingCycle === c ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'
                }`}>
                {c === 'monthly' ? 'Monthly billing' : <>Annual billing <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">SAVE 17%</span></>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isSelected = value === plan.key;
          const isPop = plan.badge === 'Most popular';
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const caps = [plan.volume, plan.staff, plan.branches, plan.wa, plan.sms, plan.storage];

          return (
            <div key={plan.key} onClick={() => onChange(plan.key)}
              className={`rounded-2xl border cursor-pointer transition-all overflow-hidden ${
                isSelected ? 'border-2 border-[#0D7C66] shadow-md' : isPop ? 'border-[#0D7C66]/30 border' : 'border-gray-200'
              } bg-white`}>

              {/* Badge */}
              {plan.badge && (
                <div className={`text-[10px] font-semibold text-center py-1.5 tracking-wide uppercase text-white ${
                  isPop ? 'bg-[#0D7C66]' : 'bg-slate-800'
                }`}>{plan.badge}</div>
              )}

              {/* Header */}
              <div className="px-4 pt-4">
                <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="px-4 pt-3">
                {price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0D7C66]">₹{price.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] text-gray-400">/month</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-slate-800">Custom pricing</span>
                )}
                {billingCycle === 'annual' && price && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    Billed ₹{(price * 12).toLocaleString('en-IN')}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="px-4 pt-3">
                <button className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-all border ${
                  isSelected
                    ? 'bg-[#0D7C66] text-white border-[#0D7C66]'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}>
                  {plan.key === 'enterprise' ? 'Contact sales →' : isSelected ? 'Selected ✓' : 'Select plan →'}
                </button>
              </div>

              {/* Capacity Pills */}
              <div className="px-4 pt-3 flex flex-wrap gap-1">
                {caps.map((c, i) => (
                  <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                    {c}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-4 mt-3" />

              {/* Feature Categories */}
              <div className="px-4 pt-2 pb-3">
                {Object.entries(plan.features).map(([category, feats]) => {
                  const catKey = `${plan.key}-${category}`;
                  const isOpen = expandedCats[catKey] !== false;
                  const inc = feats.filter(f => f.included).length;

                  return (
                    <div key={category} className="mb-1">
                      <button onClick={(e) => { e.stopPropagation(); toggleCat(catKey); }}
                        className="flex items-center justify-between w-full py-1.5 border-none bg-transparent cursor-pointer">
                        <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">{category}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[#0D7C66] font-semibold">{inc}/{feats.length}</span>
                          <svg width="10" height="10" viewBox="0 0 10 10"
                            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            <path d="M2.5 3.75l2.5 2.5 2.5-2.5" stroke="#94A3B8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="flex flex-col gap-1 pb-1">
                          {feats.map((f, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              {f.included ? <CheckIcon /> : <XMark />}
                              <span className={`text-[11px] leading-snug ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
                                {f.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gateway Note */}
      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed text-center">
        <strong>Payment gateway charges:</strong> Razorpay fee (2.36%) added separately and collected from tenant. HospiBot receives the full plan amount. GST @18% applies.
      </div>
    </div>
  );
}
