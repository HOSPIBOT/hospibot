'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Settings, Save, CheckCircle2, FlaskConical, Home, MessageSquare,
  Award, Shield, Users, Clock, Bell, Building2, ChevronRight, Loader2,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

type Tab = 'general' | 'lab' | 'nabl' | 'collection' | 'whatsapp' | 'notifications' | 'billing_info';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? '' : 'bg-slate-300'}`}
      style={checked ? { background: NAVY } : {}}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function DiagnosticSettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '',
    pincode: '', gstNumber: '', website: '',
    openTime: '08:00', closeTime: '20:00',
  });

  const [lab, setLab] = useState({
    reportHeader: '', pathologistName: '', pathologistMCI: '',
    labDirectorName: '', nablCode: '', tatDefault: 24,
    statPremiumPaise: 20000,
    autoSignoff: false, requireDualValidation: false,
    criticalValueEscalationMinutes: 30,
  });

  const [nabl, setNabl] = useState({
    accreditationNumber: '', accreditationBody: 'NABL',
    validUntil: '', iso15189: false, internalQC: true,
    externalQC: false, externalQCProvider: '',
    tatAlerts: true, tatThresholdHours: 24,
    bioriskTraining: false, aerb: false, cpcbBmw: false,
  });

  const [collection, setCollection] = useState({
    homeCollectionEnabled: true, homeCollectionFee: 10000,
    collectionSlotDuration: 30, maxPerDay: 20,
    servicePincodes: '', advanceBookingHours: 2,
    coldChainAvailable: false, zoneBasedPricing: false,
  });

  const [wa, setWa] = useState({
    phoneNumberId: '', accessToken: '', businessAccountId: '',
    orderConfirmation: true, sampleCollected: true,
    reportReady: true, criticalValueAlert: true,
    reTestReminder: true, homeCollectionConfirm: true,
    smsFallback: false,
  });

  const [notifs, setNotifs] = useState({
    tatBreachAlertEmail: '', criticalValueSmsTo: '',
    lowCreditThreshold: 200, dailySummaryEmail: '',
    dailySummaryEnabled: false,
  });

  const [billing, setBilling] = useState({
    invoicePrefix: 'LAB', nextInvoiceNumber: 1,
    defaultPaymentTerms: 30, tpaEnabled: false,
    cghs: false, esiEnabled: false,
    razorpayKeyId: '', razorpayKeySecret: '',
  });

  useEffect(() => {
    api.get('/tenants/current').catch(() => ({ data: {} })).then((r: any) => {
      const d = r.data;
      setGeneral(g => ({ ...g, name: d.name || '', phone: d.phone || '', email: d.email || '',
        address: d.address || '', city: d.city || '', state: d.state || '',
        pincode: d.pincode || '', gstNumber: d.gstNumber || '', website: d.website || '' }));
      const s = d.settings || {};
      if (s.labConfig) setLab((p: any) => ({ ...p, ...s.labConfig }));
      if (s.nabl) setNabl((p: any) => ({ ...p, ...s.nabl }));
      if (s.collection) setCollection((p: any) => ({ ...p, ...s.collection }));
      if (s.whatsapp) setWa((p: any) => ({ ...p, ...s.whatsapp }));
      if (s.notifications) setNotifs((p: any) => ({ ...p, ...s.notifications }));
      if (s.billing) setBilling((p: any) => ({ ...p, ...s.billing }));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current', {
        name: general.name, phone: general.phone, email: general.email,
        address: general.address, city: general.city, state: general.state,
        pincode: general.pincode, gstNumber: general.gstNumber, website: general.website,
        settings: { labConfig: lab, nabl, collection, whatsapp: wa, notifications: notifs, billing },
      });
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const TABS = [
    { key: 'general',       label: 'General',         icon: Building2 },
    { key: 'lab',           label: 'Lab Config',       icon: FlaskConical },
    { key: 'nabl',          label: 'NABL / Compliance',icon: Shield },
    { key: 'collection',    label: 'Home Collection',  icon: Home },
    { key: 'whatsapp',      label: 'WhatsApp',         icon: MessageSquare },
    { key: 'notifications', label: 'Notifications',    icon: Bell },
    { key: 'billing_info',  label: 'Billing Setup',    icon: Settings },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Configure your diagnostic lab portal</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ background: NAVY }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map((t: any) => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              style={tab === t.key ? { background: NAVY } : {}}>
              <t.icon className="w-4 h-4 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6">

          {/* General */}
          {tab === 'general' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 mb-4">General Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Lab Name', 'name', 'City Diagnostics'],
                  ['Phone', 'phone', '+91 98765 43210'],
                  ['Email', 'email', 'lab@citydiag.com'],
                  ['Website', 'website', 'www.citydiag.com'],
                  ['GST Number', 'gstNumber', '29AAACI1681G1ZJ'],
                  ['City', 'city', 'Hyderabad'],
                  ['State', 'state', 'Telangana'],
                  ['Pincode', 'pincode', '500032'],
                ].map(([label, k, ph]) => (
                  <div key={k as string}>
                    <label className={labelCls}>{label}</label>
                    <input className={inputCls} placeholder={ph as string}
                      value={(general as any)[k as string] ?? ''}
                      onChange={e => setGeneral((g: any) => ({ ...g, [k as string]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} placeholder="12/A, Medical Enclave, Banjara Hills"
                    value={general.address} onChange={e => setGeneral(g => ({ ...g, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Opening Time</label>
                  <input className={inputCls} type="time" value={general.openTime} onChange={e => setGeneral(g => ({ ...g, openTime: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Closing Time</label>
                  <input className={inputCls} type="time" value={general.closeTime} onChange={e => setGeneral(g => ({ ...g, closeTime: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Lab Config */}
          {tab === 'lab' && (
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 mb-4">Lab Configuration</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  ['Pathologist Name', 'pathologistName', 'Dr. A. Reddy', false],
                  ['Pathologist MCI #', 'pathologistMCI', 'MCI-12345', false],
                  ['Lab Director', 'labDirectorName', 'Dr. B. Sharma', false],
                  ['NABL Code', 'nablCode', 'MC-2345', false],
                  ['Default TAT (hours)', 'tatDefault', '24', true],
                  ['STAT Premium (₹)', 'statPremiumPaise', '200', true],
                  ['Critical Value Escalation (min)', 'criticalValueEscalationMinutes', '30', true],
                ].map(([label, k, ph, isNum]) => (
                  <div key={k as string}>
                    <label className={labelCls}>{label as string}</label>
                    <input className={inputCls} placeholder={ph as string} type={isNum ? 'number' : 'text'}
                      value={(lab as any)[k as string] ?? ''}
                      onChange={e => setLab((l: any) => ({ ...l, [k as string]: isNum ? +e.target.value : e.target.value }))} />
                  </div>
                ))}
              </div>
              <SettingRow label="Auto Sign-off" description="Pathologist auto-signs reports when all items are validated">
                <Toggle checked={lab.autoSignoff} onChange={v => setLab(l => ({ ...l, autoSignoff: v }))} />
              </SettingRow>
              <SettingRow label="Dual Validation" description="Require two staff to validate results before sign-off">
                <Toggle checked={lab.requireDualValidation} onChange={v => setLab(l => ({ ...l, requireDualValidation: v }))} />
              </SettingRow>
            </div>
          )}

          {/* NABL */}
          {tab === 'nabl' && (
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 mb-4">NABL & Compliance</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={labelCls}>Accreditation Number</label>
                  <input className={inputCls} placeholder="MC-2345" value={nabl.accreditationNumber} onChange={e => setNabl(n => ({ ...n, accreditationNumber: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Accreditation Body</label>
                  <select className={inputCls} value={nabl.accreditationBody} onChange={e => setNabl(n => ({ ...n, accreditationBody: e.target.value }))}>
                    <option>NABL</option><option>CAP</option><option>ISO 15189</option><option>None</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Valid Until</label>
                  <input className={inputCls} type="date" value={nabl.validUntil} onChange={e => setNabl(n => ({ ...n, validUntil: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>External QC Provider</label>
                  <input className={inputCls} placeholder="EQAS, RIQAS, BIORAD…" value={nabl.externalQCProvider} onChange={e => setNabl(n => ({ ...n, externalQCProvider: e.target.value }))} />
                </div>
              </div>
              {[
                ['ISO 15189 Accredited', 'iso15189', 'Medical laboratory quality management'],
                ['Internal QC Active', 'internalQC', 'Daily QC runs before patient samples'],
                ['External QC Active', 'externalQC', 'Enrolled in external quality assurance scheme'],
                ['TAT Breach Alerts', 'tatAlerts', 'Alert when orders exceed TAT threshold'],
                ['Biorisk Training Done', 'bioriskTraining', 'All staff completed biorisk training'],
                ['AERB Registration', 'aerb', 'For X-Ray and CT equipment (radiology)'],
                ['CPCB BMW Log Active', 'cpcbBmw', 'Biomedical waste daily log (BMW Rules 2016)'],
              ].map(([label, k, desc]) => (
                <SettingRow key={k as string} label={label as string} description={desc as string}>
                  <Toggle checked={(nabl as any)[k as string] ?? false}
                    onChange={v => setNabl((n: any) => ({ ...n, [k as string]: v }))} />
                </SettingRow>
              ))}
            </div>
          )}

          {/* Home Collection */}
          {tab === 'collection' && (
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 mb-4">Home Collection Settings</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={labelCls}>Collection Fee (₹)</label>
                  <input className={inputCls} type="number" placeholder="100" value={collection.homeCollectionFee / 100}
                    onChange={e => setCollection(c => ({ ...c, homeCollectionFee: +e.target.value * 100 }))} />
                </div>
                <div>
                  <label className={labelCls}>Slot Duration (minutes)</label>
                  <input className={inputCls} type="number" placeholder="30" value={collection.collectionSlotDuration}
                    onChange={e => setCollection(c => ({ ...c, collectionSlotDuration: +e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Max Per Day</label>
                  <input className={inputCls} type="number" placeholder="20" value={collection.maxPerDay}
                    onChange={e => setCollection(c => ({ ...c, maxPerDay: +e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Advance Booking (hours)</label>
                  <input className={inputCls} type="number" placeholder="2" value={collection.advanceBookingHours}
                    onChange={e => setCollection(c => ({ ...c, advanceBookingHours: +e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Service Pincodes (comma-separated)</label>
                  <input className={inputCls} placeholder="500032, 500033, 500034" value={collection.servicePincodes}
                    onChange={e => setCollection(c => ({ ...c, servicePincodes: e.target.value }))} />
                </div>
              </div>
              {[
                ['Home Collection Enabled', 'homeCollectionEnabled', 'Allow patients to book home collections'],
                ['Cold Chain Available', 'coldChainAvailable', 'Equipped with cold packs for temperature-sensitive samples'],
                ['Zone-Based Pricing', 'zoneBasedPricing', 'Different fees for different zones/pincodes'],
              ].map(([label, k, desc]) => (
                <SettingRow key={k as string} label={label as string} description={desc as string}>
                  <Toggle checked={(collection as any)[k as string] ?? false}
                    onChange={v => setCollection((c: any) => ({ ...c, [k as string]: v }))} />
                </SettingRow>
              ))}
            </div>
          )}

          {/* WhatsApp */}
          {tab === 'whatsapp' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 mb-2">WhatsApp Configuration</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                📌 Get these values from <strong>Meta Business Suite → WhatsApp → Business Phone Numbers</strong>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[
                  ['Phone Number ID', 'phoneNumberId', '123456789012345'],
                  ['Access Token (Bearer)', 'accessToken', 'EAABsbCS...'],
                  ['Business Account ID', 'businessAccountId', '987654321'],
                ].map(([label, k, ph]) => (
                  <div key={k as string}>
                    <label className={labelCls}>{label as string}</label>
                    <input className={inputCls} placeholder={ph as string} type="password"
                      value={(wa as any)[k as string] ?? ''}
                      onChange={e => setWa((w: any) => ({ ...w, [k as string]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <h3 className="font-bold text-slate-700 text-sm pt-4">Notification Triggers</h3>
              {[
                ['Order Confirmation (T01)', 'orderConfirmation', 'Send on new lab order creation'],
                ['Sample Collected (T02)', 'sampleCollected', 'Send when sample is collected'],
                ['Report Ready (T05/T06)', 'reportReady', 'Send when report is signed and released'],
                ['Critical Value Alert (T07)', 'criticalValueAlert', 'Send on critical value detection'],
                ['Re-Test Reminder (T15)', 'reTestReminder', 'Revenue Engine — automated re-test messages'],
                ['Home Collection Confirm (T11)', 'homeCollectionConfirm', 'Send home collection booking confirmation'],
                ['SMS Fallback', 'smsFallback', 'Send SMS when WhatsApp delivery fails'],
              ].map(([label, k, desc]) => (
                <SettingRow key={k as string} label={label as string} description={desc as string}>
                  <Toggle checked={(wa as any)[k as string] ?? false}
                    onChange={v => setWa((w: any) => ({ ...w, [k as string]: v }))} />
                </SettingRow>
              ))}
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 mb-4">Internal Notifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['TAT Breach Alert Email', 'tatBreachAlertEmail', 'manager@lab.com'],
                  ['Critical Value SMS To', 'criticalValueSmsTo', '+91 9876543210'],
                  ['Daily Summary Email', 'dailySummaryEmail', 'director@lab.com'],
                  ['Low Credit Alert Threshold (WA credits)', 'lowCreditThreshold', '200'],
                ].map(([label, k, ph]) => (
                  <div key={k as string}>
                    <label className={labelCls}>{label as string}</label>
                    <input className={inputCls} placeholder={ph as string}
                      value={(notifs as any)[k as string] ?? ''}
                      onChange={e => setNotifs((n: any) => ({ ...n, [k as string]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <SettingRow label="Daily Summary Email" description="Send daily order summary to lab director email">
                <Toggle checked={notifs.dailySummaryEnabled}
                  onChange={v => setNotifs(n => ({ ...n, dailySummaryEnabled: v }))} />
              </SettingRow>
            </div>
          )}

          {/* Billing Setup */}
          {tab === 'billing_info' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 mb-4">Billing Configuration</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Invoice Prefix', 'invoicePrefix', 'LAB'],
                  ['Default Credit Terms (days)', 'defaultPaymentTerms', '30'],
                  ['Razorpay Key ID', 'razorpayKeyId', 'rzp_live_xxxxx'],
                  ['Razorpay Key Secret', 'razorpayKeySecret', 'secret_xxxxx'],
                ].map(([label, k, ph]) => (
                  <div key={k as string}>
                    <label className={labelCls}>{label as string}</label>
                    <input className={inputCls} placeholder={ph as string}
                      type={(k as string).includes('Secret') ? 'password' : 'text'}
                      value={(billing as any)[k as string] ?? ''}
                      onChange={e => setBilling((b: any) => ({ ...b, [k as string]: e.target.value }))} />
                  </div>
                ))}
              </div>
              {[
                ['TPA Billing', 'tpaEnabled', 'Enable third-party administrator (insurance) billing'],
                ['CGHS Empanelled', 'cghs', 'Central Government Health Scheme empanelment'],
                ['ESI Empanelled', 'esiEnabled', 'Employees State Insurance empanelment'],
              ].map(([label, k, desc]) => (
                <SettingRow key={k as string} label={label as string} description={desc as string}>
                  <Toggle checked={(billing as any)[k as string] ?? false}
                    onChange={v => setBilling((b: any) => ({ ...b, [k as string]: v }))} />
                </SettingRow>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
