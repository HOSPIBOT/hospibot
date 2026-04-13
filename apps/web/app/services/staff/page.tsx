'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Plus, Phone, Mail, X, Loader2, RefreshCw, Briefcase, Download } from 'lucide-react';

const THEME = '#334155'; // services dark-slate

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  ON_LEAVE:  'bg-amber-100 text-amber-700',
  INACTIVE:  'bg-slate-100 text-slate-500',
};

const ROLES = [
  'Service Engineer', 'Field Coordinator', 'Technician',
  'Account Manager', 'Project Manager', 'Sales Executive',
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-500 outline-none transition-all placeholder:text-slate-400';

// Seed data used when backend has no field-staff module yet
const SEED = [
  { id: 's1', name: 'Rahul Sharma',  role: 'Service Engineer',  phone: '+91 98765 43210', email: 'rahul@srv.com',  status: 'ACTIVE',   contracts: 3 },
  { id: 's2', name: 'Priya Nair',    role: 'Field Coordinator', phone: '+91 98765 43211', email: 'priya@srv.com',  status: 'ACTIVE',   contracts: 2 },
  { id: 's3', name: 'Vijay Kumar',   role: 'Technician',        phone: '+91 98765 43212', email: 'vijay@srv.com',  status: 'ON_LEAVE', contracts: 1 },
  { id: 's4', name: 'Sunita Reddy',  role: 'Account Manager',   phone: '+91 98765 43213', email: 'sunita@srv.com', status: 'ACTIVE',   contracts: 4 },
  { id: 's5', name: 'Arjun Das',     role: 'Project Manager',   phone: '+91 98765 43214', email: 'arjun@srv.com',  status: 'ACTIVE',   contracts: 5 },
  { id: 's6', name: 'Kavitha Menon', role: 'Sales Executive',   phone: '+91 98765 43215', email: 'kavitha@srv.com',status: 'ACTIVE',   contracts: 2 },
];

export default function ServicesStaffPage() {
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name: '', phone: '', email: '', role: ROLES[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try to pull from staff/doctors endpoint; fall back to seed
      const res = await api.get('/doctors', { params: { limit: 20 } });
      const docs = res.data?.data ?? [];
      if (docs.length > 0) {
        setStaff(docs.map((d: any, i: number) => ({
          id       : d.id,
          name     : d.user ? `${d.user.firstName} ${d.user.lastName ?? ''}`.trim()
                            : `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(),
          role     : d.specialties?.[0] ?? d.specialization ?? ROLES[i % ROLES.length],
          phone    : d.user?.phone ?? d.phone ?? '—',
          email    : d.user?.email ?? d.email ?? '—',
          status   : 'ACTIVE',
          contracts: d._count?.appointments ?? 0,
        })));
      } else {
        setStaff([]);
      }
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const header = ['Name', 'Phone', 'Email', 'Role', 'Status', 'Contracts'];
    const rows = staff.map(s => [s.name ?? '', s.phone ?? '', s.email ?? '', s.role ?? '', s.status ?? '', s.contracts ?? 0]);
    const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `services-staff-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${staff.length} staff members`);
  };
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setStaff(prev => [...prev, {
      id: `local-${Date.now()}`,
      name: form.name, phone: form.phone, email: form.email,
      role: form.role, status: 'ACTIVE', contracts: 0,
    }]);
    toast.success(`${form.name} added`);
    setForm({ name: '', phone: '', email: '', role: ROLES[0] });
    setShowAdd(false);
    setSaving(false);
  };

  const active   = staff.filter(s => s.status === 'ACTIVE').length;
  const onLeave  = staff.filter(s => s.status === 'ON_LEAVE').length;
  const contracts = staff.reduce((a, s) => a + (s.contracts ?? 0), 0);

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Staff</h1>
          <p className="text-sm text-slate-500 mt-0.5">{active} active · {onLeave} on leave · {staff.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={staff.length === 0}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Active Staff',        v: active,    color: '#10B981' },
          { l: 'On Leave',            v: onLeave,   color: '#F59E0B' },
          { l: 'Contracts Assigned',  v: contracts, color: THEME     },
        ].map(k => (
          <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500 mb-1">{k.l}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {staff.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {s.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 truncate text-sm">{s.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.role}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</div>
                {s.email !== '—' && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{s.email}</div>}
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  {s.contracts} contract{s.contracts !== 1 ? 's' : ''} assigned
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Staff</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: 'name',  label: 'Name *',  ph: 'Full name',    type: 'text'  },
                { key: 'phone', label: 'Phone *', ph: '+91 98765…',   type: 'tel'   },
                { key: 'email', label: 'Email',   ph: 'work@email.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{f.label}</label>
                  <input type={f.type} className={inputCls} placeholder={f.ph}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Role</label>
                <select className={inputCls} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
