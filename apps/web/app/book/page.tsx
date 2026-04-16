'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, User, Phone, Stethoscope,
  CheckCircle2, Loader2, ArrowRight, ArrowLeft, Shield,
} from 'lucide-react';

type Step = 'doctor' | 'date' | 'slot' | 'details' | 'done';

const inputCls = 'w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400 shadow-sm';

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < current ? 'bg-[#0D7C66] text-white' :
            i === current ? 'bg-[#0D7C66] text-white ring-4 ring-[#0D7C66]/20' :
            'bg-slate-100 text-slate-400'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < current ? 'bg-[#0D7C66]' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function PublicBookingPageInner() {
  const params     = useSearchParams();
  const tenantSlug = params?.get('clinic') || '';

  const [step, setStep]           = useState<Step>('doctor');
  const [submitting, setSubmitting] = useState(false);
  const [tenant, setTenant]        = useState<any>(null);
  const [doctors, setDoctors]      = useState<any[]>([]);
  const [slots, setSlots]          = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingId, setBookingId]  = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedSlot, setSelectedSlot]     = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', notes: '',
  });

  // Date constraints
  const today    = new Date().toISOString().split('T')[0];
  const maxDate  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    // For public page, we need tenant resolution by slug
    // Using /tenants/by-slug/:slug endpoint or fallback to load all doctors
    api.get('/doctors', { params: { limit: 20, isAvailable: true } })
      .then(r => setDoctors(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    api.get(`/doctors/${selectedDoctor.id}/slots`, { params: { date: selectedDate } })
      .then(r => setSlots(r.data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor, selectedDate]);

  const submit = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone required'); return; }
    setSubmitting(true);
    try {
      // Find or create patient
      let patientId: string;
      const existing = await api.get('/patients', { params: { search: form.phone, limit: 1 } });
      if (existing.data.data?.[0]) {
        patientId = existing.data.data[0].id;
      } else {
        const newPat = await api.post('/patients', {
          firstName: form.firstName, lastName: form.lastName || undefined,
          phone: form.phone, email: form.email || undefined,
        });
        patientId = newPat.data.id;
      }

      // Book appointment
      const scheduledAt = `${selectedDate}T${selectedSlot}:00`;
      const appt = await api.post('/appointments', {
        patientId, doctorId: selectedDoctor.id,
        scheduledAt, notes: form.notes || undefined, type: 'SCHEDULED',
      });
      setBookingId(appt.data.id?.slice(0, 8).toUpperCase() || 'CONFIRMED');
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const STEPS = ['Doctor', 'Date', 'Slot', 'Details'];
  const stepIndex = { doctor: 0, date: 1, slot: 2, details: 3, done: 4 };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#E8F5F0] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-[#0D7C66]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-slate-500 mb-6">You'll receive a WhatsApp confirmation shortly.</p>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-4 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Booking ID</span>
              <span className="font-bold font-mono text-[#0D7C66]">{bookingId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Doctor</span>
              <span className="font-semibold text-slate-900">Dr. {selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName || ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-semibold text-slate-900">{selectedDate && formatDate(selectedDate)} · {selectedSlot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Patient</span>
              <span className="font-semibold text-slate-900">{form.firstName} {form.lastName}</span>
            </div>
          </div>

          <div className="bg-[#E8F5F0] rounded-2xl p-4 text-left space-y-2 mb-4">
            {['📱 WhatsApp confirmation sent to ' + form.phone, '📋 Show your booking ID at reception', '⏰ Please arrive 10 minutes early'].map((s, i) => (
              <p key={i} className="text-xs text-[#0A5E4F]">{s}</p>
            ))}
          </div>

          <p className="text-xs text-slate-400">Powered by <strong className="text-[#0D7C66]">HospiBot</strong></p>
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
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Book Appointment</p>
            <p className="text-xs text-slate-400">Powered by HospiBot</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <StepIndicator current={stepIndex[step]} steps={STEPS} />

        {/* Step 1: Select Doctor */}
        {step === 'doctor' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Choose Your Doctor</h2>
              <p className="text-slate-400 text-sm mt-1">Select who you'd like to consult</p>
            </div>
            {doctors.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((d: any) => {
                  const name = `Dr. ${d.user?.firstName} ${d.user?.lastName || ''}`.trim();
                  const isSelected = selectedDoctor?.id === d.id;
                  return (
                    <button key={d.id} onClick={() => { setSelectedDoctor(d); setStep('date'); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-200 bg-white hover:border-[#0D7C66]/40 hover:bg-[#E8F5F0]/30'
                      }`}>
                      <div className="w-12 h-12 rounded-2xl bg-[#0D7C66] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {d.user?.firstName?.[0]}{d.user?.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{name}</p>
                        {d.specialization && <p className="text-sm text-slate-500">{d.specialization}</p>}
                        {d.experience && <p className="text-xs text-slate-400">{d.experience} years experience</p>}
                      </div>
                      {d.consultationFee && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0D7C66]">₹{d.consultationFee / 100}</p>
                          <p className="text-[10px] text-slate-400">consult fee</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 'date' && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Select Date</h2>
              <p className="text-slate-400 text-sm mt-1">
                Dr. {selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
              <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Choose Appointment Date</label>
              <input type="date" min={today} max={maxDate} className={inputCls}
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              <p className="text-[10px] text-slate-400 mt-2">Available dates: today up to 30 days from now</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('doctor')} className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 flex-1 justify-center">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => selectedDate && setStep('slot')} disabled={!selectedDate}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-5 py-3 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-50 flex-1 justify-center">
                See Slots <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Slot */}
        {step === 'slot' && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Choose a Time Slot</h2>
              <p className="text-slate-400 text-sm mt-1">{selectedDate && formatDate(selectedDate)}</p>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 py-12 text-center">
                <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No slots available</p>
                <p className="text-slate-300 text-xs mt-1">Try a different date</p>
                <button onClick={() => setStep('date')} className="mt-4 text-[#0D7C66] text-sm font-semibold hover:underline">
                  ← Choose another date
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot: any) => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`py-3 text-sm font-bold rounded-2xl border-2 transition-all ${
                        selectedSlot === slot
                          ? 'border-[#0D7C66] bg-[#0D7C66] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#0D7C66] hover:text-[#0D7C66]'
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep('date')} className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => selectedSlot && setStep('details')} disabled={!selectedSlot}
                    className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-5 py-3 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-50 flex-1 justify-center">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Patient Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Your Details</h2>
              <p className="text-slate-400 text-sm mt-1">
                Dr. {selectedDoctor?.user?.firstName} · {selectedDate && formatDate(selectedDate)} · {selectedSlot}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">First Name *</label>
                  <input className={inputCls} placeholder="Ramesh" value={form.firstName}
                    onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Last Name</label>
                  <input className={inputCls} placeholder="Kumar" value={form.lastName}
                    onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number * (WhatsApp)</label>
                <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason for Visit</label>
                <input className={inputCls} placeholder="Fever, headache, follow-up…" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#E8F5F0] rounded-2xl px-4 py-3 border border-[#0D7C66]/20">
              <Shield className="w-4 h-4 text-[#0D7C66] flex-shrink-0" />
              <p className="text-xs text-[#0A5E4F]">Your data is secure and DPDPA compliant. WhatsApp confirmation will be sent.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('slot')} className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-5 py-3.5 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-60 shadow-lg shadow-[#0D7C66]/20">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking…</> : <><CheckCircle2 className="w-5 h-5" /> Confirm Appointment</>}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-300 mt-6 pb-4">Powered by HospiBot · hospibot.in</p>
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#0D7C66] border-t-transparent rounded-full" /></div>}>
      <PublicBookingPageInner />
    </Suspense>
  );
}
