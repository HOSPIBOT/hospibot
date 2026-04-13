'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Search, X, Loader2, Phone, Mail,
  MessageSquare, Calendar, ArrowRight, User, BarChart3,
  TrendingUp, Filter, ChevronDown, Download,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string; name?: string; phone: string; email?: string;
  source: string; stage: string; score: number; notes?: string;
  tags: string[]; assignedTo?: string; createdAt: string;
  lastContactAt?: string; patient?: { firstName: string; lastName?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'NEW',                label: 'New',               color: '#64748B', bg: '#F8FAFC' },
  { key: 'CONTACTED',         label: 'Contacted',          color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'APPOINTMENT_BOOKED',label: 'Appt Booked',        color: '#8B5CF6', bg: '#FAF5FF' },
  { key: 'VISITED',           label: 'Visited',            color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'FOLLOW_UP_PENDING', label: 'Follow-Up',          color: '#EF4444', bg: '#FFF1F2' },
  { key: 'ACTIVE_PATIENT',    label: 'Active Patient',     color: '#10B981', bg: '#F0FDF4' },
  { key: 'DORMANT',           label: 'Dormant',            color: '#94A3B8', bg: '#F8FAFC' },
];

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: '💬 WhatsApp', WEBSITE: '🌐 Website', WALK_IN: '🚶 Walk-In',
  REFERRAL: '👥 Referral', GOOGLE_ADS: '🔍 Google', FACEBOOK_ADS: '📘 Facebook',
  INSTAGRAM: '📸 Instagram', JUSTDIAL: '📞 JustDial', PRACTO: '🏥 Practo', OTHER: '📝 Other',
};

