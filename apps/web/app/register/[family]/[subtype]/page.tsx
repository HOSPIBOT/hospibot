'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSubType, type TenantSubType,
  FALLBACK_THEMES, PORTAL_LABELS,
} from '@/lib/portal/portal-types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry',
];

const PLANS = [
  {
    key: 'STARTER', name: 'Starter', price: '₹500', period: '/month',
    desc: 'Perfect for solo practitioners and small clinics',
    features: ['Up to 3 users', '1 branch', '1,000 WhatsApp messages/mo', 'Basic appointments & billing', 'Email support'],
    color: '#64748B',
  },
  {
    key: 'GROWTH', name: 'Growth', price: '₹1,200', period: '/month',
    desc: 'For growing clinics and diagnostic centers',
    features: ['Up to 15 users', '3 branches', '5,000 WhatsApp messages/mo', 'Full automation engine', 'Analytics dashboard', 'Priority support'],
    color: '#3B82F6',
    popular: true,
  },
  {
    key: 'ENTERPRISE', name: 'Enterprise', price: '₹4,500', period: '/month',
    desc: 'For hospitals, chains and large organizations',
    features: ['Unlimited users', 'Unlimited branches', 'Unlimited WhatsApp messages', 'Custom WhatsApp flows', 'Dedicated account manager', 'SLA 99.9% uptime', 'API access'],
    color: '#7C3AED',
  },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
      {children} {required && <span className="text-red-500 normal-case font-normal">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-current focus:ring-2 focus:ring-current/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60" />
  );
}

function Select({ value, onChange, children }: any) {
  return (
    <select value={value} onChange={onChange}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all cursor-pointer">
      {children}
    </select>
  );
}

