'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BedDouble, Plus, RefreshCw, Search, X, Loader2,
  Users, AlertTriangle, CheckCircle2, Wrench,
  Home, Download, BarChart3, Filter,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  ICU:        '#EF4444', SEMI_ICU:  '#F97316',
  GENERAL:    '#3B82F6', PRIVATE:   '#8B5CF6',
  DELUXE:     '#EC4899', PEDIATRIC: '#14B8A6',
  MATERNITY:  '#F59E0B', ISOLATION: '#64748B',
};
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  AVAILABLE:    { label: 'Available',    bg: 'bg-emerald-50 border-emerald-200',  text: 'text-emerald-700', icon: CheckCircle2 },
  OCCUPIED:     { label: 'Occupied',     bg: 'bg-red-50 border-red-200',          text: 'text-red-700',     icon: Users         },
  RESERVED:     { label: 'Reserved',     bg: 'bg-amber-50 border-amber-200',      text: 'text-amber-700',   icon: AlertTriangle  },
  MAINTENANCE:  { label: 'Maintenance',  bg: 'bg-slate-100 border-slate-300',     text: 'text-slate-600',   icon: Wrench         },
  HOUSEKEEPING: { label: 'Cleaning',     bg: 'bg-purple-50 border-purple-200',    text: 'text-purple-700',  icon: Home           },
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

