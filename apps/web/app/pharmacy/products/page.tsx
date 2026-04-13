'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Pill, Plus, Search, RefreshCw, X, Loader2, AlertTriangle, Download,
  Clock, Package, ChevronLeft, ChevronRight, Edit3, CheckCircle2,
} from 'lucide-react';

const NAV_COLOR = '#166534';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 outline-none transition-all placeholder:text-slate-400';

const FORMS = ['Tablet','Capsule','Syrup','Suspension','Injection','Cream','Ointment','Drops','Inhaler','Patch','Suppository','Sachet'];
const CATEGORIES = ['Analgesic','Antibiotic','Antifungal','Antiviral','Antacid','Antihistamine','Antidiabetic','Antihypertensive','Cardiovascular','Dermatology','ENT','Gastrointestinal','Hormonal','Multivitamin','Neurological','Ophthalmic','Respiratory','Surgical','Vaccines','General'];

function AddProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', genericName: '', manufacturer: '', category: 'General', composition: '',
    strength: '', form: 'Tablet', schedule: '', mrp: '', costPrice: '', sellingPrice: '',
    gstRate: '12', minimumStock: '10', unit: 'Strip', unitsPerPack: '10',
    storageCondition: '', requiresPrescription: false, isControlledSubstance: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.mrp || !form.sellingPrice) {
      toast.error('Name, MRP and selling price are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/pharmacy/products', {
        ...form,
        mrp: Number(form.mrp), costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice), gstRate: Number(form.gstRate),
        minimumStock: Number(form.minimumStock), unitsPerPack: Number(form.unitsPerPack),
      });
      toast.success(`${form.name} added to catalogue`);
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add product');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Add Drug to Catalogue</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Drug Identity */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Drug Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Brand Name <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="e.g. Paracetamol 500mg Tab" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Generic Name</label>
                <input className={inputCls} placeholder="Paracetamol" value={form.genericName} onChange={set('genericName')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Manufacturer</label>
                <input className={inputCls} placeholder="Sun Pharma" value={form.manufacturer} onChange={set('manufacturer')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Form</label>
                <select className={inputCls} value={form.form} onChange={set('form')}>
                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select className={inputCls} value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Strength</label>
                <input className={inputCls} placeholder="500mg / 10mg/5ml" value={form.strength} onChange={set('strength')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Drug Schedule</label>
                <select className={inputCls} value={form.schedule} onChange={set('schedule')}>
                  <option value="">OTC (No Schedule)</option>
                  <option value="H">Schedule H</option>
                  <option value="H1">Schedule H1</option>
                  <option value="X">Schedule X</option>
                  <option value="G">Schedule G</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Composition</label>
                <input className={inputCls} placeholder="Paracetamol 500mg" value={form.composition} onChange={set('composition')} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pricing</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">MRP (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} step={0.01} className={inputCls} placeholder="150.00" value={form.mrp} onChange={set('mrp')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Price (₹)</label>
                <input type="number" min={0} step={0.01} className={inputCls} placeholder="100.00" value={form.costPrice} onChange={set('costPrice')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Selling Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} step={0.01} className={inputCls} placeholder="140.00" value={form.sellingPrice} onChange={set('sellingPrice')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">GST Rate (%)</label>
                <select className={inputCls} value={form.gstRate} onChange={set('gstRate')}>
                  {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Unit</label>
                <select className={inputCls} value={form.unit} onChange={set('unit')}>
                  {['Strip','Bottle','Vial','Tube','Box','Sachet','Ampule','Patch'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Units per Pack</label>
                <input type="number" min={1} className={inputCls} value={form.unitsPerPack} onChange={set('unitsPerPack')} />
              </div>
            </div>
          </div>

          {/* Stock & Control */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Stock & Control</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Minimum Stock (reorder level)</label>
                <input type="number" min={0} className={inputCls} value={form.minimumStock} onChange={set('minimumStock')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Storage Condition</label>
                <select className={inputCls} value={form.storageCondition} onChange={set('storageCondition')}>
                  <option value="">Standard</option>
                  <option value="Cool & Dry">Cool & Dry (15-25°C)</option>
                  <option value="Refrigerate">Refrigerate (2-8°C)</option>
                  <option value="Freeze">Freeze (-20°C)</option>
                  <option value="Protect from Light">Protect from Light</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <input type="checkbox" checked={form.requiresPrescription}
                  onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))}
                  className="w-4 h-4 accent-[#166534]" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Requires Prescription</p>
                  <p className="text-xs text-slate-400">Cannot be dispensed without Rx</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                <input type="checkbox" checked={form.isControlledSubstance}
                  onChange={e => setForm(f => ({ ...f, isControlledSubstance: e.target.checked }))}
                  className="w-4 h-4 accent-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Controlled Substance</p>
                  <p className="text-xs text-red-600">Schedule H1 / X — requires special log</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Drug
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PharmacyProductsPage() {
  const [products, setProducts]     = useState<any[]>([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [catFilter, setCat]         = useState('');
  const [lowStockOnly, setLowStock] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 30 };
      if (debSearch) params.search = debSearch;
      if (catFilter) params.category = catFilter;
      if (lowStockOnly) params.lowStock = 'true';
      const res = await api.get('/pharmacy/products', { params });
      setProducts(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 30, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [debSearch, catFilter, lowStockOnly]);

  useEffect(() => { load(1); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/pharmacy/products', { params: { limit: 5000 } });
      const all: any[] = res.data.data ?? products;
      const header = ['Name', 'Generic Name', 'Category', 'Form', 'Strength', 'Stock', 'Min Stock', 'Active'];
      const rows = all.map(p => [p.name??'', p.genericName??'', p.category??'', p.form??'', p.strength??'', p.currentStock??0, p.minimumStock??0, p.isActive!==false?'Yes':'No']);
      const csv=[header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`pharmacy-products-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();URL.revokeObjectURL(url);toast.success(`Exported ${all.length} products`);
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await api.put(`/pharmacy/products/${id}`, { isActive: !currentlyActive });
      setProducts(p => p.map(prod => prod.id === id ? { ...prod, isActive: !currentlyActive } : prod));
      toast.success(currentlyActive ? 'Product deactivated' : 'Product activated');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drug Catalogue</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: NAV_COLOR }}>
            <Plus className="w-4 h-4" /> Add Drug
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by name, generic, or composition…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCat(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setLowStock(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${lowStockOnly ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
          <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
        </button>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Drug', 'Form / Strength', 'Category', 'MRP', 'Stock', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                ))}</tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Pill className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No products found</p>
                  <button onClick={() => setShowAdd(true)}
                    className="mt-3 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
                    style={{ background: NAV_COLOR }}>
                    <Plus className="w-4 h-4" /> Add First Drug
                  </button>
                </td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    {p.genericName && <p className="text-xs text-slate-400">{p.genericName}</p>}
                    {p.manufacturer && <p className="text-xs text-slate-300">{p.manufacturer}</p>}
                    {p.requiresPrescription && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">Rx Only</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{p.form}</span>
                  {p.strength && <p className="text-xs text-slate-400 mt-0.5">{p.strength}</p>}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-600">{p.category}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-slate-900">₹{(p.mrp / 100).toFixed(2)}</td>
                <td className="px-5 py-3.5">
                  <div>
                    <p className={`text-sm font-bold ${p.currentStock === 0 ? 'text-red-600' : p.isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                      {p.currentStock} {p.unit}s
                    </p>
                    {p.isLowStock && p.currentStock > 0 && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Low</p>
                    )}
                    {p.currentStock === 0 && (
                      <p className="text-[10px] text-red-600 font-bold">OUT OF STOCK</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => toggleActive(p.id, p.isActive)}
                      className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onCreated={() => load(1)} />}
    </div>
  );
}
