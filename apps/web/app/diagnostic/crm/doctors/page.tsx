'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, Search, X, Phone, Loader2, CheckCircle2, TrendingUp, Award } from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function DoctorModal({ doctor, onClose, onSaved }: { doctor?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: doctor?.name ?? '', mobile: doctor?.mobile ?? '',
    specialty: doctor?.specialty ?? '', clinicName: doctor?.clinicName ?? '',
    clinicAddress: doctor?.clinicAddress ?? '', mciNumber: doctor?.mciNumber ?? '',
    email: doctor?.email ?? '', incentiveRate: doctor?.incentiveRate?.toString() ?? '',
    notes: doctor?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.mobile) { toast.error('Name and mobile are required'); return; }
    setSaving(true);
    try {
      if (doctor?.id) {
        await api.put(`/diagnostic/crm/doctors/${doctor.id}`, form);
      } else {
        await api.post('/diagnostic/crm/doctors', { ...form, incentiveRate: form.incentiveRate ? +form.incentiveRate : undefined });
      }
      toast.success(doctor?.id ? 'Doctor updated' : 'Doctor added to CRM');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const SPECIALTIES = ['General Medicine', 'Cardiology', 'Endocrinology', 'Nephrology', 'Oncology', 'Obstetrics', 'Paediatrics', 'Orthopaedics', 'Neurology', 'Pulmonology', 'Other'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">{doctor?.id ? 'Edit Doctor' : 'Add Doctor to CRM'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Full Name *</label><input className={inputCls} placeholder="Dr. Priya Sharma" value={form.name} onChange={setF('name')} /></div>
          <div><label className={labelCls}>Mobile *</label><input className={inputCls} placeholder="9876543210" value={form.mobile} onChange={setF('mobile')} /></div>
          <div><label className={labelCls}>Specialty</label>
            <select className={inputCls} value={form.specialty} onChange={setF('specialty')}>
              <option value="">Select…</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>MCI Number</label><input className={inputCls} placeholder="MCI-12345" value={form.mciNumber} onChange={setF('mciNumber')} /></div>
          <div><label className={labelCls}>Clinic Name</label><input className={inputCls} placeholder="City Health Clinic" value={form.clinicName} onChange={setF('clinicName')} /></div>
          <div><label className={labelCls}>Email</label><input className={inputCls} placeholder="dr.priya@clinic.in" value={form.email} onChange={setF('email')} /></div>
          <div className="col-span-2"><label className={labelCls}>Clinic Address</label><input className={inputCls} placeholder="Banjara Hills, Hyderabad" value={form.clinicAddress} onChange={setF('clinicAddress')} /></div>
          <div><label className={labelCls}>Incentive Rate (₹ / referral)</label><input className={inputCls} type="number" placeholder="50" value={form.incentiveRate} onChange={setF('incentiveRate')} /></div>
          <div className="col-span-2"><label className={labelCls}>Notes</label><textarea className={inputCls} rows={2} placeholder="Notes about this doctor…" value={form.notes} onChange={setF('notes')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {doctor?.id ? 'Save Changes' : 'Add Doctor'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorCRMPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/crm/doctors', { params: search ? { search } : {} });
      setDoctors(res.data ?? []);
    } finally { setLoading(false); }
  }, [search, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const sendWhatsApp = async (doctor: any) => {
    try {
      await api.post('/diagnostic/orders', {}); // placeholder — in real impl send WA message to doctor
      toast.success(`WhatsApp sent to Dr. ${doctor.name}`);
    } catch { toast.error('WhatsApp failed'); }
  };

  const topReferrers = [...doctors].sort((a, b) => b.referralVolumeMtd - a.referralVolumeMtd).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Doctor CRM</h1>
          <p className="text-sm text-slate-500">{doctors.length} referring doctors</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: NAVY }}>
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Top referrers */}
      {topReferrers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900">Top Referrers This Month</h3>
          </div>
          <div className="space-y-3">
            {topReferrers.map((doc, i) => {
              const maxVol = topReferrers[0]?.referralVolumeMtd || 1;
              return (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">Dr. {doc.name}</p>
                      <p className="text-sm font-black text-[#1E3A5F] ml-2 flex-shrink-0">{doc.referralVolumeMtd}</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${doc.referralVolumeMtd / maxVol * 100}%`, background: NAVY }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by name, specialty, or mobile…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Doctor list */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No doctors in CRM</p>
          <p className="text-sm mt-1">Add referring doctors to track referrals and send engagement messages</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: NAVY }}>
                    {doc.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Dr. {doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.specialty ?? 'General'} {doc.clinicName ? `· ${doc.clinicName}` : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#1E3A5F]">{doc.referralVolumeMtd}</p>
                  <p className="text-[10px] text-slate-400">this month</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Phone className="w-3 h-3" />
                <span>{doc.mobile}</span>
                {doc.incentiveRate && <span className="ml-auto font-semibold text-[#0D7C66]">₹{doc.incentiveRate}/ref</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(doc)}
                  className="flex-1 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Edit
                </button>
                <a href={`https://wa.me/91${doc.mobile.slice(-10)}`} target="_blank" rel="noreferrer"
                  className="flex-1 py-2 text-xs font-bold text-white rounded-xl text-center hover:opacity-90 transition-opacity"
                  style={{ background: '#25D366' }}>
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <DoctorModal
          doctor={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
