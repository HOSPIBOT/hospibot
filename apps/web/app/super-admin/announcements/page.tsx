'use client';

import { useState } from 'react';
import { Megaphone, Plus, Send, Building2, Users, AlertTriangle, Info, CheckCircle2, X, Clock } from 'lucide-react';

type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS' | 'MAINTENANCE';
type AudienceType = 'ALL' | 'PLAN' | 'STATUS';

const PAST_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Scheduled Maintenance — Apr 14, 2026',
    body: 'HospiBot will undergo scheduled maintenance on Monday, April 14 from 2:00 AM to 4:00 AM IST. All services will be temporarily unavailable during this window.',
    type: 'MAINTENANCE',
    audience: 'ALL',
    sentTo: 200,
    sentAt: 'Apr 12, 2026 · 10:00 AM',
    sentBy: 'Super Admin',
  },
  {
    id: 'a2',
    title: 'New Feature: Multi-Branch Analytics Dashboard',
    body: 'Enterprise plan users can now access the cross-branch analytics dashboard. Navigate to Analytics → Multi-Branch View to get started.',
    type: 'SUCCESS',
    audience: 'PLAN: Enterprise',
    sentTo: 24,
    sentAt: 'Apr 10, 2026 · 2:30 PM',
    sentBy: 'Super Admin',
  },
  {
    id: 'a3',
    title: 'WhatsApp Business API Rate Limit Update',
    body: 'Meta has updated rate limits for WABA accounts. Please ensure your WhatsApp phone numbers are verified to avoid message throttling. Starter plan users may notice reduced throughput during peak hours.',
    type: 'WARNING',
    audience: 'PLAN: Starter',
    sentTo: 89,
    sentAt: 'Apr 8, 2026 · 9:15 AM',
    sentBy: 'Super Admin',
  },
  {
    id: 'a4',
    title: 'Trial Expiry Reminder',
    body: 'Your trial period is ending soon. Please upgrade to a paid plan to continue using HospiBot without interruption.',
    type: 'INFO',
    audience: 'STATUS: Trial',
    sentTo: 12,
    sentAt: 'Apr 5, 2026 · 11:00 AM',
    sentBy: 'System (Auto)',
  },
];

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: any; color: string; bg: string; border: string }> = {
  INFO: { label: 'Informational', icon: Info, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  WARNING: { label: 'Warning', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  SUCCESS: { label: 'Feature/Update', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MAINTENANCE: { label: 'Maintenance', icon: Clock, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
};

function AnnouncementCard({ ann }: { ann: typeof PAST_ANNOUNCEMENTS[0] }) {
  const cfg = TYPE_CONFIG[ann.type as AnnouncementType];
  const Icon = cfg.icon;
  return (
    <div className={`border rounded-2xl p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-bold ${cfg.color}`}>{ann.title}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{ann.body}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> {ann.audience} · {ann.sentTo} tenants</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{ann.sentAt}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">By {ann.sentBy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'INFO' as AnnouncementType,
    audienceType: 'ALL' as AudienceType,
    audiencePlan: 'ENTERPRISE',
    audienceStatus: 'TRIAL',
    scheduleNow: true,
    scheduledAt: '',
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const getRecipientCount = () => {
    if (form.audienceType === 'ALL') return 200;
    if (form.audienceType === 'PLAN') {
      return form.audiencePlan === 'ENTERPRISE' ? 24 : form.audiencePlan === 'GROWTH' ? 87 : 89;
    }
    return form.audienceStatus === 'TRIAL' ? 12 : form.audienceStatus === 'ACTIVE' ? 178 : 10;
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => { setSent(false); setShowCompose(false); }, 2000); }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Broadcast messages to all tenants or specific segments</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: '28', sub: 'All time' },
          { label: 'This Month', value: '4', sub: 'Apr 2026' },
          { label: 'Avg Reach', value: '85', sub: 'tenants / blast' },
          { label: 'Open Rate', value: '94%', sub: 'In-app notification' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Past announcements */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900">Recent Announcements</h3>
        {PAST_ANNOUNCEMENTS.map((ann) => (
          <AnnouncementCard key={ann.id} ann={ann} />
        ))}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-[#0D7C66]" />
                <h3 className="font-bold text-slate-900">New Announcement</h3>
              </div>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${form.type === t ? `border-current ${cfg.color} ${cfg.bg}` : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
                <input
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all"
                  placeholder="Announcement headline..."
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all resize-none"
                  placeholder="Write your announcement..."
                  value={form.body}
                  onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Audience</label>
                <div className="flex items-center gap-2 mb-3">
                  {[
                    { value: 'ALL', label: 'All Tenants', icon: Globe },
                    { value: 'PLAN', label: 'By Plan', icon: Building2 },
                    { value: 'STATUS', label: 'By Status', icon: Users },
                  ].map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setForm(f => ({ ...f, audienceType: value as AudienceType }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${form.audienceType === value ? 'bg-[#E8F5F0] border-[#0D7C66] text-[#0D7C66]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>

                {form.audienceType === 'PLAN' && (
                  <select value={form.audiencePlan} onChange={(e) => setForm(f => ({ ...f, audiencePlan: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none">
                    <option value="STARTER">Starter (89 tenants)</option>
                    <option value="GROWTH">Growth (87 tenants)</option>
                    <option value="ENTERPRISE">Enterprise (24 tenants)</option>
                  </select>
                )}
                {form.audienceType === 'STATUS' && (
                  <select value={form.audienceStatus} onChange={(e) => setForm(f => ({ ...f, audienceStatus: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none">
                    <option value="ACTIVE">Active (178 tenants)</option>
                    <option value="TRIAL">Trial (12 tenants)</option>
                    <option value="SUSPENDED">Suspended (10 tenants)</option>
                  </select>
                )}

                <div className="mt-2 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#0D7C66]" />
                  This announcement will reach <strong className="text-[#0D7C66]">{getRecipientCount()} tenants</strong>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Delivery</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setForm(f => ({ ...f, scheduleNow: true }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${form.scheduleNow ? 'bg-[#E8F5F0] border-[#0D7C66] text-[#0D7C66]' : 'border-slate-200 text-slate-600'}`}>
                    Send Immediately
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, scheduleNow: false }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${!form.scheduleNow ? 'bg-[#E8F5F0] border-[#0D7C66] text-[#0D7C66]' : 'border-slate-200 text-slate-600'}`}>
                    Schedule
                  </button>
                </div>
                {!form.scheduleNow && (
                  <input type="datetime-local"
                    className="w-full mt-2 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none"
                    value={form.scheduledAt} onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSend} disabled={sending || !form.title || !form.body}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                {sent ? <><CheckCircle2 className="w-4 h-4" /> Sent!</> : sending ? 'Sending...' : <><Send className="w-4 h-4" /> {form.scheduleNow ? 'Send Now' : 'Schedule'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Needed for the Globe icon in audience selector
function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
