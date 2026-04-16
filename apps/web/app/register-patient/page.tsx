'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User, Phone, Mail, Calendar, MapPin, Heart,
  CheckCircle2, Loader2, Shield, ArrowRight,
} from 'lucide-react';

const inputCls = 'w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400 shadow-sm';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

function PatientSelfRegistrationPageInner() {
  const params = useSearchParams();
  const tenantSlug = params?.get('clinic') || '';

  const [step, setStep]       = useState<'form' | 'done'>('form');
  const [submitting, setSub]  = useState(false);
  const [healthId, setHealthId] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    dateOfBirth: '', gender: 'MALE', bloodGroup: '',
    address: '', city: '', pincode: '',
    allergies: '', emergencyName: '', emergencyPhone: '',
    consent: false,
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone are required'); return; }
    if (!form.consent) { toast.error('Please accept the consent'); return; }
    if (!/^[+]?[\d\s-]{10,}$/.test(form.phone)) { toast.error('Enter a valid phone number'); return; }

    setSub(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim() || undefined,
        phone:     form.phone.trim(),
        email:     form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender:    form.gender,
        bloodGroup: form.bloodGroup || undefined,
        address:   form.address.trim() || undefined,
        city:      form.city.trim() || undefined,
        pincode:   form.pincode.trim() || undefined,
        allergies: form.allergies ? form.allergies.split(',').map((a: any) => a.trim()).filter(Boolean) : [],
        emergencyContact: form.emergencyName ? { name: form.emergencyName, phone: form.emergencyPhone } : undefined,
      };

      const res = await api.post('/patients', payload);
      setHealthId(res.data.healthId || res.data.id?.slice(0, 8).toUpperCase());
      setStep('done');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('duplicate') || msg?.includes('already')) {
        toast.error('This phone number is already registered. Please check with reception.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally { setSub(false); }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#E8F5F0] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-[#0D7C66]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Complete!</h1>
          <p className="text-slate-500 mb-6 text-sm">Welcome to HospiBot. Your health record has been created.</p>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Your Health ID</p>
            <p className="text-4xl font-black text-[#0D7C66] tracking-wider font-mono">{healthId}</p>
            <p className="text-xs text-slate-400 mt-2">Show this to reception or use it at future visits</p>
          </div>

          <div className="bg-[#E8F5F0] rounded-2xl p-4 text-left space-y-2.5 mb-6">
            {[
              '📋 Please proceed to reception with your Health ID',
              '📱 You will receive a WhatsApp confirmation shortly',
              '🔒 Your data is secure and DPDPA compliant',
            ].map((item, i) => (
              <p key={i} className="text-sm text-[#0A5E4F]">{item}</p>
            ))}
          </div>

          <p className="text-xs text-slate-400">Powered by HospiBot · hospibot.in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0D7C66] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Patient Registration</p>
            <p className="text-xs text-slate-400">Powered by HospiBot</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-[#E8F5F0] rounded-2xl px-4 py-3 border border-[#0D7C66]/20 flex items-start gap-2">
          <Shield className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#0A5E4F]">Your information is encrypted and protected under India's DPDPA. We will never share it without your consent.</p>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="font-semibold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-[#0D7C66]" /> Personal Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">First Name *</label>
              <input className={inputCls} placeholder="Ramesh" value={form.firstName} onChange={f('firstName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Last Name</label>
              <input className={inputCls} placeholder="Kumar" value={form.lastName} onChange={f('lastName')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date of Birth</label>
            <input type="date" className={inputCls} value={form.dateOfBirth} onChange={f('dateOfBirth')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gender</label>
            <div className="flex gap-2">
              {['MALE', 'FEMALE', 'OTHER'].map((g: any) => (
                <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${form.gender === g ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Blood Group</label>
            <select className={inputCls} value={form.bloodGroup} onChange={f('bloodGroup')}>
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((b: any) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="font-semibold text-slate-900 flex items-center gap-2"><Phone className="w-4 h-4 text-[#0D7C66]" /> Contact Information</p>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number *</label>
            <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={f('phone')} />
            <p className="text-[10px] text-slate-400 mt-1">WhatsApp confirmation will be sent to this number</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
            <input type="email" className={inputCls} placeholder="you@email.com" value={form.email} onChange={f('email')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address</label>
            <input className={inputCls} placeholder="Street, Area, Landmark" value={form.address} onChange={f('address')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">City</label>
              <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={f('city')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pincode</label>
              <input className={inputCls} placeholder="500001" value={form.pincode} onChange={f('pincode')} />
            </div>
          </div>
        </div>

        {/* Medical */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="font-semibold text-slate-900 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Medical Information</p>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Known Allergies</label>
            <input className={inputCls} placeholder="Penicillin, Aspirin, Sulfa (comma separated)" value={form.allergies} onChange={f('allergies')} />
          </div>
        </div>

        {/* Emergency contact */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="font-semibold text-slate-900">Emergency Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name</label>
              <input className={inputCls} placeholder="Family member name" value={form.emergencyName} onChange={f('emergencyName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
              <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.emergencyPhone} onChange={f('emergencyPhone')} />
            </div>
          </div>
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
          <input type="checkbox" checked={form.consent} onChange={e => setForm(p => ({ ...p, consent: e.target.checked }))}
            className="mt-0.5 w-4 h-4 accent-[#0D7C66] cursor-pointer" />
          <div>
            <p className="text-sm font-medium text-slate-900">I consent to registration *</p>
            <p className="text-xs text-slate-400 mt-0.5">
              I agree to have my health information stored and processed by this facility
              in accordance with applicable health regulations and India's DPDPA.
              I can withdraw consent at any time.
            </p>
          </div>
        </label>

        <button onClick={submit} disabled={submitting}
          className="w-full bg-[#0D7C66] text-white font-bold py-4 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0D7C66]/20 text-base">
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering…</>
            : <><Shield className="w-5 h-5" /> Complete Registration <ArrowRight className="w-5 h-5" /></>
          }
        </button>

        <p className="text-center text-xs text-slate-400 pb-4">
          Already registered? Please proceed to the reception counter
          <br />Powered by <strong className="text-[#0D7C66]">HospiBot</strong> · hospibot.in
        </p>
      </div>
    </div>
  );
}

export default function PatientSelfRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#0D7C66] border-t-transparent rounded-full" /></div>}>
      <PatientSelfRegistrationPageInner />
    </Suspense>
  );
}
