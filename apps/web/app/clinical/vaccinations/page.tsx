'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Plus, RefreshCw, Search, X, Loader2,
  CheckCircle2, Clock, AlertTriangle, Download,
  ChevronLeft, ChevronRight, User, Calendar,
} from 'lucide-react';

const VACCINE_SCHEDULES = [
  { name: 'BCG',               dueAt: 0,    description: 'At birth - tuberculosis protection' },
  { name: 'OPV-0 (Polio)',     dueAt: 0,    description: 'At birth - oral polio vaccine' },
  { name: 'Hepatitis B (1st)', dueAt: 0,    description: 'At birth' },
  { name: 'DPT-1',             dueAt: 42,   description: '6 weeks - diphtheria, pertussis, tetanus' },
  { name: 'OPV-1',             dueAt: 42,   description: '6 weeks - oral polio' },
  { name: 'Hib-1',             dueAt: 42,   description: '6 weeks - Haemophilus influenzae b' },
  { name: 'Rotavirus-1',       dueAt: 42,   description: '6 weeks' },
  { name: 'PCV-1',             dueAt: 42,   description: '6 weeks - pneumococcal' },
  { name: 'DPT-2',             dueAt: 70,   description: '10 weeks' },
  { name: 'OPV-2',             dueAt: 70,   description: '10 weeks' },
  { name: 'DPT-3',             dueAt: 98,   description: '14 weeks' },
  { name: 'OPV-3',             dueAt: 98,   description: '14 weeks' },
  { name: 'IPV',               dueAt: 98,   description: '14 weeks - inactivated polio' },
  { name: 'Measles-1 / MR',    dueAt: 270,  description: '9 months' },
  { name: 'JE-1',              dueAt: 270,  description: '9 months - Japanese encephalitis' },
  { name: 'Vitamin A (1st)',    dueAt: 270,  description: '9 months' },
  { name: 'MMR-1',             dueAt: 365,  description: '12 months - measles, mumps, rubella' },
  { name: 'Hepatitis A-1',     dueAt: 365,  description: '12 months' },
  { name: 'DPT Booster-1',     dueAt: 548,  description: '18 months' },
  { name: 'MMR-2',             dueAt: 548,  description: '18 months' },
  { name: 'DPT Booster-2',     dueAt: 1825, description: '5 years' },
  { name: 'OPV Booster',       dueAt: 1825, description: '5 years' },
  { name: 'Tdap / TT',         dueAt: 3650, description: '10 years - tetanus booster' },
  { name: 'HPV-1',             dueAt: 3285, description: '9 years girls - cervical cancer prevention' },
  { name: 'HPV-2',             dueAt: 3467, description: '6 months after HPV-1' },
];

