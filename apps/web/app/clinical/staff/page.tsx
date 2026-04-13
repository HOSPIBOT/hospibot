'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, RefreshCw, X, Loader2,
  Phone, Mail, Shield, CheckCircle2, XCircle, Edit3,
} from 'lucide-react';

const ROLES = [
  'DOCTOR', 'RECEPTIONIST', 'NURSE', 'BILLING_STAFF',
  'LAB_TECHNICIAN', 'PHARMACIST', 'MARKETING_USER', 'BRANCH_ADMIN',
];

const ROLE_COLORS: Record<string, string> = {
  DOCTOR:          'bg-amber-100 text-amber-700',
  RECEPTIONIST:    'bg-slate-100 text-slate-600',
  NURSE:           'bg-pink-100 text-pink-700',
  BILLING_STAFF:   'bg-orange-100 text-orange-700',
  LAB_TECHNICIAN:  'bg-cyan-100 text-cyan-700',
  PHARMACIST:      'bg-indigo-100 text-indigo-700',
  MARKETING_USER:  'bg-rose-100 text-rose-700',
  BRANCH_ADMIN:    'bg-blue-100 text-blue-700',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'RECEPTIONIST', password: '',
  });
  const [saving, setSaving] = useState(false);

  const invite = async () => {
    if (!form.firstName || !form.email || !form.password) {
      toast.error('First name, email, and password required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/users', {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone || undefined,
        role: form.role, password: form.password,
      });
      toast.success(`${form.firstName} invited as ${form.role}. They can log in at /auth/login.`);
      onInvited(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to invite staff member');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Invite Staff Member</h2>
            <p className="text-xs text-slate-400 mt-0.5">They'll receive credentials to log in</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">First Name *</label>
            <input className={inputCls} placeholder="Priya" value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Last Name</label>
            <input className={inputCls} placeholder="Nair" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email *</label>
            <input type="email" className={inputCls} placeholder="priya@clinic.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone</label>
            <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Role *</label>
            <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Temporary Password *</label>
            <input type="password" className={inputCls} placeholder="Min 8 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <p className="text-[10px] text-slate-400 mt-1">Staff member should change this on first login</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={invite} disabled={saving}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Invite Staff Member
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalStaffPage() {
  const [staff, setStaff]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');
  const [showInvite, setInvite] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setStaff(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (userId: string, currentActive: boolean, name: string) => {
    try {
      await api.patch(`/auth/users/${userId}`, { isActive: !currentActive });
      setStaff(prev => prev.map(s => s.id === userId ? { ...s, isActive: !currentActive } : s));
      toast.success(`${name} ${!currentActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update'); }
  };

  const filtered = staff.filter(s => {
    const matchSearch = !search || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0D7C66]" /> Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {staff.filter(s => s.isActive !== false).length} active · {staff.length} total staff members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setInvite(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F]">
            <Plus className="w-4 h-4" /> Invite Staff
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none"
          value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Staff table */}
      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-16"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No staff members found</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Invite your team members to get started</p>
          <button onClick={() => setInvite(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] mx-auto">
            <Plus className="w-4 h-4" /> Invite First Staff Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Staff Member', 'Contact', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => {
                const name = `${s.firstName} ${s.lastName || ''}`.trim();
                const active = s.isActive !== false;
                return (
                  <tr key={s.id} className={`hover:bg-slate-50/60 transition-colors ${!active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{s.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[s.role] || 'bg-slate-100 text-slate-600'}`}>
                        {(s.role || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {active
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className={`text-xs font-medium ${active ? 'text-emerald-600' : 'text-red-400'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleActive(s.id, active, name)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                            active
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setInvite(false)} onInvited={load} />}
    </div>
  );
}
