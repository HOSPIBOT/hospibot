'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, X, Loader2, RefreshCw,
  Shield, CheckCircle2, Mail, Phone, Stethoscope,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

// Lab-specific roles with descriptions
const LAB_ROLES = [
  { value: 'TENANT_ADMIN',   label: 'Lab Administrator',   color: 'bg-red-100 text-red-700',      desc: 'Full access to all settings and data' },
  { value: 'PATHOLOGIST',    label: 'Pathologist',          color: 'bg-purple-100 text-purple-700',desc: 'Sign-off reports, validate results, critical value override' },
  { value: 'LAB_TECHNICIAN', label: 'Lab Technician',       color: 'bg-blue-100 text-blue-700',    desc: 'Enter results, operate analysers, QC runs' },
  { value: 'PHLEBOTOMIST',   label: 'Phlebotomist',         color: 'bg-cyan-100 text-cyan-700',    desc: 'Sample collection, home visits, dispatch' },
  { value: 'RECEPTIONIST',   label: 'Front Desk / Reception',color: 'bg-slate-100 text-slate-600', desc: 'Register patients, create orders, billing' },
  { value: 'BILLING_STAFF',  label: 'Billing Staff',        color: 'bg-amber-100 text-amber-700',  desc: 'Invoicing, payments, TPA billing' },
  { value: 'RADIOLOGIST',    label: 'Radiologist',          color: 'bg-indigo-100 text-indigo-700',desc: 'Radiology reports, scan interpretation' },
  { value: 'BRANCH_ADMIN',   label: 'Branch Manager',       color: 'bg-green-100 text-green-700',  desc: 'Manage a single branch, view branch reports' },
];

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'LAB_TECHNICIAN', password: '',
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.firstName || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      toast.success(`${form.firstName} added to lab team`);
      onInvited(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const selectedRole = LAB_ROLES.find(r => r.value === form.role);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Add Staff Member</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Role selector */}
          <div>
            <label className={labelCls}>Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {LAB_ROLES.map(r => (
                <button key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    form.role === r.value ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${r.color}`}>
                    {r.label.split('/')[0].trim().split(' ')[0]}
                  </span>
                  <span className={`text-xs font-semibold ${form.role === r.value ? 'text-[#1E3A5F]' : 'text-slate-600'}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
            {selectedRole && (
              <p className="text-xs text-slate-400 mt-2 px-1">
                <span className="font-semibold text-slate-600">{selectedRole.label}:</span> {selectedRole.desc}
              </p>
            )}
          </div>

          {/* Personal details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input className={inputCls} placeholder="Priya" value={form.firstName} onChange={setF('firstName')} />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input className={inputCls} placeholder="Sharma" value={form.lastName} onChange={setF('lastName')} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input className={inputCls} type="email" placeholder="priya@labname.com" value={form.email} onChange={setF('email')} />
            </div>
            <div>
              <label className={labelCls}>Mobile</label>
              <input className={inputCls} type="tel" placeholder="9876543210" value={form.phone} onChange={setF('phone')} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Temporary Password *</label>
              <input className={inputCls} type="password" placeholder="They can change this after first login"
                value={form.password} onChange={setF('password')} />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Add to Team
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffCard({ user, onToggle }: { user: any; onToggle: (id: string, active: boolean) => void }) {
  const [toggling, setToggling] = useState(false);
  const role = LAB_ROLES.find(r => r.value === user.role);
  const name = `${user.firstName} ${user.lastName ?? ''}`.trim();
  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(user.id, !user.isActive); }
    finally { setToggling(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${user.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: user.isActive ? NAVY : '#94A3B8' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{name}</p>
          {role && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.color}`}>
              {role.label}
            </span>
          )}
        </div>
        <button onClick={handleToggle} disabled={toggling}
          className={`w-9 h-5 rounded-full transition-all flex-shrink-0 disabled:opacity-50 ${user.isActive ? '' : 'bg-slate-300'}`}
          style={user.isActive ? { background: NAVY } : {}}>
          {toggling ? (
            <div className="w-3 h-3 bg-white rounded-full mx-auto animate-pulse" />
          ) : (
            <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${user.isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
          )}
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{user.email}</p>
        {user.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{user.phone}</p>}
        {user.lastLoginAt && (
          <p className="text-slate-400">
            Last login: {new Date(user.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        )}
        {!user.isActive && <p className="text-red-500 font-semibold">Deactivated</p>}
      </div>
    </div>
  );
}

export default function DiagnosticStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, page: 1 };
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await api.get('/auth/users', { params });
      setStaff(res.data.data ?? []);
      setMeta(res.data.meta ?? meta);
    } finally { setLoading(false); }
  }, [search, role, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const toggleUser = async (userId: string, active: boolean) => {
    try {
      await api.patch(`/auth/users/${userId}`, { isActive: active });
      toast.success(active ? 'Staff member activated' : 'Staff member deactivated');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const roleCounts = staff.reduce((acc: any, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500">{staff.filter(s => s.isActive).length} active · {meta.total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setRole('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${!role ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          style={!role ? { background: NAVY } : {}}>
          All ({meta.total})
        </button>
        {LAB_ROLES.map(r => {
          const cnt = roleCounts[r.value] ?? 0;
          if (cnt === 0) return null;
          return (
            <button key={r.value} onClick={() => setRole(role === r.value ? '' : r.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                role === r.value ? `${r.color} border-transparent` : `bg-white border-slate-200 text-slate-600`
              }`}>
              {r.label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setSearch('')}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No staff members found</p>
          <p className="text-sm mt-1">Add pathologists, technicians, and front desk staff</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {staff.map(u => (
            <StaffCard key={u.id} user={u} onToggle={toggleUser} />
          ))}
        </div>
      )}

      {adding && (
        <InviteModal
          onClose={() => setAdding(false)}
          onInvited={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
