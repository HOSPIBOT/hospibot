'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare, Plus, RefreshCw, X, Loader2, Eye,
  Send, Copy, Check, CheckCircle2, AlertTriangle, Search,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  APPOINTMENT: 'bg-blue-100 text-blue-700',
  BILLING:     'bg-emerald-100 text-emerald-700',
  LAB_REPORT:  'bg-purple-100 text-purple-700',
  REMINDER:    'bg-amber-100 text-amber-700',
  MARKETING:   'bg-pink-100 text-pink-700',
  GENERAL:     'bg-slate-100 text-slate-600',
  PRESCRIPTION:'bg-teal-100 text-teal-700',
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PENDING:  'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const SAMPLE_VARS: Record<string, string> = {
  '{{patient_name}}':    'Ramesh Kumar',
  '{{doctor_name}}':     'Dr. Priya Sharma',
  '{{appointment_time}}': '10:30 AM',
  '{{appointment_date}}': '15 Apr 2025',
  '{{clinic_name}}':     'City Multi-Speciality',
  '{{invoice_number}}':  'INV-2025-0042',
  '{{amount}}':          '₹1,500',
  '{{medicine_name}}':   'Paracetamol 500mg',
  '{{test_name}}':       'Complete Blood Count',
  '{{health_id}}':       'HB-20250001',
  '{{otp}}':             '482910',
  '{{days}}':            '7',
};

function resolveTemplate(body: string): string {
  let result = body;
  for (const [key, val] of Object.entries(SAMPLE_VARS)) {
    result = result.replaceAll(key, `*${val}*`);
  }
  return result;
}

