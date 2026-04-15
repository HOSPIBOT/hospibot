'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FlaskConical, Plus, Search, RefreshCw, X, Loader2,
  Clock, Home, CheckCircle2, Edit3, Trash2,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const CATEGORIES = ['Haematology', 'Biochemistry', 'Urine', 'Microbiology', 'Serology', 'Hormones', 'Stool', 'Other'];
const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'CSF', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Haematology: 'bg-red-100 text-red-700', Biochemistry: 'bg-blue-100 text-blue-700',
  Urine: 'bg-yellow-100 text-yellow-700', Microbiology: 'bg-green-100 text-green-700',
  Serology: 'bg-purple-100 text-purple-700', Hormones: 'bg-pink-100 text-pink-700',
  Stool: 'bg-amber-100 text-amber-700', Other: 'bg-slate-100 text-slate-600',
};

function AddTestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ code: '', name: '', category: 'Haematology', price: '', turnaroundHrs: 24, sampleType: 'Blood', unit: '', normalRange: '', methodology: '', isHomeCollectionAllowed: true });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.price) { toast.error('Code, name, and price are required'); return; }
    setSubmitting(true);
    try {
      await api.post('/diagnostic/catalog', { ...form, price: Number(form.price), turnaroundHrs: Number(form.turnaroundHrs) })
        .catch(() => api.post('/lab/catalog', { ...form, price: Number(form.price), turnaroundHrs: Number(form.turnaroundHrs) }));
      toast.success(`${form.name} added to catalog`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add test');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Add Test to Catalog</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Test Code <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="e.g. CBC, HbA1c" value={form.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
            <select className={inputCls} value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Test Name <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="e.g. Complete Blood Count" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Price (₹) <span className="text-red-500">*</span></label>
            <input type="number" min={0} className={inputCls} placeholder="250" value={form.price} onChange={set('price')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">TAT (hours)</label>
            <input type="number" min={1} className={inputCls} value={form.turnaroundHrs} onChange={set('turnaroundHrs')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Sample Type</label>
            <select className={inputCls} value={form.sampleType} onChange={set('sampleType')}>
              {SAMPLE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Unit</label>
            <input className={inputCls} placeholder="g/dL, mg/L, IU/L" value={form.unit} onChange={set('unit')} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Normal Range</label>
            <input className={inputCls} placeholder="e.g. 13.5-17.5 g/dL (Male)" value={form.normalRange} onChange={set('normalRange')} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isHomeCollectionAllowed}
                onChange={e => setForm(f => ({ ...f, isHomeCollectionAllowed: e.target.checked }))}
                className="w-4 h-4 accent-[#1E3A5F]" />
              <span className="text-sm text-slate-700 font-medium">Home collection available for this test</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: '#1E3A5F' }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestCatalogPage() {
  const [grouped, setGrouped]   = useState<Record<string, any[]>>({});
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [seeding, setSeeding]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const res = await api.get('/diagnostic/catalog', { params });
      setGrouped(res.data.grouped || {});
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load catalog'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const seedCatalog = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/diagnostic/catalog/seed');
      toast.success(`${res.data.seeded} standard tests seeded!`);
      load();
    } catch { toast.error('Failed to seed catalog'); }
    finally { setSeeding(false); }
  };

  const deleteTest = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from catalog?`)) return;
    try {
      await api.delete(`/diagnostic/catalog/${id}`);
      toast.success(`${name} removed`);
      load();
    } catch { toast.error('Failed to remove test'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} tests in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedCatalog} disabled={seeding}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            Seed 25 Default Tests
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: '#1E3A5F' }}>
            <Plus className="w-4 h-4" /> Add Test
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search by test name or code…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all ${
                catFilter === c ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={catFilter === c ? { background: '#1E3A5F' } : {}}>
              {c || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped catalog */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No tests in catalog yet</p>
          <button onClick={seedCatalog} disabled={seeding}
            className="mt-4 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity mx-auto flex items-center gap-2"
            style={{ background: '#1E3A5F' }}>
            <FlaskConical className="w-4 h-4" /> Seed 25 Standard Tests
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, tests]) => (
            <div key={category} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}>
                  {category}
                </span>
                <span className="text-xs text-slate-400">{tests.length} tests</span>
              </div>
              <div className="divide-y divide-slate-50">
                {tests.map((test: any) => (
                  <div key={test.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-xs font-bold font-mono text-[#1E3A5F]">{test.code}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{test.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.turnaroundHrs}h TAT</span>
                        <span>{test.sampleType}</span>
                        {test.unit && <span>Unit: {test.unit}</span>}
                        {test.isHomeCollectionAllowed && <span className="flex items-center gap-1 text-emerald-600"><Home className="w-3 h-3" /> Home</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-900">₹{(test.price / 100).toFixed(0)}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => deleteTest(test.id, test.name)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddTestModal onClose={() => setShowAdd(false)} onCreated={load} />}
    </div>
  );
}
