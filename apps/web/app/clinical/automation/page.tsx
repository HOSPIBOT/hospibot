'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Zap, Plus, X, Play, Pause, Trash2, RefreshCw, ChevronDown,
  ChevronRight, CheckCircle2, Clock, Users, AlertCircle, ArrowRight,
  Settings, BarChart3, Loader2, Activity, MessageSquare, Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationRule {
  id: string; name: string; description?: string; isActive: boolean;
  trigger: string; conditions: any; waitDays: number; actions: any[];
  escalation: any; triggeredCount: number; convertedCount: number;
  createdAt: string;
}

interface Protocol {
  id: string; name: string; description: string; category: string;
  rulesCount: number; rules: any[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: 'VISIT_COMPLETED',       label: 'Visit Completed',          icon: '🏥' },
  { value: 'DIAGNOSIS_RECORDED',    label: 'Diagnosis Recorded',       icon: '🩺' },
  { value: 'MEDICATION_PRESCRIBED', label: 'Medication Prescribed',    icon: '💊' },
  { value: 'TIME_ELAPSED',          label: 'Time Since Last Visit',    icon: '⏰' },
  { value: 'APPOINTMENT_CANCELLED', label: 'Appointment Cancelled',    icon: '❌' },
  { value: 'NO_SHOW',               label: 'Patient No-Show',          icon: '👻' },
  { value: 'PAYMENT_RECEIVED',      label: 'Payment Received',         icon: '💰' },
  { value: 'LAB_REPORT_READY',      label: 'Lab Report Ready',         icon: '🧪' },
];

const ACTION_TYPES = [
  { value: 'SEND_WHATSAPP',      label: 'Send WhatsApp Message' },
  { value: 'SEND_TEMPLATE',      label: 'Send WhatsApp Template' },
  { value: 'CREATE_APPOINTMENT', label: 'Create Follow-up Appointment' },
  { value: 'UPDATE_CRM_STAGE',   label: 'Update Patient CRM Stage' },
  { value: 'NOTIFY_STAFF',       label: 'Notify Staff' },
];

const CRM_STAGES = ['NEW','CONTACTED','APPOINTMENT_BOOKED','VISITED','FOLLOW_UP_PENDING','ACTIVE_PATIENT','DORMANT'];

