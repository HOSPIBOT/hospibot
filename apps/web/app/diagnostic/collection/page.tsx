'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Home, Plus, RefreshCw, X, Loader2, Phone, MapPin,
  Clock, CheckCircle2, User, Calendar,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' },
  ASSIGNED:  { label: 'Assigned',  color: '#F59E0B', bg: '#FFFBEB' },
  COLLECTED: { label: 'Collected', color: '#10B981', bg: '#ECFDF5' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' },
};

function PatientSearch({ onSelect }: { onSelect: (p: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await api.get('/patients', { params: { search: q, limit: 6 } }).catch(() => ({ data: { data: [] } }));
      setResults(r.data.data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="relative">
      <input className={inputCls} placeholder="Search patient…" value={q} onChange={e => setQ(e.target.value)} />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
      {results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {results.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setQ(''); setResults([]); }}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 text-left">
              <div className="w-7 h-7 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-bold flex items-center justify-center">{p.firstName?.[0]}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-slate-400">{p.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeSlotGrid({ onSelect, selected }: { onSelect: (t: string) => void; selected: string }) {
  const slots = [];
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) slots.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`);
  }
  return (
    <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
      {slots.map(slot => (
        <button key={slot} onClick={() => onSelect(slot)}
          className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${selected === slot ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-[#1E3A5F]/40'}`}
          style={selected === slot ? { background: NAVY } : {}}>
          {slot}
        </button>
      ))}
    </div>
  );
}

