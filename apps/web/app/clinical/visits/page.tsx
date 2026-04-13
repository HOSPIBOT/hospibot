'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Stethoscope, Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, User, FileText, Filter, X, Calendar, ChevronDown,
} from 'lucide-react';

export default function AllVisitsPage() {
  const [visits,   setVisits]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deb,      setDeb]      = useState('');
  const [meta,     setMeta]     = useState({ page: 1, total: 0, totalPages: 1, limit: 20 });

  // Filters
  const [doctors,     setDoctors]     = useState<any[]>([]);
  const [doctorId,    setDoctorId]    = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [hasNotes,    setHasNotes]    = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load doctors for filter dropdown
  useEffect(() => {
    api.get('/doctors', { params: { limit: 50 } })
      .then(r => setDoctors(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const activeFilterCount = [doctorId, dateFrom, dateTo, hasNotes].filter(Boolean).length;

  const clearFilters = () => {
    setDoctorId(''); setDateFrom(''); setDateTo(''); setHasNotes(false);
  };

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, status: 'COMPLETED' };
      if (deb)      params.search   = deb;
      if (doctorId) params.doctorId = doctorId;
      if (dateFrom) params.from     = dateFrom;
      if (dateTo)   params.to       = dateTo;
      const res = await api.get('/appointments', { params });
      let data = res.data.data ?? [];
      // Client-side filter: only visits that have recorded notes
      if (hasNotes) data = data.filter((v: any) => v.visit?.chiefComplaint || v.visit?.diagnosisText || v.visit?.clinicalNotes);
      setVisits(data);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1, limit: 20 });
    } catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  }, [deb, doctorId, dateFrom, dateTo, hasNotes]);

  useEffect(() => { load(1); }, [load]);

  const inputCls = 'px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#0D7C66]" /> Visit History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${meta.total.toLocaleString('en-IN')} completed consultations`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0D7C66] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button onClick={() => load(meta.page)}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search by patient name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Filter visits</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Doctor filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Doctor</label>
              <div className="relative">
                <select
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  className={`${inputCls} w-full appearance-none pr-7`}
                >
                  <option value="">All Doctors</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.firstName ?? d.firstName} {d.user?.lastName ?? d.lastName ?? ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">From Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>

            {/* Has notes toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
              <button
                onClick={() => setHasNotes(v => !v)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  hasNotes
                    ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                {hasNotes ? 'Has notes ✓' : 'Has notes'}
              </button>
            </div>
          </div>

          {/* Quick date presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Quick:</span>
            {[
              { label: 'Today',      from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
              { label: 'This week',  from: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })(), to: new Date().toISOString().slice(0, 10) },
              { label: 'This month', from: new Date().toISOString().slice(0, 8) + '01', to: new Date().toISOString().slice(0, 10) },
              { label: 'Last 30d',   from: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })(), to: new Date().toISOString().slice(0, 10) },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  dateFrom === p.from && dateTo === p.to
                    ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No visits found</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 text-sm text-[#0D7C66] hover:underline font-medium">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => {
            const patient = v.patient;
            const doctor  = v.doctor;
            const drName  = doctor
              ? `Dr. ${doctor.user?.firstName ?? doctor.firstName ?? ''} ${doctor.user?.lastName ?? doctor.lastName ?? ''}`.trim()
              : 'Unassigned';
            const hasVisitData = v.visit?.diagnosisText || v.visit?.chiefComplaint || v.visit?.clinicalNotes;
            return (
              <a key={v.id} href={`/clinical/visits/${v.id}`}
                className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-[#0D7C66]/20 transition-all group">
                <div className="flex items-start gap-4">

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {patient?.firstName?.[0]}{patient?.lastName?.[0] || ''}
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-slate-900 group-hover:text-[#0D7C66] transition-colors">
                        {patient?.firstName} {patient?.lastName || ''}
                      </p>
                      {patient?.healthId && (
                        <span className="text-[10px] text-slate-400 font-mono">{patient.healthId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
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
                      <p className="text-xs text-slate-600 mt-1.5 truncate">
                        <span className="font-semibold text-slate-500">Dx:</span> {v.visit.diagnosisText}
                      </p>
                    )}
                    {!v.visit?.diagnosisText && v.visit?.chiefComplaint && (
                      <p className="text-xs text-slate-500 mt-1.5 truncate">{v.visit.chiefComplaint}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                      Completed
                    </span>
                    {hasVisitData && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Notes
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
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 5) }).map((_, i) => {
              const p = meta.totalPages <= 5 ? i + 1 : meta.page <= 3 ? i + 1 : meta.page + i - 2;
              if (p < 1 || p > meta.totalPages) return null;
              return (
                <button key={p} onClick={() => load(p)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                    meta.page === p ? 'bg-[#0D7C66] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}>{p}</button>
              );
            })}
            <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
