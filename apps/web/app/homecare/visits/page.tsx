'use client';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { Home, Clock, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
const STATUS_COLORS: Record<string,string> = { PENDING:'bg-amber-100 text-amber-700', IN_PROGRESS:'bg-blue-100 text-blue-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };
export default function HomecareVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async()=>{setLoading(true);try{const r=await api.get('/appointments',{params:{limit:20,type:'HOME_VISIT'}});setVisits(r.data.data??[]);}catch{}finally{setLoading(false);}}, []);
  useEffect(()=>{load();},[load]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Visits Log</h1>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
      </div>
      <div className="space-y-3">
        {loading?Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)
        :visits.length===0?<div className="bg-white rounded-2xl border border-slate-100 py-16 text-center"><Home className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No home visits recorded</p></div>
        :visits.map(v=>(
          <div key={v.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{background:'#6B21A8'}}><Home className="w-4 h-4"/></div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{v.patient?.firstName} {v.patient?.lastName||''}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDate(v.scheduledAt)} {formatTime(v.scheduledAt)}</span>
              </div>
              {v.notes&&<p className="text-xs text-slate-500 mt-0.5 truncate">{v.notes}</p>}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[v.status]||'bg-slate-100 text-slate-600'}`}>{v.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
