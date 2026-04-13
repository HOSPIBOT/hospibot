'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Truck, Plus, RefreshCw, X, Loader2, Phone, Mail, MapPin, Star } from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166834] outline-none transition-all placeholder:text-slate-400';

const EMPTY_FORM = {
  name: '', contactPerson: '', phone: '', email: '',
  address: '', city: '', gstNumber: '', creditDays: '30',
};

function SupplierModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.phone) { toast.error('Supplier name and phone required'); return; }
    setSaving(true);
    try {
      await api.post('/pharmacy/suppliers', {
        ...form,
        creditDays: form.creditDays ? Number(form.creditDays) : 30,
      });
      toast.success(`${form.name} added as supplier!`);
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add Supplier</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Name *</label>
            <input className={inputCls} placeholder="Sun Pharma Distributors" value={form.name} onChange={f('name')} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contact Person</label>
            <input className={inputCls} placeholder="Rajesh Sharma" value={form.contactPerson} onChange={f('contactPerson')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone *</label>
            <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={f('phone')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email</label>
            <input type="email" className={inputCls} placeholder="orders@supplier.com" value={form.email} onChange={f('email')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Credit Days</label>
            <input type="number" className={inputCls} placeholder="30" value={form.creditDays} onChange={f('creditDays')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">GST Number</label>
            <input className={inputCls} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={f('gstNumber')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">City</label>
            <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={f('city')} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Address</label>
            <input className={inputCls} placeholder="Street address" value={form.address} onChange={f('address')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-[#166834] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Supplier
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PharmacySuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacy/suppliers');
      setSuppliers(res.data ?? []);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#166834]" /> Suppliers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{suppliers.length} suppliers registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#166834] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No suppliers added yet</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Add your drug distributors and suppliers to manage purchase orders</p>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#166834] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto">
            <Plus className="w-4 h-4" /> Add First Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {suppliers.map(s => (
            <a key={s.id} href={`/pharmacy/suppliers/${s.id}`} className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-emerald-200 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-[#166834] transition-colors">{s.name}</p>
                  {s.contactPerson && <p className="text-xs text-slate-500 mt-0.5">{s.contactPerson}</p>}
                </div>
                {s.creditDays && (
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {s.creditDays}d credit
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                {s.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {(s.address || s.city) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{[s.address, s.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              {s.gstNumber && (
                <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                  GST: <span className="font-mono">{s.gstNumber}</span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {showAdd && (
        <SupplierModal onClose={() => setShowAdd(false)} onSaved={load} />
      )}
    </div>
  );
}
