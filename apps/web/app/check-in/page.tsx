'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Search, Loader2, Phone, User, Calendar, ArrowRight } from 'lucide-react';

function SelfCheckInPageInner() {
  const params = useSearchParams();
  const [phone, setPhone]       = useState('');
  const [searching, setSearching] = useState(false);
  const [appointments, setAppts] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedAppt, setChecked] = useState<any>(null);
  const [error, setError]       = useState('');

  const search = async () => {
    if (!phone.trim()) return;
    setSearching(true); setError(''); setAppts([]);
    try {
      const today = new Date().toISOString().split('T')[0];
      const pat = await api.get('/patients', { params: { search: phone, limit: 1 } });
      if (!pat.data.data?.[0]) { setError('No patient found with this phone number. Please speak to reception.'); return; }
      const patId = pat.data.data[0].id;
      const appts = await api.get('/appointments', { params: { patientId: patId, date: today, limit: 5 } });
      const todayAppts = appts.data.data?.filter((a: any) => ['PENDING','CONFIRMED'].includes(a.status)) ?? [];
      if (todayAppts.length === 0) {
        setError("You don't have any appointments today. Please check with reception.");
        return;
      }
      setAppts(todayAppts);
    } catch { setError('Something went wrong. Please try again or speak to reception.'); }
    finally { setSearching(false); }
  };

  const checkIn = async (appt: any) => {
    try {
      await api.put(`/appointments/${appt.id}/status`, { status: 'CHECKED_IN' });
      setCheckedIn(true);
      setChecked(appt);
    } catch { setError('Check-in failed. Please speak to reception.'); }
  };

  if (checkedIn && checkedAppt) {
    const patient = checkedAppt.patient;
    const doctor = checkedAppt.doctor;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-[#0D7C66] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0D7C66]/30">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Check-In Successful!</h1>
          <p className="text-slate-500 mb-8">Please take a seat. You will be called shortly.</p>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Patient</span>
              <span className="font-bold text-slate-900">{patient?.firstName} {patient?.lastName || ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Doctor</span>
              <span className="font-semibold text-slate-700">{doctor ? `Dr. ${doctor.user?.firstName} ${doctor.user?.lastName || ''}` : '—'}</span>
            </div>
            {checkedAppt.department && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-600">{checkedAppt.department.name}</span>
              </div>
            )}
          </div>
          <button onClick={() => { setCheckedIn(false); setAppts([]); setPhone(''); }}
            className="text-sm text-[#0D7C66] hover:underline">
            Check in another patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#0D7C66] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0D7C66]/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Self Check-In</h1>
          <p className="text-slate-500 mt-1 text-sm">Enter your registered phone number</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              <Phone className="w-3.5 h-3.5 inline mr-1" />Phone Number
            </label>
            <input
              type="tel"
              className="w-full text-xl font-bold px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-[#0D7C66] outline-none transition-all text-center tracking-widest"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              autoFocus
            />
          </div>

          <button onClick={search} disabled={searching || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#0D7C66] text-white text-lg font-bold py-4 rounded-2xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors shadow-lg shadow-[#0D7C66]/20">
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {searching ? 'Searching…' : 'Find My Appointment'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}
        </div>

        {appointments.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Today's Appointments</p>
            {appointments.map((a: any) => (
              <button key={a.id} onClick={() => checkIn(a)}
                className="w-full bg-white rounded-3xl border-2 border-slate-200 hover:border-[#0D7C66] p-5 text-left transition-all group hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{a.doctor ? `Dr. ${a.doctor.user?.firstName} ${a.doctor.user?.lastName || ''}` : 'Doctor'}</p>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {a.department?.name && ` · ${a.department.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{a.status}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D7C66] transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-300">Powered by HospiBot · hospibot.in</p>
      </div>
    </div>
  );
}

export default function SelfCheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#0D7C66] border-t-transparent rounded-full" /></div>}>
      <SelfCheckInPageInner />
    </Suspense>
  );
}
