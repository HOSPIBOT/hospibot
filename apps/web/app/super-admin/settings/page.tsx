'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from '@/lib/super-admin-api';

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-5 border-b border-slate-100 last:border-0">
      <div className="flex-1 max-w-xs">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="w-64 flex-shrink-0">{children}</div>
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0D7C66]' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlatformSettings();
      setSettings(data);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof PlatformSettings) => (value: any) =>
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updatePlatformSettings(settings);
      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-5">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Global configuration for all tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Onboarding */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-5 pb-2">Onboarding</h3>
        <Field label="Trial Period (days)" description="How long new tenants stay on trial before requiring a plan.">
          <input type="number" className={inputClass} min={1} max={90}
            value={settings.trialDays}
            onChange={(e) => set('trialDays')(Number(e.target.value))} />
        </Field>
        <Field label="Auto-suspend after (days)" description="Days past trial expiry before auto-suspension. Set 0 to disable.">
          <input type="number" className={inputClass} min={0}
            value={settings.autoSuspendAfterDays}
            onChange={(e) => set('autoSuspendAfterDays')(Number(e.target.value))} />
        </Field>
        <Field label="Allow New Registrations" description="Enable or disable the public /auth/register endpoint.">
          <Toggle checked={settings.allowNewRegistrations} onChange={set('allowNewRegistrations')} />
        </Field>
        <Field label="Require Email Verification" description="New tenant admins must verify their email before logging in.">
          <Toggle checked={settings.requireEmailVerification} onChange={set('requireEmailVerification')} />
        </Field>
      </div>

      {/* Operations */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-5 pb-2">Operations</h3>
        <Field label="Maintenance Mode" description="When enabled, all tenant logins are blocked with a maintenance notice.">
          <div className="flex items-center gap-3">
            <Toggle checked={settings.maintenanceMode} onChange={set('maintenanceMode')} />
            {settings.maintenanceMode && (
              <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">⚠ Platform locked</span>
            )}
          </div>
        </Field>
        <Field label="Support Email" description="Displayed to tenants in error messages and the Help section.">
          <input type="email" className={inputClass}
            value={settings.supportEmail}
            onChange={(e) => set('supportEmail')(e.target.value)} />
        </Field>
        <Field label="Alert Recipients" description="Comma-separated emails that receive ops alerts and incident notifications.">
          <input type="text" className={inputClass}
            value={settings.alertEmailRecipients}
            onChange={(e) => set('alertEmailRecipients')(e.target.value)} />
        </Field>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-red-800 mb-1">Danger Zone</h3>
        <p className="text-xs text-red-700 mb-4">These actions are irreversible. Proceed with extreme caution.</p>
        <div className="flex items-center gap-3">
          <button className="text-xs font-medium text-red-700 border border-red-300 bg-white px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Purge all trial tenants older than 90 days
          </button>
          <button className="text-xs font-medium text-red-700 border border-red-300 bg-white px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Reset platform announcement history
          </button>
        </div>
      </div>
    </div>
  );
}
