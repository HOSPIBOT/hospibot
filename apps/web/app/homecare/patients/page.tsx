'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Search, RefreshCw, Phone, MapPin, Heart,
  ChevronLeft, ChevronRight, Plus, Calendar, Clock,
  X, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const NAV_COLOR = '#6B21A8';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#6B21A8] outline-none transition-all placeholder:text-slate-400';

const SERVICE_TYPES = [
  'Nursing Care', 'Physiotherapy', 'IV Infusion', 'Wound Dressing',
  'Post-Surgical Care', 'Elderly Care', 'Palliative Care', 'Baby Care',
];

function QuickScheduleModal({ client, onClose, onScheduled }: {
  client: any; onClose: () => void; onScheduled: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [address,     setAddress]     = useState(client.address ?? client.city ?? '');
  const [submitting,  setSubmitting]  = useState(false);

  const submit = async () => {
    if (!scheduledAt) { toast.error('Select date and time'); return; }
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        patientId   : client.id,
        scheduledAt,
        type        : 'HOME_VISIT',
        notes       : `Service: ${serviceType}\nAddress: ${address}`,
      });
      toast.success(`Home visit scheduled for ${client.firstName}!`);
      onScheduled();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to schedule');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Schedule Home Visit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {client.firstName} {client.lastName || ''} · {client.phone}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date & Time *</label>
            <input type="datetime-local" className={inputCls} value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Service Type</label>
            <select className={inputCls} value={serviceType} onChange={e => setServiceType(e.target.value)}>
              {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Visit Address</label>
            <input className={inputCls} placeholder="Full address for home visit"
              value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Schedule Visit
          </button>
        </div>
      </div>
    </div>
  );
}

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', bloodGroup: '', allergies: '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.firstName || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    try {
      await api.post('/patients', {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
        bloodGroup: form.bloodGroup || undefined,
      });
      toast.success(`${form.firstName} registered as client!`);
      onAdded(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add Client</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {[
            { k: 'firstName', label: 'First Name *', ph: 'Ramesh',   type: 'text', span: 1 },
            { k: 'lastName',  label: 'Last Name',    ph: 'Kumar',    type: 'text', span: 1 },
            { k: 'phone',     label: 'Phone *',      ph: '+91 98765…', type: 'tel', span: 1 },
            { k: 'email',     label: 'Email',        ph: 'email@example.com', type: 'email', span: 1 },
            { k: 'address',   label: 'Address',      ph: 'Street, Area', type: 'text', span: 2 },
            { k: 'city',      label: 'City',         ph: 'Hyderabad',  type: 'text', span: 1 },
          ].map(field => (
            <div key={field.k} className={field.span === 2 ? 'col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{field.label}</label>
              <input type={field.type} className={inputCls} placeholder={field.ph}
                value={(form as any)[field.k]} onChange={f(field.k)} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Blood Group</label>
            <select className={inputCls} value={form.bloodGroup} onChange={f('bloodGroup')}>
              <option value="">Select…</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Allergies</label>
            <input className={inputCls} placeholder="Penicillin, Sulfa…"
              value={form.allergies} onChange={f('allergies')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={save} disabled={saving}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomecareClientsPage() {
  const [clients,      setClients]      = useState<any[]>([]);
  const [lastVisits,   setLastVisits]   = useState<Record<string, any>>({});
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [deb,          setDeb]          = useState('');
  const [meta,         setMeta]         = useState({ page: 1, total: 0, totalPages: 1 });
  const [scheduleFor,  setScheduleFor]  = useState<any>(null);
  const [showAdd,      setShowAdd]      = useState(false);

  useEffect(() => { const t = setTimeout(() => setDeb(search), 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (deb) params.search = deb;
      const res = await api.get('/patients', { params });
      const data: any[] = res.data.data ?? [];
      setClients(data);
      setMeta(res.data.meta ?? { page: 1, total: 0, totalPages: 1 });

      // Load last visit for each client in parallel (best-effort)
      const visits: Record<string, any> = {};
      await Promise.allSettled(data.map(async c => {
        const r = await api.get('/appointments', {
          params: { patientId: c.id, type: 'HOME_VISIT', status: 'COMPLETED', limit: 1, sort: 'desc' },
        });
        const last = r.data?.data?.[0];
        if (last) visits[c.id] = last;
      }));
      setLastVisits(visits);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [deb]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" /> Clients
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${meta.total.toLocaleString('en-IN')} registered clients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: NAV_COLOR }}>
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search clients by name or phone…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-slate-400" /></button>}
      </div>

      {/* Client grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No clients found</p>
          <button onClick={() => setShowAdd(true)}
            className="mt-4 text-sm font-semibold text-purple-700 hover:text-purple-900">
            Add first client →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {clients.map(c => {
            const lastVisit = lastVisits[c.id];
            return (
              <div key={c.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">

                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <a href={`/clinical/patients/${c.id}`}
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: NAV_COLOR }}>
                    {c.firstName?.[0]}{c.lastName?.[0] || ''}
                  </a>
                  <div className="flex-1 min-w-0">
                    <a href={`/clinical/patients/${c.id}`}
                      className="font-bold text-slate-900 hover:text-purple-700 transition-colors block truncate">
                      {c.firstName} {c.lastName || ''}
                    </a>
                    <p className="text-xs font-mono text-slate-400">{c.healthId}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-slate-500 mb-3">
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 flex-shrink-0" /> {c.phone}
                    </div>
                  )}
                  {(c.address || c.city) && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {c.address || c.city}
                    </div>
                  )}
                  {c.bloodGroup && (
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 flex-shrink-0 text-red-400" />
                      {c.bloodGroup}
                      {c.allergies?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <AlertTriangle className="w-3 h-3" /> {c.allergies[0]}
                        </span>
                      )}
                    </div>
                  )}
                  {lastVisit && (
                    <div className="flex items-center gap-1.5 text-emerald-600 pt-0.5">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      Last visit: {formatDate(lastVisit.scheduledAt)}
                    </div>
                  )}
                  {!lastVisit && !loading && (
                    <div className="flex items-center gap-1.5 text-slate-300 pt-0.5">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      No visits yet
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  onClick={() => setScheduleFor(c)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white py-2 rounded-xl transition-colors"
                  style={{ background: NAV_COLOR }}>
                  <Calendar className="w-3.5 h-3.5" /> Schedule Visit
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {meta.page} / {meta.totalPages}</p>
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

      {/* Modals */}
      {scheduleFor && (
        <QuickScheduleModal
          client={scheduleFor}
          onClose={() => setScheduleFor(null)}
          onScheduled={() => load(meta.page)}
        />
      )}
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onAdded={() => load(1)}
        />
      )}
    </div>
  );
}
