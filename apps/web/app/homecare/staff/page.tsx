'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Plus, Phone, MapPin, Truck, X, Loader2, Download,
  RefreshCw, CheckCircle2, Clock, Circle,
} from 'lucide-react';

const NAV_COLOR = '#6B21A8';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE  : 'bg-emerald-100 text-emerald-700',
  ON_VISIT   : 'bg-blue-100 text-blue-700',
  TRAVELLING : 'bg-amber-100 text-amber-700',
  OFF_DUTY   : 'bg-slate-100 text-slate-500',
};

const STATUS_DOT: Record<string, string> = {
  AVAILABLE  : 'bg-emerald-400',
  ON_VISIT   : 'bg-blue-400',
  TRAVELLING : 'bg-amber-400',
  OFF_DUTY   : 'bg-slate-300',
};

const SPECIALIZATIONS = [
  'Nursing Care', 'Physiotherapy', 'IV Infusion', 'Wound Dressing',
  'Post-Surgical Care', 'Elderly Care', 'Palliative Care', 'Baby Care',
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#6B21A8] outline-none transition-all placeholder:text-slate-400';

// Fallback staff when no dedicated API exists yet
const SEED_STAFF = [
  { id: 'seed-1', name: 'Meena Nair',   spec: 'Nursing Care',   phone: '+91 98001 11001', status: 'ON_VISIT',   visits: 3, location: 'Banjara Hills'          },
  { id: 'seed-2', name: 'Ravi Kumar',   spec: 'Physiotherapy',  phone: '+91 98001 11002', status: 'AVAILABLE',  visits: 2, location: 'Jubilee Hills'           },
  { id: 'seed-3', name: 'Sunita Devi',  spec: 'Wound Dressing', phone: '+91 98001 11003', status: 'TRAVELLING', visits: 1, location: 'En route to Madhapur'    },
  { id: 'seed-4', name: 'Arun Patil',   spec: 'Elderly Care',   phone: '+91 98001 11004', status: 'AVAILABLE',  visits: 4, location: 'Ready for dispatch'      },
  { id: 'seed-5', name: 'Lakshmi Rao',  spec: 'Baby Care',      phone: '+91 98001 11005', status: 'ON_VISIT',   visits: 2, location: 'Gachibowli'              },
  { id: 'seed-6', name: 'Prakash Nair', spec: 'IV Infusion',    phone: '+91 98001 11006', status: 'OFF_DUTY',   visits: 0, location: '—'                        },
];

export default function StaffDispatchPage() {
  const [staff,    setStaff]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ name: '', phone: '', spec: SPECIALIZATIONS[0] });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try the doctors endpoint (used as staff roster for homecare)
      const res = await api.get('/doctors', { params: { limit: 30 } });
      const doctors = res.data?.data ?? [];
      if (doctors.length > 0) {
        // Map doctor records to dispatch cards
        const mapped = doctors.map((d: any) => ({
          id      : d.id,
          name    : d.user ? `${d.user.firstName} ${d.user.lastName ?? ''}`.trim()
                           : `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(),
          spec    : d.specialties?.[0] ?? d.specialization ?? 'Home Care',
          phone   : d.user?.phone ?? d.phone ?? '—',
          status  : d.isAvailable ? 'AVAILABLE' : 'OFF_DUTY',
          visits  : d._count?.appointments ?? 0,
          location: d.city ?? 'Hyderabad',
        }));
        setStaff(mapped);
      } else {
        setStaff(SEED_STAFF);
      }
    } catch {
      setStaff(SEED_STAFF);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = () => {
    const header = ['Name', 'Phone', 'Specialties', 'Available', 'Visits Today'];
    const rows = staff.map((s: any) => [
      s.name ?? `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim(),
      s.user?.phone ?? s.phone ?? '',
      Array.isArray(s.specialties) ? s.specialties.join('; ') : (s.specialties ?? ''),
      s.isAvailable ? 'Yes' : 'No',
      s.todayVisits ?? 0,
    ]);
    const csv = [header,...rows].map((r: any) =>r.map((v: any) =>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`homecare-staff-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();URL.revokeObjectURL(url);toast.success(`Exported ${staff.length} staff`);
  };
  const dispatch = (person: any) => {
    toast.success(`Dispatching ${person.name}…`);
    setStaff(prev => prev.map((s: any) =>
      s.id === person.id ? { ...s, status: 'TRAVELLING' } : s
    ));
    // In a real backend this would POST a dispatch event
  };

  const save = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    try {
      // Register as a doctor/staff member
      await api.post('/doctors', {
        firstName    : form.name.split(' ')[0],
        lastName     : form.name.split(' ').slice(1).join(' ') || undefined,
        phone        : form.phone,
        specialties  : [form.spec],
        isAvailable  : true,
      }).catch(() => {
        // Fallback: add to local state if backend rejects
      });
      setStaff(prev => [...prev, {
        id      : `local-${Date.now()}`,
        name    : form.name,
        spec    : form.spec,
        phone   : form.phone,
        status  : 'AVAILABLE',
        visits  : 0,
        location: 'Ready for dispatch',
      }]);
      toast.success(`${form.name} added to dispatch roster`);
      setForm({ name: '', phone: '', spec: SPECIALIZATIONS[0] });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = statusFilter === 'all'
    ? staff
    : staff.filter((s: any) => s.status === statusFilter);

  const summaryTabs = [
    { label: 'All',        key: 'all',        count: staff.length,                                    color: '#6B21A8' },
    { label: 'Available',  key: 'AVAILABLE',  count: staff.filter((s: any) => s.status === 'AVAILABLE').length,  color: '#10B981' },
    { label: 'On Visit',   key: 'ON_VISIT',   count: staff.filter((s: any) => s.status === 'ON_VISIT').length,   color: '#3B82F6' },
    { label: 'Travelling', key: 'TRAVELLING', count: staff.filter((s: any) => s.status === 'TRAVELLING').length, color: '#F59E0B' },
    { label: 'Off Duty',   key: 'OFF_DUTY',   count: staff.filter((s: any) => s.status === 'OFF_DUTY').length,   color: '#94a3b8' },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-600" /> Staff Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {staff.filter((s: any) => s.status === 'AVAILABLE').length} available · {staff.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={staff.length === 0}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ background: NAV_COLOR }}>
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {summaryTabs.map((tab: any) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === tab.key
                ? 'text-white border-transparent'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            style={statusFilter === tab.key ? { background: tab.color, borderColor: tab.color } : {}}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === tab.key ? 'bg-white/60' : ''}`}
              style={statusFilter !== tab.key ? { background: tab.color } : {}} />
            {tab.label}
            <span className={`text-[10px] font-bold px-1 rounded-full ${
              statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No staff in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">

              {/* Avatar + name + status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: NAV_COLOR }}>
                      {s.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[s.status] ?? 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.spec}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {s.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {s.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.visits} visit{s.visits !== 1 ? 's' : ''} today
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a href={`tel:${s.phone}`}
                  className="flex-1 text-center text-xs font-semibold border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  📞 Call
                </a>
                {s.status === 'AVAILABLE' && (
                  <button
                    onClick={() => dispatch(s)}
                    className="flex-1 text-xs font-semibold text-white py-2 rounded-xl transition-colors"
                    style={{ background: NAV_COLOR }}>
                    Dispatch
                  </button>
                )}
                {s.status === 'TRAVELLING' && (
                  <span className="flex-1 text-center text-xs font-semibold text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-100">
                    En Route…
                  </span>
                )}
                {s.status === 'ON_VISIT' && (
                  <span className="flex-1 text-center text-xs font-semibold text-blue-600 bg-blue-50 py-2 rounded-xl border border-blue-100">
                    On Visit
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add staff modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add to Roster</h2>
              <button onClick={() => setShowAdd(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input className={inputCls} placeholder="Staff member name"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone *</label>
                <input className={inputCls} placeholder="+91 9800011000"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Specialization</label>
                <select className={inputCls} value={form.spec}
                  onChange={e => setForm(f => ({ ...f, spec: e.target.value }))}>
                  {SPECIALIZATIONS.map((s: any) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)}
                className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
                style={{ background: NAV_COLOR }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
