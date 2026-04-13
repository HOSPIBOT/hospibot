'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Settings, MessageSquare, Building2, Bell, Shield, Save,
  CheckCircle2, AlertTriangle, Eye, EyeOff, RefreshCw, Plus, Trash2,
} from 'lucide-react';

type Tab = 'general' | 'whatsapp' | 'departments' | 'notifications' | 'integrations';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0D7C66]' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { tenant } = useAuthStore();
  const [tab, setTab]   = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [depts, setDepts]   = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', type: 'clinical' });
  const [addingDept, setAddingDept] = useState(false);

  const [general, setGeneral] = useState({
    name: tenant?.name || '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    gstNumber: '',
    timezone: 'Asia/Kolkata',
  });

  const [waConfig, setWaConfig] = useState({
    phoneNumberId: '',
    businessId: '',
    accessToken: '',
    webhookVerifyToken: '',
    autoReply: true,
    autoReplyMessage: 'Thank you for contacting us! Our team will respond shortly.',
    businessHoursOnly: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '20:00',
  });

  const [notifConfig, setNotifConfig] = useState({
    appointmentReminder24h: true,
    appointmentReminder2h: true,
    appointmentReminder30m: false,
    reportReadyAlert: true,
    paymentConfirmation: true,
    newPatientAlert: false,
    noShowAlert: true,
  });

  // Load existing tenant settings
  useEffect(() => {
    api.get('/tenants/current').then(r => {
      const t = r.data;
      setGeneral(g => ({
        ...g,
        name: t.name || '',
        phone: t.phone || '',
        email: t.email || '',
        address: t.address || '',
        city: t.city || '',
        state: t.state || '',
        pincode: t.pincode || '',
        website: t.website || '',
        gstNumber: t.gstNumber || '',
      }));
      if (t.settings?.whatsapp) setWaConfig(c => ({ ...c, ...t.settings.whatsapp }));
      if (t.settings?.notifications) setNotifConfig(n => ({ ...n, ...t.settings.notifications }));
      if (t.waPhoneNumberId) setWaConfig(c => ({ ...c, phoneNumberId: t.waPhoneNumberId }));
      if (t.waBusinessId)    setWaConfig(c => ({ ...c, businessId: t.waBusinessId }));
    }).catch(() => {});
  }, []);

  const loadDepts = () => {
    setLoadingDepts(true);
    api.get('/doctors/departments', { params: { limit: 100 } })
      .then(r => setDepts(r.data.data ?? []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoadingDepts(false));
  };

  useEffect(() => { if (tab === 'departments') loadDepts(); }, [tab]);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current', general);
      toast.success('Settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const saveWhatsApp = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current', {
        waPhoneNumberId: waConfig.phoneNumberId,
        waBusinessId: waConfig.businessId,
        waAccessToken: waConfig.accessToken,
        settings: { whatsapp: waConfig },
      });
      toast.success('WhatsApp configuration saved');
    } catch { toast.error('Failed to save WhatsApp config'); }
    finally { setSaving(false); }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current/settings', { notifications: notifConfig });
      toast.success('Notification preferences saved');
    } catch { toast.error('Failed to save notifications'); }
    finally { setSaving(false); }
  };

  const addDepartment = async () => {
    if (!newDept.name) { toast.error('Department name required'); return; }
    setAddingDept(true);
    try {
      await api.post('/doctors/departments', newDept);
      toast.success(`${newDept.name} department created`);
      setNewDept({ name: '', code: '', type: 'clinical' });
      loadDepts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create department');
    } finally { setAddingDept(false); }
  };

  const deleteDept = async (id: string, name: string) => {
    // Confirmed via UI button
    try {
      await api.delete(`/doctors/departments/${id}`);
      toast.success(`${name} deleted`);
      loadDepts();
    } catch { toast.error('Failed to delete department'); }
  };

  const tabs = [
    { key: 'general' as Tab,       label: 'General',       icon: Settings },
    { key: 'whatsapp' as Tab,      label: 'WhatsApp',      icon: MessageSquare },
    { key: 'departments' as Tab,   label: 'Departments',   icon: Building2 },
    { key: 'notifications' as Tab,  label: 'Notifications', icon: Bell },
    { key: 'integrations' as Tab,   label: 'Integrations',  icon: Zap },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure your facility preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-[#0D7C66] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                <t.icon className="w-4 h-4 flex-shrink-0" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* General */}
          {tab === 'general' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">General Information</h3>
                <button onClick={saveGeneral} disabled={saving}
                  className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                  {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Facility Name</label>
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
                  <input className={inputCls} value={general.city} onChange={e => setGeneral(g => ({ ...g, city: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">State</label>
                  <input className={inputCls} value={general.state} onChange={e => setGeneral(g => ({ ...g, state: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">GST Number</label>
                  <input className={inputCls} placeholder="29AAAAA0000A1Z5" value={general.gstNumber} onChange={e => setGeneral(g => ({ ...g, gstNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Website</label>
                  <input className={inputCls} placeholder="www.yourhospital.com" value={general.website} onChange={e => setGeneral(g => ({ ...g, website: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Timezone</label>
                  <select className={inputCls} value={general.timezone} onChange={e => setGeneral(g => ({ ...g, timezone: e.target.value }))}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {tab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">WhatsApp Business API</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Connect your Meta Business Account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {waConfig.phoneNumberId ? (
                      <span className="text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Not Configured
                      </span>
                    )}
                    <button onClick={saveWhatsApp} disabled={saving}
                      className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number ID</label>
                    <input className={inputCls} placeholder="Meta Phone Number ID" value={waConfig.phoneNumberId}
                      onChange={e => setWaConfig(c => ({ ...c, phoneNumberId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">WhatsApp Business ID</label>
                    <input className={inputCls} placeholder="Meta Business Account ID" value={waConfig.businessId}
                      onChange={e => setWaConfig(c => ({ ...c, businessId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Permanent Access Token</label>
                    <div className="relative">
                      <input className={inputCls} type={showToken ? 'text' : 'password'} placeholder="Meta Permanent Token"
                        value={waConfig.accessToken} onChange={e => setWaConfig(c => ({ ...c, accessToken: e.target.value }))} />
                      <button type="button" onClick={() => setShowToken(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Webhook URL (configure in Meta Dashboard)</p>
                    <code className="text-xs text-[#0D7C66] font-mono break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/whatsapp/webhook` : 'https://your-api.railway.app/api/v1/whatsapp/webhook'}
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Auto-Reply Settings</h3>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto-reply to new messages</p>
                    <p className="text-xs text-slate-400 mt-0.5">Send automatic acknowledgment to new patient messages</p>
                  </div>
                  <Toggle checked={waConfig.autoReply} onChange={v => setWaConfig(c => ({ ...c, autoReply: v }))} />
                </div>
                {waConfig.autoReply && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Auto-reply message</label>
                    <textarea className={`${inputCls} resize-none`} rows={2}
                      value={waConfig.autoReplyMessage} onChange={e => setWaConfig(c => ({ ...c, autoReplyMessage: e.target.value }))} />
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Business hours only</p>
                    <p className="text-xs text-slate-400 mt-0.5">Only auto-reply during configured business hours</p>
                  </div>
                  <Toggle checked={waConfig.businessHoursOnly} onChange={v => setWaConfig(c => ({ ...c, businessHoursOnly: v }))} />
                </div>
                {waConfig.businessHoursOnly && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Open Time</label>
                      <input className={inputCls} type="time" value={waConfig.businessHoursStart}
                        onChange={e => setWaConfig(c => ({ ...c, businessHoursStart: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Close Time</label>
                      <input className={inputCls} type="time" value={waConfig.businessHoursEnd}
                        onChange={e => setWaConfig(c => ({ ...c, businessHoursEnd: e.target.value }))} />
                    </div>
                  </div>
                )}
                <button onClick={saveWhatsApp} disabled={saving}
                  className="bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                  Save WhatsApp Settings
                </button>
              </div>
            </div>
          )}

          {/* Departments */}
          {tab === 'departments' && (
            <div className="space-y-4">
              {/* Add department */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Add Department</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="Cardiology" value={newDept.name} onChange={e => setNewDept(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Code</label>
                    <input className={inputCls} placeholder="CARD" value={newDept.code} onChange={e => setNewDept(d => ({ ...d, code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Type</label>
                    <select className={inputCls} value={newDept.type} onChange={e => setNewDept(d => ({ ...d, type: e.target.value }))}>
                      <option value="clinical">Clinical</option>
                      <option value="ancillary">Ancillary (Lab/Pharmacy)</option>
                      <option value="administrative">Administrative</option>
                    </select>
                  </div>
                </div>
                <button onClick={addDepartment} disabled={addingDept || !newDept.name}
                  className="mt-3 flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors">
                  {addingDept ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addingDept ? 'Adding…' : 'Add Department'}
                </button>
              </div>

              {/* List departments */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Existing Departments ({depts.length})</h3>
                </div>
                {loadingDepts ? (
                  <div className="p-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-12" />)}</div>
                ) : depts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No departments configured yet.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {depts.map(dept => (
                      <div key={dept.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] text-[#0D7C66] text-xs font-bold flex items-center justify-center">
                            {dept.code || dept.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                            <p className="text-xs text-slate-400">{dept.type} · {dept.code || 'No code'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dept.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {dept.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button onClick={() => deleteDept(dept.id, dept.name)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Integrations */}
          {tab === 'integrations' && (
            <div className="space-y-4">
              {/* Razorpay */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">₹</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Razorpay Payments</h3>
                      <p className="text-xs text-slate-400">Accept online payments via UPI, cards, net banking</p>
                    </div>
                  </div>
                  <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-[#0D7C66] hover:underline">
                    Get API Keys <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Configure these in your Railway/Vercel environment variables — they should never be stored in the database.
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'RAZORPAY_KEY_ID',         label: 'Key ID',        placeholder: 'rzp_live_...' },
                    { key: 'RAZORPAY_KEY_SECRET',      label: 'Key Secret',    placeholder: 'Set in backend env vars' },
                    { key: 'RAZORPAY_WEBHOOK_SECRET',  label: 'Webhook Secret', placeholder: 'Set in backend env vars' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{f.label}</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-500">{f.placeholder}</div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Webhook URL</label>
                    <code className="block bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-[#0D7C66] break-all">
                      {typeof window !== 'undefined' ? window.location.origin.replace('hospibot-web.vercel.app', 'hospibot-api.railway.app') : 'https://your-api.railway.app'}/api/v1/billing/webhook/razorpay
                    </code>
                  </div>
                </div>
              </div>

              {/* Tally */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <span className="text-amber-700 font-bold text-sm">T</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Tally Integration</h3>
                      <p className="text-xs text-slate-400">Export invoices to Tally ERP 9 / Tally Prime</p>
                    </div>
                  </div>
                  <a href="/clinical/billing"
                    className="flex items-center gap-1 text-xs text-[#0D7C66] hover:underline">
                    Go to Billing <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-xs text-[#0A5E4F]">
                  From the Billing page, click <strong>Tally Export</strong> to download the current month's invoices as Tally XML.
                  Import the file in Tally via Gateway → Import Data → Import of Data.
                </div>
              </div>

              {/* ABHA */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#0D7C66]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">ABHA (Ayushman Bharat)</h3>
                      <p className="text-xs text-slate-400">India's national health ID — ABDM integration</p>
                    </div>
                  </div>
                  <a href="/clinical/abha" className="flex items-center gap-1 text-xs text-[#0D7C66] hover:underline">
                    Link Patients <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'ABHA_CLIENT_ID',     label: 'Client ID',     placeholder: 'Set in backend env vars' },
                    { key: 'ABHA_CLIENT_SECRET',  label: 'Client Secret', placeholder: 'Set in backend env vars' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{f.label}</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-500">{f.placeholder}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">WhatsApp Notification Preferences</h3>
                <button onClick={saveNotifications} disabled={saving}
                  className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>

              {[
                { key: 'appointmentReminder24h', label: 'Appointment reminder (24 hours before)', desc: 'Sent to patient the day before their appointment' },
                { key: 'appointmentReminder2h', label: 'Appointment reminder (2 hours before)', desc: 'Sent 2 hours before appointment time' },
                { key: 'appointmentReminder30m', label: 'Appointment reminder (30 minutes before)', desc: 'Last-minute reminder before appointment' },
                { key: 'reportReadyAlert', label: 'Lab report ready alert', desc: 'Notify patient when their lab report is uploaded' },
                { key: 'paymentConfirmation', label: 'Payment confirmation', desc: 'Send receipt after successful payment' },
                { key: 'newPatientAlert', label: 'New patient registration alert', desc: 'Alert staff when a new patient registers' },
                { key: 'noShowAlert', label: 'No-show alert to staff', desc: 'Notify reception when patient marks as no-show' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={(notifConfig as any)[item.key]}
                    onChange={v => setNotifConfig(n => ({ ...n, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
