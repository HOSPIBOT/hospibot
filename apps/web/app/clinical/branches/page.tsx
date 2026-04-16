'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2, Plus, RefreshCw, X, Loader2, MapPin,
  Phone, Mail, Star, CheckCircle2, Edit3, Save,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

const EMPTY_FORM = {
  name: '', address: '', city: '', state: '',
  pincode: '', phone: '', email: '', isMain: false,
};

function BranchModal({
  branch, onClose, onSaved,
}: { branch?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!branch;
  const [form, setForm] = useState(branch || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) { toast.error('Branch name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/tenants/current/branches/${branch.id}`, form);
        toast.success('Branch updated!');
      } else {
        await api.post('/tenants/current/branches', form);
        toast.success(`${form.name} branch created!`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save branch');
    } finally { setSaving(false); }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? `Edit ${branch.name}` : 'Add New Branch'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Branch Name *</label>
            <input className={inputCls} placeholder="Main Branch / Banjara Hills / Jubilee Hills…"
              value={form.name} onChange={set('name')} />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Address</label>
            <input className={inputCls} placeholder="Street address, area, landmark"
              value={form.address} onChange={set('address')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
            <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={set('city')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">State</label>
            <input className={inputCls} placeholder="Telangana" value={form.state} onChange={set('state')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
            <input className={inputCls} placeholder="500001" value={form.pincode} onChange={set('pincode')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone</label>
            <input className={inputCls} placeholder="+91 40 1234 5678" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" className={inputCls} placeholder="branch@clinic.com" value={form.email} onChange={set('email')} />
          </div>

          <label className="col-span-2 flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <input type="checkbox" checked={form.isMain}
              onChange={e => setForm((f: any) => ({ ...f, isMain: e.target.checked }))}
              className="w-4 h-4 accent-amber-500" />
            <span className="text-sm font-medium text-amber-900">Set as main/headquarters branch</span>
          </label>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create Branch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editBranch, setEdit]   = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/current/branches');
      setBranches(res.data ?? []);
    } catch { toast.error('Failed to load branches'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (b: any) => {
    try {
      await api.patch(`/tenants/current/branches/${b.id}`, { isActive: !b.isActive });
      setBranches(prev => prev.map((x: any) => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
      toast.success(`${b.name} ${!b.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0D7C66]" /> Branches
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {branches.length} branch{branches.length !== 1 ? 'es' : ''} · Manage your multi-location setup
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F]">
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {/* Branches grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-52" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No branches configured</p>
          <p className="text-slate-300 text-sm mt-1 mb-5">Add your clinic locations for multi-branch management</p>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {branches.map((b: any) => (
            <div key={b.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${b.isMain ? 'border-[#0D7C66]/30' : 'border-slate-100'} ${!b.isActive ? 'opacity-60' : ''}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{b.name}</p>
                    {b.isMain && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" /> Main
                      </span>
                    )}
                  </div>
                  {b.city && <p className="text-xs text-slate-400 mt-0.5">{b.city}{b.state ? `, ${b.state}` : ''}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {b.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{b.address}{b.pincode ? `, ${b.pincode}` : ''}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span>{b.phone}</span>
                  </div>
                )}
                {b.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{b.email}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                <button onClick={() => setEdit(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => toggleActive(b)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-colors ${
                    b.isActive
                      ? 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                      : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                  }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {b.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editBranch) && (
        <BranchModal
          branch={editBranch}
          onClose={() => { setShowAdd(false); setEdit(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
