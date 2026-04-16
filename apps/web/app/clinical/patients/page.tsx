'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, Plus, Filter, Phone, Mail, Calendar, Tag, ChevronLeft,
  ChevronRight, X, Users, HeartPulse, Loader2, Download, RefreshCw,
} from 'lucide-react';

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

function Skeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="animate-pulse bg-slate-200 rounded-lg h-4" />
        </td>
      ))}
    </tr>
  );
}

interface AddPatientForm {
  firstName: string; lastName: string; phone: string; email: string;
  gender: string; dateOfBirth: string; bloodGroup: string;
  address: string; city: string; state: string; pincode: string;
  allergies: string; chronicConditions: string;
  insuranceProvider: string; insurancePolicyNo: string;
}

const defaultForm: AddPatientForm = {
  firstName: '', lastName: '', phone: '', email: '', gender: '', dateOfBirth: '',
  bloodGroup: '', address: '', city: '', state: '', pincode: '',
  allergies: '', chronicConditions: '', insuranceProvider: '', insurancePolicyNo: '',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [meta, setMeta]         = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch]     = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]         = useState<AddPatientForm>(defaultForm);
  const [addStep, setAddStep]   = useState<1 | 2>(1);
  const [uhrLookup, setUhrLookup]     = useState<any>(null);
  const [uhrChecking, setUhrChecking] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [showFilters,  setShowFilters]  = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterBlood,  setFilterBlood]  = useState('');
  const [exporting,    setExporting]    = useState(false);

  const activeFilters = [filterGender, filterBlood].filter(Boolean).length;

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (debSearch)    params.search    = debSearch;
      if (filterGender) params.gender    = filterGender;
      if (filterBlood)  params.bloodGroup = filterBlood;
      const res = await api.get('/patients', { params });
      setPatients(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, [debSearch, filterGender, filterBlood]);

  useEffect(() => { load(1); }, [load]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      // Pull up to 5000 patients for export
      const res = await api.get('/patients', {
        params: {
          limit: 5000,
          search: debSearch || undefined,
          gender: filterGender || undefined,
          bloodGroup: filterBlood || undefined,
        },
      });
      const all: any[] = res.data.data ?? [];
      const header = ['Health ID','First Name','Last Name','Phone','Email','Gender','Blood Group','DOB','City','Registered On'];
      const rows = all.map((p: any) => [
        p.healthId ?? '', p.firstName ?? '', p.lastName ?? '', p.phone ?? '',
        p.email ?? '', p.gender ?? '', p.bloodGroup ?? '',
        p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        p.city ?? '',
        p.createdAt ? p.createdAt.slice(0, 10) : '',
      ]);
      const csv = [header, ...rows].map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} patients`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const setF = (k: keyof AddPatientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone are required'); return; }
    setSubmitting(true);
    try {
      await api.post('/patients', {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map((s: any) => s.trim()) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map((s: any) => s.trim()) : [],
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
      });
      toast.success('Patient registered successfully');
      setShowAdd(false);
      setForm(defaultForm);
      setAddStep(1);
      load(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const ageFromDOB = (dob: string) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${meta.total.toLocaleString('en-IN')} total patients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setShowAdd(true); setAddStep(1); }}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search by name, phone, Health ID…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 border text-sm px-3 py-2 rounded-xl transition-colors ${
              showFilters || activeFilters > 0
                ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Filter className="w-4 h-4" />
            Filter
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0D7C66] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Filter patients</p>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setFilterGender(''); setFilterBlood(''); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gender</label>
                <select
                  value={filterGender}
                  onChange={e => setFilterGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none cursor-pointer">
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Blood Group</label>
                <select
                  value={filterBlood}
                  onChange={e => setFilterBlood(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none cursor-pointer">
                  <option value="">All Blood Groups</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((bg: any) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Health ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Age / Gender</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Visit</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No patients found</p>
                  <p className="text-slate-300 text-xs mt-1">Add your first patient to get started</p>
                </td>
              </tr>
            ) : (
              patients.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  onClick={() => window.location.href = `/clinical/patients/${p.id}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {p.firstName?.[0]}{p.lastName?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#0D7C66] transition-colors">
                          {p.firstName} {p.lastName || ''}
                        </p>
                        {p.email && <p className="text-xs text-slate-400 truncate max-w-[160px]">{p.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono font-semibold text-[#0D7C66] bg-[#E8F5F0] px-2 py-0.5 rounded-lg">
                      {p.healthId || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{p.phone}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {p.dateOfBirth ? `${ageFromDOB(p.dateOfBirth)} yrs` : '—'}
                    {p.gender && <span className="text-slate-400 ml-1">· {p.gender}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {(p.tags || []).slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{tag}</span>
                      ))}
                      {p.chronicConditions?.length > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {p.chronicConditions[0]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
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

      {/* Add Patient Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register New Patient</h2>
                <p className="text-xs text-slate-400 mt-0.5">Step {addStep} of 2</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Step progress */}
              <div className="flex items-center gap-2 mb-6">
                {['Personal Info', 'Medical Info'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${addStep > i + 1 ? 'bg-[#0D7C66] text-white' : addStep === i + 1 ? 'border-2 border-[#0D7C66] text-[#0D7C66]' : 'bg-slate-200 text-slate-500'}`}>
                      {addStep > i + 1 ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${addStep === i + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                    {i < 1 && <div className="w-8 h-px bg-slate-200 mx-1" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Personal Info */}
              {addStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">First Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="Ramesh" value={form.firstName} onChange={setF('firstName')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Name</label>
                    <input className={inputCls} placeholder="Kumar" value={form.lastName} onChange={setF('lastName')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="+91 98765 43210" value={form.phone}
                      onChange={async e => {
                        setF('phone')(e);
                        const digits = e.target.value.replace(/\D/g,'').slice(-10);
                        if (digits.length === 10) {
                          setUhrChecking(true);
                          try {
                            const res = await api.get(`/vault/lookup?phone=${digits}`);
                            if (res.data?.found) {
                              setUhrLookup(res.data);
                              if (res.data.uhr) {
                                setForm(f => ({...f,
                                  firstName: f.firstName || res.data.uhr.firstName || '',
                                  lastName: f.lastName || res.data.uhr.lastName || '',
                                  bloodGroup: f.bloodGroup || res.data.uhr.bloodGroup || '',
                                  allergies: f.allergies || (res.data.uhr.allergies||[]).join(', '),
                                }));
                              }
                            } else { setUhrLookup(null); }
                          } catch { setUhrLookup(null); }
                          finally { setUhrChecking(false); }
                        }
                      }} />
                    {uhrChecking && <p className="text-xs text-[#0D7C66] mt-1 flex items-center gap-1">⟳ Checking Universal Health Vault…</p>}
                    {uhrLookup?.found && (
                      <div className="mt-2 bg-[#E8F5F0] border border-[#0D7C66]/30 rounded-xl px-3 py-2.5 flex items-start gap-2">
                        <span className="text-[#0D7C66] text-sm font-bold">✓</span>
                        <div>
                          <p className="text-xs font-bold text-[#0D7C66]">Found in Universal Health Vault</p>
                          <p className="text-xs text-slate-600 mt-0.5">Health ID: <strong>{uhrLookup.uhr?.hospibot_health_id}</strong> · Blood: {uhrLookup.uhr?.bloodGroup||'—'}</p>
                          {uhrLookup.consentStatus === 'GRANTED'
                            ? <p className="text-xs text-emerald-700 font-medium">✓ Consent granted — records pre-filled</p>
                            : <p className="text-xs text-amber-600 font-medium">Consent request will be sent via WhatsApp</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
                    <input className={inputCls} type="email" placeholder="ramesh@email.com" value={form.email} onChange={setF('email')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                    <input className={inputCls} type="date" value={form.dateOfBirth} onChange={setF('dateOfBirth')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gender</label>
                    <select className={inputCls} value={form.gender} onChange={setF('gender')}>
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((g: any) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Address</label>
                    <input className={inputCls} placeholder="Street, Area" value={form.address} onChange={setF('address')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
                    <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={setF('city')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
                    <input className={inputCls} placeholder="500001" value={form.pincode} onChange={setF('pincode')} />
                  </div>
                </div>
              )}

              {/* Step 2: Medical Info */}
              {addStep === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Blood Group</label>
                    <select className={inputCls} value={form.bloodGroup} onChange={setF('bloodGroup')}>
                      <option value="">Unknown</option>
                      {BLOOD_GROUPS.map((g: any) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Insurance Provider</label>
                    <input className={inputCls} placeholder="Star Health, ICICI Lombard…" value={form.insuranceProvider} onChange={setF('insuranceProvider')} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Insurance Policy Number</label>
                    <input className={inputCls} placeholder="Policy number" value={form.insurancePolicyNo} onChange={setF('insurancePolicyNo')} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Known Allergies <span className="text-slate-300 font-normal normal-case">(comma-separated)</span></label>
                    <input className={inputCls} placeholder="Penicillin, Sulfa drugs, Aspirin" value={form.allergies} onChange={setF('allergies')} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Chronic Conditions <span className="text-slate-300 font-normal normal-case">(comma-separated)</span></label>
                    <input className={inputCls} placeholder="Diabetes, Hypertension, Asthma" value={form.chronicConditions} onChange={setF('chronicConditions')} />
                  </div>

                  {/* Summary preview */}
                  {(form.firstName || form.phone) && (
                    <div className="col-span-2 bg-[#E8F5F0] rounded-xl p-4 border border-[#0D7C66]/20">
                      <p className="text-xs font-semibold text-[#0D7C66] mb-2">REGISTRATION SUMMARY</p>
                      <div className="text-sm text-slate-700 space-y-1">
                        <p><span className="text-slate-400">Name:</span> {form.firstName} {form.lastName}</p>
                        <p><span className="text-slate-400">Phone:</span> {form.phone}</p>
                        {form.dateOfBirth && <p><span className="text-slate-400">DOB:</span> {new Date(form.dateOfBirth).toLocaleDateString('en-IN')}</p>}
                        {form.bloodGroup && <p><span className="text-slate-400">Blood Group:</span> {form.bloodGroup}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => addStep === 1 ? setShowAdd(false) : setAddStep(1)}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                {addStep === 1 ? 'Cancel' : '← Back'}
              </button>
              {addStep === 1 ? (
                <button onClick={() => setAddStep(2)} disabled={!form.firstName || !form.phone}
                  className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Continue →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Registering…' : 'Register Patient'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
