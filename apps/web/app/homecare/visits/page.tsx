'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Home, CheckCircle2, Clock, RefreshCw, MapPin, Phone, User, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = {
  PENDING:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700',
  IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-emerald-100 text-emerald-700',
  CANCELLED:'bg-red-100 text-red-700'
};
const ADVANCE: Record<string,string> = { CONFIRMED:'IN_PROGRESS', IN_PROGRESS:'COMPLETED' };

export default function HomecareVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page:1, total:0, totalPages:1 });

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const r = await api.get('/appointments', { params:{ limit:20, page, type:'HOME_VISIT' } });
      setVisits(r.data.data ?? []);
      setMeta(r.data.meta ?? { page:1, total:0, totalPages:1 });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/appointments', { params: { limit: 2000, type: 'HOME_VISIT' } });
      const all: any[] = res.data.data ?? visits;
      const header = ['Date','Time','Client','Phone','Address','Service','Status'];
      const rows = all.map(v => [
        formatDate(v.scheduledAt), formatTime(v.scheduledAt),
        `${v.patient?.firstName??''} ${v.patient?.lastName??''}`.trim(),
        v.patient?.phone??'', v.patient?.address??v.patient?.city??'',
        v.notes?.match(/Service:\s*([^\n]+)/)?.[1]?.trim()??'Home Visit', v.status??'',
      ]);
      const csv=[header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`home-visits-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();URL.revokeObjectURL(url);toast.success(`Exported ${all.length} visits`);
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  const advance = async (id: string, nextStatus: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: nextStatus });
      toast.success(`Visit marked as ${nextStatus.replace('_',' ')}`);
      load(meta.page);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-purple-600"/>Home Visits
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total} total home visits</p>
        </div>
        <button onClick={()=>load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Home className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm font-medium">No home visits scheduled</p>
          <a href="/homecare/bookings" className="mt-4 inline-block text-purple-600 text-sm font-semibold hover:underline">Schedule a home visit →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => {
            const nextStatus = ADVANCE[v.status];
            const patient = v.patient;
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-purple-700">
                    {patient?.firstName?.[0]}{patient?.lastName?.[0]||'H'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">{patient?.firstName} {patient?.lastName||''}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status]||'bg-slate-100 text-slate-600'}`}>{v.status?.replace('_',' ')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDate(v.scheduledAt)} {formatTime(v.scheduledAt)}</span>
                      {patient?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{patient.phone}</span>}
                      {(patient?.address||patient?.city) && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{patient.address||patient.city}</span>}
                    </div>
                    {v.notes && <p className="text-xs text-slate-500 mt-1.5 truncate">{v.notes}</p>}
                  </div>
                  {nextStatus && (
                    <button onClick={()=>advance(v.id,nextStatus)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5"/>
                      {nextStatus==='IN_PROGRESS'?'Start Visit':'Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages>1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <button onClick={()=>load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
}
