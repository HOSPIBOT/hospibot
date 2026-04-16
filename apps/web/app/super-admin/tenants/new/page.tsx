'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const TENANT_TYPES = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic / Polyclinic' },
  { value: 'DOCTOR', label: 'Individual Doctor' },
  { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic Center' },
  { value: 'IVF_CENTER', label: 'IVF / Fertility Centre' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'HOME_HEALTHCARE', label: 'Home Healthcare' },
  { value: 'EQUIPMENT_VENDOR', label: 'Equipment Vendor' },
];

const PLANS = [
  { value: 'STARTER', label: 'Starter', price: '₹500/mo', desc: 'Up to 3 users, 1 branch' },
  { value: 'GROWTH', label: 'Growth', price: '₹1,200/mo', desc: 'Up to 15 users, 3 branches' },
  { value: 'ENTERPRISE', label: 'Enterprise', price: '₹4,500/mo', desc: 'Unlimited users & branches' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
];

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400";

export default function NewTenantPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    // Org
    name: '', slug: '', type: 'CLINIC', phone: '', email: '', website: '',
    // Address
    address: '', city: '', state: 'Telangana', pincode: '',
    // Admin
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '',
    // Plan
    plan: 'GROWTH',
    // WhatsApp
    waPhoneNumberId: '', waBusinessId: '', waAccessToken: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 40);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        slug: form.slug,
        type: form.type,
        phone: form.phone,
        city: form.city,
        state: form.state,
        country: 'India',
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Tenant Created!</h2>
        <p className="text-slate-500 text-sm mb-6">{form.name} has been added to the platform. Their admin login credentials have been set.</p>
        <div className="flex items-center gap-3 justify-center">
          <Link href="/super-admin/tenants">
            <button className="bg-[#0D7C66] text-white px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-[#0A5E4F] transition-colors">
              Back to Tenants
            </button>
          </Link>
          <button onClick={() => { setSuccess(false); setStep(1); setForm({ name: '', slug: '', type: 'CLINIC', phone: '', email: '', website: '', address: '', city: '', state: 'Telangana', pincode: '', adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '', plan: 'GROWTH', waPhoneNumberId: '', waBusinessId: '', waAccessToken: '' }); }}
            className="border border-slate-200 text-slate-700 px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/super-admin/tenants" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0D7C66] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Tenant</h1>
        <p className="text-sm text-slate-500 mt-0.5">Register a new hospital or clinic on the platform</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: 'Organization' },
          { n: 2, label: 'Admin User' },
          { n: 3, label: 'Plan & WhatsApp' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button onClick={() => step > s.n && setStep(s.n)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${step === s.n ? 'bg-[#0D7C66] text-white' : step > s.n ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-slate-200 text-slate-500'}`}>
              {step > s.n ? '✓' : s.n}
            </button>
            <span className={`text-xs font-medium ${step === s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
            {i < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        {/* Step 1: Organization */}
        {step === 1 && (
          <>
            <h3 className="font-semibold text-slate-900">Organization Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Organization Name" required>
                  <input className={inputClass} placeholder="e.g. Apollo Heart Clinic"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} />
                </Field>
              </div>
              <Field label="URL Slug" required>
                <input className={inputClass} placeholder="e.g. apollo-heart-clinic"
                  value={form.slug} onChange={set('slug')} />
              </Field>
              <Field label="Facility Type" required>
                <select className={inputClass} value={form.type} onChange={set('type')}>
                  {TENANT_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Phone" required>
                <input className={inputClass} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </Field>
              <Field label="Email">
                <input className={inputClass} type="email" placeholder="admin@clinic.com" value={form.email} onChange={set('email')} />
              </Field>
              <Field label="City" required>
                <input className={inputClass} placeholder="Hyderabad" value={form.city} onChange={set('city')} />
              </Field>
              <Field label="State" required>
                <select className={inputClass} value={form.state} onChange={set('state')}>
                  {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Address">
                <input className={inputClass} placeholder="Street, Area" value={form.address} onChange={set('address')} />
              </Field>
              <Field label="Pincode">
                <input className={inputClass} placeholder="500033" value={form.pincode} onChange={set('pincode')} />
              </Field>
            </div>
          </>
        )}

        {/* Step 2: Admin User */}
        {step === 2 && (
          <>
            <h3 className="font-semibold text-slate-900">Admin User Account</h3>
            <p className="text-sm text-slate-500">This person will be the Tenant Admin for {form.name || 'this organization'}.</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required>
                <input className={inputClass} placeholder="Ravi" value={form.adminFirstName} onChange={set('adminFirstName')} />
              </Field>
              <Field label="Last Name">
                <input className={inputClass} placeholder="Kumar" value={form.adminLastName} onChange={set('adminLastName')} />
              </Field>
              <div className="col-span-2">
                <Field label="Admin Email" required>
                  <input className={inputClass} type="email" placeholder="ravi@apolloclinic.com" value={form.adminEmail} onChange={set('adminEmail')} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Initial Password" required>
                  <input className={inputClass} type="password" placeholder="Set a strong password" value={form.adminPassword} onChange={set('adminPassword')} />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Plan & WhatsApp */}
        {step === 3 && (
          <>
            <h3 className="font-semibold text-slate-900">Plan Selection</h3>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((p) => (
                <button key={p.value} onClick={() => setForm(f => ({ ...f, plan: p.value }))}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${form.plan === p.value ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-sm font-bold text-slate-900">{p.label}</p>
                  <p className="text-xs text-[#0D7C66] font-semibold mt-0.5">{p.price}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">WhatsApp Business API <span className="text-xs text-slate-400 font-normal">(optional, can be configured later)</span></h3>
              <div className="space-y-3">
                <Field label="Phone Number ID">
                  <input className={inputClass} placeholder="Meta Phone Number ID" value={form.waPhoneNumberId} onChange={set('waPhoneNumberId')} />
                </Field>
                <Field label="WhatsApp Business ID">
                  <input className={inputClass} placeholder="Meta Business ID" value={form.waBusinessId} onChange={set('waBusinessId')} />
                </Field>
                <Field label="Access Token">
                  <input className={inputClass} placeholder="Meta Permanent Token" value={form.waAccessToken} onChange={set('waAccessToken')} />
                </Field>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => step > 1 && setStep(s => s - 1)}
          disabled={step === 1}
          className="text-sm text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Back
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="bg-[#0D7C66] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="bg-[#0D7C66] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        )}
      </div>
    </div>
  );
}
