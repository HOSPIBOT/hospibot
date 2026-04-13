'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Loader2, User, Phone, Mail, Clock,
  Calendar, Award, Stethoscope, Star, CheckCircle2,
} from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
               '12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

export default function DoctorProfilePage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const router     = useRouter();
  const [doctor, setDoctor]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<'profile'|'availability'|'stats'>('profile');

  // Editable profile state
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    specialization: '', department: '', qualification: '',
    experience: '', regNumber: '', bio: '', consultationFee: '',
  });

  // Availability: {Monday: {start:'09:00', end:'17:00', isAvailable: true}, ...}
  const [avail, setAvail] = useState<Record<string, { start: string; end: string; isAvailable: boolean }>>(
    DAYS.reduce((acc, d) => ({
      ...acc,
      [d]: { start: '09:00', end: '17:00', isAvailable: d !== 'Sunday' },
    }), {} as any)
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/doctors/${id}`);
      const doc = res.data;
      setDoctor(doc);
      setForm({
        firstName:       doc.user?.firstName || '',
        lastName:        doc.user?.lastName || '',
        phone:           doc.user?.phone || '',
        email:           doc.user?.email || '',
        specialization:  doc.specialization || '',
        department:      doc.department?.name || '',
        qualification:   doc.qualification || '',
        experience:      doc.experience?.toString() || '',
        regNumber:       doc.regNumber || '',
        bio:             doc.bio || '',
        consultationFee: doc.consultationFee ? (doc.consultationFee / 100).toString() : '',
      });
      if (doc.availability) setAvail(doc.availability);
    } catch { toast.error('Failed to load doctor profile'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch(`/doctors/${id}`, {
        specialization: form.specialization,
        qualification:  form.qualification,
        experience:     form.experience ? Number(form.experience) : undefined,
        regNumber:      form.regNumber,
        bio:            form.bio,
        consultationFee: form.consultationFee ? Math.round(Number(form.consultationFee) * 100) : undefined,
        availability:   avail,
      });
      toast.success('Profile updated!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" /></div>;
  }
  if (!doctor) {
    return <div className="text-center py-20 text-slate-400">Doctor not found</div>;
  }

  const drName = `Dr. ${form.firstName} ${form.lastName}`.trim();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xl font-bold">
            {form.firstName?.[0]}{form.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{drName}</h1>
            <p className="text-sm text-slate-500">{form.specialization || 'Doctor'}{form.department ? ` · ${form.department}` : ''}</p>
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'profile'      as const, label: 'Profile',      icon: User },
          { key: 'availability' as const, label: 'Availability', icon: Clock },
          { key: 'stats'        as const, label: 'Performance',  icon: Star },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-[#0D7C66]" /> Personal Info</h3>
            {[
              { k: 'firstName',   l: 'First Name',     readOnly: true  },
              { k: 'lastName',    l: 'Last Name',      readOnly: true  },
              { k: 'phone',       l: 'Phone',          readOnly: true  },
              { k: 'email',       l: 'Email',          readOnly: true  },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
                <input className={`${inputCls} ${f.readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  readOnly={f.readOnly} value={(form as any)[f.k]}
                  onChange={e => !f.readOnly && setForm(p => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}
            {doctor.user?.role && (
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-500">
                Role: <strong>{doctor.user.role}</strong> · System account managed by Admin
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#0D7C66]" /> Clinical Details</h3>
              {[
                { k: 'specialization', l: 'Specialization',   placeholder: 'Cardiology' },
                { k: 'qualification',  l: 'Qualification',    placeholder: 'MBBS, MD (Medicine)' },
                { k: 'regNumber',      l: 'Registration No.', placeholder: 'MCI Reg Number' },
                { k: 'experience',     l: 'Experience (years)', placeholder: '12', type: 'number' },
                { k: 'consultationFee',l: 'Consultation Fee (₹)', placeholder: '500', type: 'number' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
                  <input type={f.type || 'text'} className={inputCls} placeholder={f.placeholder}
                    value={(form as any)[f.k]}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Bio / About</h3>
              <textarea className={`${inputCls} resize-none`} rows={3}
                placeholder="Brief professional bio shown to patients…"
                value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* Availability tab */}
      {tab === 'availability' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-[#0D7C66]" /> Weekly Schedule</h3>
            <p className="text-xs text-slate-400">Click toggle to enable/disable each day</p>
          </div>
          <div className="space-y-3">
            {DAYS.map(day => {
              const d = avail[day] || { start: '09:00', end: '17:00', isAvailable: false };
              return (
                <div key={day} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${d.isAvailable ? 'border-[#0D7C66]/20 bg-[#E8F5F0]/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="w-28 flex-shrink-0">
                    <p className={`text-sm font-semibold ${d.isAvailable ? 'text-slate-900' : 'text-slate-400'}`}>{day}</p>
                  </div>

                  {d.isAvailable ? (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Start</label>
                        <select className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none"
                          value={d.start} onChange={e => setAvail(p => ({ ...p, [day]: { ...d, start: e.target.value } }))}>
                          {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <span className="text-slate-300">—</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">End</label>
                        <select className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none"
                          value={d.end} onChange={e => setAvail(p => ({ ...p, [day]: { ...d, end: e.target.value } }))}>
                          {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <span className="text-xs text-slate-400">
                        ({(() => {
                          const [sh, sm] = d.start.split(':').map(Number);
                          const [eh, em] = d.end.split(':').map(Number);
                          const mins = (eh * 60 + em) - (sh * 60 + sm);
                          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                        })()})
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 flex-1">Day off</p>
                  )}

                  <button
                    onClick={() => setAvail(p => ({ ...p, [day]: { ...d, isAvailable: !d.isAvailable } }))}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${d.isAvailable ? 'bg-[#0D7C66]' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.isAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Appointments', value: doctor.totalAppointments || 0, icon: Calendar, color: '#0D7C66' },
            { label: 'Avg. Rating',        value: doctor.avgRating ? `${doctor.avgRating}/5` : 'N/A', icon: Star, color: '#F59E0B' },
            { label: 'Prescriptions',      value: doctor.prescriptionCount || 0, icon: Stethoscope, color: '#3B82F6' },
            { label: 'Experience (yrs)',   value: doctor.experience || form.experience || 0, icon: Award, color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}

          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Professional Profile</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { l: 'Specialization', v: doctor.specialization || form.specialization || '—' },
                { l: 'Qualification',  v: doctor.qualification || form.qualification || '—' },
                { l: 'Reg. Number',    v: doctor.regNumber || form.regNumber || '—' },
              ].map(f => (
                <div key={f.l}>
                  <p className="text-xs text-slate-400 mb-0.5">{f.l}</p>
                  <p className="font-semibold text-slate-900">{f.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
