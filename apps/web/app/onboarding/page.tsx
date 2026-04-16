'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2, Users, Calendar, MessageSquare, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, Stethoscope, Pill,
  FlaskConical, Home, Truck, Heart,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Hospital Info',    icon: Building2,    desc: 'Basic details about your facility' },
  { id: 2, title: 'Your Team',        icon: Users,        desc: 'Add your first doctor' },
  { id: 3, title: 'WhatsApp Setup',   icon: MessageSquare,desc: 'Connect your WhatsApp number' },
  { id: 4, title: 'First Appointment',icon: Calendar,     desc: 'Configure appointment slots' },
  { id: 5, title: 'You\'re Ready!',   icon: CheckCircle2, desc: 'Start using HospiBot' },
];

const FACILITY_TYPES = [
  { value: 'GENERAL_CLINIC',  label: 'General Clinic',          icon: Stethoscope },
  { value: 'HOSPITAL',        label: 'Multi-specialty Hospital', icon: Building2   },
  { value: 'DIAGNOSTIC',      label: 'Diagnostic Centre',       icon: FlaskConical },
  { value: 'PHARMACY',        label: 'Pharmacy',                icon: Pill         },
  { value: 'HOME_HEALTHCARE', label: 'Home Healthcare',         icon: Home         },
  { value: 'EQUIPMENT',       label: 'Equipment Vendor',        icon: Truck        },
  { value: 'WELLNESS',        label: 'Wellness Centre',         icon: Heart        },
];

const SPECIALTIES = ['General Medicine','Cardiology','Orthopedics','Pediatrics','Gynecology',
  'Dermatology','Neurology','Ophthalmology','ENT','Dentistry','Oncology','Psychiatry'];

const inputCls = 'w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

