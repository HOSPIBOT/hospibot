'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400';
export default function SettingsPage() {
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', gst: '' });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Equipment Settings</h1>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Facility Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {[{k:'name',l:'Facility Name',p:'Equipment Centre Name'},{k:'phone',l:'Phone',p:'+91 98765 43210'},{k:'email',l:'Email',p:'info@centre.com'},{k:'address',l:'Address',p:'Full address'},{k:'gst',l:'GST Number',p:'22AAAAA0000A1Z5'}].map(f=>(
            <div key={f.k} className={f.k==='address'?'col-span-2':''}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
              <input className={inputCls} placeholder={f.p} value={(form as any)[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))}/>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={()=>toast.success('Settings saved!')} className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90" style={{background:'#1E40AF'}}>
            <Save className="w-4 h-4"/>Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