function BookModal({ onClose, onBooked }: { onClose: () => void; onBooked: () => void }) {
  const [patient, setPatient] = useState<any>(null);
  const [form, setForm] = useState({ scheduledDate: new Date().toISOString().split('T')[0], slotTime: '08:00', address: '', city: '', pincode: '', contactPhone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!patient || !form.address) { toast.error('Patient and address required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/home-collections', {
        patientId: patient.id, scheduledDate: form.scheduledDate, slotTime: form.slotTime,
        address: form.address, city: form.city, pincode: form.pincode,
        contactPhone: form.contactPhone || patient.phone, notes: form.notes,
      }).catch(() => api.post('/lab/collection', {
        patientId: patient.id, scheduledAt: `${form.scheduledDate}T${form.slotTime}`,
        address: form.address, city: form.city, pincode: form.pincode,
        contactPhone: form.contactPhone || patient.phone, notes: form.notes,
      }));
      toast.success('Booked! Patient notified via WhatsApp.');
      onBooked(); onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Book Home Collection</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Patient *</label>
            {patient ? (
              <div className="flex items-center gap-3 bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-xl p-3">
                <p className="flex-1 font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                <p className="text-sm text-slate-500">{patient.phone}</p>
                <button onClick={() => setPatient(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ) : <PatientSearch onSelect={setPatient} />}
          </div>
          <div>
            <label className={labelCls}>Date *</label>
            <input className={inputCls} type="date" min={new Date().toISOString().split('T')[0]} value={form.scheduledDate} onChange={setF('scheduledDate')} />
          </div>
          <div>
            <label className={labelCls}>Time Slot * — selected: {form.slotTime}</label>
            <TimeSlotGrid selected={form.slotTime} onSelect={slot => setForm(f => ({ ...f, slotTime: slot }))} />
          </div>
          <div>
            <label className={labelCls}>Address *</label>
            <input className={inputCls} placeholder="Flat 4B, Green Valley Apartments, Kondapur" value={form.address} onChange={setF('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>City</label><input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={setF('city')} /></div>
            <div><label className={labelCls}>Pincode</label><input className={inputCls} placeholder="500032" value={form.pincode} onChange={setF('pincode')} /></div>
          </div>
          <div><label className={labelCls}>Contact Phone</label><input className={inputCls} placeholder="Auto-filled from patient" value={form.contactPhone} onChange={setF('contactPhone')} /></div>
          <div><label className={labelCls}>Notes</label><textarea className={`${inputCls} resize-none`} rows={2} placeholder="Gate code, landmark, fasting required…" value={form.notes} onChange={setF('notes')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
            Book · {form.slotTime}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ c, onRefresh }: { c: any; onRefresh: () => void }) {
  const [updating, setUpdating] = useState(false);
  const p = c.patient ?? {};
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  const s = STATUS_MAP[c.status] ?? { label: c.status, color: '#94A3B8', bg: '#F8FAFC' };
  const NEXT: Record<string, string> = { SCHEDULED: 'ASSIGNED', ASSIGNED: 'COLLECTED' };
  const nextStatus = NEXT[c.status];

  const advance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/lab/collection/${c.id}/status`, { status: nextStatus });
      toast.success('Updated'); onRefresh();
    } catch { toast.error('Failed'); } finally { setUpdating(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${c.status === 'SCHEDULED' ? 'border-blue-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-sm font-bold flex items-center justify-center flex-shrink-0">{name[0]?.toUpperCase()}</div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{name}</p>
            <p className="text-xs text-slate-400">{p.phone}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: s.bg, color: s.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.label}
        </span>
      </div>
      <div className="space-y-1.5 mb-4 text-xs text-slate-600">
        <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="font-semibold">{formatDate(c.scheduledAt)}</span><span className="text-slate-400">at</span><span className="font-black text-[#1E3A5F]">{formatTime(c.scheduledAt)}</span></p>
        <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{c.address}{c.city ? `, ${c.city}` : ''}</p>
        {c.technicianName && <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Agent: {c.technicianName}</p>}
      </div>
      {c.status === 'COLLECTED' ? (
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Collected {c.collectedAt ? `at ${formatTime(c.collectedAt)}` : ''}
        </div>
      ) : c.status === 'CANCELLED' ? null : nextStatus ? (
        <div className="flex gap-2">
          <button onClick={advance} disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60"
            style={{ background: NAVY }}>
            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {nextStatus === 'ASSIGNED' ? 'Mark Assigned' : 'Mark Collected'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function HomeCollectionPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBook, setShowBook] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (status) params.status = status;
      if (date) params.date = date;
      const res = await api.get('/diagnostic/home-collections', { params })
        .catch(() => api.get('/lab/collection', { params }));
      setCollections(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [status, date, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    scheduled: collections.filter(c => c.status === 'SCHEDULED').length,
    assigned:  collections.filter(c => c.status === 'ASSIGNED').length,
    collected: collections.filter(c => c.status === 'COLLECTED').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Home Collection</h1>
          <p className="text-sm text-slate-500">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k+1)} className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowBook(true)} className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90" style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Book Collection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', v: stats.scheduled, c: '#3B82F6', i: Calendar },
          { label: 'Assigned',  v: stats.assigned,  c: '#F59E0B', i: User },
          { label: 'Collected', v: stats.collected, c: '#10B981', i: CheckCircle2 },
          { label: 'Total',     v: collections.length, c: NAVY, i: Home },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.c}14` }}>
              <s.i className="w-4 h-4" style={{ color: s.c }} />
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: s.v > 0 ? s.c : '#CBD5E1' }}>{s.v}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none cursor-pointer"
          value={date} onChange={e => setDate(e.target.value)} />
        {['', 'SCHEDULED', 'ASSIGNED', 'COLLECTED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all ${status === s ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            style={status === s ? { background: NAVY } : {}}>
            {s || 'All'} ({!s ? collections.length : collections.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-44"/>)}</div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Home className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No collections for this date</p>
          <button onClick={() => setShowBook(true)} className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2" style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Book Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {collections.map(c => <CollectionCard key={c.id} c={c} onRefresh={() => setRefreshKey(k => k+1)} />)}
        </div>
      )}

      {showBook && <BookModal onClose={() => setShowBook(false)} onBooked={() => setRefreshKey(k => k+1)} />}
    </div>
  );
}
