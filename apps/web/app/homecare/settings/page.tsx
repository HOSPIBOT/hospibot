'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Home, Truck } from 'lucide-react';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#6B21A8] outline-none transition-all placeholder:text-slate-400';
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!checked)} className={`relative w-10 h-5 rounded-full transition-colors ${checked?'bg-purple-600':'bg-slate-200'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  );
}
export default function HomecareSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({ orgName:'', phone:'', radius:'15', fee:'150', whatsappNotify:true, autoAssign:false, requireConsent:true });
  useEffect(()=>{
    api.get('/tenants/current').then(r=>{
      const s = r.data?.settings?.homecare||{};
      setCfg(c=>({...c, orgName:r.data.name||'', ...s}));
    }).catch(()=>{});
  },[]);
  const save = async()=>{
    setSaving(true);
    try { await api.patch('/tenants/current/settings',{homecare:cfg}); toast.success('Settings saved!'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-60">
          {saving?'…':<Save className="w-4 h-4"/>} Save
        </button>
      </div>
      {[
        { title:'Organisation', icon:Home, fields:[
          {k:'orgName',l:'Organisation Name',p:'Home Health Services'},
          {k:'phone',l:'Contact Phone',p:'+91 98765 43210'},
          {k:'radius',l:'Service Radius (km)',p:'15',t:'number'},
          {k:'fee',l:'Home Visit Fee (₹)',p:'150',t:'number'},
        ]},
        { title:'Automation', icon:Truck, toggles:[
          {k:'whatsappNotify',l:'WhatsApp Notifications',d:'Send booking confirmations via WhatsApp'},
          {k:'autoAssign',l:'Auto-Assign Staff',d:'Automatically assign nearest available staff'},
          {k:'requireConsent',l:'Require Patient Consent',d:'Collect digital consent before home visits'},
        ]},
      ].map(section=>(
        <div key={section.title} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><section.icon className="w-4 h-4 text-purple-600"/>{section.title}</h3>
          {section.fields&&<div className="grid grid-cols-2 gap-4">{section.fields.map(f=>(
            <div key={f.k}><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{f.l}</label>
              <input type={f.t||'text'} className={inputCls} placeholder={f.p} value={(cfg as any)[f.k]} onChange={e=>setCfg(c=>({...c,[f.k]:e.target.value}))}/></div>
          ))}</div>}
          {section.toggles&&section.toggles.map(t=>(
            <div key={t.k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div><p className="text-sm font-medium text-slate-900">{t.l}</p><p className="text-xs text-slate-400 mt-0.5">{t.d}</p></div>
              <Toggle checked={!!(cfg as any)[t.k]} onChange={v=>setCfg(c=>({...c,[t.k]:v}))}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