export default function RegisterSubTypePage() {
  const familySlug = (useParams() as any)?.['family'] ?? ''; const subTypeSlug = (useParams() as any)?.['subtype'] ?? '';
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [subType, setSubType] = useState<TenantSubType | null>(null);
  const [step, setStep] = useState(3); // 3=details, 4=admin, 5=plan
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const theme = FALLBACK_THEMES[familySlug] || FALLBACK_THEMES.clinical;

  // Form state
  const [org, setOrg] = useState({
    name: '', slug: '', phone: '', email: '', website: '',
    address: '', city: '', state: 'Telangana', pincode: '', country: 'India',
    gstNumber: '', medRegNo: '', drugLicense: '', nablNo: '',
  });
  const [admin, setAdmin] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [plan, setPlan] = useState('GROWTH');

  useEffect(() => {
    getSubType(familySlug, subTypeSlug)
      .then(setSubType)
      .catch(() => { /* use fallback */ });
  }, [familySlug, subTypeSlug]);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 40);

  const setO = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setOrg(o => ({ ...o, [k]: e.target.value }));
  const setA = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdmin(a => ({ ...a, [k]: e.target.value }));

  const flags = subType?.regFields ?? {};
  const showMedReg    = flags.medRegNo !== false && ['clinical', 'diagnostic'].includes(familySlug);
  const showDrugLic   = flags.drugLicense !== false && ['pharmacy'].includes(familySlug);
  const showNabl      = flags.nablNo !== false && familySlug === 'diagnostic';
  const showGst       = true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        name: org.name, slug: org.slug, type: subTypeSlug.toUpperCase().replace(/-/g, '_'),
        phone: org.phone, email: org.email, website: org.website,
        address: org.address, city: org.city, state: org.state,
        country: org.country, pincode: org.pincode, gstNumber: org.gstNumber,
        adminFirstName: admin.firstName, adminLastName: admin.lastName,
        adminEmail: admin.email, adminPassword: admin.password,
        plan, portalFamily: familySlug, subTypeSlug,
        registrationDetails: { medRegNo: org.medRegNo, drugLicense: org.drugLicense, nablNo: org.nablNo },
      });
      setAuth(res.data.user, res.data.tenant, res.data.accessToken, res.data.refreshToken);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-xl border border-slate-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${theme.primaryColor}15` }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set! 🎉</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your {PORTAL_LABELS[familySlug] || 'HospiBot'} account is ready. Your 14-day free trial has started.
          </p>
          <button
            onClick={() => router.push(`/${familySlug}/dashboard`)}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: theme.primaryColor }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Choose Category', 'Select Type', 'Your Details', 'Admin Account', 'Pick a Plan'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image src="/hospibot-logo.png" alt="HospiBot" width={120} height={40} className="object-contain" />
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: theme.primaryLight, color: theme.primaryColor }}>
            {PORTAL_LABELS[familySlug]}
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i < step - 1 ? 'text-slate-600' : i === step - 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={i < step - 1 ? { background: theme.primaryColor, color: '#fff' }
                      : i === step - 1 ? { border: `2px solid ${theme.primaryColor}`, color: theme.primaryColor }
                      : { background: '#E2E8F0', color: '#94A3B8' }}>
                    {i < step - 1 ? '✓' : i + 1}
                  </span>
                  <span className="hidden md:block">{s}</span>
                </div>
                {i < 4 && <div className="w-5 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => step === 3 ? router.push(`/register/${familySlug}`) : setStep(s => s - 1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* ── Step 3: Organization Details ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: theme.primaryColor }}>3</span>
                <h2 className="text-xl font-bold text-slate-900">Tell us about your organization</h2>
              </div>
              {subType && <p className="text-sm text-slate-500 ml-8">Registering as: <strong>{subType.name}</strong></p>}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel required>Organization / Facility Name</FieldLabel>
                  <Input value={org.name} placeholder="e.g. Apollo Heart Clinic"
                    onChange={(e: any) => setOrg(o => ({ ...o, name: e.target.value, slug: autoSlug(e.target.value) }))} />
                </div>
                <div>
                  <FieldLabel required>URL Slug</FieldLabel>
                  <Input value={org.slug} placeholder="apollo-heart-clinic"
                    onChange={(e: any) => setOrg(o => ({ ...o, slug: e.target.value }))} />
                  <p className="text-xs text-slate-400 mt-1">hospibot.in/{org.slug || 'your-name'}</p>
                </div>
                <div>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <Input value={org.phone} placeholder="+91 98765 43210" onChange={setO('phone')} />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" value={org.email} placeholder="info@yourfacility.com" onChange={setO('email')} />
                </div>
                <div>
                  <FieldLabel>Website</FieldLabel>
                  <Input value={org.website} placeholder="www.yourfacility.com" onChange={setO('website')} />
                </div>
              </div>

              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide pt-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel>Street Address</FieldLabel>
                  <Input value={org.address} placeholder="Building, Street, Area" onChange={setO('address')} />
                </div>
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <Input value={org.city} placeholder="Hyderabad" onChange={setO('city')} />
                </div>
                <div>
                  <FieldLabel required>State</FieldLabel>
                  <Select value={org.state} onChange={setO('state')}>
                    {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Pincode</FieldLabel>
                  <Input value={org.pincode} placeholder="500033" onChange={setO('pincode')} />
                </div>
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <Select value={org.country} onChange={setO('country')}>
                    <option value="India">India</option>
                    <option value="UAE">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                  </Select>
                </div>
              </div>

              {(showGst || showMedReg || showDrugLic || showNabl) && (
                <>
                  <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide pt-2">Regulatory Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showGst && (
                      <div>
                        <FieldLabel>GST Number</FieldLabel>
                        <Input value={org.gstNumber} placeholder="29AAAAA0000A1Z5" onChange={setO('gstNumber')} />
                      </div>
                    )}
                    {showMedReg && (
                      <div>
                        <FieldLabel>Medical Registration Number</FieldLabel>
                        <Input value={org.medRegNo} placeholder="MCI/NMC Registration No." onChange={setO('medRegNo')} />
                      </div>
                    )}
                    {showDrugLic && (
                      <div>
                        <FieldLabel>Drug License Number</FieldLabel>
                        <Input value={org.drugLicense} placeholder="DL-XXXXXXXXXX" onChange={setO('drugLicense')} />
                      </div>
                    )}
                    {showNabl && (
                      <div>
                        <FieldLabel>NABL Accreditation Number</FieldLabel>
                        <Input value={org.nablNo} placeholder="MC-XXXX" onChange={setO('nablNo')} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(4)}
                disabled={!org.name || !org.slug || !org.phone || !org.city}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ background: theme.primaryColor }}>
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Admin Account ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: theme.primaryColor }}>4</span>
              <h2 className="text-xl font-bold text-slate-900">Create your admin account</h2>
            </div>
            <p className="text-sm text-slate-500 ml-8">This will be the primary administrator for {org.name}</p>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>First Name</FieldLabel>
                  <Input value={admin.firstName} placeholder="Ravi" onChange={setA('firstName')} />
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <Input value={admin.lastName} placeholder="Kumar" onChange={setA('lastName')} />
                </div>
              </div>
              <div>
                <FieldLabel required>Admin Email</FieldLabel>
                <Input type="email" value={admin.email} placeholder="admin@yourfacility.com" onChange={setA('email')} />
              </div>
              <div>
                <FieldLabel required>Password</FieldLabel>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={admin.password}
                    placeholder="Minimum 8 characters" onChange={setA('password')} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Use at least 8 characters including a number</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!admin.firstName || !admin.email || admin.password.length < 8}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ background: theme.primaryColor }}>
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Plan Selection ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: theme.primaryColor }}>5</span>
              <h2 className="text-xl font-bold text-slate-900">Choose your plan</h2>
            </div>
            <p className="text-sm text-slate-500 ml-8">Start with a 14-day free trial. No credit card required.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((p) => (
                <button key={p.key} onClick={() => setPlan(p.key)}
                  className={`relative text-left rounded-2xl border-2 p-5 transition-all ${plan === p.key ? 'shadow-lg scale-[1.02]' : 'border-slate-200 bg-white hover:shadow-md'}`}
                  style={plan === p.key ? { borderColor: theme.primaryColor, background: theme.primaryLight } : {}}>
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-3 py-1 rounded-full"
                      style={{ background: theme.primaryColor }}>MOST POPULAR</span>
                  )}
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: p.color }}>{p.key}</p>
                    <p className="text-xl font-bold text-slate-900">{p.price} <span className="text-sm font-normal text-slate-400">{p.period}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map((f: any) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              🎁 <strong>14-day free trial</strong> included. You'll only be charged after your trial ends. Cancel anytime.
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(4)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-all hover:opacity-90 shadow-lg"
                style={{ background: theme.primaryColor }}>
                {submitting ? 'Creating account...' : 'Start Free Trial →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
