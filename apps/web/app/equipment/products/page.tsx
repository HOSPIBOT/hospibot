'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Package, Plus, Search, RefreshCw, X, Loader2 } from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40AF] outline-none transition-all placeholder:text-slate-400';

export default function EquipmentProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deb, setDeb]           = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name:'', sku:'', category:'', price:'', stock:'10', description:'' });

  useEffect(() => { const t = setTimeout(()=>setDeb(search),350); return ()=>clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/marketplace/products', { params: { search: deb || undefined, limit: 50 } });
      setProducts(r.data.data ?? r.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [deb]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    setSaving(true);
    try {
      await api.post('/marketplace/my-products', {
        name: form.name, sku: form.sku, category: form.category,
        price: Math.round(Number(form.price) * 100),
        stock: Number(form.stock) || 0,
        description: form.description,
      });
      toast.success('Product added!');
      setShowAdd(false);
      setForm({ name:'', sku:'', category:'', price:'', stock:'10', description:'' });
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Catalogue</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
          <button onClick={()=>setShowAdd(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90" style={{background:'#1E40AF'}}>
            <Plus className="w-4 h-4"/> Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36"/>)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm mb-4">No products in catalogue yet</p>
          <button onClick={()=>setShowAdd(true)} className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-90" style={{background:'#1E40AF'}}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {products.map((p: any) =>{
            const inStock = (p.stock??0) > 0 || p.inStock === true;
            return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600"/>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(p.stock??0)===0?'bg-red-100 text-red-700':(p.stock??0)<5?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>
                  {(p.stock??0)===0?'Out of Stock':`${p.stock??0} in stock`}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{p.name}</p>
              {p.sku&&<p className="text-xs font-mono text-slate-400">{p.sku}</p>}
              {p.category&&<p className="text-xs text-slate-500 mt-1">{p.category}</p>}
              <p className="text-lg font-black text-blue-700 mt-2">{formatINR(p.price||0)}</p>
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={async () => {
                    const qty = prompt(`Update stock for "${p.name}" (current: ${p.stock ?? 0}):`, String(p.stock ?? 0));
                    if (qty === null) return;
                    const n = Number(qty);
                    if (isNaN(n) || n < 0) { toast.error('Invalid quantity'); return; }
                    try {
                      await api.patch(`/marketplace/products/${p.id}`, { stock: n });
                      setProducts(prev => prev.map((x: any) => x.id === p.id ? { ...x, stock: n } : x));
                      toast.success('Stock updated');
                    } catch { toast.error('Failed to update stock'); }
                  }}
                  className="flex-1 text-xs font-medium text-center border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  Update Stock
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/marketplace/products/${p.id}`, { inStock: !inStock });
                      setProducts(prev => prev.map((x: any) => x.id === p.id ? { ...x, inStock: !inStock } : x));
                      toast.success(inStock ? 'Marked out of stock' : 'Marked in stock');
                    } catch { toast.error('Failed'); }
                  }}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                    inStock ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}>
                  {inStock ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {showAdd&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Product</h2>
              <button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Product Name *</label>
                <input className={inputCls} placeholder="Hospital Bed Electric 3-Function" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">SKU</label>
                <input className={inputCls} placeholder="HB-3F-001" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category</label>
                <input className={inputCls} placeholder="Beds, Monitors…" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Price (₹) *</label>
                <input type="number" className={inputCls} placeholder="185000" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Stock</label>
                <input type="number" className={inputCls} value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2 hover:opacity-90" style={{background:'#1E40AF'}}>
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
