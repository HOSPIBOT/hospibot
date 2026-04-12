'use client';

import { useState } from 'react';
import { Save, Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="mb-4 pb-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-50 last:border-0 items-start">
      <div>
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#0D7C66]' : 'bg-slate-300'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'HospiBot',
    supportEmail: 'support@hospibot.ai',
    trialDays: 14,
    maxTrialTenants: 50,
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    waDefaultTemplate: 'appointment_reminder',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: '587',
    smtpUser: 'apikey',
    smtpPassword: 'SG.••••••••••••••••',
    metaAppId: '1234567890',
    metaAppSecret: '••••••••••••••••',
    metaWebhookToken: 'hospibot_wa_verify_2026',
    razorpayKeyId: 'rzp_live_••••••••••',
    razorpayKeySecret: '••••••••••••••••',
    invoicePrefix: 'HB',
    gstNumber: '36AADCH1234Z1Z5',
    autoSuspendTrialAfterDays: 3,
    alertEmailRecipients: 'ops@hospibot.ai, alerts@hospibot.ai',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(s => ({ ...s, [key]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Global configuration for the HospiBot platform</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save All Changes</>}
        </button>
      </div>

      {/* General */}
      <Section title="General" desc="Basic platform identity and configuration">
        <Field label="Platform Name" hint="Displayed to all users">
          <input className={inputClass} value={settings.platformName} onChange={set('platformName')} />
        </Field>
        <Field label="Support Email" hint="Shown in help sections and emails">
          <input className={inputClass} type="email" value={settings.supportEmail} onChange={set('supportEmail')} />
        </Field>
        <Field label="Alert Email Recipients" hint="Comma-separated list for ops alerts">
          <input className={inputClass} value={settings.alertEmailRecipients} onChange={set('alertEmailRecipients')} />
        </Field>
      </Section>

      {/* Registration & Trial */}
      <Section title="Registration & Trial" desc="Control how new tenants join the platform">
        <Field label="Allow New Registrations" hint="Disable to pause onboarding">
          <Toggle value={settings.allowNewRegistrations} onChange={(v) => setSettings(s => ({ ...s, allowNewRegistrations: v }))} />
        </Field>
        <Field label="Require Email Verification" hint="Tenants must verify email before access">
          <Toggle value={settings.requireEmailVerification} onChange={(v) => setSettings(s => ({ ...s, requireEmailVerification: v }))} />
        </Field>
        <Field label="Trial Duration (days)">
          <input className={inputClass} type="number" value={settings.trialDays} onChange={set('trialDays')} />
        </Field>
        <Field label="Auto-Suspend Trial After Expiry (days)" hint="Days after trial ends before auto-suspension">
          <input className={inputClass} type="number" value={settings.autoSuspendTrialAfterDays} onChange={set('autoSuspendTrialAfterDays')} />
        </Field>
        <Field label="Max Concurrent Trial Tenants">
          <input className={inputClass} type="number" value={settings.maxTrialTenants} onChange={set('maxTrialTenants')} />
        </Field>
      </Section>

      {/* Maintenance Mode */}
      <Section title="Maintenance Mode" desc="Temporarily disable the platform for all users">
        <Field label="Maintenance Mode" hint="All tenant logins will be blocked and a maintenance banner shown">
          <div className="flex items-center gap-3">
            <Toggle value={settings.maintenanceMode} onChange={(v) => setSettings(s => ({ ...s, maintenanceMode: v }))} />
            {settings.maintenanceMode && (
              <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-semibold border border-red-200">⚠ Platform is in maintenance mode</span>
            )}
          </div>
        </Field>
      </Section>

      {/* Email / SMTP */}
      <Section title="Email (SMTP)" desc="Transactional email configuration for notifications and invoices">
        <Field label="SMTP Host">
          <input className={inputClass} value={settings.smtpHost} onChange={set('smtpHost')} />
        </Field>
        <Field label="SMTP Port">
          <input className={inputClass} value={settings.smtpPort} onChange={set('smtpPort')} />
        </Field>
        <Field label="SMTP Username">
          <input className={inputClass} value={settings.smtpUser} onChange={set('smtpUser')} />
        </Field>
        <Field label="SMTP Password">
          <div className="relative">
            <input className={inputClass} type={showToken ? 'text' : 'password'} value={settings.smtpPassword} onChange={set('smtpPassword')} />
            <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp Business API" desc="Global Meta WABA credentials for the platform webhook">
        <Field label="Meta App ID">
          <input className={inputClass} value={settings.metaAppId} onChange={set('metaAppId')} />
        </Field>
        <Field label="Meta App Secret">
          <input className={inputClass} type="password" value={settings.metaAppSecret} onChange={set('metaAppSecret')} />
        </Field>
        <Field label="Webhook Verify Token" hint="Used to verify Meta webhook deliveries">
          <input className={inputClass} value={settings.metaWebhookToken} onChange={set('metaWebhookToken')} />
        </Field>
        <Field label="Default Message Template">
          <select className={inputClass} value={settings.waDefaultTemplate} onChange={set('waDefaultTemplate')}>
            <option value="appointment_reminder">Appointment Reminder</option>
            <option value="follow_up">Follow-Up Message</option>
            <option value="invoice_sent">Invoice Sent</option>
            <option value="welcome">Welcome Message</option>
          </select>
        </Field>
      </Section>

      {/* Billing */}
      <Section title="Billing & Payments" desc="Razorpay and invoice configuration">
        <Field label="Razorpay Key ID">
          <input className={inputClass} value={settings.razorpayKeyId} onChange={set('razorpayKeyId')} />
        </Field>
        <Field label="Razorpay Key Secret">
          <input className={inputClass} type="password" value={settings.razorpayKeySecret} onChange={set('razorpayKeySecret')} />
        </Field>
        <Field label="Invoice Prefix" hint="Prefix for all platform invoices (e.g. HB → HB-2026-0001)">
          <input className={inputClass} value={settings.invoicePrefix} onChange={set('invoicePrefix')} />
        </Field>
        <Field label="Platform GST Number">
          <input className={inputClass} value={settings.gstNumber} onChange={set('gstNumber')} />
        </Field>
      </Section>
    </div>
  );
}