function WhatsAppBubble({ body, header }: { body: string; header?: string }) {
  const resolved = resolveTemplate(body);
  // Convert *text* → bold in display
  const formatted = resolved.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

  return (
    <div className="flex justify-end">
      <div className="max-w-xs bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
        {header && <p className="text-sm font-bold text-slate-800 mb-1">{header}</p>}
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }} />
        <p className="text-[10px] text-slate-400 text-right mt-1.5">12:34 ✓✓</p>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#25D366] outline-none transition-all placeholder:text-slate-400';

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', category: 'GENERAL', language: 'en',
    headerText: '', body: '', footer: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied]         = useState(false);

  const VAR_SHORTCUTS = [
    '{{patient_name}}', '{{doctor_name}}', '{{appointment_time}}', '{{appointment_date}}',
    '{{clinic_name}}', '{{invoice_number}}', '{{amount}}', '{{medicine_name}}',
    '{{test_name}}', '{{otp}}', '{{days}}',
  ];

  const insertVar = (v: string) => setForm(f => ({ ...f, body: f.body + v }));

  const copyName = () => {
    navigator.clipboard.writeText(form.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async () => {
    if (!form.name || !form.body) { toast.error('Template name and body required'); return; }
    if (!/^[a-z0-9_]+$/.test(form.name)) { toast.error('Name: lowercase letters, numbers, underscores only'); return; }
    setSubmitting(true);
    try {
      await api.post('/whatsapp/templates', {
        name: form.name,
        category: form.category,
        language: form.language,
        components: [
          ...(form.headerText ? [{ type: 'HEADER', format: 'TEXT', text: form.headerText }] : []),
          { type: 'BODY', text: form.body },
          ...(form.footer ? [{ type: 'FOOTER', text: form.footer }] : []),
        ],
      });
      toast.success('Template created! Submit to Meta for approval via WhatsApp Business Manager.');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex overflow-hidden">

        {/* Left: Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-900">Create Template</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Template Name *</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="appointment_reminder" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} />
                  <button onClick={copyName} className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Lowercase, underscores only — this is what Meta uses</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Header (optional)</label>
              <input className={inputCls} placeholder="Your appointment is confirmed" value={form.headerText}
                onChange={e => setForm(f => ({ ...f, headerText: e.target.value }))} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message Body *</label>
                <span className="text-[10px] text-slate-400">{form.body.length}/1024 chars</span>
              </div>
              <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={6}
                placeholder="Hi {{patient_name}},&#10;Your appointment with {{doctor_name}} is confirmed for {{appointment_date}} at {{appointment_time}}.&#10;&#10;Please arrive 10 minutes early.&#10;&#10;_{{clinic_name}}_"
                maxLength={1024}
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              {/* Variable shortcuts */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VAR_SHORTCUTS.map(v => (
                  <button key={v} onClick={() => insertVar(v)}
                    className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full hover:bg-[#25D366]/10 hover:text-[#075E54] transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Footer (optional)</label>
              <input className={inputCls} placeholder="Reply STOP to unsubscribe" value={form.footer}
                onChange={e => setForm(f => ({ ...f, footer: e.target.value }))} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              <strong>Meta Approval Required:</strong> After creating, you must submit this template in{' '}
              <a href="https://business.facebook.com/wa/manage/message-templates" target="_blank" rel="noreferrer" className="underline">
                WhatsApp Business Manager
              </a> for approval. Templates used for marketing require Utility or Marketing category.
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
            <button onClick={submit} disabled={submitting}
              className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1FAD57] disabled:opacity-50 transition-colors">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Template
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-72 border-l border-slate-100 bg-slate-50 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </p>
          </div>
          {/* WA mock chrome */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-[#E5DDD5] h-full p-4 space-y-3" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4c9bc' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
              {(form.body || form.headerText) ? (
                <WhatsAppBubble header={form.headerText} body={form.body || 'Start typing your message…'} />
              ) : (
                <div className="text-center text-slate-400 text-xs pt-8">
                  Start typing to see preview
                </div>
              )}
              {form.footer && (
                <div className="flex justify-end">
                  <div className="max-w-xs bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-2">
                    <p className="text-[11px] text-slate-500 italic">{form.footer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [previewTpl, setPreview]  = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp/templates?global=true');
      // Backend returns { data: [...] } shape
      setTemplates(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedDefaults = async () => {
    try {
      await api.post('/whatsapp/templates/seed-defaults');
      toast.success('Default templates seeded!');
      load();
    } catch { toast.error('Failed to seed templates'); }
  };

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || t.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#25D366]" /> WhatsApp Templates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{templates.length} templates · Pre-approved messages for campaigns and automation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={seedDefaults} className="text-sm font-medium border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50">Seed Defaults</button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1FAD57] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer"
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No templates yet</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Create templates for appointment reminders, lab reports, billing, and more</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={seedDefaults} className="text-sm font-medium border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50">Load Default Templates</button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#1FAD57]">
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => {
            const bodyComp = tpl.components?.find((c: any) => c.type === 'BODY');
            const headerComp = tpl.components?.find((c: any) => c.type === 'HEADER');
            const bodyText = bodyComp?.text || tpl.body || '';

            return (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm font-mono truncate">{tpl.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tpl.category] || 'bg-slate-100 text-slate-500'}`}>
                        {tpl.category?.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[tpl.status] || 'bg-slate-100 text-slate-500'}`}>
                        {tpl.status || 'DRAFT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview bubble */}
                <div className="bg-[#E5DDD5] rounded-xl p-3 mb-3 min-h-16">
                  <div className="flex justify-end">
                    <div className="max-w-full bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 shadow-sm">
                      {headerComp?.text && <p className="text-xs font-bold text-slate-800 mb-0.5">{headerComp.text}</p>}
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-4">
                        {resolveTemplate(bodyText).replace(/\*([^*]+)\*/g, '$1')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setPreview(tpl)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50">
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewTpl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900 font-mono text-sm">{previewTpl.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[previewTpl.category] || ''}`}>
                  {previewTpl.category?.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#E5DDD5] p-4 space-y-2" style={{ minHeight: 200 }}>
              {(() => {
                const body = previewTpl.components?.find((c: any) => c.type === 'BODY')?.text || previewTpl.body || '';
                const header = previewTpl.components?.find((c: any) => c.type === 'HEADER')?.text;
                const footer = previewTpl.components?.find((c: any) => c.type === 'FOOTER')?.text;
                return <WhatsAppBubble header={header} body={body || 'No body text'} />;
              })()}
            </div>
            <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400">Language: {previewTpl.language || 'en'}</p>
              <button onClick={() => { navigator.clipboard.writeText(previewTpl.name); toast.success('Name copied!'); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
                <Copy className="w-3 h-3" /> Copy Name
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