const ADULT_VACCINES = [
  'Influenza (Annual)', 'Hepatitis B (Adult)', 'Tdap Booster', 'Typhoid',
  'COVID-19', 'Pneumococcal (PCV13)', 'Shingles (Zoster)', 'Meningococcal',
  'Hepatitis A', 'Yellow Fever', 'Rabies (Pre-exposure)', 'Cholera',
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function VaccinationsPage() {
  const [patients,  setPatients]  = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any>(null);
  const [records,   setRecords]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({ vaccine: '', date: new Date().toISOString().slice(0,10), batch: '', site: 'Right arm', notes: '', nextDue: '', administeredBy: '' });

  useEffect(() => {
    if (search.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search, limit: 8 } })
        .then(r => setPatients(r.data.data ?? [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadRecords = useCallback(async (patient: any) => {
    setSelected(patient); setLoading(true);
    try {
      // Fetch from vault health records filtered by type VACCINATION
      const res = await api.get(`/vault/records/${patient.uhrId || patient.id}`, {
        params: { recordType: 'VACCINATION' }
      }).catch(() => ({ data: { records: [] } }));
      setRecords(res.data?.records ?? []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, []);

  const saveRecord = async () => {
    if (!selected || !form.vaccine || !form.date) { toast.error('Vaccine and date required'); return; }
    setSaving(true);
    try {
      await api.post(`/vault/records/${selected.uhrId || selected.id}`, {
        recordType: 'VACCINATION',
        title: form.vaccine,
        data: { vaccine: form.vaccine, date: form.date, batch: form.batch, site: form.site, administeredBy: form.administeredBy, nextDue: form.nextDue },
        notes: form.notes,
        recordDate: form.date,
      }).catch(async () => {
        // Fallback: store as a health record note
        await api.post('/visits', {
          patientId: selected.id,
          clinicalNotes: `VACCINATION: ${form.vaccine} | Batch: ${form.batch || 'N/A'} | Site: ${form.site} | Next due: ${form.nextDue || 'N/A'} | By: ${form.administeredBy || 'N/A'} | Notes: ${form.notes}`,
          type: 'VACCINATION',
        });
      });
      toast.success(`${form.vaccine} recorded successfully`);
      setShowAdd(false);
      setForm({ vaccine:'', date: new Date().toISOString().slice(0,10), batch:'', site:'Right arm', notes:'', nextDue:'', administeredBy:'' });
      loadRecords(selected);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // Compute due vaccines based on patient DOB
  const getDueVaccines = () => {
    if (!selected?.dateOfBirth) return [];
    const ageInDays = Math.floor((Date.now() - new Date(selected.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24));
    const administered = new Set(records.map((r: any) => r.title || r.data?.vaccine));
    return VACCINE_SCHEDULES
      .filter(v => v.dueAt <= ageInDays + 7 && !administered.has(v.name)) // due now or in next week
      .slice(0, 8);
  };

  const exportPDF = () => {
    if (!selected) return;
    const rows = records.map(r => `${r.recordDate?.slice(0,10) || formatDate(r.createdAt)} | ${r.title} | Batch: ${r.data?.batch||'—'} | ${r.data?.administeredBy||'—'}`).join('\n');
    const content = `VACCINATION RECORD\n${selected.firstName} ${selected.lastName||''}\nDOB: ${selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString('en-IN') : '—'}\nHealth ID: ${selected.healthId||'—'}\n\n${rows || 'No records'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `vaccination-${selected.firstName}-${selected.lastName||''}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Vaccination record exported');
  };

  const dueVaccines = getDueVaccines();
  const ageYears = selected?.dateOfBirth ? Math.floor((Date.now() - new Date(selected.dateOfBirth).getTime()) / (1000*60*60*24*365.25)) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0D7C66]" /> Vaccination Records
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">National immunization schedule tracking — pediatric &amp; adult</p>
        </div>
      </div>

      {/* Patient search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Search Patient</label>
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search by name, phone, or Health ID…"
              value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          {patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10">
              {patients.map(p => (
                <button key={p.id} onClick={() => { setSelected(p); setSearch(''); setPatients([]); loadRecords(p); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0 transition-colors">
                  <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName||''}</p>
                  <p className="text-xs text-slate-400">{p.phone} · DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN') : '—'} · {p.healthId||'No Health ID'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected patient */}
      {selected && (
        <>
          {/* Patient card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0D7C66] text-white text-lg font-bold flex items-center justify-center">
                {selected.firstName?.[0]}{selected.lastName?.[0]||''}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{selected.firstName} {selected.lastName||''}</p>
                <p className="text-sm text-slate-400">{ageYears !== null ? `${ageYears} years old` : ''} · {selected.gender||'—'} · {selected.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5">Health ID: {selected.healthId||'—'} · DOB: {selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString('en-IN') : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportPDF} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                <Plus className="w-4 h-4" /> Record Vaccine
              </button>
            </div>
          </div>

          {/* Due vaccines alert */}
          {dueVaccines.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">{dueVaccines.length} vaccine{dueVaccines.length>1?'s':''} due or overdue</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dueVaccines.map(v => (
                  <button key={v.name} onClick={() => { setForm(f=>({...f,vaccine:v.name})); setShowAdd(true); }}
                    className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-200 transition-colors">
                    + {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Records */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Vaccination History</h3>
              <button onClick={() => loadRecords(selected)} className="p-1.5 text-slate-400 hover:bg-white rounded-xl">
                <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
              </button>
            </div>
            {loading ? (
              <div className="p-5 space-y-2">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-12"/>)}</div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center">
                <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No vaccination records found</p>
                <button onClick={() => setShowAdd(true)} className="mt-3 text-sm font-semibold text-[#0D7C66] hover:underline">Record first vaccine →</button>
              </div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  {['Date','Vaccine','Batch #','Site','Given By','Next Due'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r:any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatDate(r.recordDate||r.createdAt)}</td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-slate-900">{r.title}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{r.data?.batch||'—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{r.data?.site||'—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{r.data?.administeredBy||'—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{r.data?.nextDue ? formatDate(r.data.nextDue) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Vaccine schedule reference */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">National Immunization Schedule Reference</h3>
            <div className="grid grid-cols-3 gap-2">
              {VACCINE_SCHEDULES.slice(0,12).map(v => {
                const administered = records.some((r:any) => r.title === v.name);
                return (
                  <div key={v.name} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs ${administered ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${administered ? 'text-emerald-500' : 'text-slate-200'}`} />
                    <div>
                      <p className={`font-semibold ${administered ? 'text-emerald-800' : 'text-slate-700'}`}>{v.name}</p>
                      <p className="text-slate-400">{v.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAdd && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Vaccination</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selected.firstName} {selected.lastName||''}</p>
              </div>
              <button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Vaccine *</label>
                <input className={inputCls} list="vaccine-list" placeholder="Select or type vaccine name…"
                  value={form.vaccine} onChange={e=>setForm(f=>({...f,vaccine:e.target.value}))} autoFocus />
                <datalist id="vaccine-list">
                  {[...VACCINE_SCHEDULES.map(v=>v.name), ...ADULT_VACCINES].map(v=><option key={v} value={v}/>)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Date Given *</label>
                <input type="date" className={inputCls} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Next Due Date</label>
                <input type="date" className={inputCls} value={form.nextDue} onChange={e=>setForm(f=>({...f,nextDue:e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Batch / Lot Number</label>
                <input className={inputCls} placeholder="A12345B" value={form.batch} onChange={e=>setForm(f=>({...f,batch:e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Site of Administration</label>
                <select className={inputCls} value={form.site} onChange={e=>setForm(f=>({...f,site:e.target.value}))}>
                  {['Right arm','Left arm','Right thigh','Left thigh','Oral','Intranasal','Subcutaneous'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Administered By</label>
                <input className={inputCls} placeholder="Dr. Name / Nurse Name" value={form.administeredBy} onChange={e=>setForm(f=>({...f,administeredBy:e.target.value}))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Adverse reactions, patient remarks…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={saveRecord} disabled={saving} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle2 className="w-4 h-4"/>} Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
