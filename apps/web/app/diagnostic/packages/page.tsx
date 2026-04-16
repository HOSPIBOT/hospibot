'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, Plus, X, Loader2, CheckCircle2, Search,
  FlaskConical, IndianRupee, Edit3, Trash2,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const PACKAGE_TYPES = [
  { value: 'basic', label: 'Basic Health Check', color: '#10B981' },
  { value: 'comprehensive', label: 'Comprehensive', color: '#3B82F6' },
  { value: 'cardiac', label: 'Cardiac Risk', color: '#EF4444' },
  { value: 'diabetes', label: 'Diabetes Panel', color: '#F59E0B' },
  { value: 'corporate', label: 'Corporate Wellness', color: '#8B5CF6' },
  { value: 'women', label: "Women's Health", color: '#EC4899' },
  { value: 'senior', label: 'Senior Citizen', color: '#06B6D4' },
  { value: 'executive', label: 'Executive Full Body', color: '#1E3A5F' },
];

const DEFAULT_PACKAGES = [
  {
    name: 'Basic Health Check',
    packageType: 'basic',
    description: 'Essential blood work and health parameters',
    price: 49900,
    testCodes: ['CBC', 'FBS', 'LFT', 'KFT', 'UCR'],
    isActive: true,
  },
  {
    name: 'Comprehensive Health Check',
    packageType: 'comprehensive',
    description: 'Complete health assessment with thyroid and vitamins',
    price: 149900,
    testCodes: ['CBC', 'FBS', 'PPBS', 'HBA1C', 'LFT', 'KFT', 'LIPID', 'THYROID', 'VITD', 'VITB12', 'UCR'],
    isActive: true,
  },
  {
    name: 'Cardiac Risk Panel',
    packageType: 'cardiac',
    description: 'Heart health and cardiovascular risk assessment',
    price: 99900,
    testCodes: ['CBC', 'LIPID', 'CRP', 'FBS', 'HBA1C', 'KFT'],
    isActive: true,
  },
  {
    name: 'Diabetes Management Panel',
    packageType: 'diabetes',
    description: 'Comprehensive diabetes monitoring',
    price: 79900,
    testCodes: ['FBS', 'PPBS', 'HBA1C', 'LIPID', 'KFT', 'UCR', 'UACR'],
    isActive: true,
  },
];

