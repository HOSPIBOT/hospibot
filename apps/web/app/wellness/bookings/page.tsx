'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, RefreshCw, X, Loader2, Clock,
  Phone, CheckCircle2, ChevronLeft, ChevronRight,
  Search, Ban, Download,
} from 'lucide-react';

const COLOR = '#BE185D';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  PENDING:   { label: 'Confirm',  status: 'CONFIRMED' },
  CONFIRMED: { label: 'Complete', status: 'COMPLETED' },
};

const SESSION_TYPES = [
  'Yoga', 'Meditation', 'Nutrition Consultation', 'Physiotherapy',
  'Spa Therapy', 'Mental Wellness', 'Personal Training', 'Ayurveda',
];

const FILTER_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'today',     label: 'Today'     },
  { key: 'upcoming',  label: 'Upcoming'  },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';

export default function WellnessBookingsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [patients,     setPatients]     = useState<any[]>([]);
  const [patSearch,    setPatSearch]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [updating,     setUpdating]     = useState<string | null>(null);
  const [tab,          setTab]          = useState('all');
  const [search,       setSearch]       = useState('');
  const [meta,         setMeta]         = useState({ page: 1, total: 0, totalPages: 1 });
  const [form, setForm] = useState({
    patientId: '', patientName: '', scheduledAt: '',
    sessionType: SESSION_TYPES[0], notes: '',
  });

  // Patient search for booking
  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 5 } })
        .then(r => setPatients(r.data.data || []))
        .catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, type: 'WELLNESS' };
      if (tab === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        params.from = today; params.to = today;
      } else if (tab === 'upcoming') {
        params.from = new Date().toISOString().slice(0, 10);
        params.status = 'CONFIRMED,PENDING';
      } else if (tab === 'completed') {
        params.status = 'COMPLETED';
      } else if (tab === 'cancelled') {
        params.status = 'CANCELLED';
      }
      if (search) params.search = search;
      const res = await api.get('/appointments', { params });
      setAppointments(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { load(1); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/appointments', { params: { limit: 2000, type: 'WELLNESS' } });
      const all: any[] = res.data.data ?? appointments;
      const header = ['Date', 'Time', 'Member', 'Phone', 'Session Type', 'Status'];
      const rows = all.map(a => [
        formatDate(a.scheduledAt), formatTime(a.scheduledAt),
        `${a.patient?.firstName ?? ''} ${a.patient?.lastName ?? ''}`.trim(),
        a.patient?.phone ?? '',
        a.notes?.match(/Session:\s*([^\n]+)/)?.[1]?.trim() ?? 'Wellness',
        a.status ?? '',
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `wellness-bookings-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} sessions`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const advance = async (id: string, nextStatus: string) => {
    setUpdating(id);
    try {
      await api.put(`/appointments/${id}/status`, { status: nextStatus });
      setAppointments(prev => prev.map(a =>
        a.id === id ? { ...a, status: nextStatus } : a
      ));
      toast.success(`Session marked as ${nextStatus.toLowerCase()}`);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this session?')) return;
    setUpdating(id);
    try {
      await api.put(`/appointments/${id}/status`, { status: 'CANCELLED' });
      setAppointments(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'CANCELLED' } : a
      ));
      toast.success('Session cancelled');
    } catch { toast.error('Failed to cancel'); }
    finally { setUpdating(null); }
  };

  const save = async () => {
    if (!form.patientId || !form.scheduledAt) {
      toast.error('Select member and date/time');
      return;
    }
    setSaving(true);
    try {
      await api.post('/appointments', {
        patientId  : form.patientId,
        scheduledAt: form.scheduledAt,
        type       : 'WELLNESS',
        notes      : `Session: ${form.sessionType}${form.notes ? '\n' + form.notes : ''}`,
      });
      toast.success('Session booked!');
      setShowCreate(false);
      setForm({ patientId: '', patientName: '', scheduledAt: '', sessionType: SESSION_TYPES[0], notes: '' });
      load(1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to book');
    } finally { setSaving(false); }
  };

  const tabCount = (key: string) => {
    if (key === 'all') return appointments.length;
    return appointments.filter(a => {
      if (key === 'completed') return a.status === 'COMPLETED';
      if (key === 'cancelled') return a.status === 'CANCELLED';
      if (key === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        return a.scheduledAt?.startsWith(today);
      }
      if (key === 'upcoming') return ['PENDING', 'CONFIRMED'].includes(a.status);
      return false;
    }).length;
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${meta.total} total sessions`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: COLOR }}>
            <Plus className="w-4 h-4" /> Book Session
          </button>
        </div>
      </div>

      {/* Search + tabs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search member…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No sessions found</p>
          <p className="text-slate-400 text-sm mt-1">
            {tab !== 'all' ? 'Try switching tabs' : 'Book the first session to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => {
            const next = NEXT_STATUS[a.status];
            const busy = updating === a.id;
            return (
              <div key={a.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: COLOR }}>
                  {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0] || ''}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">
                    {a.patient?.firstName} {a.patient?.lastName || ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(a.scheduledAt)} · {formatTime(a.scheduledAt)}
                    </span>
                    {a.patient?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {a.patient.phone}
                      </span>
                    )}
                  </div>
                  {a.notes && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{a.notes}</p>
                  )}
                </div>

                {/* Status badge */}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-600'
                }`}>
                  {a.status}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {next && (
                    <button
                      onClick={() => advance(a.id, next.status)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl disabled:opacity-50"
                      style={{ background: COLOR }}>
                      {busy
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {next.label}
                    </button>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(a.status) && (
                    <button
                      onClick={() => cancel(a.id)}
                      disabled={busy}
                      title="Cancel session"
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => load(meta.page - 1)} disabled={meta.page === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Book session modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Book Session</h2>
              <button onClick={() => setShowCreate(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Member search */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Member *
                </label>
                {form.patientId ? (
                  <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-2.5 border border-pink-200">
                    <span className="text-sm font-semibold text-pink-900">{form.patientName}</span>
                    <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))}>
                      <X className="w-4 h-4 text-pink-400" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search member…"
                      value={patSearch} onChange={e => setPatSearch(e.target.value)} autoFocus />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patients.map(p => (
                          <button key={p.id}
                            onClick={() => {
                              setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}`.trim() }));
                              setPatSearch(''); setPatients([]);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">
                            {p.firstName} {p.lastName || ''} · {p.phone}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Session Type</label>
                <select className={inputCls} value={form.sessionType}
                  onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))}>
                  {SESSION_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date & Time *</label>
                <input type="datetime-local" className={inputCls}
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2}
                  placeholder="Any special requirements…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowCreate(false)}
                className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
                style={{ background: COLOR }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Book Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
