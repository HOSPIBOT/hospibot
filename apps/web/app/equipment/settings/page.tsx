'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400';
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!checked)} className={`relative w-10 h-5 rounded-full transition-colors ${checked?'bg-[#1E40AF]':'bg-slate-200'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  );
}
export default function PortalSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({ orgName:'', phone:'', email:'', whatsappNotify:true, autoConfirm:false });
  useEffect(()=>{
    api.get('/tenants/current').then(r=>{
      const s = r.data?.settings?.equipment||{};
      setCfg((c:any)=>({...c, orgName:r.data.name||'', ...s}));
    }).catch(()=>{});
  },[]);
  const save = async()=>{
    setSaving(true);
    try { await api.patch('/tenants/current/settings',{equipment:cfg}); toast.success('Settings saved!'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Management Settings</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60 hover:opacity-90" style={{background:'#1E40AF'}}>
          {saving?'...':<Save className="w-4 h-4"/>} Save
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Organisation</h3>
        <div className="grid grid-cols-2 gap-4">
          {[{k:'orgName',l:'Name',p:'Equipment Management'},{k:'phone',l:'Phone',p:'+91 98765 43210'},{k:'email',l:'Email',p:'info@business.com'}].map(f=>(
            <div key={f.k}><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{f.l}</label>
              <input className={inputCls} placeholder={f.p} value={(cfg as any)[f.k]} onChange={e=>setCfg((c:any)=>({...c,[f.k]:e.target.value}))}/></div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Automation</h3>
        {[{k:'whatsappNotify',l:'WhatsApp Notifications',d:'Send booking confirmations via WhatsApp'},{k:'autoConfirm',l:'Auto-confirm bookings',d:'Automatically confirm new bookings'}].map(t=>(
          <div key={t.k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <div><p className="text-sm font-medium text-slate-900">{t.l}</p><p className="text-xs text-slate-400">{t.d}</p></div>
            <Toggle checked={!!(cfg as any)[t.k]} onChange={v=>setCfg((c:any)=>({...c,[t.k]:v}))}/>
          </div>
        ))}
      </div>
    </div>
  );
}