function AdmitModal({ bed, onClose, onDone }: { bed: any; onClose: () => void; onDone: () => void }) {
  const [patSearch, setPatSearch] = useState('');
  const [patients,  setPatients]  = useState<any[]>([]);
  const [selPat,    setSelPat]    = useState<any>(null);
  const [discharge, setDischarge] = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 6 } })
        .then(r => setPatients(r.data.data ?? [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const admit = async () => {
    if (!selPat) { toast.error('Select a patient'); return; }
    setSaving(true);
    try {
      await api.post(`/beds/${bed.id}/admit`, {
        patientId: selPat.id,
        expectedDischarge: discharge || undefined,
        notes: notes || undefined,
      });
      toast.success(`${selPat.firstName} admitted to Bed ${bed.number}`);
      onDone(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Admission failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admit Patient</h2>
            <p className="text-xs text-slate-400 mt-0.5">Bed {bed.number} · {bed.ward} · {bed.category.replace('_',' ')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient *</label>
            {selPat ? (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                <span className="text-sm font-semibold text-emerald-900">{selPat.firstName} {selPat.lastName || ''} · {selPat.phone}</span>
                <button onClick={() => setSelPat(null)}><X className="w-4 h-4 text-emerald-400" /></button>
              </div>
            ) : (
              <div className="relative">
                <input className={inputCls} placeholder="Search patient by name or phone…" value={patSearch} onChange={e => setPatSearch(e.target.value)} autoFocus />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {patients.map((p: any) => (
                      <button key={p.id} onClick={() => { setSelPat(p); setPatSearch(''); setPatients([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">
                        <p className="font-semibold text-slate-900">{p.firstName} {p.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{p.phone} · {p.healthId}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Expected Discharge</label>
            <input type="datetime-local" className={inputCls} value={discharge} onChange={e => setDischarge(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Diagnosis, special requirements…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={admit} disabled={saving} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Admit
          </button>
        </div>
      </div>
    </div>
  );
}

function DischargeModal({ bed, patient, onClose, onDone }: { bed: any; patient: any; onClose: () => void; onDone: () => void }) {
  const [summary, setSummary] = useState('');
  const [saving,  setSaving]  = useState(false);

  const discharge = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/beds/${bed.id}/discharge`, { dischargeSummary: summary });
      toast.success(`${patient?.firstName} discharged. LOS: ${res.data.lengthOfStay}`);
      onDone(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Discharge failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Discharge Patient</h2>
            <p className="text-xs text-slate-400 mt-0.5">{patient?.firstName} {patient?.lastName || ''} · Bed {bed.number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Discharge Summary</label>
          <textarea className={`${inputCls} resize-none`} rows={4}
            placeholder="Condition at discharge, medications, follow-up instructions…"
            value={summary} onChange={e => setSummary(e.target.value)} autoFocus />
          <p className="text-xs text-slate-400 mt-2">After discharge, bed will be queued for housekeeping (status → Cleaning)</p>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={discharge} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BedManagementPage() {
  const [beds,    setBeds]    = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [wards,   setWards]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [wardF,   setWardF]   = useState('');
  const [admitBed,    setAdmitBed]    = useState<any>(null);
  const [dischargeBed,setDischargeBed]= useState<any>(null);
  const [view,    setView]    = useState<'floor'|'list'>('floor');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ward:'', number:'', category:'GENERAL', dailyRate:'', notes:'' });
  const [addSaving, setAddSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bedsRes, statsRes, wardsRes] = await Promise.all([
        api.get('/beds', { params: { limit: 200, status: statusF || undefined, ward: wardF || undefined } }),
        api.get('/beds/dashboard'),
        api.get('/beds/wards'),
      ]);
      setBeds(bedsRes.data.data ?? []);
      setStats(statsRes.data);
      setWards(wardsRes.data ?? []);
    } catch { toast.error('Failed to load bed data'); }
    finally { setLoading(false); }
  }, [statusF, wardF]);

  useEffect(() => { load(); }, [load]);

  const markAvailable = async (bedId: string) => {
    try {
      await api.patch(`/beds/${bedId}/available`);
      toast.success('Bed marked available');
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = beds.filter((b: any) =>
    !search || `${b.number} ${b.ward} ${b.patient?.firstName || ''} ${b.patient?.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const createBed = async () => {
    if (!addForm.ward || !addForm.number) { toast.error('Ward and number required'); return; }
    setAddSaving(true);
    try {
      await api.post('/beds', { ...addForm, dailyRate: Number(addForm.dailyRate) * 100 || 0 });
      toast.success(`Bed ${addForm.number} created`);
      setShowAdd(false);
      setAddForm({ ward:'', number:'', category:'GENERAL', dailyRate:'', notes:'' });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setAddSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-[#0D7C66]" /> Bed Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${stats?.total ?? 0} beds · ${stats?.occupancyRate ?? 0}% occupied`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['floor','list'] as const).map((v: any) => (
              <button key={v} onClick={() => setView(v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${view===v?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                {v === 'floor' ? '🗺 Floor Map' : '☰ List'}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Add Bed
          </button>
        </div>
      </div>

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)}</div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label:'Total Beds',      value: stats?.total??0,               color:'#0D7C66' },
            { label:'Available',       value: stats?.available??0,           color:'#10B981' },
            { label:'Occupied',        value: stats?.occupied??0,            color:'#EF4444' },
            { label:'Admissions Today',value: stats?.admittedToday??0,       color:'#3B82F6' },
            { label:'Discharges Today',value: stats?.expectedDischarges??0,  color:'#F59E0B' },
          ].map((k: any) => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-3xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search bed or patient…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={wardF} onChange={e=>setWardF(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Wards</option>
          {wards.map((w: any) => <option key={w.ward} value={w.ward}>{w.ward} ({w.available}/{w.total} avail)</option>)}
        </select>
        {(statusF || wardF || search) && (
          <button onClick={() => { setStatusF(''); setWardF(''); setSearch(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Floor Map View */}
      {view === 'floor' && (
        <div className="space-y-6">
          {wards.filter((w: any) => !wardF || w.ward === wardF).map((ward: any) => {
            const wardBeds = filtered.filter((b: any) => b.ward === ward.ward);
            if (wardBeds.length === 0) return null;
            return (
              <div key={ward.ward} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{ward.ward}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="text-emerald-600 font-semibold">{ward.available} available</span>
                    <span className="text-red-500 font-semibold">{ward.occupied} occupied</span>
                    <span className="text-slate-400">{ward.total} total</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-4 lg:grid-cols-6 gap-3">
                  {wardBeds.map((bed: any) => {
                    const st = STATUS_CONFIG[bed.status] || STATUS_CONFIG.AVAILABLE;
                    const catColor = CATEGORY_COLORS[bed.category] || '#64748B';
                    const StatusIcon = st.icon;
                    return (
                      <div key={bed.id}
                        className={`border-2 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-all ${st.bg}`}
                        onClick={() => {
                          if (bed.status === 'AVAILABLE' || bed.status === 'RESERVED') setAdmitBed(bed);
                          else if (bed.status === 'OCCUPIED') setDischargeBed(bed);
                          else if (bed.status === 'HOUSEKEEPING') { if (confirm(`Mark Bed ${bed.number} as available?`)) markAvailable(bed.id); }
                        }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-slate-600">{bed.number}</span>
                          <div className="w-3 h-3 rounded-full" style={{background: catColor}} title={bed.category} />
                        </div>
                        <StatusIcon className={`w-4 h-4 mb-1 ${st.text}`} />
                        <p className={`text-[10px] font-semibold ${st.text}`}>{st.label}</p>
                        {bed.patient && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {bed.patient.firstName} {bed.patient.lastName?.[0]||''}
                          </p>
                        )}
                        {bed.dailyRate > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatINR(bed.dailyRate)}/day</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
              <BedDouble className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No beds found</p>
              <button onClick={() => setShowAdd(true)} className="mt-4 text-sm font-semibold text-[#0D7C66] hover:underline">Add first bed →</button>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Bed #','Ward','Category','Status','Patient','Admitted','Daily Rate','Actions'].map((h: any) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array.from({length:8}).map((_,i) => (
                <tr key={i}>{Array.from({length:8}).map((__,j) => <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm">No beds found</td></tr>
              ) : filtered.map((bed: any) => {
                const st = STATUS_CONFIG[bed.status] || STATUS_CONFIG.AVAILABLE;
                return (
                  <tr key={bed.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{bed.number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{bed.ward}</td>
                    <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{background: CATEGORY_COLORS[bed.category]}}>{bed.category.replace('_',' ')}</span></td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text} border`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-700">{bed.patient ? `${bed.patient.firstName} ${bed.patient.lastName||''}` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{bed.admittedAt ? new Date(bed.admittedAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{bed.dailyRate > 0 ? formatINR(bed.dailyRate) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(bed.status === 'AVAILABLE' || bed.status === 'RESERVED') && (
                          <button onClick={() => setAdmitBed(bed)} className="text-xs font-semibold text-white bg-[#0D7C66] px-2.5 py-1 rounded-lg hover:opacity-90">Admit</button>
                        )}
                        {bed.status === 'OCCUPIED' && (
                          <button onClick={() => setDischargeBed(bed)} className="text-xs font-semibold text-white bg-red-600 px-2.5 py-1 rounded-lg hover:opacity-90">Discharge</button>
                        )}
                        {bed.status === 'HOUSEKEEPING' && (
                          <button onClick={() => markAvailable(bed.id)} className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100">Mark Clean</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legend:</p>
        {Object.entries(STATUS_CONFIG).map(([k,v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className={`w-3 h-3 rounded-full border ${v.bg}`} />
            {v.label}
          </div>
        ))}
      </div>

      {/* Add Bed Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Bed</h2>
              <button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ward *</label><input className={inputCls} placeholder="ICU, General Ward A…" value={addForm.ward} onChange={e=>setAddForm(f=>({...f,ward:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bed Number *</label><input className={inputCls} placeholder="101, ICU-01…" value={addForm.number} onChange={e=>setAddForm(f=>({...f,number:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category</label>
                <select className={inputCls} value={addForm.category} onChange={e=>setAddForm(f=>({...f,category:e.target.value}))}>
                  {['ICU','SEMI_ICU','GENERAL','PRIVATE','DELUXE','PEDIATRIC','MATERNITY','ISOLATION'].map((c: any) =><option key={c} value={c}>{c.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Daily Rate (₹)</label><input type="number" className={inputCls} placeholder="2000" value={addForm.dailyRate} onChange={e=>setAddForm(f=>({...f,dailyRate:e.target.value}))}/></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Notes</label><input className={inputCls} placeholder="Special equipment, AC, etc." value={addForm.notes} onChange={e=>setAddForm(f=>({...f,notes:e.target.value}))}/></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={createBed} disabled={addSaving} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {addSaving?<Loader2 className="w-4 h-4 animate-spin"/>:<Plus className="w-4 h-4"/>} Add Bed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admit / Discharge modals */}
      {admitBed && <AdmitModal bed={admitBed} onClose={() => setAdmitBed(null)} onDone={load} />}
      {dischargeBed && <DischargeModal bed={dischargeBed} patient={dischargeBed.patient} onClose={() => setDischargeBed(null)} onDone={load} />}
    </div>
  );
}
