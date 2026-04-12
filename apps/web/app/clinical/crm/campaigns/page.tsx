'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, X, Loader2, MessageSquare, Users, Send,
  Clock, CheckCircle2, AlertCircle, BarChart3, ArrowLeft,
  Play, Eye, Calendar, Filter, TrendingUp, ChevronRight,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  scheduled: 'bg-blue-100 text-blue-700',
  running:   'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed:    'bg-red-100 text-red-700',
};

const TEMPLATES = [
  { name: 'followup_reminder',        label: 'Follow-Up Reminder',         category: 'FOLLOWUP' },
  { name: 'medicine_refill_reminder', label: 'Medicine Refill Reminder',    category: 'FOLLOWUP' },
  { name: 'lab_test_reminder',        label: 'Lab Test Reminder',           category: 'FOLLOWUP' },
  { name: 'chronic_care_check',       label: 'Chronic Care Check-In',       category: 'FOLLOWUP' },
  { name: 'appointment_reminder_24h', label: 'Appointment Reminder (24h)',  category: 'APPOINTMENT' },
  { name: 'discharge_followup',       label: 'Post-Discharge Follow-Up',    category: 'FOLLOWUP' },
  { name: 'payment_request',          label: 'Payment Request',             category: 'BILLING' },
];

const SOURCES = ['WHATSAPP','WEBSITE','WALK_IN','REFERRAL','GOOGLE_ADS','FACEBOOK_ADS','INSTAGRAM','JUSTDIAL','PRACTO','OTHER'];
const STAGES  = ['NEW','CONTACTED','APPOINTMENT_BOOKED','VISITED','FOLLOW_UP_PENDING','ACTIVE_PATIENT','DORMANT'];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

