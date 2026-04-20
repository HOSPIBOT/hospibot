'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const CHANNELS = ['sms', 'email', 'whatsapp'] as const;
const CHANNEL_LABELS: Record<string, string> = { sms: '📱 SMS', email: '📧 Email', whatsapp: '💬 WhatsApp' };
const CHANNEL_DESCS: Record<string, string> = {
  sms: 'Configure SMS provider, API keys, DLT settings, and per-SMS pricing charged to tenants.',
  email: 'Configure email provider (SMTP/SendGrid/SES), credentials, and per-email pricing.',
  whatsapp: 'Configure WhatsApp Business API provider, access tokens, and per-message pricing.',
};

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent';
const btnCls = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors';

export default function CommunicationsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [providers, setProviders] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>('sms');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [cfgRes, provRes] = await Promise.all([
        api.get('/super-admin/communications'),
        api.get('/super-admin/communications/providers'),
      ]);
      setConfigs(cfgRes.data || []);
      setProviders(provRes.data || {});
    } catch { toast.error('Failed to load communication configs'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeConfig = configs.find(c => c.channel === activeTab);

  const startEdit = (config: any) => {
    setEditing({
      provider: config?.provider || '',
      displayName: config?.displayName || '',
      isActive: config?.isActive ?? true,
      credentials: { ...(config?.credentials || {}) },
      settings: { ...(config?.settings || {}) },
      costPerUnit: config?.costPerUnit || 0,
      sellPricePerUnit: config?.sellPricePerUnit || 0,
      unitLabel: config?.unitLabel || 'message',
      notes: config?.notes || '',
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/super-admin/communications/${activeTab}`, editing);
      toast.success(`${CHANNEL_LABELS[activeTab]} provider updated!`);
      setEditing(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const testProvider = async (channel: string) => {
    setTesting(channel);
    try {
      const { data } = await api.post(`/super-admin/communications/${channel}/test`);
      if (data.success) toast.success(`✅ ${channel.toUpperCase()} provider is working!`);
      else toast.error(`❌ ${channel.toUpperCase()}: ${data.message}`);
    } catch { toast.error('Test failed'); }
    setTesting(null);
  };

  const seedDefaults = async () => {
    try {
      const { data } = await api.post('/super-admin/communications/seed');
      toast.success(`Seeded ${data.seeded} default configs`);
      load();
    } catch { toast.error('Seed failed'); }
  };

  const channelProviders = providers[activeTab] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Communications</h1>
          <p className="text-sm text-slate-500 mt-1">Manage SMS, Email & WhatsApp providers, credentials, and pricing</p>
        </div>
        <button onClick={seedDefaults} className={`${btnCls} bg-slate-100 text-slate-700 hover:bg-slate-200`}>Seed Defaults</button>
      </div>

      {/* Channel Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {CHANNELS.map(ch => (
          <button key={ch} onClick={() => { setActiveTab(ch); setEditing(null); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === ch ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {CHANNEL_LABELS[ch]}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 mb-4">{CHANNEL_DESCS[activeTab]}</p>

      {/* Current Config Display */}
      {activeConfig ? (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{activeConfig.displayName}</h3>
              <p className="text-sm text-slate-500">Provider: <span className="font-mono">{activeConfig.provider}</span></p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${activeConfig.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {activeConfig.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`inline-block mt-1 ml-2 px-2 py-0.5 rounded text-xs font-medium ${activeConfig.hasCredentials ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {activeConfig.hasCredentials ? 'Credentials Set' : 'No Credentials'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => testProvider(activeTab)} disabled={testing === activeTab}
                className={`${btnCls} bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                {testing === activeTab ? 'Testing...' : 'Test Connection'}
              </button>
              <button onClick={() => startEdit(activeConfig)} className={`${btnCls} bg-teal-600 text-white hover:bg-teal-700`}>
                Edit Provider
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
            <div><p className="text-xs text-slate-500">Cost to HospiBot</p><p className="text-lg font-bold text-slate-700">₹{(activeConfig.costPerUnit / 100).toFixed(2)}/{activeConfig.unitLabel}</p></div>
            <div><p className="text-xs text-slate-500">Price to Tenant</p><p className="text-lg font-bold text-teal-700">₹{(activeConfig.sellPricePerUnit / 100).toFixed(2)}/{activeConfig.unitLabel}</p></div>
            <div><p className="text-xs text-slate-500">Margin</p><p className="text-lg font-bold text-green-700">₹{((activeConfig.sellPricePerUnit - activeConfig.costPerUnit) / 100).toFixed(2)}/{activeConfig.unitLabel}</p></div>
          </div>

          {/* Credentials (masked) */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Credentials (masked)</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(activeConfig.credentials || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-slate-50 p-2 rounded text-xs">
                  <span className="text-slate-500 font-mono">{k}</span>
                  <span className="text-slate-700 font-mono">{String(v) || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-yellow-800">No {activeTab.toUpperCase()} provider configured yet.</p>
          <button onClick={() => startEdit({})} className={`${btnCls} bg-teal-600 text-white mt-3`}>Configure Provider</button>
        </div>
      )}

      {/* Available Providers */}
      <h3 className="text-sm font-semibold text-slate-600 mb-3">Available {activeTab.toUpperCase()} Providers</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {channelProviders.map((p: any) => (
          <div key={p.slug} className={`p-3 rounded-lg border text-sm ${activeConfig?.provider === p.slug ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="font-semibold text-slate-700">{p.name}</div>
            <div className="text-xs text-slate-500">{p.country} — {p.features?.join(', ')}</div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Edit {CHANNEL_LABELS[activeTab]} Provider</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
                  <select className={inputCls} value={editing.provider} onChange={e => setEditing({...editing, provider: e.target.value})}>
                    <option value="">Select provider</option>
                    {channelProviders.map((p: any) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Display Name</label>
                  <input className={inputCls} value={editing.displayName} onChange={e => setEditing({...editing, displayName: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({...editing, isActive: e.target.checked})} />
                <label className="text-sm text-slate-700">Active (messages will be sent through this provider)</label>
              </div>

              <h3 className="text-sm font-semibold text-slate-600 border-t pt-3">Credentials</h3>
              {Object.entries(editing.credentials).map(([k, v]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-500 mb-1 font-mono">{k}</label>
                  <input className={inputCls} type={k.toLowerCase().includes('pass') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('token') ? 'password' : 'text'}
                    value={String(v || '')} onChange={e => setEditing({...editing, credentials: {...editing.credentials, [k]: e.target.value}})} />
                </div>
              ))}

              <h3 className="text-sm font-semibold text-slate-600 border-t pt-3">Pricing (paise per unit)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cost to HospiBot (paise)</label>
                  <input className={inputCls} type="number" value={editing.costPerUnit} onChange={e => setEditing({...editing, costPerUnit: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Price to Tenant (paise)</label>
                  <input className={inputCls} type="number" value={editing.sellPricePerUnit} onChange={e => setEditing({...editing, sellPricePerUnit: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unit Label</label>
                  <input className={inputCls} value={editing.unitLabel} onChange={e => setEditing({...editing, unitLabel: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea className={inputCls} rows={2} value={editing.notes} onChange={e => setEditing({...editing, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button onClick={() => setEditing(null)} className={`${btnCls} bg-slate-100 text-slate-700`}>Cancel</button>
              <button onClick={save} disabled={saving} className={`${btnCls} bg-teal-600 text-white hover:bg-teal-700`}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
