'use client';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Users, Search, RefreshCw, Phone, Home, MapPin } from 'lucide-react';
export default function HomecareClientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deb, setDeb]           = useState('');
  useEffect(()=>{const t=setTimeout(()=>setDeb(search),400);return()=>clearTimeout(t);},[search]);
  const load = useCallback(async()=>{setLoading(true);try{const r=await api.get('/patients',{params:{search:deb,limit:20}});setPatients(r.data.data??[]);}catch{}finally{setLoading(false);}}, [deb]);
  useEffect(()=>{load();},[load]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Care Clients</h1>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400"/>
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {loading?<div className="grid grid-cols-2 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28"/>)}</div>
      :<div className="grid grid-cols-2 gap-4">
        {patients.length===0?<div className="col-span-2 bg-white rounded-2xl border border-slate-100 py-16 text-center"><Users className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No clients found</p></div>
        :patients.map(p=>(
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{background:'#6B21A8'}}>{p.firstName?.[0]}{p.lastName?.[0]||''}</div>
              <div><p className="font-bold text-slate-900">{p.firstName} {p.lastName||''}</p><p className="text-xs text-slate-400">ID: {p.healthId}</p></div>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/>{p.phone}</div>
              {p.address&&<div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>{p.address}, {p.city}</div>}
            </div>
            <a href={`/clinical/patients/${p.id}`} className="mt-3 block text-center text-xs font-semibold border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50">View Full Profile</a>
          </div>
        ))}
      </div>}
    </div>
  );
}
