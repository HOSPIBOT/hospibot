'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Phone, MapPin, Truck, X, Loader2 } from 'lucide-react';
const STATUS_COLORS: Record<string,string> = { AVAILABLE:'bg-emerald-100 text-emerald-700', ON_VISIT:'bg-blue-100 text-blue-700', TRAVELLING:'bg-amber-100 text-amber-700', OFF_DUTY:'bg-slate-100 text-slate-500' };
const STAFF = [
  { id:'1', name:'Meena Nair',   spec:'Nursing Care',   phone:'+91 98001 11001', status:'ON_VISIT',   visits:3, loc:'Banjara Hills' },
  { id:'2', name:'Ravi Kumar',   spec:'Physiotherapy',  phone:'+91 98001 11002', status:'AVAILABLE',  visits:2, loc:'Jubilee Hills' },
  { id:'3', name:'Sunita Devi',  spec:'Wound Dressing', phone:'+91 98001 11003', status:'TRAVELLING', visits:1, loc:'En route Madhapur' },
  { id:'4', name:'Arun Patil',   spec:'Elderly Care',   phone:'+91 98001 11004', status:'AVAILABLE',  visits:4, loc:'Ready for dispatch' },
];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#6B21A8] outline-none transition-all placeholder:text-slate-400';
export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', spec:'Nursing Care' });
  const [saving, setSaving] = useState(false);
  const save = async () => { if(!form.name||!form.phone){toast.error('Name and phone required');return;} setSaving(true); await new Promise(r=>setTimeout(r,700)); toast.success(`${form.name} added!`); setShowAdd(false); setSaving(false); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Staff Dispatch</h1>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl" style={{background:'#6B21A8'}}><Plus className="w-4 h-4"/>Add Staff</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Total Staff',v:STAFF.length,c:'#6B21A8'},{l:'Available',v:STAFF.filter(s=>s.status==='AVAILABLE').length,c:'#10B981'},{l:'On Visit',v:STAFF.filter(s=>s.status==='ON_VISIT').length,c:'#3B82F6'},{l:"Today's Visits",v:STAFF.reduce((a,s)=>a+s.visits,0),c:'#F59E0B'}].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-xs text-slate-500 mb-1">{s.l}</p><p className="text-2xl font-bold" style={{color:s.c}}>{s.v}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {STAFF.map(s=>(
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{background:'#6B21A8'}}>{s.name.split(' ').map(n=>n[0]).join('')}</div>
                <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-xs text-slate-400">{s.spec}</p></div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status.replace('_',' ')}</span>
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5"/>{s.phone}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5"/>{s.loc}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><Truck className="w-3.5 h-3.5"/>{s.visits} visits today</div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${s.phone}`} className="flex-1 text-center text-xs font-semibold border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50">Call</a>
              {s.status==='AVAILABLE'&&<button onClick={()=>toast.success(`Dispatching ${s.name}…`)} className="flex-1 text-xs font-semibold text-white py-2 rounded-xl" style={{background:'#6B21A8'}}>Dispatch</button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Add Staff</h2><button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-4 h-4"/></button></div>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Name *</label><input className={inputCls} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone *</label><input className={inputCls} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Specialization</label><select className={inputCls} value={form.spec} onChange={e=>setForm(f=>({...f,spec:e.target.value}))}>{['Nursing Care','Physiotherapy','IV Infusion','Wound Dressing','Elderly Care','Baby Care'].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{background:'#6B21A8'}}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}Add Staff</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
