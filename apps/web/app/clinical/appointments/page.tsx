'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Search, Clock, User, CheckCircle2, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, X, Loader2, Filter,
  ArrowRight, Phone, Hash, Stethoscope, AlertCircle, Activity,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED:   'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_IN:  'bg-purple-100 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  COMPLETED:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED:   'bg-red-100 text-red-600 border-red-200',
  NO_SHOW:     'bg-slate-100 text-slate-500 border-slate-200',
  RESCHEDULED: 'bg-orange-100 text-orange-700 border-orange-200',
};

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  CONFIRMED:   { label: 'Check In',  status: 'CHECKED_IN',  color: 'bg-purple-500' },
  CHECKED_IN:  { label: 'Start',     status: 'IN_PROGRESS', color: 'bg-indigo-500' },
  IN_PROGRESS: { label: 'Complete',  status: 'COMPLETED',   color: 'bg-emerald-500' },
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

function QueueCard({ appt, onStatusChange }: { appt: any; onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false);
  const next = NEXT_STATUS[appt.status];

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/appointments/${appt.id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      onStatusChange();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-md ${appt.status === 'IN_PROGRESS' ? 'border-indigo-300 shadow-md' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono text-[#0D7C66]">{appt.tokenNumber || `#${appt.id.slice(-4)}`}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {appt.status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs text-slate-400">{formatTime(appt.scheduledAt)}</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-[#E8F5F0] text-[#0D7C66] text-xs font-bold flex items-center justify-center">
          {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0] || ''}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{appt.patient?.firstName} {appt.patient?.lastName || ''}</p>
          <p className="text-xs text-slate-400">{appt.patient?.phone}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Stethoscope className="w-3 h-3" />
        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName || ''}
        {appt.department?.name && <span>· {appt.department.name}</span>}
      </div>

      {appt.type === 'EMERGENCY' && (
        <div className="flex items-center gap-1 text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-lg mb-2">
          <AlertCircle className="w-3 h-3" /> EMERGENCY
        </div>
      )}

      <div className="flex items-center gap-2">
        {next && (
          <button onClick={() => handleStatusChange(next.status)} disabled={updating}
            className={`flex-1 text-xs font-semibold text-white py-2 rounded-xl transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5 ${next.color}`}>
            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {next.label}
          </button>
        )}
        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
          <button onClick={() => handleStatusChange('CANCELLED')} disabled={updating}
            className="text-xs font-medium text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60">
            Cancel
          </button>
        )}
        {appt.status === 'PENDING' && (
          <button onClick={() => handleStatusChange('NO_SHOW')} disabled={updating}
            className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60">
            No Show
          </button>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors]           = useState<any[]>([]);
  const [patients, setPatients]         = useState<any[]>([]);
  const [meta, setMeta]                 = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<'queue' | 'list'>('queue');
  const [showBook, setShowBook]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [rescheduleAppt, setReschedule] = useState<any>(null);
  const [newDateTime, setNewDateTime]   = useState('');
  const [dateFilter, setDateFilter]     = useState(new Date().toISOString().split('T')[0]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);

  const [form, setForm] = useState({
    patientId: '', patientName: '', doctorId: '', scheduledAt: '',
    type: 'SCHEDULED', notes: '', duration: 15,
  });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) {
        params.startDate = `${dateFilter}T00:00:00`;
        params.endDate   = `${dateFilter}T23:59:59`;
      }
      const res = await api.get('/appointments', { params });
      setAppointments(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, [statusFilter, dateFilter]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    api.get('/doctors', { params: { limit: 100 } }).then(r => setDoctors(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/patients', { params: { search: patientSearch, limit: 5 } });
        setPatientResults(r.data.data ?? []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleBook = async () => {
    if (!form.patientId || !form.doctorId || !form.scheduledAt) {
      toast.error('Patient, doctor and time are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        patientId: form.patientId,
        doctorId: form.doctorId,
        scheduledAt: form.scheduledAt,
        type: form.type,
        notes: form.notes,
        duration: form.duration,
      });
      toast.success('Appointment booked! Patient will receive WhatsApp confirmation.');
      setShowBook(false);
      setForm({ patientId: '', patientName: '', doctorId: '', scheduledAt: '', type: 'SCHEDULED', notes: '', duration: 15 });
      load(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  const reschedule = async () => {
    if (!newDateTime || !rescheduleAppt) return;
    try {
      await api.post(`/appointments/${rescheduleAppt.id}/reschedule`, { scheduledAt: newDateTime });
      toast.success('Appointment rescheduled. Patient notified via WhatsApp.');
      setReschedule(null); setNewDateTime(''); load(1);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to reschedule'); }
  };

  // Queue stats
  const stats = {
    total:      appointments.length,
    waiting:    appointments.filter(a => ['PENDING','CONFIRMED','CHECKED_IN'].includes(a.status)).length,
    inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
    completed:  appointments.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {dateFilter === new Date().toISOString().split('T')[0] ? 'Today' : dateFilter} ·{' '}
            {stats.waiting} waiting · {stats.inProgress} in progress · {stats.completed} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="/clinical/appointments/queue"
            className="flex items-center gap-2 border border-[#0D7C66] text-[#0D7C66] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#E8F5F0] transition-colors">
            <Activity className="w-4 h-4" /> Live Queue
          </a>
          <button onClick={() => setShowBook(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Today',  value: stats.total,      color: '#0D7C66' },
          { label: 'Waiting',      value: stats.waiting,    color: '#F59E0B' },
          { label: 'In Progress',  value: stats.inProgress, color: '#6366F1' },
          { label: 'Completed',    value: stats.completed,  color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-[#0D7C66] cursor-pointer" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-[#0D7C66] cursor-pointer">
          <option value="">All Statuses</option>
          {['PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['queue', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Queue view */}
      {view === 'queue' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-48" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No appointments for this date</p>
            <p className="text-slate-300 text-xs mt-1">Book an appointment to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map(appt => (
              <QueueCard key={appt.id} appt={appt} onStatusChange={() => load(meta.page)} />
            ))}
          </div>
        )
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Token</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                  ))}</tr>
                ))
              ) : appointments.map(appt => (
                <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#0D7C66]">{appt.tokenNumber || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{appt.patient?.firstName} {appt.patient?.lastName || ''}</p>
                      <p className="text-xs text-slate-400">{appt.patient?.phone}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">
                    Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName || ''}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{formatTime(appt.scheduledAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {appt.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[appt.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {NEXT_STATUS[appt.status] && (
                      <button onClick={async () => {
                        try {
                          await api.patch(`/appointments/${appt.id}/status`, { status: NEXT_STATUS[appt.status].status });
                          toast.success('Status updated'); load(meta.page);
                        } catch { toast.error('Failed'); }
                      }}
                        className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: '#0D7C66' }}>
                        {NEXT_STATUS[appt.status].label}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {!loading && meta.total > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
                <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book Appointment Modal */}
      {rescheduleAppt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setReschedule(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reschedule Appointment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{rescheduleAppt.patient?.firstName} {rescheduleAppt.patient?.lastName || ''}</p>
              </div>
              <button onClick={() => setReschedule(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                Current: {rescheduleAppt.scheduledAt ? new Date(rescheduleAppt.scheduledAt).toLocaleString('en-IN') : '—'}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Date & Time *</label>
                <input type="datetime-local" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none"
                  value={newDateTime} onChange={e => setNewDateTime(e.target.value)} />
              </div>
              <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-xs text-[#0A5E4F]">
                Patient will receive a WhatsApp notification about the rescheduled appointment.
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setReschedule(null)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={reschedule} disabled={!newDateTime}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50">
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      {showBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowBook(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
              <button onClick={() => setShowBook(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Patient search */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient <span className="text-red-500">*</span></label>
                {form.patientId ? (
                  <div className="flex items-center justify-between bg-[#E8F5F0] rounded-xl px-4 py-2.5 border border-[#0D7C66]/30">
                    <span className="text-sm font-semibold text-[#0D7C66]">{form.patientName}</span>
                    <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient by name or phone…"
                      value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patientResults.map(p => (
                          <button key={p.id} onClick={() => { setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}` })); setPatientSearch(''); setPatientResults([]); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName || ''}</p>
                            <p className="text-xs text-slate-400">{p.phone} · {p.healthId || ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Doctor <span className="text-red-500">*</span></label>
                <select className={inputCls} value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.firstName} {d.user?.lastName || ''} {d.department?.name ? `· ${d.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date & Time <span className="text-red-500">*</span></label>
                  <input type="datetime-local" className={inputCls} value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Type</label>
                  <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="WALK_IN">Walk-In</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="TELECONSULT">Teleconsult</option>
                    <option value="FOLLOW_UP">Follow-Up</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Duration (minutes)</label>
                <select className={inputCls} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                  {[10, 15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2}
                  placeholder="Chief complaint, reason for visit…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="bg-[#E8F5F0] rounded-xl p-3 text-xs text-[#0D7C66]">
                ✓ Patient will receive WhatsApp confirmation with token number after booking
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowBook(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={handleBook} disabled={submitting || !form.patientId || !form.doctorId || !form.scheduledAt}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Booking…' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
