'use client';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Users, Plus, Search, RefreshCw, X, Loader2, Star, Clock, Phone } from 'lucide-react';
const PLANS = ['Basic','Silver','Gold','Platinum','Corporate'];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';
const PLAN_COLORS: Record<string,string> = { Basic:'bg-slate-100 text-slate-600', Silver:'bg-slate-200 text-slate-700', Gold:'bg-amber-100 text-amber-700', Platinum:'bg-purple-100 text-purple-700', Corporate:'bg-blue-100 text-blue-700' };
export default function WellnessMembersPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deb, setDeb]           = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm] = useState({ patSearch:'', patId:'', patName:'', plan:'Gold', sessions:12, validUntil:'' });
  const [patSuggestions, setPatSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setDeb(search),400);return()=>clearTimeout(t);},[search]);
  const load = useCallback(async()=>{ setLoading(true); try{ const r=await api.get('/patients',{params:{search:deb,limit:20}}); setPatients(r.data.data??[]); }catch{}finally{setLoading(false);} },[deb]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{ if(form.patSearch.length<2){setPatSuggestions([]);return;} api.get('/patients',{params:{search:form.patSearch,limit:5}}).then(r=>setPatSuggestions(r.data.data||[])).catch(()=>{}); },[form.patSearch]);
  const save = async()=>{
    if(!form.patId){toast.error('Select a patient');return;}
    setSaving(true);
    try{
      const expiry = form.validUntil || new Date(Date.now()+365*86400000).toISOString().split('T')[0];
      await api.patch(`/patients/${form.patId}`,{ membershipPlan: form.plan, membershipExpiry: expiry, membershipSessions: form.sessions });
      toast.success(`Membership activated for ${form.patName}!`); setShowAdd(false); load();
    }catch(e:any){toast.error(e?.response?.data?.message||'Failed');}
    finally{setSaving(false);}
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Membership Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:'#BE185D'}}><Plus className="w-4 h-4"/>Enroll Member</button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400"/><input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {loading?<div className="grid grid-cols-2 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28"/>)}</div>
      :<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.length===0?<div className="col-span-2 bg-white rounded-2xl border border-slate-100 py-20 text-center"><Users className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No members found</p></div>
        :patients.map(p=>(
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{background:'#BE185D'}}>{p.firstName?.[0]}{p.lastName?.[0]||''}</div>
                <div><p className="font-bold text-slate-900">{p.firstName} {p.lastName||''}</p><p className="text-xs text-slate-400">{p.phone}</p></div>
              </div>
              {p.membershipPlan&&<span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${PLAN_COLORS[p.membershipPlan]||'bg-slate-100 text-slate-600'}`}><Star className="w-2.5 h-2.5"/>{p.membershipPlan}</span>}
            </div>
            {p.membershipExpiry&&<p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/>Valid until: {formatDate(p.membershipExpiry)}</p>}
            <div className="mt-3 flex gap-2">
              <a href={`/clinical/patients/${p.id}`} className="flex-1 text-center text-xs font-medium border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50">View Profile</a>
              <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50"><Phone className="w-3.5 h-3.5"/></a>
            </div>
          </div>
        ))}
      </div>}
      {showAdd&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Enroll Member</h2><button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Patient *</label>
              {form.patId?<div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-2.5 border border-pink-200"><span className="text-sm font-semibold text-pink-900">{form.patName}</span><button onClick={()=>setForm(f=>({...f,patId:'',patName:'',patSearch:''}))}><X className="w-4 h-4 text-pink-400"/></button></div>
              :<div className="relative"><input className={inputCls} placeholder="Search patient…" value={form.patSearch} onChange={e=>setForm(f=>({...f,patSearch:e.target.value}))}/>{patSuggestions.length>0&&<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">{patSuggestions.map(p=><button key={p.id} onClick={()=>{setForm(f=>({...f,patId:p.id,patName:`${p.firstName} ${p.lastName||''}`.trim(),patSearch:''}));setPatSuggestions([]);}} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">{p.firstName} {p.lastName||''} · {p.phone}</button>)}</div>}</div>}
            </div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Plan</label><select className={inputCls} value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))}>{PLANS.map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Sessions Included</label><input type="number" min={1} className={inputCls} value={form.sessions} onChange={e=>setForm(f=>({...f,sessions:Number(e.target.value)}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Valid Until</label><input type="date" className={inputCls} value={form.validUntil} onChange={e=>setForm(f=>({...f,validUntil:e.target.value}))}/></div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{background:'#BE185D'}}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Enroll</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
