'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Package, Plus, Search, X, Loader2 } from 'lucide-react';
const PRODUCTS = [
  { id:'1', name:'Hospital Bed Electric 3-Function', category:'Beds', price:'₹1,85,000', stock:8,  sku:'HB-3F-001' },
  { id:'2', name:'Oxygen Concentrator 5LPM',         category:'Respiratory', price:'₹42,000', stock:15, sku:'OC-5L-001' },
  { id:'3', name:'Digital Patient Monitor 5-Para',   category:'Monitors', price:'₹89,000', stock:5, sku:'PM-5P-001' },
  { id:'4', name:'Infusion Pump Single Channel',     category:'Infusion', price:'₹38,500', stock:20, sku:'IP-SC-001' },
  { id:'5', name:'Portable Ventilator',              category:'Respiratory', price:'₹3,20,000', stock:3, sku:'PV-001' },
  { id:'6', name:'Wheelchair Standard',              category:'Mobility', price:'₹8,500', stock:30, sku:'WC-STD-001' },
  { id:'7', name:'ECG Machine 12-Lead',              category:'Diagnostics', price:'₹65,000', stock:6, sku:'ECG-12L-001' },
  { id:'8', name:'Pulse Oximeter Fingertip',         category:'Diagnostics', price:'₹2,800', stock:50, sku:'PO-FT-001' },
];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40AF] outline-none transition-all placeholder:text-slate-400';
const CATS = [...new Set(PRODUCTS.map(p=>p.category))];
export default function EquipmentProductsPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat]       = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm] = useState({ name:'', category:'Beds', price:'', stock:'' });
  const [saving, setSaving] = useState(false);
  const filtered = PRODUCTS.filter(p=>(!search||p.name.toLowerCase().includes(search.toLowerCase()))&&(!cat||p.category===cat));
  const save = async()=>{if(!form.name){toast.error('Name required');return;}setSaving(true);await new Promise(r=>setTimeout(r,700));toast.success('Product added!');setShowAdd(false);setSaving(false);};
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Catalogue</h1>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:'#1E40AF'}}><Plus className="w-4 h-4"/>Add Product</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1"><Search className="w-4 h-4 text-slate-400"/><input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" placeholder="Search equipment…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none" value={cat} onChange={e=>setCat(e.target.value)}><option value="">All Categories</option>{CATS.map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">{['SKU','Product','Category','Price','In Stock',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(p=>(
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{p.sku}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{p.name}</td>
                <td className="px-5 py-3.5"><span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.category}</span></td>
                <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">{p.price}</td>
                <td className="px-5 py-3.5 text-sm text-slate-700">{p.stock} units</td>
                <td className="px-4 py-3.5 text-right"><button onClick={()=>toast.success(`Enquiry sent for ${p.name}`)} className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-white bg-[#1E40AF] px-3 py-1.5 rounded-lg">Enquire</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Add Product</h2><button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Product Name *</label><input className={inputCls} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category</label><select className={inputCls} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{['Beds','Respiratory','Monitors','Infusion','Mobility','Diagnostics','Surgical','ICU'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Price (₹)</label><input className={inputCls} placeholder="85000" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Stock</label><input type="number" className={inputCls} value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{background:'#1E40AF'}}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Add Product</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
