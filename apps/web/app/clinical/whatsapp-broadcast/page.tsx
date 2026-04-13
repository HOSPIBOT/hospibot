'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Send, Users, MessageSquare, Loader2, CheckCircle2,
  AlertTriangle, X, Phone, RefreshCw,
} from 'lucide-react';

const SEGMENTS = [
  { key: 'ALL',              label: 'All Patients',          desc: 'Everyone registered in the system' },
  { key: 'RECENT',           label: 'Recent Patients (30d)', desc: 'Patients who visited in the last 30 days' },
  { key: 'NO_VISIT_90D',     label: 'Inactive (90+ days)',   desc: 'Patients who haven\'t visited in 90+ days' },
  { key: 'UPCOMING_APPT',    label: 'Upcoming Appointments', desc: 'Patients with appointments in the next 7 days' },
  { key: 'PENDING_INVOICES', label: 'Pending Payments',      desc: 'Patients with unpaid invoices' },
  { key: 'CUSTOM_PHONE',     label: 'Specific Numbers',      desc: 'Enter phone numbers manually' },
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#25D366] outline-none transition-all placeholder:text-slate-400 resize-none';

export default function WhatsAppBroadcastPage() {
  const [segment, setSegment]       = useState('ALL');
  const [message, setMessage]       = useState('');
  const [customPhones, setCustom]   = useState('');
  const [estimate, setEstimate]     = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [campaigns, setCampaigns]   = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Character counter
  const charCount = message.length;
  const msgCount  = Math.ceil(charCount / 160) || 1;

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await api.get('/crm/campaigns', { params: { limit: 10 } });
      setCampaigns(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingCampaigns(false); }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const getEstimate = async () => {
    if (segment === 'CUSTOM_PHONE') {
      const phones = customPhones.split('\n').filter(p => p.trim()).length;
      setEstimate(phones);
      return;
    }
    setEstimating(true);
    try {
      const res = await api.post('/crm/campaigns/estimate', {
        audience: { segment },
      });
      setEstimate(res.data.count ?? res.data.estimate ?? 0);
    } catch { setEstimate(null); }
    finally { setEstimating(false); }
  };

  useEffect(() => { setEstimate(null); }, [segment]);

  const sendBroadcast = async () => {
    if (!message.trim()) { toast.error('Enter a message'); return; }
    if (estimate === null) { toast.error('Get audience estimate first'); return; }
    if (estimate === 0)    { toast.error('No recipients in selected segment'); return; }
    // Confirmed via UI button — proceed directly

    setSending(true);
    try {
      await api.post('/crm/campaigns', {
        name: `Broadcast ${new Date().toLocaleDateString('en-IN')}`,
        type: 'WHATSAPP',
        message: { text: message },
        audience: {
          segment,
          ...(segment === 'CUSTOM_PHONE' ? { phones: customPhones.split('\n').filter(p => p.trim()) } : {}),
        },
        scheduledAt: new Date().toISOString(),
        sendImmediately: true,
      });
      setSent(true);
      toast.success(`Broadcast queued for ${estimate} recipients!`);
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send broadcast');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-[#25D366]" /> WhatsApp Broadcast
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Send bulk messages to patient segments</p>
        </div>
        <button onClick={loadCampaigns} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loadingCampaigns ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">
          <strong>Important:</strong> WhatsApp limits broadcast to users who have previously messaged you. Marketing templates must be pre-approved by Meta. Use personal conversation templates for best delivery rates.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Compose panel */}
        <div className="col-span-2 space-y-4">
          {/* Segment selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#25D366]" /> Target Audience
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENTS.map(s => (
                <button key={s.key} onClick={() => setSegment(s.key)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    segment === s.key
                      ? 'border-[#25D366] bg-[#E9FBF0]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <p className={`text-xs font-bold ${segment === s.key ? 'text-[#128C7E]' : 'text-slate-700'}`}>{s.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>

            {segment === 'CUSTOM_PHONE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Numbers (one per line)</label>
                <textarea className={inputCls} rows={4}
                  placeholder="+91 98765 43210&#10;+91 98765 43211&#10;+91 98765 43212"
                  value={customPhones} onChange={e => setCustom(e.target.value)} />
              </div>
            )}

            {/* Estimate */}
            <div className="flex items-center gap-3">
              <button onClick={getEstimate} disabled={estimating}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-60">
                {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Get Estimate
              </button>
              {estimate !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-900">{estimate.toLocaleString('en-IN')}</span>
                  <span className="text-slate-400">recipients estimated</span>
                </div>
              )}
            </div>
          </div>

          {/* Message compose */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#25D366]" /> Message
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{charCount}/1024 chars</span>
                <span>·</span>
                <span>{msgCount} SMS segment{msgCount > 1 ? 's' : ''}</span>
              </div>
            </div>
            <textarea className={inputCls} rows={6} maxLength={1024}
              placeholder="Hi {{patient_name}}, this is a message from [Clinic Name]. We hope you're doing well! 😊&#10;&#10;[Your message here]&#10;&#10;Reply STOP to unsubscribe."
              value={message} onChange={e => setMessage(e.target.value)} />

            {/* Variable hints */}
            <div className="flex flex-wrap gap-1.5">
              {['{{patient_name}}', '{{clinic_name}}', '{{appointment_time}}', '{{doctor_name}}'].map(v => (
                <button key={v} onClick={() => setMessage(m => m + v)}
                  className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full hover:bg-[#25D366]/10 hover:text-[#128C7E] transition-colors">
                  {v}
                </button>
              ))}
            </div>

            {/* Send button */}
            {sent ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">Broadcast sent! Check campaign history below.</p>
                <button onClick={() => { setSent(false); setMessage(''); setEstimate(null); }}
                  className="ml-auto text-xs text-emerald-600 hover:underline">Send another</button>
              </div>
            ) : (
              <button onClick={sendBroadcast} disabled={sending || !message.trim() || estimate === null}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#1FAD57] disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : estimate !== null ? `Send to ${estimate.toLocaleString('en-IN')} patients` : 'Send Broadcast'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Recent campaigns */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Broadcasts</h3>
          {loadingCampaigns ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-16"/>)}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-10">
              <Send className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'SENDING' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{c.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {c.stats?.sent ?? c.recipientCount ?? 0} sent
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
