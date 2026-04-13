'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Scissors, Plus, RefreshCw, Search, X, Loader2,
  Clock, User, CheckCircle2, AlertTriangle, ChevronLeft,
  ChevronRight, Calendar, Stethoscope, Activity,
} from 'lucide-react';

const OT_ROOMS = ['OT-1 (General)', 'OT-2 (Ortho)', 'OT-3 (Cardio)', 'OT-4 (Emergency)', 'OT-5 (Laparoscopy)'];
const SURGERY_TYPES = ['Appendectomy','Hernia Repair','Cholecystectomy','Caesarean Section','Knee Replacement','Hip Replacement','Cardiac Bypass','Cataract','Tonsillectomy','Thyroidectomy','Laparoscopy','Hysterectomy','Prostatectomy','Spinal Fusion','Gastric Bypass','Custom'];
const STATUS_CONFIG: Record<string,string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  PREP:        'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-red-100 text-red-700',
  POSTPONED:   'bg-slate-100 text-slate-600',
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function OperationTheatrePage() {
  const [cases,    setCases]    = useState<any[]>([]);
  const [doctors,  setDoctors]  = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0,10));
  const [patSearch, setPatSearch] = useState('');

  const [form, setForm] = useState({
    patientId:'', surgeryType:'', otRoom: OT_ROOMS[0],
    scheduledAt: `${new Date().toISOString().slice(0,10)}T09:00`,
    duration: 60, surgeon: '', anesthetist: '',
    scrubNurse: '', notes: '', preChecklistDone: false,
    anesthesiaType: 'General',
  });
  const set = (k:string) => (e:any) => setForm(f => ({...f,[k]: e.target?.value ?? e}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Store OT cases in automation logs table as a workaround, or use appointments with type=SURGERY
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments', { params: { type:'SURGERY', from: dateFilter, to: dateFilter, limit:50 } }),
        api.get('/doctors'),
      ]);
      setCases(apptRes.data.data ?? []);
      setDoctors(docRes.data.data ?? docRes.data ?? []);
    } catch { setCases([]); }
    finally { setLoading(false); }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 5 } })
        .then(r => setPatients(r.data.data ?? [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const createCase = async () => {
    if (!form.patientId || !form.surgeryType || !form.surgeon) { toast.error('Patient, surgery type, and surgeon required'); return; }
    setSaving(true);
    try {
      await api.post('/appointments', {
        patientId: form.patientId,
        scheduledAt: form.scheduledAt,
        type: 'SURGERY',
        notes: JSON.stringify({
          surgeryType: form.surgeryType, otRoom: form.otRoom,
          duration: form.duration, surgeon: form.surgeon,
          anesthetist: form.anesthetist, scrubNurse: form.scrubNurse,
          anesthesiaType: form.anesthesiaType, preChecklistDone: form.preChecklistDone,
          notes: form.notes,
        }),
      });
      toast.success('OT case scheduled');
      setShowNew(false);
      setForm({ patientId:'', surgeryType:'', otRoom:OT_ROOMS[0], scheduledAt:`${new Date().toISOString().slice(0,10)}T09:00`, duration:60, surgeon:'', anesthetist:'', scrubNurse:'', notes:'', preChecklistDone:false, anesthesiaType:'General' });
      load();
    } catch (e:any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id:string, status:string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success(`Case ${status.toLowerCase()}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = cases.filter(c =>
    !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase())
  );

  // Today's stats
  const scheduled   = cases.filter(c => c.status === 'SCHEDULED').length;
  const inProgress  = cases.filter(c => c.status === 'IN_PROGRESS').length;
  const completed   = cases.filter(c => c.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-[#0D7C66]" /> Operation Theatre
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${cases.length} cases on ${new Date(dateFilter).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none" />
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Schedule Case
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Scheduled', value: scheduled,  color:'#3B82F6' },
          { label:'In Progress',value: inProgress, color:'#8B5CF6' },
          { label:'Completed',  value: completed,  color:'#10B981' },
          { label:'Total Today',value: cases.length,color:'#0D7C66' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-3xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* OT Schedule */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Today's OT Schedule</h3>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Time','Patient','Surgery','OT Room','Surgeon','Anesthesia','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? Array.from({length:4}).map((_,i) => (
              <tr key={i}>{Array.from({length:8}).map((__,j) => <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <Scissors className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No OT cases scheduled</p>
                <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-semibold text-[#0D7C66] hover:underline">Schedule a case →</button>
              </td></tr>
            ) : filtered.map(c => {
              const meta = (() => { try { return JSON.parse(c.notes||'{}'); } catch { return {}; } })();
              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{formatTime(c.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{c.patient?.firstName} {c.patient?.lastName||''}</p>
                    <p className="text-xs text-slate-400">{c.patient?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{meta.surgeryType || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{meta.otRoom || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{meta.surgeon || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{meta.anesthesiaType||'—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[c.status]||'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {c.status === 'SCHEDULED' && (
                        <button onClick={() => updateStatus(c.id, 'IN_PROGRESS')} className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100">Start</button>
                      )}
                      {c.status === 'IN_PROGRESS' && (
                        <button onClick={() => updateStatus(c.id, 'COMPLETED')} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100">Complete</button>
                      )}
                      {!['COMPLETED','CANCELLED'].includes(c.status) && (
                        <button onClick={() => updateStatus(c.id, 'CANCELLED')} className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Case Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Schedule OT Case</h2>
              <button onClick={()=>setShowNew(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Patient *</label>
                {form.patientId ? (
                  <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-900">{patients.find(p=>p.id===form.patientId)?.firstName || 'Selected'}</span>
                    <button onClick={()=>setForm(f=>({...f,patientId:''}))}><X className="w-4 h-4 text-emerald-400"/></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient…" value={patSearch} onChange={e=>setPatSearch(e.target.value)} autoFocus />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10">
                        {patients.map(p => (
                          <button key={p.id} onClick={()=>{setForm(f=>({...f,patientId:p.id}));setPatSearch('');setPatients([]);}}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b last:border-0">
                            <p className="font-semibold">{p.firstName} {p.lastName||''}</p>
                            <p className="text-xs text-slate-400">{p.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Surgery Type *</label>
                <select className={inputCls} value={form.surgeryType} onChange={set('surgeryType')}>
                  <option value="">Select…</option>
                  {SURGERY_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">OT Room</label>
                <select className={inputCls} value={form.otRoom} onChange={set('otRoom')}>
                  {OT_ROOMS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Date & Time *</label>
                <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={set('scheduledAt')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Est. Duration (mins)</label>
                <input type="number" className={inputCls} value={form.duration} onChange={set('duration')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Surgeon *</label>
                <input className={inputCls} placeholder="Dr. Name" value={form.surgeon} onChange={set('surgeon')} list="surgeons-list" />
                <datalist id="surgeons-list">{doctors.map(d=><option key={d.id} value={`Dr. ${d.user?.firstName} ${d.user?.lastName||''}`}/>)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Anesthetist</label>
                <input className={inputCls} placeholder="Dr. Name" value={form.anesthetist} onChange={set('anesthetist')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Scrub Nurse</label>
                <input className={inputCls} placeholder="Nurse name" value={form.scrubNurse} onChange={set('scrubNurse')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Anesthesia Type</label>
                <select className={inputCls} value={form.anesthesiaType} onChange={set('anesthesiaType')}>
                  {['General','Spinal','Epidural','Local','Regional','Sedation'].map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Pre-Op Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Pre-operative instructions, allergies, special requirements…" value={form.notes} onChange={set('notes')} />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.preChecklistDone} onChange={e=>setForm(f=>({...f,preChecklistDone:e.target.checked}))} className="w-4 h-4 accent-[#0D7C66]" />
                  <span className="text-sm text-slate-700 font-medium">Pre-operative safety checklist completed (WHO Surgical Safety Checklist)</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowNew(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={createCase} disabled={saving} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Scissors className="w-4 h-4"/>} Schedule Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
