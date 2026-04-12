'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Plus, RefreshCw, X, Loader2, Clock, Phone } from 'lucide-react';

const NAV_COLOR = '#6B21A8';
const STATUS_COLORS: Record<string,string> = { PENDING:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400';

export default function HomecareBookingsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [patSearch, setPatSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ patientId:'', patientName:'', scheduledAt:'', serviceType:'Nursing Care', address:'', notes:'' });

  useEffect(()=>{ if(patSearch.length<2){setPatients([]);return;} const t=setTimeout(()=>api.get('/patients',{params:{search:patSearch,limit:5}}).then(r=>setPatients(r.data.data||[])).catch(()=>{}),300); return()=>clearTimeout(t); },[patSearch]);
  const load = useCallback(async()=>{ setLoading(true); try { const r=await api.get('/appointments',{params:{limit:30}}); setAppointments(r.data.data??[]); } catch {} finally { setLoading(false); } },[]);
  useEffect(()=>{load();},[load]);

  const handleCreate = async()=>{
    if(!form.patientId||!form.scheduledAt){toast.error('Patient and date/time required');return;}
    setSubmitting(true);
    try { await api.post('/appointments',{patientId:form.patientId,scheduledAt:form.scheduledAt,type:'HOME_VISIT',notes:`Service: ${form.serviceType}\nAddress: ${form.address}\n${form.notes}`}); toast.success('Home visit scheduled!'); setShowCreate(false); load(); }
    catch(e:any){toast.error(e?.response?.data?.message||'Failed');}
    finally{setSubmitting(false);}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Visit Bookings</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:NAV_COLOR}}><Plus className="w-4 h-4"/> Schedule Visit</button>
        </div>
      </div>
      <div className="space-y-3">
        {loading?Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)
        :appointments.length===0?<div className="bg-white rounded-2xl border border-slate-100 py-16 text-center"><Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No home visits scheduled</p></div>
        :appointments.map(a=>(
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm" style={{background:NAV_COLOR}}>{a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]||''}</div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{a.patient?.firstName} {a.patient?.lastName||''}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDate(a.scheduledAt)} {formatTime(a.scheduledAt)}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{a.patient?.phone}</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-600'}`}>{a.status.replace('_',' ')}</span>
          </div>
        ))}
      </div>
      {showCreate&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Schedule Home Visit</h2><button onClick={()=>setShowCreate(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Client *</label>
              {form.patientId?<div className="flex items-center justify-between bg-purple-50 rounded-xl px-4 py-2.5 border border-purple-200"><span className="text-sm font-semibold text-purple-800">{form.patientName}</span><button onClick={()=>setForm(f=>({...f,patientId:'',patientName:''}))}><X className="w-4 h-4 text-purple-400"/></button></div>
              :<div className="relative"><input className={inputCls} placeholder="Search client…" value={patSearch} onChange={e=>setPatSearch(e.target.value)}/>{patients.length>0&&<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">{patients.map(p=><button key={p.id} onClick={()=>{setForm(f=>({...f,patientId:p.id,patientName:`${p.firstName} ${p.lastName||''}`}));setPatSearch('');setPatients([]);}} className="w-full text-left px-4 py-2.5 hover:bg-slate-50"><p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName||''}</p><p className="text-xs text-slate-400">{p.phone}</p></button>)}</div>}</div>}
            </div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date & Time *</label><input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Service Type</label>
              <select className={inputCls} value={form.serviceType} onChange={e=>setForm(f=>({...f,serviceType:e.target.value}))}>
                {['Nursing Care','Physiotherapy','IV Infusion','Wound Dressing','Post-Surgical Care','Elderly Care','Palliative Care','Baby Care'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Address</label><input className={inputCls} placeholder="Full address" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={handleCreate} disabled={submitting} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2" style={{background:NAV_COLOR}}>{submitting&&<Loader2 className="w-4 h-4 animate-spin"/>}Schedule</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
