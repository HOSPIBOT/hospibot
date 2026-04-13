'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Settings } from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400';

export default function ServicesSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({
    orgName: '', phone: '', email: '', website: '',
    currency: 'INR', paymentTerms: '30', gstNumber: '',
    defaultAmcDuration: '12',
  });

  useEffect(() => {
    api.get('/tenants/current').then(r => {
      const s = r.data?.settings?.services || {};
      setCfg(c => ({ ...c, orgName: r.data.name || '', ...s }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current/settings', { services: cfg });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" /> Settings
        </h1>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-60">
          {saving ? '…' : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {[
        { title: 'Organisation', fields: [
          { k: 'orgName',  l: 'Company Name',   p: 'Services India Pvt. Ltd.' },
          { k: 'phone',    l: 'Contact Phone',  p: '+91 98765 43210' },
          { k: 'email',    l: 'Business Email', p: 'info@company.com' },
          { k: 'website',  l: 'Website',        p: 'https://company.com' },
        ]},
        { title: 'Financial', fields: [
          { k: 'gstNumber',          l: 'GST Number',              p: '22AAAAA0000A1Z5' },
          { k: 'paymentTerms',       l: 'Payment Terms (days)',     p: '30', t: 'number' },
          { k: 'defaultAmcDuration', l: 'Default AMC Duration (months)', p: '12', t: 'number' },
          { k: 'currency',           l: 'Currency',                p: 'INR' },
        ]},
      ].map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">{section.title}</h3>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map(f => (
              <div key={f.k}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
                <input type={(f as any).t || 'text'} className={inputCls} placeholder={f.p}
                  value={(cfg as any)[f.k]} onChange={e => setCfg(c => ({ ...c, [f.k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
