'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Stethoscope, Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, User, FileText, Activity, Filter,
} from 'lucide-react';

export default function AllVisitsPage() {
  const [visits, setVisits]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deb, setDeb]         = useState('');
  const [meta, setMeta]       = useState({ page: 1, total: 0, totalPages: 1, limit: 20 });

  useEffect(() => { const t = setTimeout(() => setDeb(search), 400); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Visits from appointments (all with visit data)
      const params: any = { page, limit: 20, status: 'COMPLETED' };
      if (deb) params.search = deb;
      const res = await api.get('/appointments', { params });
      setVisits(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1, limit: 20 });
    } catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  }, [deb]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#0D7C66]" /> Visit History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} completed consultations</p>
        </div>
        <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search visits by patient name…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">{Array.from({length:6}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No completed visits found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => {
            const patient = v.patient;
            const doctor  = v.doctor;
            const drName  = doctor ? `Dr. ${doctor.user?.firstName} ${doctor.user?.lastName || ''}`.trim() : 'Unassigned';
            return (
              <a key={v.id} href={`/clinical/visits/${v.id}`}
                className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-[#0D7C66]/20 transition-all group">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {patient?.firstName?.[0]}{patient?.lastName?.[0] || ''}
                  </div>
                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-slate-900 group-hover:text-[#0D7C66] transition-colors">
                        {patient?.firstName} {patient?.lastName || ''}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">{patient?.healthId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(v.scheduledAt)} {formatTime(v.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {drName}
                      </span>
                      {v.department?.name && (
                        <span className="text-slate-300">{v.department.name}</span>
                      )}
                    </div>
                    {v.visit?.diagnosisText && (
                      <p className="text-xs text-slate-500 mt-1.5 truncate">
                        <span className="font-medium">Dx:</span> {v.visit.diagnosisText}
                      </p>
                    )}
                    {v.visit?.chiefComplaint && !v.visit?.diagnosisText && (
                      <p className="text-xs text-slate-500 mt-1.5 truncate">{v.visit.chiefComplaint}</p>
                    )}
                  </div>
                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                      Completed
                    </span>
                    {v.visit && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Notes recorded
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
            <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
