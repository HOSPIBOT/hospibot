'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  FlaskConical, Phone, Mail, X, Loader2, CheckCircle2,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

function AddPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    gender: '', dateOfBirth: '', bloodGroup: '',
    allergies: '', chronicConditions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone are required'); return; }
    setSubmitting(true);
    try {
      await api.post('/patients', {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()) : [],
        dateOfBirth: form.dateOfBirth || undefined,
      });
      toast.success('Patient registered!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Register Patient</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">First Name <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Ramesh" value={form.firstName} onChange={set('firstName')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Name</label>
            <input className={inputCls} placeholder="Kumar" value={form.lastName} onChange={set('lastName')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input className={inputCls} type="email" placeholder="ramesh@email.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
            <input type="date" className={inputCls} value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gender</label>
            <select className={inputCls} value={form.gender} onChange={set('gender')}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Blood Group</label>
            <select className={inputCls} value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Allergies</label>
            <input className={inputCls} placeholder="comma-separated" value={form.allergies} onChange={set('allergies')} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Chronic Conditions</label>
            <input className={inputCls} placeholder="Diabetes, Hypertension…" value={form.chronicConditions} onChange={set('chronicConditions')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: '#1E3A5F' }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Register Patient
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosticPatientsPage() {
  const [patients, setPatients]     = useState<any[]>([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [showAdd, setShowAdd]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (debSearch) params.search = debSearch;
      const res = await api.get('/patients', { params });
      setPatients(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, [debSearch]);

  useEffect(() => { load(1); }, [load]);

  const ageFromDOB = (dob: string) =>
    Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${meta.total.toLocaleString('en-IN')} registered patients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: '#1E3A5F' }}>
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by name, phone, or Health ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Patient', 'Health ID', 'Contact', 'Age / Gender', 'Blood Group', 'Last Lab Order', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                ))}</tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No patients found</p>
                  <p className="text-slate-300 text-xs mt-1">Register your first patient to get started</p>
                </td>
              </tr>
            ) : patients.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                onClick={() => window.location.href = `/diagnostic/lab-orders?patientId=${p.id}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {p.firstName?.[0]}{p.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#1E3A5F] transition-colors">
                        {p.firstName} {p.lastName || ''}
                      </p>
                      {p.email && <p className="text-xs text-slate-400 truncate max-w-[160px]">{p.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {p.healthId ? (
                    <span className="text-xs font-mono font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded-lg">
                      {p.healthId}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">
                  {p.dateOfBirth ? `${ageFromDOB(p.dateOfBirth)} yrs` : '—'}
                  {p.gender && <span className="text-slate-400 ml-1">· {p.gender}</span>}
                </td>
                <td className="px-5 py-3.5">
                  {p.bloodGroup ? (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">{p.bloodGroup}</span>
                  ) : <span className="text-slate-300 text-xs">Unknown</span>}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">
                  {p.lastVisitAt ? formatDate(p.lastVisitAt) : 'No orders yet'}
                </td>
                <td className="px-5 py-3.5">
                  {p.chronicConditions?.length > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {p.chronicConditions[0]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onCreated={() => load(1)} />}
    </div>
  );
}