const PROTOCOL_TEMPLATES: Protocol[] = [
  {
    id: 'diabetes-management', name: 'Diabetes Management Protocol', category: 'Chronic Care',
    description: 'HbA1c every 90 days, monthly BP check, medication refill reminders at 25 days',
    rulesCount: 4, rules: [],
  },
  {
    id: 'hypertension-monitoring', name: 'Hypertension Monitoring', category: 'Chronic Care',
    description: 'BP check every 30 days, medication refill every 30/60 days, annual kidney function test',
    rulesCount: 3, rules: [],
  },
  {
    id: 'post-surgical-followup', name: 'Post-Surgical Follow-Up', category: 'Surgery',
    description: 'Wound check at 7 days, suture removal at 14 days, clearance at 30 days',
    rulesCount: 3, rules: [],
  },
  {
    id: 'pregnancy-care', name: 'Pregnancy Care Protocol', category: 'Maternity',
    description: 'Monthly checkups, trimester-specific tests, vaccination schedule',
    rulesCount: 5, rules: [],
  },
  {
    id: 'pediatric-vaccination', name: 'Paediatric Vaccination Schedule', category: 'Preventive',
    description: 'Complete immunisation schedule from birth to 5 years per national guidelines',
    rulesCount: 8, rules: [],
  },
  {
    id: 'dental-hygiene', name: 'Dental Hygiene Schedule', category: 'Dental',
    description: 'Cleaning every 6 months, X-ray annually, orthodontic adjustment reminders',
    rulesCount: 2, rules: [],
  },
  {
    id: 'oncology-followup', name: 'Oncology Follow-Up Protocol', category: 'Oncology',
    description: 'Chemotherapy cycle reminders, blood work schedules, imaging protocols',
    rulesCount: 4, rules: [],
  },
  {
    id: 'cardiac-care', name: 'Cardiac Care Protocol', category: 'Cardiology',
    description: 'ECG every 6 months, echo annually, medication refills, cholesterol panel',
    rulesCount: 4, rules: [],
  },
  {
    id: 'dialysis-management', name: 'Kidney & Dialysis Care', category: 'Nephrology',
    description: 'Session scheduling, creatinine test reminders, access site monitoring',
    rulesCount: 3, rules: [],
  },
  {
    id: 'post-discharge', name: 'Post-Discharge Protocol', category: 'Hospital',
    description: 'Day 1 check-in, day 7 wound check, day 14 medication review, day 30 full follow-up',
    rulesCount: 4, rules: [],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Chronic Care': 'bg-red-100 text-red-700',
  'Surgery':      'bg-purple-100 text-purple-700',
  'Maternity':    'bg-pink-100 text-pink-700',
  'Preventive':   'bg-green-100 text-green-700',
  'Dental':       'bg-blue-100 text-blue-700',
  'Oncology':     'bg-orange-100 text-orange-700',
  'Cardiology':   'bg-rose-100 text-rose-700',
  'Nephrology':   'bg-cyan-100 text-cyan-700',
  'Hospital':     'bg-[#E8F5F0] text-[#0D7C66]',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

// ─── Action Editor ─────────────────────────────────────────────────────────────
function ActionEditor({ action, onChange, onRemove, index }: {
  action: any; onChange: (a: any) => void; onRemove: () => void; index: number;
}) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Action {index + 1}</span>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <select className={inputCls} value={action.type || ''} onChange={e => onChange({ ...action, type: e.target.value })}>
        <option value="">Select action type…</option>
        {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      {action.type === 'SEND_WHATSAPP' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Message</label>
          <textarea className={`${inputCls} resize-none`} rows={3}
            placeholder="Hi {{name}}, it has been {{days}} days since your last visit. Time for a follow-up with Dr. {{doctor_name}}."
            value={action.message || ''}
            onChange={e => onChange({ ...action, message: e.target.value })} />
          <p className="text-xs text-slate-400 mt-1">Variables: {'{{name}}'} {'{{days}}'} {'{{doctor_name}}'} {'{{facility_name}}'} {'{{test_name}}'} {'{{medicine_name}}'}</p>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={action.includeBookButton || false}
              onChange={e => onChange({ ...action, includeBookButton: e.target.checked })}
              className="rounded border-slate-300 text-[#0D7C66]" />
            <span className="text-xs text-slate-600">Include booking reply buttons (Book / Remind Later / Not Needed)</span>
          </label>
        </div>
      )}

      {action.type === 'SEND_TEMPLATE' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Template Name</label>
          <select className={inputCls} value={action.templateName || ''}
            onChange={e => onChange({ ...action, templateName: e.target.value })}>
            <option value="">Select template…</option>
            <option value="appointment_reminder_24h">Appointment Reminder (24h)</option>
            <option value="followup_reminder">Follow-up Reminder</option>
            <option value="medicine_refill_reminder">Medicine Refill Reminder</option>
            <option value="lab_test_reminder">Lab Test Reminder</option>
            <option value="chronic_care_check">Chronic Care Check-in</option>
          </select>
        </div>
      )}

      {action.type === 'UPDATE_CRM_STAGE' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Stage</label>
          <select className={inputCls} value={action.stage || ''}
            onChange={e => onChange({ ...action, stage: e.target.value })}>
            <option value="">Select stage…</option>
            {CRM_STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      )}

      {action.type === 'NOTIFY_STAFF' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notification Message</label>
          <input className={inputCls} placeholder="Patient {{name}} has not responded to follow-up"
            value={action.message || ''} onChange={e => onChange({ ...action, message: e.target.value })} />
        </div>
      )}
    </div>
  );
}

