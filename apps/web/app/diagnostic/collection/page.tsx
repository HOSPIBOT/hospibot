'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Home, Plus, RefreshCw, Search, X, Loader2,
  Phone, MapPin, Clock, CheckCircle2, User, Calendar,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  ASSIGNED:  'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

function CollectionCard({ collection, onUpdate }: { collection: any; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const patientName = `${collection.patient?.firstName} ${collection.patient?.lastName || ''}`.trim();

  const markCollected = async () => {
    setUpdating(true);
    try {
      await api.patch(`/lab/collection/${collection.id}/status`, { status: 'COLLECTED' });
      toast.success('Sample marked as collected');
      onUpdate();
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
      collection.status === 'SCHEDULED' ? 'border-blue-200' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {patientName[0]}
          </div>
          <div>
            <p className="font-bold text-slate-900">{patientName}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Phone className="w-3 h-3" /> {collection.contactPhone}
            </div>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[collection.status] || 'bg-slate-100 text-slate-600'}`}>
          {collection.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
          <span className="font-medium">{formatDate(collection.scheduledAt)} at {formatTime(collection.scheduledAt)}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
          <span>{collection.address}, {collection.city} — {collection.pincode}</span>
        </div>
        {collection.technicianName && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span>Technician: {collection.technicianName}</span>
          </div>
        )}
      </div>

      {collection.status === 'SCHEDULED' && (
        <button onClick={markCollected} disabled={updating}
          className="w-full text-xs font-bold text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background: '#1E3A5F' }}>
          {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Mark as Collected
        </button>
      )}
      {collection.status === 'COLLECTED' && (
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sample collected {collection.collectedAt ? `at ${formatTime(collection.collectedAt)}` : ''}
        </div>
      )}
    </div>
  );
}

function ScheduleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [patSearch, setPatSearch]   = useState('');
  const [patients, setPatients]     = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '', patientName: '', scheduledAt: '',
    address: '', city: '', pincode: '', contactPhone: '', notes: '',
  });

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(async () => {
      const r = await api.get('/patients', { params: { search: patSearch, limit: 5 } }).catch(() => ({ data: { data: [] } }));
      setPatients(r.data.data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.patientId || !form.scheduledAt || !form.address) {
      toast.error('Patient, date/time, and address are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/lab/collection', form);
      toast.success('Home collection scheduled! Patient notified via WhatsApp.');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to schedule');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Schedule Home Collection</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient <span className="text-red-500">*</span></label>
            {form.patientId ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-200">
                <span className="text-sm font-semibold text-blue-800">{form.patientName}</span>
                <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))}><X className="w-4 h-4 text-blue-400" /></button>
              </div>
            ) : (
              <div className="relative">
                <input className={inputCls} placeholder="Search patient…" value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {patients.map(p => (
                      <button key={p.id} onClick={() => { setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}`, contactPhone: p.phone })); setPatSearch(''); setPatients([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Collection Date & Time <span className="text-red-500">*</span></label>
            <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={set('scheduledAt')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Collection Address <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Flat no., Street, Area" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
              <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
              <input className={inputCls} placeholder="500001" value={form.pincode} onChange={set('pincode')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Contact Phone</label>
            <input className={inputCls} placeholder="Patient's phone (auto-filled)" value={form.contactPhone} onChange={set('contactPhone')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Gate code, landmark, special instructions…" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
            ✓ Patient will receive WhatsApp confirmation with scheduled date, time and address
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: '#1E3A5F' }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Scheduling…' : 'Schedule Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeCollectionPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState('');
  const [dateFilter, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [stats, setStats]             = useState({ scheduled: 0, collected: 0, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter)   params.date   = dateFilter;
      const res = await api.get('/lab/collection', { params });
      const data = res.data?.data ?? res.data ?? [];
      setCollections(data);
      setStats({
        scheduled: data.filter((c: any) => c.status === 'SCHEDULED').length,
        collected: data.filter((c: any) => c.status === 'COLLECTED').length,
        total:     data.length,
      });
    } catch { toast.error('Failed to load collections'); }
    finally { setLoading(false); }
  }, [statusFilter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-[#1E3A5F]" /> Home Sample Collection
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and track home sample pickups</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: '#1E3A5F' }}>
            <Plus className="w-4 h-4" /> Schedule Collection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Scheduled Today', value: stats.scheduled, color: '#3B82F6', icon: Clock },
          { label: 'Collected Today', value: stats.collected, color: '#10B981', icon: CheckCircle2 },
          { label: 'Total',           value: stats.total,     color: '#1E3A5F', icon: Home },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
        <input type="date" value={dateFilter} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer" />
        <div className="flex items-center gap-1">
          {['', 'SCHEDULED', 'ASSIGNED', 'COLLECTED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                statusFilter === s ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={statusFilter === s ? { background: '#1E3A5F' } : {}}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Collections grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-48" />)}
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Home className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No collections for this date</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Schedule a home collection for a patient</p>
          <button onClick={() => setShowSchedule(true)}
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity mx-auto flex items-center gap-2"
            style={{ background: '#1E3A5F' }}>
            <Plus className="w-4 h-4" /> Schedule First Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(c => (
            <CollectionCard key={c.id} collection={c} onUpdate={load} />
          ))}
        </div>
      )}

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onCreated={load} />}
    </div>
  );
}