function PackageModal({
  pkg, catalog, onClose, onSaved,
}: {
  pkg?: any; catalog: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    packageType: pkg?.packageType ?? 'basic',
    description: pkg?.description ?? '',
    price: pkg?.price ? (pkg.price / 100) : '',
    testCodes: pkg?.testCodes ?? [] as string[],
    isActive: pkg?.isActive ?? true,
  });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleTest = (code: string) => {
    setForm(f => ({
      ...f,
      testCodes: f.testCodes.includes(code)
        ? f.testCodes.filter((c: string) => c !== code)
        : [...f.testCodes, code],
    }));
  };

  const filteredCatalog = search
    ? catalog.filter((t: any) => t.code?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase()))
    : catalog;

  const totalRetailPrice = form.testCodes.reduce((sum: number, code: any) => {
    const test = catalog.find((t: any) => t.code === code);
    return sum + (test?.price ?? 0);
  }, 0);

  const saving2 = false;
  const discount = totalRetailPrice > 0 && +form.price > 0
    ? Math.round((1 - (+form.price * 100) / totalRetailPrice) * 100)
    : 0;

  const save = async () => {
    if (!form.name || form.testCodes.length === 0 || !form.price) {
      toast.error('Name, at least one test, and price required');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, price: +form.price * 100 };
      if (pkg?.id) {
        await api.put(`/diagnostic/packages/${pkg.id}`, data);
        toast.success('Package updated');
      } else {
        await api.post('/diagnostic/packages', data);
        toast.success(`Package "${form.name}" created`);
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">{pkg ? 'Edit Package' : 'Create Health Package'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Basic details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Package Name *</label>
              <input className={inputCls} placeholder="e.g. Basic Health Check Package" value={form.name} onChange={setF('name')} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.packageType} onChange={setF('packageType')}>
                {PACKAGE_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Package Price (₹) *</label>
              <input className={inputCls} type="number" placeholder="499" value={form.price} onChange={setF('price')} />
              {discount > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {discount}% discount vs retail ({formatINR(totalRetailPrice)})
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="What does this package include and who is it for?"
                value={form.description} onChange={setF('description')} />
            </div>
          </div>

          {/* Test selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>Select Tests * ({form.testCodes.length} selected)</label>
              {form.testCodes.length > 0 && (
                <button onClick={() => setForm(f => ({ ...f, testCodes: [] }))}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  Clear all
                </button>
              )}
            </div>

            {/* Selected tests */}
            {form.testCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.testCodes.map((code: any) => {
                  const test = catalog.find((t: any) => t.code === code);
                  return (
                    <span key={code}
                      className="inline-flex items-center gap-1 bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-bold px-2.5 py-1 rounded-full">
                      {test?.name ?? code}
                      <button onClick={() => toggleTest(code)} className="hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Catalog search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={`${inputCls} pl-10`} placeholder="Search tests to add…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
              {filteredCatalog.slice(0, 40).map((t: any) => {
                const isSelected = form.testCodes.includes(t.code);
                return (
                  <button key={t.id} onClick={() => toggleTest(t.code)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${isSelected ? 'bg-[#1E3A5F]/5' : ''}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${isSelected ? 'font-semibold text-[#1E3A5F]' : 'text-slate-700'}`}>{t.name}</span>
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0">{t.code}</span>
                    <span className="text-xs font-semibold text-slate-600 flex-shrink-0">{formatINR(t.price * 100)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 sticky bottom-0 bg-white border-t border-slate-100 pt-4">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {pkg ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageCard({ pkg, catalog, onEdit, onToggle }: { pkg: any; catalog: any[]; onEdit: () => void; onToggle: () => void }) {
  const pkgType = PACKAGE_TYPES.find((t: any) => t.value === pkg.packageType);
  const tests = pkg.testCodes?.map((code: string) => catalog.find((t: any) => t.code === code)).filter(Boolean) ?? [];

  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${pkg.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-slate-900">{pkg.name}</p>
            {pkgType && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: pkgType.color }}>
                {pkgType.label}
              </span>
            )}
          </div>
          {pkg.description && <p className="text-xs text-slate-500">{pkg.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle}
            className={`w-9 h-5 rounded-full transition-all ${pkg.isActive ? '' : 'bg-slate-300'}`}
            style={pkg.isActive ? { background: NAVY } : {}}>
            <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${pkg.isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <p className="text-2xl font-black mb-3" style={{ color: NAVY }}>{formatINR(pkg.price)}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {tests.slice(0, 8).map((t: any) => (
          <span key={t.code} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
            {t.code}
          </span>
        ))}
        {pkg.testCodes?.length > 8 && (
          <span className="text-[10px] text-slate-400">+{pkg.testCodes.length - 8}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
        <span>{pkg.testCodes?.length ?? 0} tests included</span>
        {pkg.isActive
          ? <span className="text-emerald-600 font-semibold">● Active</span>
          : <span className="text-slate-400">● Inactive</span>
        }
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, catRes] = await Promise.all([
        api.get('/diagnostic/packages').catch(() => ({ data: [] })),
        api.get('/diagnostic/catalog').catch(() => api.get('/lab/catalog')),
      ]);
      setPackages(pkgRes.data ?? []);
      setCatalog(catRes.data?.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      for (const pkg of DEFAULT_PACKAGES) {
        await api.post('/diagnostic/packages', pkg).catch(() => {});
      }
      toast.success('4 default health packages created!');
      setRefreshKey(k => k + 1);
    } finally { setSeeding(false); }
  };

  const togglePackage = async (pkg: any) => {
    try {
      await api.patch(`/diagnostic/packages/${pkg.id}`, { isActive: !pkg.isActive });
      setRefreshKey(k => k + 1);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Health Packages</h1>
          <p className="text-sm text-slate-500">{packages.filter((p: any) => p.isActive).length} active packages · Build bundles for corporate wellness and health check-ups</p>
        </div>
        <div className="flex items-center gap-2">
          {packages.length === 0 && (
            <button onClick={seedDefaults} disabled={seeding}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4 text-amber-500" />}
              Seed 4 Defaults
            </button>
          )}
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Create Package
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({length: 4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-48" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Health Packages Yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Bundle tests together as packages for corporate wellness programs, health check-ups, and seasonal offers.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={seedDefaults} disabled={seeding}
              className="flex items-center gap-2 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Seed 4 Default Packages
            </button>
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: NAVY }}>
              <Plus className="w-4 h-4" /> Create Custom Package
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {packages.map((pkg: any) => (
            <PackageCard key={pkg.id} pkg={pkg} catalog={catalog}
              onEdit={() => setEditing(pkg)}
              onToggle={() => togglePackage(pkg)} />
          ))}
        </div>
      )}

      {(adding || editing) && (
        <PackageModal
          pkg={editing}
          catalog={catalog}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