// ─── Rule Card ─────────────────────────────────────────────────────────────────
function RuleCard({ rule, onToggle, onDelete }: {
  rule: AutomationRule; onToggle: () => void; onDelete: () => void;
}) {
  const trigger = TRIGGERS.find(t => t.value === rule.trigger);
  const convRate = rule.triggeredCount > 0
    ? Math.round((rule.convertedCount / rule.triggeredCount) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${rule.isActive ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${rule.isActive ? 'bg-[#E8F5F0]' : 'bg-slate-100'}`}>
            {trigger?.icon || '⚡'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{rule.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{trigger?.label} · {rule.waitDays} day{rule.waitDays !== 1 ? 's' : ''} delay</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={onToggle}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                    rule.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {rule.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {rule.isActive ? 'Active' : 'Paused'}
                </button>
                <button onClick={onDelete} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{rule.triggeredCount}</p>
                <p className="text-[10px] text-slate-400">Triggered</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[#0D7C66]">{rule.convertedCount}</p>
                <p className="text-[10px] text-slate-400">Converted</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-blue-600">{convRate}%</p>
                <p className="text-[10px] text-slate-400">Conv. Rate</p>
              </div>
              <div className="ml-auto">
                <div className="flex flex-wrap gap-1">
                  {(rule.actions as any[]).map((a, i) => (
                    <span key={i} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {a.type?.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Rule Modal ─────────────────────────────────────────────────────────
function CreateRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger: 'VISIT_COMPLETED',
    waitDays: 30,
    conditions: { tags: [] as string[], diagnosisCodes: [] as string[], ageMin: '', ageMax: '' },
    actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, it\'s time for your follow-up visit. Reply BOOK to schedule an appointment.' }] as any[],
    escalation: { retryAfterDays: 7, maxRetries: 2 },
  });
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.conditions.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, conditions: { ...f.conditions, tags: [...f.conditions.tags, tagInput.trim()] } }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, conditions: { ...f.conditions, tags: f.conditions.tags.filter(t => t !== tag) } }));
  };

  const updateAction = (index: number, action: any) => {
    setForm(f => ({ ...f, actions: f.actions.map((a, i) => i === index ? action : a) }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.trigger || form.actions.length === 0) {
      toast.error('Name, trigger, and at least one action are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/automation/rules', {
        name: form.name,
        description: form.description,
        trigger: form.trigger,
        waitDays: form.waitDays,
        conditions: {
          tags: form.conditions.tags,
          diagnosisCodes: form.conditions.diagnosisCodes,
          ...(form.conditions.ageMin ? { ageMin: Number(form.conditions.ageMin) } : {}),
          ...(form.conditions.ageMax ? { ageMax: Number(form.conditions.ageMax) } : {}),
        },
        actions: form.actions.filter(a => a.type),
        escalation: form.escalation,
      });
      toast.success('Automation rule created!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create rule');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Automation Rule</h2>
            <p className="text-xs text-slate-400 mt-0.5">Build a patient follow-up workflow</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Rule Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="e.g. Diabetic Patient 90-Day Follow-Up"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
              <input className={inputCls} placeholder="Brief description of what this rule does"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          {/* Trigger */}
          <div className="bg-[#E8F5F0] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#0D7C66] uppercase tracking-widest">① When This Happens (Trigger)</p>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGERS.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, trigger: t.value }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    form.trigger === t.value ? 'border-[#0D7C66] bg-white text-[#0D7C66]' : 'border-transparent bg-white/60 text-slate-600 hover:bg-white'
                  }`}>
                  <span className="text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Wait Days Before Action</label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={365} value={form.waitDays}
                  onChange={e => setForm(f => ({ ...f, waitDays: Number(e.target.value) }))}
                  className="flex-1 accent-[#0D7C66]" />
                <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-1.5 border border-[#0D7C66]/30 min-w-20 justify-center">
                  <span className="text-lg font-bold text-[#0D7C66]">{form.waitDays}</span>
                  <span className="text-xs text-slate-500">days</span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 day</span>
                <span>1 week</span>
                <span>1 month</span>
                <span>3 months</span>
                <span>6 months</span>
                <span>1 year</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">② For These Patients (Conditions)</p>
            <p className="text-xs text-slate-400">Leave empty to apply to ALL patients who trigger the event.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient Tags <span className="text-slate-300 font-normal normal-case">(match any)</span></label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.conditions.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-[#0D7C66] text-white px-2.5 py-1 rounded-full font-medium">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-300 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Type tag and press Enter (e.g. diabetic, hypertension)"
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button onClick={addTag} className="px-3 py-2.5 bg-[#0D7C66] text-white text-sm rounded-xl hover:bg-[#0A5E4F] transition-colors">Add</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Min Age</label>
                <input type="number" className={inputCls} placeholder="18" min={0} max={120}
                  value={form.conditions.ageMin}
                  onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, ageMin: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max Age</label>
                <input type="number" className={inputCls} placeholder="80" min={0} max={120}
                  value={form.conditions.ageMax}
                  onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, ageMax: e.target.value } }))} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">③ Then Do This (Actions)</p>
              <button onClick={() => setForm(f => ({ ...f, actions: [...f.actions, { type: 'SEND_WHATSAPP', message: '' }] }))}
                className="flex items-center gap-1 text-xs font-medium text-[#0D7C66] hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Action
              </button>
            </div>
            {form.actions.map((action, i) => (
              <ActionEditor key={i} action={action} index={i}
                onChange={a => updateAction(i, a)}
                onRemove={() => setForm(f => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))} />
            ))}
          </div>

          {/* Escalation */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">④ If Patient Doesn't Respond (Escalation)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-600 mb-1.5 uppercase tracking-wide">Retry After (days)</label>
                <input type="number" className={inputCls} placeholder="7" min={1}
                  value={form.escalation.retryAfterDays}
                  onChange={e => setForm(f => ({ ...f, escalation: { ...f.escalation, retryAfterDays: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-600 mb-1.5 uppercase tracking-wide">Max Retries</label>
                <input type="number" className={inputCls} placeholder="2" min={0} max={5}
                  value={form.escalation.maxRetries}
                  onChange={e => setForm(f => ({ ...f, escalation: { ...f.escalation, maxRetries: Number(e.target.value) } }))} />
              </div>
            </div>
            <p className="text-xs text-amber-600">After max retries, patient is flagged in CRM for manual outreach.</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Creating…' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const [rules, setRules]     = useState<AutomationRule[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'rules' | 'protocols' | 'logs'>('rules');
  const [showCreate, setShowCreate] = useState(false);
  const [installingProtocol, setInstallingProtocol] = useState<string | null>(null);
  const [installedProtocols, setInstalledProtocols] = useState<Set<string>>(new Set());
  const [logs, setLogs]       = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, statsRes] = await Promise.all([
        api.get('/automation/rules'),
        api.get('/automation/stats'),
      ]);
      setRules(rulesRes.data.data ?? []);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load automation'); }
    finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('/automation/logs?limit=50');
      setLogs(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  const toggleRule = async (rule: AutomationRule) => {
    try {
      await api.patch(`/automation/rules/${rule.id}/toggle`);
      setRules(r => r.map(x => x.id === rule.id ? { ...x, isActive: !x.isActive } : x));
      toast.success(rule.isActive ? 'Rule paused' : 'Rule activated');
    } catch { toast.error('Failed to update rule'); }
  };

  const deleteRule = async (id: string) => {
    // Confirmed via UI button
    try {
      await api.delete(`/automation/rules/${id}`);
      setRules(r => r.filter(x => x.id !== id));
      toast.success('Rule deleted');
    } catch { toast.error('Failed to delete rule'); }
  };

  const installProtocol = async (protocolId: string) => {
    setInstallingProtocol(protocolId);
    try {
      const res = await api.post(`/automation/protocols/${protocolId}/install`);
      toast.success(`${res.data.protocol} installed! ${res.data.rulesCreated} rules created.`);
      setInstalledProtocols(p => new Set([...p, protocolId]));
      load();
      setTab('rules');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to install protocol');
    } finally { setInstallingProtocol(null); }
  };

  const activeRules   = rules.filter(r => r.isActive).length;
  const totalTriggered = stats?.totalTriggered ?? 0;
  const convRate      = stats?.conversionRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automated patient follow-ups that drive repeat visits</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Rules',    value: activeRules,     icon: Zap,          color: '#0D7C66' },
          { label: 'Messages Sent',   value: totalTriggered,  icon: MessageSquare, color: '#25D366' },
          { label: 'Appointments Booked', value: stats?.totalConverted ?? 0, icon: Calendar, color: '#3B82F6' },
          { label: 'Conversion Rate', value: `${convRate}%`,  icon: BarChart3,    color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([['rules', 'My Rules'], ['protocols', 'Protocol Templates'], ['logs', 'Activity Log']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
            {key === 'rules' && rules.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-[#0D7C66] text-white px-1.5 py-0.5 rounded-full">{rules.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: My Rules */}
      {tab === 'rules' && (
        loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28" />)}</div>
        ) : rules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <Zap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No automation rules yet</p>
            <p className="text-slate-300 text-xs mt-1 mb-5">Create your first rule or install a pre-built protocol</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors">
                <Plus className="w-4 h-4" /> Create Custom Rule
              </button>
              <button onClick={() => setTab('protocols')}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <Activity className="w-4 h-4" /> Browse Protocols
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <RuleCard key={rule.id} rule={rule}
                onToggle={() => toggleRule(rule)}
                onDelete={() => deleteRule(rule.id)} />
            ))}
          </div>
        )
      )}

      {/* Tab: Protocol Templates */}
      {tab === 'protocols' && (
        <div className="space-y-4">
          <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-sm text-[#0A5E4F] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>One-click activation.</strong> Each protocol installs multiple pre-configured rules. Patients who match the conditions receive automated follow-ups at the right time intervals.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROTOCOL_TEMPLATES.map(proto => {
              const installed = installedProtocols.has(proto.id);
              return (
                <div key={proto.id} className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${installed ? 'border-[#0D7C66]/30 bg-[#E8F5F0]/30' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[proto.category] || 'bg-slate-100 text-slate-600'}`}>
                      {proto.category}
                    </span>
                    <span className="text-xs text-slate-400">{proto.rulesCount} rules</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{proto.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">{proto.description}</p>
                  <button
                    onClick={() => !installed && installProtocol(proto.id)}
                    disabled={installingProtocol === proto.id || installed}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      installed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-[#0D7C66] text-white hover:bg-[#0A5E4F] disabled:opacity-60'
                    }`}>
                    {installingProtocol === proto.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Installing…</>
                      : installed
                      ? <><CheckCircle2 className="w-4 h-4" /> Installed</>
                      : <><Zap className="w-4 h-4" /> Activate Protocol</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Activity Log */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Automation Activity</h3>
            <button onClick={loadLogs} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {loadingLogs ? (
            <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-12" />)}</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No automation activity yet</p>
              <p className="text-slate-300 text-xs mt-1">Activity will appear here once rules start triggering</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log, i) => (
                <div key={log.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    log.result === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.result === 'sent' ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{log.rule?.name || 'Automation Rule'}</p>
                    <p className="text-xs text-slate-400">{log.actionTaken?.replace('_', ' ')} · {new Date(log.executedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    log.result === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
