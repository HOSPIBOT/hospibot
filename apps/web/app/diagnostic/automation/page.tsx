'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, Plus, X, Loader2, CheckCircle2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const TRIGGER_OPTIONS = [
  { value: 'TEST_COMPLETED', label: 'Test Completed — Re-test reminder after N days' },
  { value: 'ABNORMAL_RESULT', label: 'Abnormal Result — Follow-up test suggestion' },
  { value: 'ANNIVERSARY', label: 'Patient Anniversary — Annual health check reminder' },
  { value: 'BIRTHDAY', label: 'Patient Birthday — Wellness package offer' },
  { value: 'CORPORATE_DUE', label: 'Corporate Wellness Due — Bulk test reminder' },
];

const TEMPLATE_OPTIONS = [
  { code: 'T15', label: 'T15 — Re-test reminder (90 days)' },
  { code: 'T16', label: 'T16 — Abnormal follow-up (urgency)' },
  { code: 'T17', label: 'T17 — Annual health package offer' },
  { code: 'T18', label: 'T18 — Loyalty discount (3rd visit)' },
  { code: 'T19', label: 'T19 — Corporate wellness reminder' },
  { code: 'T20', label: 'T20 — Birthday offer' },
];

const DEFAULT_RULES = [
  { name: 'Diabetic Follow-Up (HbA1c)', testCode: 'HBA1C', triggerEvent: 'TEST_COMPLETED', waitDays: 90, templateCode: 'T15', desc: 'Remind patients after 90 days to repeat HbA1c' },
  { name: 'Thyroid Annual Check', testCode: 'THYROID', triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17', desc: 'Annual thyroid profile reminder' },
  { name: 'Lipid Profile Follow-Up', testCode: 'LIPID', triggerEvent: 'TEST_COMPLETED', waitDays: 180, templateCode: 'T15', desc: '6-month lipid profile reminder' },
  { name: 'Abnormal HbA1c Alert', testCode: 'HBA1C', triggerEvent: 'ABNORMAL_RESULT', waitDays: 30, templateCode: 'T16', desc: 'High HbA1c — 30 day follow-up' },
  { name: 'Annual CBC Reminder', testCode: 'CBC', triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17', desc: 'Annual blood count reminder' },
];

function RuleCard({ rule, onToggle }: { rule: any; onToggle: () => void }) {
  const [toggling, setToggling] = useState(false);
  const cvr = rule.conversionRate ?? 0;

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(); } finally { setToggling(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${rule.isActive ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-bold text-slate-900">{rule.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{rule.testCode ? `Test: ${rule.testCode}` : 'All tests'} · {rule.waitDays} days · {rule.templateCode}</p>
        </div>
        <button onClick={handleToggle} disabled={toggling} className="flex-shrink-0 ml-3">
          {toggling ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> :
            rule.isActive
              ? <ToggleRight className="w-7 h-7 text-[#0D7C66]" />
              : <ToggleLeft className="w-7 h-7 text-slate-300" />
          }
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="px-2 py-0.5 bg-slate-100 rounded-full font-semibold">{rule.triggerEvent?.replace(/_/g, ' ')}</span>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">{rule.templateCode}</span>
      </div>

      {(rule.sentTotal > 0 || rule.convertedTotal > 0) && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
          {[
            { label: 'Sent', value: rule.sentTotal ?? 0 },
            { label: 'Converted', value: rule.convertedTotal ?? 0 },
            { label: 'Conv. Rate', value: `${cvr}%`, highlight: cvr > 15 },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-black ${s.highlight ? 'text-[#0D7C66]' : 'text-slate-900'}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddRuleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', testCode: '', triggerEvent: 'TEST_COMPLETED', waitDays: '90', templateCode: 'T15', messageText: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.triggerEvent || !form.templateCode) { toast.error('Name, trigger, and template required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/automation/rules', { ...form, waitDays: +form.waitDays });
      toast.success('Rule created');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Create failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Create Automation Rule</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div><label className={labelCls}>Rule Name *</label><input className={inputCls} placeholder="Diabetic Follow-Up (90 days)" value={form.name} onChange={setF('name')} /></div>
          <div><label className={labelCls}>Trigger Event</label>
            <select className={inputCls} value={form.triggerEvent} onChange={setF('triggerEvent')}>
              {TRIGGER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Test Code (optional)</label><input className={inputCls} placeholder="HBA1C" value={form.testCode} onChange={e => setForm(f => ({ ...f, testCode: e.target.value.toUpperCase() }))} /></div>
            <div><label className={labelCls}>Wait Days *</label><input className={inputCls} type="number" placeholder="90" value={form.waitDays} onChange={setF('waitDays')} /></div>
          </div>
          <div><label className={labelCls}>WhatsApp Template</label>
            <select className={inputCls} value={form.templateCode} onChange={setF('templateCode')}>
              {TEMPLATE_OPTIONS.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Custom Message (optional)</label>
            <textarea className={inputCls} rows={3} placeholder="Override template message…" value={form.messageText} onChange={setF('messageText')} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/automation/rules');
      setRules(res.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (ruleId: string) => {
    await api.patch(`/diagnostic/automation/rules/${ruleId}/toggle`);
    setRefreshKey(k => k + 1);
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      for (const rule of DEFAULT_RULES) {
        await api.post('/diagnostic/automation/rules', rule).catch(() => {});
      }
      toast.success(`${DEFAULT_RULES.length} default rules created!`);
      setRefreshKey(k => k + 1);
    } finally { setSeeding(false); }
  };

  const activeRules = rules.filter(r => r.isActive).length;
  const totalSent = rules.reduce((s, r) => s + (r.sentTotal ?? 0), 0);
  const totalConverted = rules.reduce((s, r) => s + (r.convertedTotal ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Revenue Engine</h1>
          <p className="text-sm text-slate-500">{activeRules}/{rules.length} rules active · Automated WhatsApp re-engagement</p>
        </div>
        <div className="flex items-center gap-2">
          {rules.length === 0 && (
            <button onClick={seedDefaults} disabled={seeding}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-500" />}
              Seed Defaults
            </button>
          )}
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      {totalSent > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Messages Sent', value: totalSent, icon: Zap, color: '#3B82F6' },
            { label: 'Bookings Converted', value: totalConverted, icon: CheckCircle2, color: TEAL },
            { label: 'Overall Conv. Rate', value: `${totalSent > 0 ? Math.round(totalConverted / totalSent * 100) : 0}%`, icon: TrendingUp, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}14` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      {rules.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-[#1E3A5F]/5 to-[#0D7C66]/5 rounded-2xl border border-[#1E3A5F]/10 p-8 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Revenue Engine — Automate Patient Re-engagement</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Create rules that automatically send WhatsApp reminders when patients are due for follow-up tests.
            Proven to increase repeat visits by 30-45%.
          </p>
          <div className="grid grid-cols-3 gap-4 text-left mb-6">
            {[
              { step: '1', label: 'Patient completes HbA1c', desc: 'Test result is released to patient' },
              { step: '2', label: '90 days later', desc: 'Automated WhatsApp reminder sent' },
              { step: '3', label: 'Patient books & pays', desc: 'Revenue attributed to the rule' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white text-sm font-black flex items-center justify-center mb-2">{s.step}</div>
                <p className="text-sm font-bold text-slate-900">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={seedDefaults} disabled={seeding}
            className="flex items-center gap-2 mx-auto text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Create 5 Default Rules
          </button>
        </div>
      )}

      {/* Rules grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} onToggle={() => toggle(rule.id)} />
          ))}
        </div>
      )}

      {adding && <AddRuleModal onClose={() => setAdding(false)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