// ─── Campaign Card ─────────────────────────────────────────────────────────────
function CampaignCard({ campaign, onExecute, onView }: { campaign: any; onExecute: () => void; onView: () => void }) {
  const deliveryRate = campaign.sentCount > 0
    ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100) : 0;
  const readRate = campaign.deliveredCount > 0
    ? Math.round((campaign.readCount / campaign.deliveredCount) * 100) : 0;
  const convRate = campaign.sentCount > 0
    ? Math.round(((campaign.convertedCount || 0) / campaign.sentCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}>
              {campaign.status.toUpperCase()}
            </span>
            {campaign.scheduledAt && campaign.status === 'scheduled' && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(campaign.scheduledAt).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900">{campaign.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Template: {campaign.templateName} · Target: {campaign.targetCount} patients</p>
        </div>
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Sent',      value: campaign.sentCount || 0,       color: '#3B82F6' },
          { label: 'Delivered', value: campaign.deliveredCount || 0,  color: '#8B5CF6' },
          { label: 'Read',      value: campaign.readCount || 0,       color: '#F59E0B' },
          { label: 'Converted', value: campaign.convertedCount || 0,  color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="text-center bg-slate-50 rounded-xl py-2">
            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rates bar */}
      {campaign.sentCount > 0 && (
        <div className="space-y-1.5 mb-4">
          {[
            { label: 'Delivery Rate', rate: deliveryRate, color: '#8B5CF6' },
            { label: 'Read Rate',     rate: readRate,     color: '#F59E0B' },
            { label: 'Conv. Rate',    rate: convRate,     color: '#10B981' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 w-24">{r.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${r.rate}%`, background: r.color }} />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 w-8 text-right">{r.rate}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
          <button onClick={onExecute}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#25D366] py-2 rounded-xl hover:opacity-90 transition-opacity">
            <Play className="w-3.5 h-3.5" /> Send Now
          </button>
        )}
        {campaign.status === 'completed' && (
          <span className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Create Campaign Modal ─────────────────────────────────────────────────────
function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep]             = useState<1|2|3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate]     = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    templateName: '',
    scheduledAt: '',
    filters: {
      stages:     [] as string[],
      sources:    [] as string[],
      tags:       '',
      city:       '',
      minDaysSinceVisit: '',
      maxDaysSinceVisit: '',
      hasOutstandingBill: false,
      ageMin: '',
      ageMax: '',
    },
  });

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (field: 'stages' | 'sources', val: string) =>
    setForm(f => ({
      ...f,
      filters: {
        ...f.filters,
        [field]: f.filters[field].includes(val)
          ? f.filters[field].filter(x => x !== val)
          : [...f.filters[field], val],
      },
    }));

  const estimateReach = async () => {
    setEstimating(true);
    try {
      const res = await api.post('/crm/campaigns/estimate', { filters: buildFilters() });
      setEstimate(res.data.count ?? 0);
    } catch {
      setEstimate(null);
    } finally { setEstimating(false); }
  };

  const buildFilters = () => ({
    ...(form.filters.stages.length     ? { stages: form.filters.stages }     : {}),
    ...(form.filters.sources.length    ? { sources: form.filters.sources }   : {}),
    ...(form.filters.tags              ? { tags: form.filters.tags.split(',').map(t => t.trim()).filter(Boolean) } : {}),
    ...(form.filters.city              ? { city: form.filters.city }         : {}),
    ...(form.filters.minDaysSinceVisit ? { minDaysSinceVisit: Number(form.filters.minDaysSinceVisit) } : {}),
    ...(form.filters.maxDaysSinceVisit ? { maxDaysSinceVisit: Number(form.filters.maxDaysSinceVisit) } : {}),
    ...(form.filters.hasOutstandingBill ? { hasOutstandingBill: true }        : {}),
    ...(form.filters.ageMin            ? { ageMin: Number(form.filters.ageMin) } : {}),
    ...(form.filters.ageMax            ? { ageMax: Number(form.filters.ageMax) } : {}),
  });

  const handleSubmit = async () => {
    if (!form.name || !form.templateName) { toast.error('Name and template required'); return; }
    setSubmitting(true);
    try {
      await api.post('/crm/campaigns', {
        name: form.name,
        templateName: form.templateName,
        filters: buildFilters(),
        scheduledAt: form.scheduledAt || undefined,
      });
      toast.success('Campaign created! Ready to send.');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    } finally { setSubmitting(false); }
  };

  const selectedTemplate = TEMPLATES.find(t => t.name === form.templateName);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Campaign</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-3">
            {[['Campaign Info', '📝'], ['Audience', '👥'], ['Review & Send', '🚀']].map(([label, icon], i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${step > i + 1 ? 'bg-[#0D7C66] text-white' : step === i + 1 ? 'border-2 border-[#0D7C66] text-[#0D7C66]' : 'bg-slate-100 text-slate-400'}`}>
                  {step > i + 1 ? '✓' : icon}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Step 1: Campaign Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Campaign Name <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="e.g. Monsoon Health Camp — April 2026"
                  value={form.name} onChange={e => setF('name', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">WhatsApp Template <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => setF('templateName', t.name)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        form.templateName === t.name ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}>
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${form.templateName === t.name ? 'text-[#0D7C66]' : 'text-slate-400'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${form.templateName === t.name ? 'text-[#0D7C66]' : 'text-slate-700'}`}>{t.label}</p>
                        <p className="text-[10px] text-slate-400">{t.category}</p>
                      </div>
                      {form.templateName === t.name && <CheckCircle2 className="w-4 h-4 text-[#0D7C66] ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Schedule (optional — leave blank to send immediately)</label>
                <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={e => setF('scheduledAt', e.target.value)} />
              </div>
            </>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <>
              <div className="bg-[#E8F5F0] rounded-xl px-4 py-3 text-xs text-[#0A5E4F]">
                Leave all filters empty to send to <strong>all patients</strong>. Use filters to target specific segments.
              </div>

              {/* Stages */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">CRM Stage <span className="text-slate-300 font-normal normal-case">(match any selected)</span></label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => toggleArr('stages', s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                        form.filters.stages.includes(s) ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Lead Source <span className="text-slate-300 font-normal normal-case">(match any selected)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map(s => (
                    <button key={s} onClick={() => toggleArr('sources', s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                        form.filters.sources.includes(s) ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags, City, Days since visit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient Tags <span className="text-slate-300 font-normal normal-case">(comma-sep)</span></label>
                  <input className={inputCls} placeholder="diabetic, hypertension"
                    value={form.filters.tags} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, tags: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
                  <input className={inputCls} placeholder="Hyderabad"
                    value={form.filters.city} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, city: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Visit Min (days ago)</label>
                  <input type="number" className={inputCls} placeholder="30"
                    value={form.filters.minDaysSinceVisit} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, minDaysSinceVisit: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Visit Max (days ago)</label>
                  <input type="number" className={inputCls} placeholder="90"
                    value={form.filters.maxDaysSinceVisit} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, maxDaysSinceVisit: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Age Min</label>
                  <input type="number" className={inputCls} placeholder="18"
                    value={form.filters.ageMin} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, ageMin: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Age Max</label>
                  <input type="number" className={inputCls} placeholder="65"
                    value={form.filters.ageMax} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, ageMax: e.target.value } }))} />
                </div>
              </div>

              {/* Outstanding bill toggle */}
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={form.filters.hasOutstandingBill}
                  onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, hasOutstandingBill: e.target.checked } }))}
                  className="w-4 h-4 accent-[#0D7C66]" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Patients with outstanding bills only</p>
                  <p className="text-xs text-slate-400">Only send to patients who have unpaid invoices</p>
                </div>
              </label>

              {/* Estimate button */}
              <button onClick={estimateReach} disabled={estimating}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#0D7C66]/40 text-[#0D7C66] text-sm font-medium py-3 rounded-xl hover:bg-[#E8F5F0] transition-colors disabled:opacity-60">
                {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {estimating ? 'Estimating…' : estimate !== null ? `~${estimate} patients will receive this campaign — recalculate` : 'Estimate Audience Size'}
              </button>

              {estimate !== null && (
                <div className="bg-[#E8F5F0] rounded-xl px-4 py-3 flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#0D7C66]" />
                  <p className="text-sm font-semibold text-[#0D7C66]">
                    <strong>{estimate}</strong> patients match your filters and will receive this campaign
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Campaign Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-semibold text-slate-900">{form.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Template</span>
                    <span className="font-semibold text-slate-900">{selectedTemplate?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Send Time</span>
                    <span className="font-semibold text-slate-900">
                      {form.scheduledAt ? new Date(form.scheduledAt).toLocaleString('en-IN') : 'Immediately'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Audience</span>
                    <span className="font-semibold text-[#0D7C66]">{estimate !== null ? `~${estimate} patients` : 'Not estimated'}</span>
                  </div>
                </div>
              </div>

              {/* Active filters summary */}
              {(form.filters.stages.length > 0 || form.filters.sources.length > 0 || form.filters.tags || form.filters.city) && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 mb-2">ACTIVE FILTERS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.filters.stages.map(s => <span key={s} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    {form.filters.sources.map(s => <span key={s} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    {form.filters.tags && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tags: {form.filters.tags}</span>}
                    {form.filters.city && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">City: {form.filters.city}</span>}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This will send WhatsApp messages to real patients using Meta-approved templates.
                  Patients can opt out by replying STOP. All campaigns are logged for compliance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={() => step > 1 ? setStep((s => (s - 1) as 1|2|3)(step)) : onClose()}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 3 ? (
            <button onClick={() => setStep((s => (s + 1) as 2|3)(step))}
              disabled={step === 1 && (!form.name || !form.templateName)}
              className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              {submitting ? 'Creating…' : form.scheduledAt ? 'Schedule Campaign' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatus] = useState('');
  const [executing, setExecuting] = useState<string | null>(null);
  const [meta, setMeta]           = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/crm/campaigns', { params });
      setCampaigns(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const executeCampaign = async (id: string) => {
    if (!window.confirm('Send this campaign to all matching patients now?')) return;
    setExecuting(id);
    try {
      const res = await api.post(`/crm/campaigns/${id}/execute`);
      toast.success(`Campaign sent to ${res.data.sentCount || 0} patients!`);
      load(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to execute campaign');
    } finally { setExecuting(null); }
  };

  // Overall stats
  const totalSent      = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalRead      = campaigns.reduce((s, c) => s + (c.readCount || 0), 0);
  const totalConverted = campaigns.reduce((s, c) => s + (c.convertedCount || 0), 0);
  const avgReadRate    = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/clinical/crm" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WhatsApp Campaigns</h1>
            <p className="text-sm text-slate-500 mt-0.5">{meta.total} campaigns · {totalSent.toLocaleString('en-IN')} messages sent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(1)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: meta.total,       icon: MessageSquare, color: '#0D7C66' },
          { label: 'Messages Sent',   value: totalSent,        icon: Send,          color: '#25D366' },
          { label: 'Avg Read Rate',   value: `${avgReadRate}%`, icon: TrendingUp,   color: '#F59E0B' },
          { label: 'Appointments',    value: totalConverted,   icon: Calendar,      color: '#3B82F6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'draft', 'scheduled', 'running', 'completed', 'failed'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all capitalize ${statusFilter === s ? 'bg-[#0D7C66] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Campaigns grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-52" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No campaigns yet</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Create your first campaign to reach patients at scale</p>
          <button onClick={() => setShowCreate(true)}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c}
              onExecute={() => executeCampaign(c.id)}
              onView={() => {}} />
          ))}
        </div>
      )}

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onCreated={() => load(1)} />}
    </div>
  );
}
