'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Store, Plus, RefreshCw, X, Loader2, Eye, EyeOff, Star, Truck } from 'lucide-react';

const NAV_COLOR = '#166534';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] outline-none transition-all placeholder:text-slate-400';

export default function PharmacyMarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', category:'OTC Medicines', price:'', mrp:'', priceUnit:'per strip', isHomeDelivery:false, deliveryDays:'2', tags:'', featured:false });

  const load = useCallback(async() => {
    setLoading(true);
    try { const r = await api.get('/marketplace/my-products'); setProducts(r.data.data??[]); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async() => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    setSubmitting(true);
    try {
      await api.post('/marketplace/my-products', {
        ...form,
        price: Number(form.price), mrp: form.mrp ? Number(form.mrp) : undefined,
        tags: form.tags ? form.tags.split(',').map((t: any) =>t.trim()) : [],
        deliveryDays: form.isHomeDelivery ? Number(form.deliveryDays) : undefined,
      });
      toast.success(`${form.name} listed on HospiBot Marketplace!`);
      setShowUpload(false); load();
    } catch(e:any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const toggle = async(id:string, isAvailable:boolean) => {
    try {
      await api.put(`/marketplace/my-products/${id}`, { isAvailable: !isAvailable });
      setProducts(p => p.map((prod: any) => prod.id===id ? {...prod, isAvailable: !isAvailable} : prod));
      toast.success(!isAvailable ? 'Product listed' : 'Product unlisted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6" style={{color:NAV_COLOR}}/> Marketplace Listings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">List your pharmacy products on the HospiBot Marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
          <button onClick={()=>setShowUpload(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:NAV_COLOR}}><Plus className="w-4 h-4"/>List Product</button>
        </div>
      </div>

      <div className="bg-[#F0FDF4] border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
        <strong>HospiBot Marketplace</strong> — Your products will be visible to patients and hospitals across the HospiBot network.
        They can browse, order, and pay — and you fulfill the order.
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-48"/>)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Store className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm font-medium">No products listed on marketplace yet</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">List your pharmacy products to reach more patients</p>
          <button onClick={()=>setShowUpload(true)} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2" style={{background:NAV_COLOR}}><Plus className="w-4 h-4"/>List First Product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                </div>
                {p.featured && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2"><Star className="w-2.5 h-2.5"/>Featured</span>}
              </div>
              {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold text-slate-900">{formatINR(p.price)}</span>
                {p.mrp && <span className="text-xs text-slate-400 line-through">{formatINR(p.mrp)}</span>}
                <span className="text-xs text-slate-400">{p.priceUnit}</span>
              </div>
              {p.isHomeDelivery && <div className="flex items-center gap-1 text-xs text-emerald-600 mb-3"><Truck className="w-3 h-3"/>Delivery in {p.deliveryDays}d</div>}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full flex-1 text-center ${p.isAvailable?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
                  {p.isAvailable?'Listed':'Unlisted'}
                </span>
                <button onClick={()=>toggle(p.id, p.isAvailable)} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  {p.isAvailable?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}
                  {p.isAvailable?'Unlist':'List'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowUpload(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">List on Marketplace</h2>
              <button onClick={()=>setShowUpload(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Product Name *</label><input className={inputCls} placeholder="e.g. Paracetamol 500mg Strip" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label><textarea className={`${inputCls} resize-none`} rows={2} placeholder="Brief description for marketplace listing" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select className={inputCls} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {['OTC Medicines','Prescription Medicines','Health Supplements','Personal Care','Baby Care','Surgical Supplies','Diagnostics','Equipment'].map((c: any) =><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Price (₹) *</label><input type="number" min={0} step={0.01} className={inputCls} placeholder="150.00" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">MRP (₹)</label><input type="number" min={0} step={0.01} className={inputCls} placeholder="180.00" value={form.mrp} onChange={e=>setForm(f=>({...f,mrp:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Price Unit</label>
                <select className={inputCls} value={form.priceUnit} onChange={e=>setForm(f=>({...f,priceUnit:e.target.value}))}>
                  {['per strip','per bottle','per unit','per pack','per tablet'].map((u: any) =><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tags (comma-separated)</label><input className={inputCls} placeholder="paracetamol, fever, pain relief" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/></div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <input type="checkbox" checked={form.isHomeDelivery} onChange={e=>setForm(f=>({...f,isHomeDelivery:e.target.checked}))} className="w-4 h-4 accent-[#166834]"/>
                <span className="text-sm font-medium text-slate-900">Home Delivery Available</span>
              </label>
              {form.isHomeDelivery && <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Delivery Days</label><input type="number" min={1} className={inputCls} value={form.deliveryDays} onChange={e=>setForm(f=>({...f,deliveryDays:e.target.value}))}/></div>}
              <label className="flex items-center gap-2 cursor-pointer bg-amber-50 rounded-xl px-4 py-3 border border-amber-200 col-span-2">
                <input type="checkbox" checked={form.featured} onChange={e=>setForm(f=>({...f,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500"/>
                <span className="text-sm font-medium text-amber-900">Mark as Featured Product</span>
              </label>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowUpload(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={handleUpload} disabled={submitting} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2" style={{background:NAV_COLOR}}>{submitting&&<Loader2 className="w-4 h-4 animate-spin"/>}List on Marketplace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
