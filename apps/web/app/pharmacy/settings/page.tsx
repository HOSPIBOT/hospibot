'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Package } from 'lucide-react';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] outline-none transition-all placeholder:text-slate-400';
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!checked)} className={`relative w-10 h-5 rounded-full transition-colors ${checked?'bg-[#166534]':'bg-slate-200'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  );
}
export default function PharmacySettingsPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({ pharmacyName:'', licenseNumber:'', pharmacistName:'', phone:'', lowStockThreshold:'10', expiryAlertDays:'90', autoWhatsAppReports:true, requirePrescription:false, gstNumber:'' });
  useEffect(() => {
    api.get('/tenants/current').then(r => {
      const s = r.data?.settings?.pharmacy || {};
      setCfg((c: any) => ({ ...c, pharmacyName: r.data.name || '', ...s }));
    }).catch(() => {});
  }, []);
  const save = async () => {
    setSaving(true);
    try { await api.patch('/tenants/current/settings', { pharmacy: cfg }); toast.success('Pharmacy settings saved!'); }
    catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-[#166534]"/>Pharmacy Settings</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#166534] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60">
          {saving?'…':<Save className="w-4 h-4"/>} Save
        </button>
      </div>
      {[
        { title:'Pharmacy Info', fields:[
          {k:'pharmacyName',l:'Pharmacy Name',p:'City Pharmacy'},
          {k:'licenseNumber',l:'Drug License Number',p:'DL/2024/HYD/001'},
          {k:'pharmacistName',l:'Pharmacist-in-Charge',p:'Dr. M. Reddy'},
          {k:'phone',l:'Phone',p:'+91 98765 43210'},
          {k:'gstNumber',l:'GST Number',p:'22AAAAA0000A1Z5'},
        ]},
        { title:'Inventory', fields:[
          {k:'lowStockThreshold',l:'Low Stock Alert (units)',p:'10',t:'number'},
          {k:'expiryAlertDays',l:'Expiry Alert (days before)',p:'90',t:'number'},
        ]},
      ].map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">{section.title}</h3>
          <div className="grid grid-cols-2 gap-4">{section.fields.map(f => (
            <div key={f.k}><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{f.l}</label>
              <input type={(f as any).t||'text'} className={inputCls} placeholder={f.p} value={(cfg as any)[f.k]} onChange={e=>setCfg((c:any)=>({...c,[f.k]:e.target.value}))}/></div>
          ))}</div>
        </div>
      ))}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Automation</h3>
        {[
          {k:'autoWhatsAppReports',l:'Auto-send prescription receipts via WhatsApp',d:'Send dispensing confirmation to patient'},
          {k:'requirePrescription',l:'Require prescription for all dispensing',d:'Block OTC sales without doctor Rx'},
        ].map(t => (
          <div key={t.k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <div><p className="text-sm font-medium text-slate-900">{t.l}</p><p className="text-xs text-slate-400 mt-0.5">{t.d}</p></div>
            <Toggle checked={!!(cfg as any)[t.k]} onChange={v=>setCfg((c:any)=>({...c,[t.k]:v}))}/>
          </div>
        ))}
      </div>
    </div>
  );
}
