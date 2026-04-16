'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Package, Plus, Search, RefreshCw, X, Loader2, Star } from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';
const CATEGORIES = ['Equipment', 'Nutrition', 'Therapy', 'Wellness', 'Apparel', 'Supplement'];

export default function WellnessProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', category: 'Equipment', price: '', description: '', inStock: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketplace/my-products').catch(() => api.get('/marketplace/products'));
      setProducts(res.data?.data ?? res.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search ? products.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase())) : products;

  const save = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    setSaving(true);
    try {
      await api.post('/marketplace/products', {
        name: form.name, category: form.category,
        price: Math.round(Number(form.price) * 100),
        description: form.description, inStock: form.inStock,
      });
      toast.success('Product added!');
      setShowAdd(false); setForm({ name: '', category: 'Equipment', price: '', description: '', inStock: true });
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-pink-600" /> Wellness Products
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#BE185D] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">No products found</p>
          <button onClick={()=>setShowAdd(true)} className="mt-4 bg-[#BE185D] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4"/> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
              <p className="text-lg font-black text-[#BE185D]">{p.price ? formatINR(p.price) : '—'}</p>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Product</h2>
              <button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Name *</label>
                <input className={inputCls} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category</label>
                  <select className={inputCls} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map((c: any) =><option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Price (₹) *</label>
                  <input type="number" className={inputCls} placeholder="999" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Description</label>
                <input className={inputCls} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#BE185D] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