const SOURCES = Object.keys(SOURCE_LABELS);

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onMove, onConvert, onBook }: {
  lead: Lead;
  onMove: (id: string, stage: string) => void;
  onConvert: (id: string) => void;
  onBook: (lead: Lead) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const stageInfo = STAGES.find(s => s.key === lead.stage);
  const patientName = lead.patient
    ? `${lead.patient.firstName} ${lead.patient.lastName || ''}`
    : lead.name || lead.phone;

  const nextStages = STAGES.filter(s => s.key !== lead.stage);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F5F0] text-[#0D7C66] text-xs font-bold flex items-center justify-center flex-shrink-0">
            {patientName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{patientName}</p>
            <p className="text-[10px] text-slate-400">{SOURCE_LABELS[lead.source] || lead.source}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-1 min-w-40" onMouseLeave={() => setShowMenu(false)}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-3 py-1.5">Move to stage</p>
              {nextStages.map(s => (
                <button key={s.key} onClick={() => { onMove(lead.id, s.key); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
              {lead.stage !== 'ACTIVE_PATIENT' && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={() => { onConvert(lead.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> Convert to Patient
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Score + date */}
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Score: <strong className="text-slate-700">{lead.score}</strong></span>
        <span>{formatDate(lead.createdAt)}</span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white bg-[#25D366] py-1.5 px-2 rounded-lg hover:opacity-90 transition-opacity">
          <MessageSquare className="w-3 h-3" /> WA
        </a>
        <a href={`tel:${lead.phone}`}
          className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-600 border border-slate-200 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
          <Phone className="w-3 h-3" /> Call
        </a>
        <button onClick={() => onBook(lead)}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-white bg-[#0D7C66] py-1.5 rounded-lg hover:bg-[#0A5E4F] transition-colors">
          <Calendar className="w-3 h-3" /> Book Appt
        </button>
      </div>
    </div>
  );
}

// ─── Add Lead Modal ───────────────────────────────────────────────────────────

// ─── Quick Book Appointment from CRM ─────────────────────────────────────────

function QuickBookModal({ lead, onClose, onBooked }: { lead: Lead; onClose: () => void; onBooked: () => void }) {
  const [doctors, setDoctors]     = useState<any[]>([]);
  const [scheduledAt, setTime]    = useState('');
  const [doctorId, setDoctorId]   = useState('');
  const [notes, setNotes]         = useState(`Lead: ${lead.source} — ${lead.notes || ''}`);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/doctors?limit=50').then(r => setDoctors(r.data.data ?? [])).catch(() => {});
  }, []);

  const submit = async () => {
    if (!scheduledAt) { toast.error('Select appointment time'); return; }
    setSubmitting(true);
    try {
      // 1. Register as patient if not already
      let patientId: string | undefined;
      const existing = await api.get('/patients', { params: { search: lead.phone, limit: 1 } }).catch(() => null);
      if (existing?.data?.data?.[0]) {
        patientId = existing.data.data[0].id;
      } else {
        const [firstName, ...rest] = lead.name.split(' ');
        const newPat = await api.post('/patients', { firstName, lastName: rest.join(' ') || undefined, phone: lead.phone, email: lead.email });
        patientId = newPat.data.id;
      }
      // 2. Book appointment
      await api.post('/appointments', { patientId, doctorId: doctorId || undefined, scheduledAt, notes, type: 'SCHEDULED' });
      // 3. Move lead to APPOINTMENT_BOOKED stage
      await api.put(`/crm/leads/${lead.id}`, { stage: 'APPOINTMENT_BOOKED' }).catch(() => {});
      toast.success(`Appointment booked for ${lead.name}! Lead moved to Appt Booked.`);
      onBooked();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to book');
    } finally { setSubmitting(false); }
  };

  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lead.name} · {lead.phone}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 text-xs text-[#0A5E4F]">
            Patient will be registered automatically if not already in the system.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date & Time *</label>
            <input type="datetime-local" className={inputCls} value={scheduledAt} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Doctor (optional)</label>
            <select className={inputCls} value={doctorId} onChange={e => setDoctorId(e.target.value)}>
              <option value="">Any Available Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName || ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Calendar className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'WALK_IN', notes: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.phone) { toast.error('Phone number required'); return; }
    setSubmitting(true);
    try {
      await api.post('/crm/leads', {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Lead added!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add lead');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add Lead</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
            <input className={inputCls} placeholder="Patient name" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input className={inputCls} type="email" placeholder="optional" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Lead Source</label>
            <select className={inputCls} value={form.source} onChange={set('source')}>
              {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tags <span className="text-slate-300 font-normal normal-case">(comma-separated)</span></label>
            <input className={inputCls} placeholder="diabetic, hypertension, vip" value={form.tags} onChange={set('tags')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Any notes about this lead…" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Adding…' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [funnel, setFunnel]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [view, setView]         = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (debSearch) params.search = debSearch;
      if (sourceFilter) params.source = sourceFilter;
      const [leadsRes, funnelRes] = await Promise.all([
        api.get('/crm/leads', { params }),
        api.get('/crm/leads/funnel'),
      ]);
      setLeads(leadsRes.data.data ?? []);
      setFunnel(funnelRes.data);
    } catch { toast.error('Failed to load CRM'); }
    finally { setLoading(false); }
  }, [debSearch, sourceFilter]);

  useEffect(() => { load(); }, [load]);

  const moveStage = async (leadId: string, newStage: string) => {
    try {
      await api.put(`/crm/leads/${leadId}`, { stage: newStage });
      setLeads(l => l.map(lead => lead.id === leadId ? { ...lead, stage: newStage } : lead));
      toast.success(`Moved to ${STAGES.find(s => s.key === newStage)?.label}`);
    } catch { toast.error('Failed to update stage'); }
  };

  const convertLead = async (leadId: string) => {
    try {
      await api.post(`/crm/leads/${leadId}/convert`);
      toast.success('Lead converted to patient!');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Conversion failed');
    }
  };

  const byStage = (stageKey: string) => leads.filter(l => l.stage === stageKey);

  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/crm/leads', { params: { limit: 5000 } });
      const all: any[] = res.data.data ?? leads;
      const header = ['Name', 'Phone', 'Email', 'Source', 'Stage', 'Notes', 'Created'];
      const rows = all.map(l => [
        l.name ?? '',
        l.phone ?? '',
        l.email ?? '',
        l.source ?? '',
        l.stage ?? '',
        l.notes ?? '',
        l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '',
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `crm-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} leads`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient CRM</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {leads.length} leads · {funnel?.conversionRate ?? 0}% conversion rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <a href="/clinical/crm/campaigns">
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-4 h-4" /> Campaigns
            </button>
          </a>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Funnel stats bar */}
      {funnel && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-1 mb-3">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conversion Funnel</span>
            <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              {funnel.conversionRate}% conversion
            </span>
          </div>
          <div className="flex items-end gap-1 h-14">
            {STAGES.map(stage => {
              const count = funnel.funnel?.find((f: any) => f.stage === stage.key)?.count || 0;
              const maxCount = Math.max(...(funnel.funnel?.map((f: any) => f.count) || [1]), 1);
              const height = Math.max((count / maxCount) * 100, 8);
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-700">{count}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${height}%`, background: stage.color, opacity: 0.8 }} />
                  <span className="text-[9px] text-slate-400 text-center leading-tight">{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source breakdown */}
      {funnel?.sourceBreakdown?.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {funnel.sourceBreakdown.slice(0, 6).map((s: any) => (
            <button key={s.source} onClick={() => setSourceFilter(sourceFilter === s.source ? '' : s.source)}
              className={`bg-white rounded-xl border p-3 text-center transition-all hover:shadow-sm ${sourceFilter === s.source ? 'border-[#0D7C66] bg-[#E8F5F0]' : 'border-slate-100'}`}>
              <p className="text-lg font-bold text-slate-900">{s.count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{SOURCE_LABELS[s.source] || s.source}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search leads by name, phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-[#0D7C66] cursor-pointer">
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['kanban', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        loading ? (
          <div className="grid grid-cols-7 gap-3">
            {STAGES.map(s => (
              <div key={s.key} className="animate-pulse bg-slate-200 rounded-2xl h-64" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {STAGES.map(stage => {
              const stageleads = byStage(stage.key);
              return (
                <div key={stage.key} className="flex-shrink-0 w-64 flex flex-col rounded-2xl overflow-hidden"
                  style={{ background: stage.bg, border: `1px solid ${stage.color}22` }}>
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b"
                    style={{ borderColor: `${stage.color}22` }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                      <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: stage.color }}>
                      {stageleads.length}
                    </span>
                  </div>

                  {/* Lead cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: '70vh' }}>
                    {stageleads.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-300">No leads here</div>
                    ) : stageleads.map(lead => (
                      <LeadCard key={lead.id} lead={lead}
                        onMove={moveStage}
                        onConvert={convertLead} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Name / Phone', 'Source', 'Stage', 'Score', 'Tags', 'Added', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                  ))}</tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No leads found</td>
                </tr>
              ) : leads.map(lead => {
                const stage = STAGES.find(s => s.key === lead.stage);
                const name = lead.patient ? `${lead.patient.firstName} ${lead.patient.lastName || ''}` : lead.name || lead.phone;
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-400">{lead.phone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{SOURCE_LABELS[lead.source] || lead.source}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${stage?.color}20`, color: stage?.color }}>
                        {stage?.label || lead.stage}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-[#0D7C66]" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {lead.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => convertLead(lead.id)}
                          className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                          Convert
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={load} />}
      {bookingLead && <QuickBookModal lead={bookingLead} onClose={() => setBookingLead(null)} onBooked={() => { setBookingLead(null); load(); }} />}
    </div>
  );
}