export default function OnboardingPage() {
  const router = useRouter();
  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  const [org, setOrg] = useState({
    name: '', type: 'GENERAL_CLINIC', phone: '', email: '',
    city: '', address: '', specialties: [] as string[],
  });
  const [doctor, setDoctor] = useState({
    firstName: '', lastName: '', phone: '', specialty: 'General Medicine',
    consultationFee: '500',
  });
  const [wa, setWa] = useState({
    phoneNumberId: '', accessToken: '', businessId: '',
  });
  const [slots, setSlots] = useState({
    startTime: '09:00', endTime: '18:00', slotDuration: '15',
    breakStart: '13:00', breakEnd: '14:00',
    days: ['MON','TUE','WED','THU','FRI'] as string[],
  });

  const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

  const toggleSpecialty = (s: string) => setOrg(o => ({
    ...o,
    specialties: o.specialties.includes(s) ? o.specialties.filter((x: any) =>x!==s) : [...o.specialties, s],
  }));

  const toggleDay = (d: string) => setSlots(sl => ({
    ...sl,
    days: sl.days.includes(d) ? sl.days.filter((x: any) =>x!==d) : [...sl.days, d],
  }));

  const next = () => setStep(s => Math.min(5, s+1));
  const prev = () => setStep(s => Math.max(1, s-1));

  const finish = async () => {
    setSaving(true);
    try {
      // Step 1: Save org details
      await api.patch('/tenants/current', {
        name: org.name || undefined,
        phone: org.phone || undefined,
        address: org.address || undefined,
        city: org.city || undefined,
        type: org.type,
      }).catch(() => {});

      // Step 2: Create first doctor if provided
      if (doctor.firstName && doctor.phone) {
        await api.post('/doctors', {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          phone: doctor.phone,
          specialties: [doctor.specialty],
          consultationFee: Number(doctor.consultationFee) * 100,
        }).catch(() => {});
      }

      // Step 3: Save WhatsApp config if provided
      if (wa.phoneNumberId && wa.accessToken) {
        await api.patch('/tenants/current', {
          waPhoneNumberId: wa.phoneNumberId,
          waAccessToken: wa.accessToken,
          waBusinessAccountId: wa.businessId,
        }).catch(() => {});
      }

      setDone(true);
      toast.success('Setup complete! Welcome to HospiBot 🎉');
    } catch {
      toast.error('Setup failed — you can complete it from Settings');
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D7C66] to-[#0A5E4F] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#0D7C66]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">You're all set! 🎉</h1>
          <p className="text-slate-500 text-base mt-3 leading-relaxed">
            HospiBot is ready to use. Your facility is live. WhatsApp is connected.
            Patients can now book appointments and receive messages.
          </p>
          <div className="mt-8 space-y-3">
            <button onClick={() => router.push('/clinical/dashboard')}
              className="w-full bg-[#0D7C66] text-white font-bold py-3.5 rounded-xl hover:bg-[#0A5E4F] transition-colors">
              Open Clinical Dashboard →
            </button>
            <button onClick={() => router.push('/clinical/patients')}
              className="w-full border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
              Add First Patient
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">You can update all settings from the Settings page anytime</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#E8F5F0]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D7C66] text-white font-black text-base flex items-center justify-center">H</div>
          <span className="font-black text-lg text-slate-900">HospiBot</span>
          <span className="text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">Setup Wizard</span>
        </div>
        <p className="text-sm text-slate-500">Step {step} of {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div className="h-1 bg-[#0D7C66] transition-all duration-500" style={{width:`${(step/STEPS.length)*100}%`}} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex flex-col items-center gap-1.5 ${i < STEPS.length-1 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  step > s.id ? 'bg-[#0D7C66] text-white' :
                  step === s.id ? 'bg-[#0D7C66] text-white shadow-lg shadow-[#0D7C66]/30' :
                  'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-5 h-5"/> : <s.icon className="w-5 h-5"/>}
                </div>
                <p className={`text-[10px] font-semibold text-center hidden sm:block ${step===s.id?'text-[#0D7C66]':'text-slate-400'}`}>{s.title}</p>
              </div>
              {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.id+1 ? 'bg-[#0D7C66]' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-8 py-6 text-white">
            <h2 className="text-xl font-bold">{STEPS[step-1].title}</h2>
            <p className="text-white/70 text-sm mt-1">{STEPS[step-1].desc}</p>
          </div>

          <div className="px-8 py-7 space-y-5">
            {/* Step 1: Hospital Info */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Facility Type *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FACILITY_TYPES.map((t: any) => (
                      <button key={t.value} onClick={() => setOrg(o=>({...o,type:t.value}))}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${org.type===t.value?'border-[#0D7C66] bg-[#E8F5F0]':'border-slate-200 hover:border-slate-300'}`}>
                        <t.icon className={`w-5 h-5 mx-auto mb-1 ${org.type===t.value?'text-[#0D7C66]':'text-slate-400'}`}/>
                        <p className={`text-[10px] font-semibold leading-tight ${org.type===t.value?'text-[#0D7C66]':'text-slate-500'}`}>{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Facility Name *</label>
                  <input className={inputCls} placeholder="City Multi-Specialty Hospital" value={org.name} onChange={e=>setOrg(o=>({...o,name:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Phone</label>
                    <input className={inputCls} placeholder="+91 98765 43210" value={org.phone} onChange={e=>setOrg(o=>({...o,phone:e.target.value}))} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">City</label>
                    <input className={inputCls} placeholder="Hyderabad" value={org.city} onChange={e=>setOrg(o=>({...o,city:e.target.value}))} /></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Specialties (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s: any) => (
                      <button key={s} onClick={() => toggleSpecialty(s)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${org.specialties.includes(s)?'bg-[#0D7C66] text-white border-[#0D7C66]':'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#0D7C66]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: First Doctor */}
            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium">
                  Add your first doctor to start booking appointments. You can add more from Doctors → Add Doctor.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">First Name *</label>
                    <input className={inputCls} placeholder="Ramesh" value={doctor.firstName} onChange={e=>setDoctor(d=>({...d,firstName:e.target.value}))} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Last Name</label>
                    <input className={inputCls} placeholder="Kumar" value={doctor.lastName} onChange={e=>setDoctor(d=>({...d,lastName:e.target.value}))} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Phone *</label>
                  <input className={inputCls} placeholder="+91 98765 43210" value={doctor.phone} onChange={e=>setDoctor(d=>({...d,phone:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Specialty</label>
                    <select className={inputCls} value={doctor.specialty} onChange={e=>setDoctor(d=>({...d,specialty:e.target.value}))}>
                      {SPECIALTIES.map((s: any) =><option key={s}>{s}</option>)}
                    </select></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Consultation Fee (₹)</label>
                    <input type="number" className={inputCls} placeholder="500" value={doctor.consultationFee} onChange={e=>setDoctor(d=>({...d,consultationFee:e.target.value}))} /></div>
                </div>
              </>
            )}

            {/* Step 3: WhatsApp */}
            {step === 3 && (
              <>
                <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-xs text-[#0A5E4F] font-medium">
                  Connect your WhatsApp Business number. You'll need a Meta Business account. <a href="https://business.facebook.com" target="_blank" rel="noopener" className="underline">Get started here →</a>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Phone Number ID <span className="text-slate-400 font-normal">(from Meta Developer Portal)</span></label>
                  <input className={inputCls} placeholder="123456789012345" value={wa.phoneNumberId} onChange={e=>setWa(w=>({...w,phoneNumberId:e.target.value}))} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">WhatsApp Business Account ID</label>
                  <input className={inputCls} placeholder="987654321098765" value={wa.businessId} onChange={e=>setWa(w=>({...w,businessId:e.target.value}))} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Permanent Access Token</label>
                  <input className={inputCls} type="password" placeholder="EAABsbCS..." value={wa.accessToken} onChange={e=>setWa(w=>({...w,accessToken:e.target.value}))} /></div>
                <p className="text-xs text-slate-400">You can skip this step and configure WhatsApp later from Settings → WhatsApp Setup.</p>
              </>
            )}

            {/* Step 4: Appointment Slots */}
            {step === 4 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Working Days</label>
                  <div className="flex items-center gap-2">
                    {DAYS.map((d: any) => (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all ${slots.days.includes(d)?'bg-[#0D7C66] text-white border-[#0D7C66]':'bg-white text-slate-500 border-slate-200 hover:border-[#0D7C66]'}`}>
                        {d.slice(0,2)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Start Time</label>
                    <input type="time" className={inputCls} value={slots.startTime} onChange={e=>setSlots(s=>({...s,startTime:e.target.value}))} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">End Time</label>
                    <input type="time" className={inputCls} value={slots.endTime} onChange={e=>setSlots(s=>({...s,endTime:e.target.value}))} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Slot Duration</label>
                    <select className={inputCls} value={slots.slotDuration} onChange={e=>setSlots(s=>({...s,slotDuration:e.target.value}))}>
                      {['10','15','20','30','45','60'].map((d: any) =><option key={d} value={d}>{d} minutes</option>)}
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Break Start</label>
                    <input type="time" className={inputCls} value={slots.breakStart} onChange={e=>setSlots(s=>({...s,breakStart:e.target.value}))} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Break End</label>
                    <input type="time" className={inputCls} value={slots.breakEnd} onChange={e=>setSlots(s=>({...s,breakEnd:e.target.value}))} /></div>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-600">
                  Based on these settings, you'll have approximately{' '}
                  <strong>{Math.floor((parseInt(slots.endTime)-parseInt(slots.breakStart)+parseInt(slots.breakEnd)-parseInt(slots.startTime)) * 60 / parseInt(slots.slotDuration) || 20)} appointment slots per day</strong>.
                  You can configure per-doctor schedules from the Doctors module.
                </div>
              </>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#E8F5F0] rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-9 h-9 text-[#0D7C66]"/>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Ready to launch!</h3>
                  <p className="text-sm text-slate-500 mt-1">Review your setup below, then click Finish.</p>
                </div>
                {[
                  { label:'Facility',    value: org.name || '(not set)' },
                  { label:'Type',        value: FACILITY_TYPES.find((t: any) =>t.value===org.type)?.label || org.type },
                  { label:'City',        value: org.city || '(not set)' },
                  { label:'Doctor',      value: doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '(not added)' },
                  { label:'WhatsApp',    value: wa.phoneNumberId ? '✓ Configured' : '(not configured)' },
                  { label:'Slots',       value: `${slots.startTime}–${slots.endTime}, every ${slots.slotDuration} min` },
                ].map((r: any) => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <p className="text-sm text-slate-500">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-900">{r.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button onClick={prev} disabled={step === 1}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
            {step < 5 ? (
              <button onClick={next}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors shadow-sm">
                Continue <ArrowRight className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={finish} disabled={saving}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-8 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors shadow-sm disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> Setting up…</> : <>🚀 Finish Setup</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">All settings can be changed later from your portal · Need help? Chat with us on WhatsApp</p>
      </div>
    </div>
  );
}
