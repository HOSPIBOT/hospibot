'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, Plus, RefreshCw, X, CheckCircle2, AlertTriangle,
  Clock, Eye, Copy, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';

const STANDARD_TEMPLATES = [
  {
    name: 'appointment_confirmation',
    displayName: 'Appointment Confirmation',
    category: 'APPOINTMENT',
    bodyText: 'Your appointment with Dr. {{doctor_name}} at {{facility_name}} is confirmed for {{date}} at {{time}}. Your token number is {{token}}. Reply RESCHEDULE to change the time.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Reschedule' }, { type: 'QUICK_REPLY', text: 'Cancel' }],
    variables: ['doctor_name', 'facility_name', 'date', 'time', 'token'],
  },
  {
    name: 'appointment_reminder_24h',
    displayName: 'Appointment Reminder (24 Hours)',
    category: 'APPOINTMENT',
    bodyText: 'Reminder: You have an appointment tomorrow, {{date}} at {{time}} with Dr. {{doctor_name}} at {{facility_name}}. Reply CONFIRM to confirm or RESCHEDULE to change.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Confirm' }, { type: 'QUICK_REPLY', text: 'Reschedule' }],
    variables: ['date', 'time', 'doctor_name', 'facility_name'],
  },
  {
    name: 'appointment_reminder_2h',
    displayName: 'Appointment Reminder (2 Hours)',
    category: 'APPOINTMENT',
    bodyText: 'Your appointment with Dr. {{doctor_name}} is in 2 hours at {{time}}. Please arrive 10 minutes early. Your token: {{token}}.',
    buttons: [],
    variables: ['doctor_name', 'time', 'token'],
  },
  {
    name: 'lab_report_ready',
    displayName: 'Lab Report Ready',
    category: 'LAB',
    bodyText: 'Your {{test_name}} report from {{facility_name}} is ready. Tap below to download your report securely.',
    buttons: [{ type: 'URL', text: 'Download Report', url: '{{report_url}}' }],
    variables: ['test_name', 'facility_name', 'report_url'],
  },
  {
    name: 'payment_request',
    displayName: 'Payment Request',
    category: 'BILLING',
    bodyText: 'Your invoice from {{facility_name}} for ₹{{amount}} is ready. Invoice: {{invoice_number}}. Tap below to pay securely via UPI, Card or Net Banking.',
    buttons: [{ type: 'URL', text: 'Pay Now', url: '{{payment_url}}' }],
    variables: ['facility_name', 'amount', 'invoice_number', 'payment_url'],
  },
  {
    name: 'payment_receipt',
    displayName: 'Payment Receipt',
    category: 'BILLING',
    bodyText: 'Payment received! ₹{{amount}} paid to {{facility_name}}. Invoice: {{invoice_number}}. Thank you for your payment.',
    buttons: [],
    variables: ['amount', 'facility_name', 'invoice_number'],
  },
  {
    name: 'followup_reminder',
    displayName: 'Follow-Up Reminder',
    category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, Dr. {{doctor_name}} at {{facility_name}} recommends a follow-up visit. It has been {{days}} days since your last visit.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Now' }, { type: 'QUICK_REPLY', text: 'Remind Later' }, { type: 'QUICK_REPLY', text: 'Not Needed' }],
    variables: ['name', 'doctor_name', 'facility_name', 'days'],
  },
  {
    name: 'medicine_refill_reminder',
    displayName: 'Medicine Refill Reminder',
    category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, your prescription for {{medicine_name}} from {{facility_name}} is due for refill in {{days}} days.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Request Refill' }, { type: 'QUICK_REPLY', text: 'I Have Enough' }],
    variables: ['name', 'medicine_name', 'facility_name', 'days'],
  },
  {
    name: 'lab_test_reminder',
    displayName: 'Lab Test Reminder',
    category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, Dr. {{doctor_name}} recommends your {{test_name}} test. It has been {{period}} since your last test.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Test' }, { type: 'QUICK_REPLY', text: 'Remind Later' }],
    variables: ['name', 'doctor_name', 'test_name', 'period'],
  },
  {
    name: 'chronic_care_check',
    displayName: 'Chronic Care Check-In',
    category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, checking in on your {{condition}} management. How are you feeling today?',
    buttons: [{ type: 'QUICK_REPLY', text: 'Doing Well' }, { type: 'QUICK_REPLY', text: 'Need Appointment' }, { type: 'QUICK_REPLY', text: 'Call Me' }],
    variables: ['name', 'condition'],
  },
  {
    name: 'discharge_followup',
    displayName: 'Post-Discharge Follow-Up',
    category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, you were discharged from {{facility_name}} {{days}} days ago. Hope you are recovering well. Any concerns?',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Follow-up' }, { type: 'QUICK_REPLY', text: 'I Am Fine' }],
    variables: ['name', 'facility_name', 'days'],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  APPOINTMENT: 'bg-blue-100 text-blue-700',
  LAB: 'bg-amber-100 text-amber-700',
  BILLING: 'bg-emerald-100 text-emerald-700',
  FOLLOWUP: 'bg-purple-100 text-purple-700',
  GENERAL: 'bg-slate-100 text-slate-600',
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function TemplateCard({ template, onSeed }: { template: any; onSeed: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeed();
    } finally { setSeeding(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.GENERAL}`}>
              {template.category}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[template.status || 'PENDING']}`}>
              {template.status || 'NOT SEEDED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => copy(template.bodyText)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Copy body text">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="font-semibold text-slate-900 text-sm">{template.displayName}</p>
        <p className="text-xs font-mono text-slate-400 mt-0.5">{template.name}</p>

        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Message Body</p>
              <p className="text-sm text-slate-700 leading-relaxed">{template.bodyText}</p>
            </div>

            {template.variables?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v: string) => (
                    <code key={v} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-mono">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
            )}

            {template.buttons?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Buttons</p>
                <div className="flex flex-wrap gap-2">
                  {template.buttons.map((btn: any, i: number) => (
                    <span key={i} className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      btn.type === 'QUICK_REPLY' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    }`}>
                      {btn.text} {btn.type === 'URL' ? '🔗' : '↩'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [seeding, setSeeding]   = useState(false);
  const [filter, setFilter]     = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/templates?global=true');
      setTemplates(res.data.data ?? []);
    } catch { /* use standard templates */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedAllTemplates = async () => {
    setSeeding(true);
    try {
      await api.post('/whatsapp/templates/seed-defaults');
      toast.success('All standard templates seeded! They are now available to all tenants.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to seed templates');
    } finally { setSeeding(false); }
  };

  const categories = ['ALL', 'APPOINTMENT', 'LAB', 'BILLING', 'FOLLOWUP', 'GENERAL'];

  // Merge standard templates with DB templates for display
  const displayTemplates = STANDARD_TEMPLATES.filter(t =>
    filter === 'ALL' || t.category === filter
  ).map(st => {
    const dbTemplate = templates.find(t => t.name === st.name);
    return { ...st, status: dbTemplate?.status || null };
  });

  const seededCount  = displayTemplates.filter(t => t.status).length;
  const approvedCount = displayTemplates.filter(t => t.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Standard templates for all tenants · {approvedCount} approved · {seededCount} seeded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={seedAllTemplates} disabled={seeding}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {seeding ? 'Seeding…' : 'Seed All Templates'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>How templates work:</strong> These are the standard Meta-approved templates used by all HospiBot tenants.
          Click <strong>Seed All Templates</strong> to save them to the database. For Meta approval, submit each template from the
          Meta Business Manager. Templates in APPROVED status are immediately available for automated sending.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Templates', value: STANDARD_TEMPLATES.length, color: '#0D7C66', icon: MessageSquare },
          { label: 'Seeded in DB',    value: seededCount,               color: '#3B82F6', icon: CheckCircle2 },
          { label: 'Approved by Meta', value: approvedCount,            color: '#10B981', icon: CheckCircle2 },
          { label: 'Pending Approval', value: seededCount - approvedCount, color: '#F59E0B', icon: Clock },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filter === cat ? 'bg-[#0D7C66] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {cat === 'ALL' ? `All (${STANDARD_TEMPLATES.length})` : `${cat} (${STANDARD_TEMPLATES.filter(t => t.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayTemplates.map(template => (
          <TemplateCard key={template.name} template={template} onSeed={async () => {
            try {
              await api.post('/whatsapp/templates', {
                name: template.name, displayName: template.displayName,
                category: template.category, bodyText: template.bodyText,
                buttons: template.buttons, variables: template.variables,
                isDefault: true,
              });
              toast.success(`${template.displayName} saved`);
              load();
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Failed');
            }
          }} />
        ))}
      </div>
    </div>
  );
}
