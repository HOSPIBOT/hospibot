'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Zap, Plus, X, Loader2, RefreshCw, Play, Pause,
  ChevronDown, ChevronUp, MessageSquare, Clock, Users,
  ArrowDown, CheckCircle2, Trash2, Copy,
} from 'lucide-react';

const TRIGGER_OPTIONS = [
  { value: 'VISIT_COMPLETED',      label: 'After Visit Completed' },
  { value: 'APPOINTMENT_BOOKED',   label: 'After Appointment Booked' },
  { value: 'DIAGNOSIS_RECORDED',   label: 'After Diagnosis Recorded' },
  { value: 'MEDICATION_PRESCRIBED',label: 'After Medication Prescribed' },
  { value: 'TAG_APPLIED',          label: 'After Tag Applied' },
  { value: 'MANUAL',               label: 'Manual (send to segment)' },
];

const STEP_TYPES = [
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp Message', icon: MessageSquare, color: '#25D366' },
  { value: 'WAIT',             label: 'Wait / Delay',     icon: Clock,          color: '#64748B' },
  { value: 'TAG',              label: 'Apply Tag',         icon: Users,          color: '#8B5CF6' },
];

const COMMON_TEMPLATES = [
  { name: 'Post-Visit Follow-Up',    trigger: 'VISIT_COMPLETED',    delay: 1,  message: 'Hello {name}, thank you for visiting {hospital}. How are you feeling today? Reply if you have any concerns.' },
  { name: 'Medication Refill Alert', trigger: 'MEDICATION_PRESCRIBED', delay: 25, message: 'Hi {name}, your prescription for {medication} is due for refill in 5 days. Reply "REFILL" to book a consultation.' },
  { name: '7-Day Check-In',         trigger: 'VISIT_COMPLETED',    delay: 7,  message: 'Hi {name}, it\'s been a week since your visit. How are you feeling? Reply if you need any assistance.' },
  { name: 'Appointment Reminder',   trigger: 'APPOINTMENT_BOOKED', delay: -1, message: 'Reminder: You have an appointment tomorrow at {time} with {doctor}. Reply CONFIRM to confirm or RESCHEDULE to change.' },
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

interface DripStep { id: string; type: string; delayDays: number; message?: string; tag?: string; }

export default function DripCampaignPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', trigger: 'VISIT_COMPLETED',
    triggerCondition: '', targetTag: '',
  });
  const [steps, setSteps] = useState<DripStep[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/automation/rules', { params: { type: 'DRIP' } });
      const rules = (res.data ?? []).filter((r: any) => r.isDrip || r.type === 'DRIP' || (r.actions && Array.isArray(r.actions) && r.actions.length > 1));
      setCampaigns(rules);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addStep = (type = 'WHATSAPP_MESSAGE') => {
    setSteps(s => [...s, {
      id: `step-${Date.now()}`, type,
      delayDays: steps.length === 0 ? 0 : 1,
      message: type === 'WHATSAPP_MESSAGE' ? '' : undefined,
      tag: type === 'TAG' ? '' : undefined,
    }]);
  };

  const updateStep = (id: string, patch: Partial<DripStep>) => {
    setSteps(s => s.map((st: any) => st.id === id ? { ...st, ...patch } : st));
  };

  const removeStep = (id: string) => setSteps(s => s.filter((st: any) => st.id !== id));

  const loadTemplate = (t: typeof COMMON_TEMPLATES[0]) => {
    setForm(f => ({ ...f, name: t.name, trigger: t.trigger }));
    setSteps([{
      id: `step-${Date.now()}`, type: 'WHATSAPP_MESSAGE',
      delayDays: t.delay > 0 ? t.delay : 0, message: t.message,
    }]);
  };

  const save = async () => {
    if (!form.name || steps.length === 0) { toast.error('Name and at least one step required'); return; }
    const msgSteps = steps.filter((s: any) => s.type === 'WHATSAPP_MESSAGE' && !s.message?.trim());
    if (msgSteps.length > 0) { toast.error('All WhatsApp steps need a message'); return; }
    setSaving(true);
    try {
      await api.post('/automation/rules', {
        name: form.name,
        description: form.description,
        triggerEvent: form.trigger,
        conditions: form.triggerCondition ? [{ field: 'tags', operator: 'contains', value: form.triggerCondition }] : [],
        actions: steps.map((s: any) => ({
          type: s.type,
          delayDays: s.delayDays,
          message: s.message,
          tag: s.tag,
        })),
        isDrip: true,
        status: 'ACTIVE',
      });
      toast.success('Drip campaign created and activated!');
      setShowCreate(false);
      setForm({ name:'', description:'', trigger:'VISIT_COMPLETED', triggerCondition:'', targetTag:'' });
      setSteps([]);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (rule: any) => {
    try {
      await api.post(`/automation/rules/${rule.id}/toggle`);
      toast.success(`Campaign ${rule.status === 'ACTIVE' ? 'paused' : 'activated'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#0D7C66]" /> Drip Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Multi-step WhatsApp automation sequences for patient engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> New Drip Campaign
          </button>
        </div>
      </div>

      {/* Templates */}
      {!showCreate && (
        <div className="bg-gradient-to-r from-[#E8F5F0] to-white rounded-2xl border border-[#0D7C66]/20 p-5">
          <p className="text-sm font-bold text-slate-900 mb-3">⚡ Quick-start templates</p>
          <div className="grid grid-cols-2 gap-3">
            {COMMON_TEMPLATES.map((t: any) => (
              <button key={t.name} onClick={() => { loadTemplate(t); setShowCreate(true); }}
                className="text-left p-3.5 bg-white rounded-xl border border-slate-100 hover:border-[#0D7C66]/30 hover:shadow-sm transition-all">
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.message.slice(0,80)}…</p>
                <p className="text-[11px] font-medium text-[#0D7C66] mt-1.5">Trigger: {TRIGGER_OPTIONS.find((o: any) =>o.value===t.trigger)?.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campaign list */}
      {!showCreate && (
        <div className="space-y-3">
          {loading ? (
            Array.from({length:3}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
              <Zap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No drip campaigns yet</p>
              <p className="text-slate-400 text-xs mt-1">Use a template above or create one from scratch</p>
            </div>
          ) : campaigns.map((c: any) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {TRIGGER_OPTIONS.find((o: any) =>o.value===c.triggerEvent)?.label || c.triggerEvent}
                      {' · '}{Array.isArray(c.actions) ? c.actions.length : 0} steps
                      {' · '}Created {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {c.status}
                  </span>
                  <button onClick={() => toggleStatus(c)}
                    className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
                    {c.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5"/>}
                  </button>
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
                    {expanded === c.id ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                  </button>
                </div>
              </div>
              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                  <div className="relative pl-5">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
                    {(Array.isArray(c.actions) ? c.actions : []).map((action: any, i: number) => {
                      const st = STEP_TYPES.find((s: any) => s.value === action.type) || STEP_TYPES[0];
                      return (
                        <div key={i} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style={{background: st.color}}>
                            <st.icon className="w-2 h-2 text-white" />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 ml-2">
                            {action.delayDays > 0 && (
                              <p className="text-[11px] text-slate-400 mb-1.5 font-medium">⏱ Wait {action.delayDays} day{action.delayDays!==1?'s':''} then:</p>
                            )}
                            <p className="text-xs font-semibold" style={{color: st.color}}>{st.label}</p>
                            {action.message && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{action.message}</p>}
                            {action.tag && <p className="text-xs text-slate-600 mt-1">Tag: <span className="font-semibold">{action.tag}</span></p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Build Drip Campaign</h2>
            <button onClick={() => { setShowCreate(false); setSteps([]); }}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Campaign Name *</label>
              <input className={inputCls} placeholder="Diabetic Follow-Up Sequence…" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Trigger *</label>
              <select className={inputCls} value={form.trigger} onChange={e=>setForm(f=>({...f,trigger:e.target.value}))}>
                {TRIGGER_OPTIONS.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Description</label>
              <input className={inputCls} placeholder="Automated follow-up sequence for post-discharge patients…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
          </div>

          {/* Steps builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">Sequence Steps</p>
              <p className="text-xs text-slate-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</p>
            </div>

            {steps.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No steps yet</p>
                <p className="text-slate-400 text-xs mt-1">Add steps below to build your sequence</p>
              </div>
            )}

            <div className="relative">
              {steps.length > 0 && <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100 z-0" />}
              <div className="relative space-y-3 z-10">
                {steps.map((step, idx) => {
                  const st = STEP_TYPES.find((s: any) => s.value === step.type) || STEP_TYPES[0];
                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-1" style={{background: st.color}}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <select value={step.type} onChange={e=>updateStep(step.id, {type:e.target.value})}
                            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-white outline-none cursor-pointer">
                            {STEP_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          {idx > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>After</span>
                              <input type="number" min={0} max={365}
                                className="w-16 text-xs border border-slate-200 rounded-xl px-2 py-1 bg-white outline-none text-center"
                                value={step.delayDays}
                                onChange={e=>updateStep(step.id, {delayDays: +e.target.value})} />
                              <span>days</span>
                            </div>
                          )}
                          <button onClick={()=>removeStep(step.id)} className="ml-auto p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {step.type === 'WHATSAPP_MESSAGE' && (
                          <div>
                            <textarea
                              rows={3}
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-[#0D7C66] outline-none resize-none placeholder:text-slate-400"
                              placeholder="Type your WhatsApp message…&#10;Use {name}, {hospital}, {doctor}, {date} as variables"
                              value={step.message || ''}
                              onChange={e=>updateStep(step.id, {message: e.target.value})}
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Variables: {'{name}'} {'{hospital}'} {'{doctor}'} {'{date}'}</p>
                          </div>
                        )}
                        {step.type === 'TAG' && (
                          <input className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none placeholder:text-slate-400"
                            placeholder="Tag to apply (e.g., follow-up-done, high-risk)…"
                            value={step.tag || ''}
                            onChange={e=>updateStep(step.id, {tag: e.target.value})} />
                        )}
                        {step.type === 'WAIT' && (
                          <p className="text-xs text-slate-400">Pause the sequence for the configured number of days before the next step.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add step buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {STEP_TYPES.map((st: any) => (
                <button key={st.value} onClick={() => addStep(st.value)}
                  className="flex items-center gap-1.5 text-xs font-semibold border border-dashed px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  style={{color: st.color, borderColor: `${st.color}40`}}>
                  <Plus className="w-3.5 h-3.5" /> {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">{steps.length} step sequence · Will activate immediately on save</p>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Save & Activate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
