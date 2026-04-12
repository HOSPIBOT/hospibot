'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, Save, CheckCircle2, FlaskConical, Home, MessageSquare, Award } from 'lucide-react';

type Tab = 'general' | 'nabl' | 'collection' | 'whatsapp';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? '' : 'bg-slate-300'}`}
      style={checked ? { background: '#1E3A5F' } : {}}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function DiagnosticSettingsPage() {
  const [tab, setTab]     = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    name: '', phone: '', email: '', address: '',
    city: '', gstNumber: '', nablNumber: '',
    openTime: '08:00', closeTime: '20:00',
  });

  const [collectionConfig, setCollection] = useState({
    homeCollectionEnabled: true,
    homeCollectionFee: 100,
    collectionSlotDuration: 30,
    maxHomeCollectionsPerDay: 20,
    servicePincodes: '',
    technicianCount: 3,
  });

  const [waConfig, setWaConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    autoReplyEnabled: true,
    reportReadyAutoSend: true,
    sampleCollectionConfirmation: true,
    orderConfirmation: true,
  });

  const [nabl, setNabl] = useState({
    accreditationNumber: '',
    accreditationBody: 'NABL',
    validUntil: '',
    iso15189: false,
    internalQC: true,
    externalQC: false,
    tatAlerts: true,
    tatThresholdHours: 24,
  });

  useEffect(() => {
    api.get('/tenants/current').then(r => {
      setGeneral(g => ({ ...g, name: r.data.name || '', phone: r.data.phone || '', email: r.data.email || '', gstNumber: r.data.gstNumber || '' }));
      if (r.data.settings?.labConfig) setCollection(r.data.settings.labConfig);
      if (r.data.settings?.whatsapp) setWaConfig(c => ({ ...c, ...r.data.settings.whatsapp }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current', {
        name: general.name, phone: general.phone, email: general.email,
        address: general.address, gstNumber: general.gstNumber,
        settings: { labConfig: collectionConfig, whatsapp: waConfig, nabl },
      });
      toast.success('Settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'general',    label: 'Lab Info',         icon: FlaskConical },
    { key: 'nabl',       label: 'NABL / Quality',   icon: Award },
    { key: 'collection', label: 'Home Collection',  icon: Home },
    { key: 'whatsapp',   label: 'WhatsApp',         icon: MessageSquare },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure your diagnostic centre</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ background: '#1E3A5F' }}>
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                style={tab === t.key ? { background: '#1E3A5F' } : {}}>
                <t.icon className="w-4 h-4 flex-shrink-0" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {/* General */}
          {tab === 'general' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Lab Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Lab Name</label>
                  <input className={inputCls} value={general.name} onChange={e => setGeneral(g => ({ ...g, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input className={inputCls} value={general.phone} onChange={e => setGeneral(g => ({ ...g, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
                  <input className={inputCls} type="email" value={general.email} onChange={e => setGeneral(g => ({ ...g, email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Address</label>
                  <input className={inputCls} value={general.address} onChange={e => setGeneral(g => ({ ...g, address: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">GST Number</label>
                  <input className={inputCls} placeholder="29AAAAA0000A1Z5" value={general.gstNumber} onChange={e => setGeneral(g => ({ ...g, gstNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">NABL Accreditation No.</label>
                  <input className={inputCls} placeholder="MC-xxxx" value={general.nablNumber} onChange={e => setGeneral(g => ({ ...g, nablNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Opens At</label>
                  <input type="time" className={inputCls} value={general.openTime} onChange={e => setGeneral(g => ({ ...g, openTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Closes At</label>
                  <input type="time" className={inputCls} value={general.closeTime} onChange={e => setGeneral(g => ({ ...g, closeTime: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* NABL */}
          {tab === 'nabl' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">NABL / Quality Control Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Accreditation Number</label>
                  <input className={inputCls} placeholder="MC-1234" value={nabl.accreditationNumber} onChange={e => setNabl(n => ({ ...n, accreditationNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Accreditation Body</label>
                  <select className={inputCls} value={nabl.accreditationBody} onChange={e => setNabl(n => ({ ...n, accreditationBody: e.target.value }))}>
                    <option value="NABL">NABL (India)</option>
                    <option value="CAP">CAP (USA)</option>
                    <option value="JCI">JCI</option>
                    <option value="ISO 15189">ISO 15189</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Valid Until</label>
                  <input type="date" className={inputCls} value={nabl.validUntil} onChange={e => setNabl(n => ({ ...n, validUntil: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">TAT Alert Threshold (hours)</label>
                  <input type="number" min={1} className={inputCls} value={nabl.tatThresholdHours} onChange={e => setNabl(n => ({ ...n, tatThresholdHours: Number(e.target.value) }))} />
                </div>
              </div>
              {[
                { key: 'internalQC',  label: 'Internal Quality Control', desc: 'Daily IQC runs with Levey-Jennings charts' },
                { key: 'externalQC',  label: 'External Quality Assessment', desc: 'Participate in EQA schemes (EQAS, NEQAS)' },
                { key: 'iso15189',    label: 'ISO 15189 Compliant',       desc: 'Lab accreditation for medical testing' },
                { key: 'tatAlerts',   label: 'TAT Breach Alerts',          desc: 'Alert when orders exceed turnaround time' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle checked={(nabl as any)[item.key]} onChange={v => setNabl(n => ({ ...n, [item.key]: v }))} />
                </div>
              ))}
            </div>
          )}

          {/* Home Collection */}
          {tab === 'collection' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Home Collection Settings</h3>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">Enable Home Collection</p>
                  <p className="text-xs text-slate-400">Allow patients to schedule home sample pickups</p>
                </div>
                <Toggle checked={collectionConfig.homeCollectionEnabled} onChange={v => setCollection(c => ({ ...c, homeCollectionEnabled: v }))} />
              </div>
              {collectionConfig.homeCollectionEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Collection Fee (₹)</label>
                    <input type="number" min={0} className={inputCls} value={collectionConfig.homeCollectionFee}
                      onChange={e => setCollection(c => ({ ...c, homeCollectionFee: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Slot Duration (minutes)</label>
                    <input type="number" min={15} step={15} className={inputCls} value={collectionConfig.collectionSlotDuration}
                      onChange={e => setCollection(c => ({ ...c, collectionSlotDuration: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max Collections Per Day</label>
                    <input type="number" min={1} className={inputCls} value={collectionConfig.maxHomeCollectionsPerDay}
                      onChange={e => setCollection(c => ({ ...c, maxHomeCollectionsPerDay: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Number of Technicians</label>
                    <input type="number" min={1} className={inputCls} value={collectionConfig.technicianCount}
                      onChange={e => setCollection(c => ({ ...c, technicianCount: Number(e.target.value) }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Service Pincodes <span className="text-slate-300 font-normal normal-case">(comma-separated)</span></label>
                    <input className={inputCls} placeholder="500001, 500002, 500034"
                      value={collectionConfig.servicePincodes}
                      onChange={e => setCollection(c => ({ ...c, servicePincodes: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp */}
          {tab === 'whatsapp' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">WhatsApp Configuration</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number ID</label>
                  <input className={inputCls} placeholder="Meta Phone Number ID" value={waConfig.phoneNumberId} onChange={e => setWaConfig(c => ({ ...c, phoneNumberId: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Access Token</label>
                  <input type="password" className={inputCls} placeholder="Meta Permanent Token" value={waConfig.accessToken} onChange={e => setWaConfig(c => ({ ...c, accessToken: e.target.value }))} />
                </div>
              </div>
              {[
                { key: 'orderConfirmation',          label: 'Order Confirmation',          desc: 'Send WhatsApp confirmation when order is created' },
                { key: 'sampleCollectionConfirmation', label: 'Sample Collection Alert',   desc: 'Notify patient when sample is collected' },
                { key: 'reportReadyAutoSend',          label: 'Auto-Send Report',           desc: 'Automatically send report to patient via WhatsApp' },
                { key: 'autoReplyEnabled',             label: 'AI Chatbot Auto-Reply',     desc: 'Enable bot to handle patient inquiries automatically' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle checked={(waConfig as any)[item.key]} onChange={v => setWaConfig(c => ({ ...c, [item.key]: v }))} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
