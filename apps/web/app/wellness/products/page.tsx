'use client';
import { useState } from 'react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Package, Plus, Star, X, Loader2 } from 'lucide-react';
const PRODUCTS = [
  { id:'1', name:'Yoga Mat Premium',         category:'Equipment', price:249900, inStock:true },
  { id:'2', name:'Whey Protein 2kg',          category:'Nutrition', price:349900, inStock:true },
  { id:'3', name:'Ayurveda Oil Massage Kit',  category:'Therapy',   price:189900, inStock:true },
  { id:'4', name:'Meditation Cushion Set',    category:'Equipment', price:159900, inStock:false },
  { id:'5', name:'Herbal Immunity Booster',   category:'Nutrition', price:89900,  inStock:true },
  { id:'6', name:'Resistance Bands Set',      category:'Equipment', price:119900, inStock:true },
];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#BE185D] outline-none transition-all placeholder:text-slate-400';
export default function WellnessProductsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', category:'Nutrition', price:'' });
  const [saving, setSaving] = useState(false);
  const save = async()=>{if(!form.name){toast.error('Name required');return;}setSaving(true);await new Promise(r=>setTimeout(r,700));toast.success('Product added!');setShowAdd(false);setSaving(false);};
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Wellness Products</h1>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:'#BE185D'}}><Plus className="w-4 h-4"/>Add Product</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {PRODUCTS.map(p=>(
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-900">{p.name}</p>
                <span className="text-[11px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">{p.category}</span>
              </div>
              {!p.inStock&&<span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Out of Stock</span>}
            </div>
            <p className="text-xl font-bold text-slate-900 mb-3">{formatINR(p.price)}</p>
            <div className="flex gap-2">
              <button onClick={()=>toast.success('Listed on marketplace!')} className="flex-1 text-xs font-semibold border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50">List Online</button>
              <button onClick={()=>toast.success('Updated!')} className="flex-1 text-xs font-semibold text-white py-2 rounded-xl hover:opacity-90" style={{background:'#BE185D'}}>Edit</button>
            </div>
          </div>
        ))}
      </div>
      {showAdd&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Add Product</h2><button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Product Name *</label><input className={inputCls} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category</label><select className={inputCls} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{['Nutrition','Equipment','Therapy','Apparel','Supplements','Services'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Price (₹)</label><input type="number" className={inputCls} value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{background:'#BE185D'}}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Add</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
