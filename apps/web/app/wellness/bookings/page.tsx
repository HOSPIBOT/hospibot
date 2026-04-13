'use client';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Plus, RefreshCw, X, Loader2, Clock, Phone } from 'lucide-react';
const STATUS_COLORS: Record<string,string> = { PENDING:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };
const SESSION_TYPES = ['Yoga','Meditation','Nutrition Consultation','Physiotherapy','Spa Therapy','Mental Wellness','Personal Training','Ayurveda'];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';
export default function WellnessBookingsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [patSearch, setPatSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId:'', patientName:'', scheduledAt:'', sessionType:'Yoga', notes:'' });
  useEffect(()=>{if(patSearch.length<2){setPatients([]);return;}const t=setTimeout(()=>api.get('/patients',{params:{search:patSearch,limit:5}}).then(r=>setPatients(r.data.data||[])).catch(()=>{}),300);return()=>clearTimeout(t);},[patSearch]);
  const load = useCallback(async()=>{setLoading(true);try{const r=await api.get('/appointments',{params:{limit:30}});setAppointments(r.data.data??[]);}catch{}finally{setLoading(false);}}, []);
  useEffect(()=>{load();},[load]);
  const save = async()=>{
    if(!form.patientId||!form.scheduledAt){toast.error('Select patient and time');return;}
    setSaving(true);
    try{await api.post('/appointments',{patientId:form.patientId,scheduledAt:form.scheduledAt,type:'WELLNESS',notes:`Session: ${form.sessionType}\n${form.notes}`});toast.success('Session booked!');setShowCreate(false);load();}
    catch(e:any){toast.error(e?.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Session Bookings</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:'#BE185D'}}><Plus className="w-4 h-4"/>Book Session</button>
        </div>
      </div>
      <div className="space-y-3">
        {loading?Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)
        :appointments.length===0?<div className="bg-white rounded-2xl border border-slate-100 py-16 text-center"><Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No sessions booked yet</p></div>
        :appointments.map(a=>(
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-bold" style={{background:'#BE185D'}}>{a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]||''}</div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{a.patient?.firstName} {a.patient?.lastName||''}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDate(a.scheduledAt)} {formatTime(a.scheduledAt)}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{a.patient?.phone}</span>
              </div>
              {a.notes&&<p className="text-xs text-slate-500 mt-0.5 truncate">{a.notes}</p>}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status]||'bg-slate-100 text-slate-600'}`}>{a.status}</span>
          </div>
        ))}
      </div>
      {showCreate&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Book Session</h2><button onClick={()=>setShowCreate(false)} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Member *</label>
              {form.patientId?<div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-2.5 border border-pink-200"><span className="text-sm font-semibold text-pink-900">{form.patientName}</span><button onClick={()=>setForm(f=>({...f,patientId:'',patientName:''}))}><X className="w-4 h-4 text-pink-400"/></button></div>
              :<div className="relative"><input className={inputCls} placeholder="Search member…" value={patSearch} onChange={e=>setPatSearch(e.target.value)}/>{patients.length>0&&<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">{patients.map(p=><button key={p.id} onClick={()=>{setForm(f=>({...f,patientId:p.id,patientName:`${p.firstName} ${p.lastName||''}`}));setPatSearch('');setPatients([]);}} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">{p.firstName} {p.lastName||''} · {p.phone}</button>)}</div>}</div>}
            </div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Session Type</label><select className={inputCls} value={form.sessionType} onChange={e=>setForm(f=>({...f,sessionType:e.target.value}))}>{SESSION_TYPES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Date & Time *</label><input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Notes</label><textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowCreate(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{background:'#BE185D'}}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Book</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
