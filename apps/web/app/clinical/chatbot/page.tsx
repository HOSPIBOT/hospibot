'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Bot, Save, RefreshCw, MessageSquare, Calendar, CreditCard,
  FlaskConical, Pill, AlertTriangle, Users, Settings2, ToggleLeft,
  ToggleRight, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';

const INTENTS = [
  { key: 'BOOKING',      label: 'Appointment Booking',  icon: Calendar,    desc: 'Patient types "book", "appointment", "doctor" → triggers 4-step booking flow', defaultOn: true },
  { key: 'REPORT',       label: 'Lab Report Status',    icon: FlaskConical, desc: 'Patient asks about lab results → checks order status', defaultOn: true },
  { key: 'BILLING',      label: 'Billing & Invoices',   icon: CreditCard,   desc: 'Patient asks about payment, invoice, amount due', defaultOn: true },
  { key: 'PRESCRIPTION', label: 'Prescription Status',  icon: Pill,         desc: 'Patient asks about medicines → sends latest prescription', defaultOn: true },
  { key: 'RECORDS',      label: 'Health Vault Access',  icon: Users,        desc: 'Patient requests their health records → OTP consent flow', defaultOn: true },
  { key: 'EMERGENCY',    label: 'Emergency Escalation', icon: AlertTriangle, desc: 'Detects emergency keywords → sends facility address + asks to call ambulance', defaultOn: true },
  { key: 'HUMAN',        label: 'Human Handoff',        icon: Users,         desc: '"Talk to doctor", "speak to staff" → switches conversation to manual mode', defaultOn: true },
  { key: 'MARKETING',    label: 'Promo Campaigns',      icon: Zap,          desc: 'Responds to promotional broadcasts with booking CTA', defaultOn: false },
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400 resize-none';

export default function ChatbotPage() {
  const [settings, setSettings] = useState<any>(null);
  const [intents, setIntents]   = useState<Record<string, boolean>>({});
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [expandedIntent, setExpanded] = useState<string | null>(null);

  const [greetMsg, setGreetMsg]   = useState('');
  const [fallback, setFallback]   = useState('');
  const [offHours, setOffHours]   = useState('');
  const [botName, setBotName]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/current');
      const s   = res.data?.settings?.chatbot || {};
      setSettings(s);
      setBotName(s.botName || 'HospiBot Assistant');
      setGreetMsg(s.greetingMessage || 'Hi! 👋 I\'m your clinic assistant. How can I help you today?\n\n1️⃣ Book appointment\n2️⃣ Lab report status\n3️⃣ Billing & invoices\n4️⃣ My prescriptions\n5️⃣ Health records\n\nReply with a number or type your question.');
      setFallback(s.fallbackMessage || 'I didn\'t understand that. Please type:\n• BOOK for appointments\n• REPORT for lab results\n• BILL for invoices\n• Or type HELP to talk to staff');
      setOffHours(s.offHoursMessage || 'Our clinic is currently closed. Working hours: Mon–Sat 9AM–7PM.\n\nYou can still book an appointment and we\'ll confirm when we open. Type BOOK to continue.');

      // Load intent status from settings or defaults
      const intentStatus: Record<string, boolean> = {};
      INTENTS.forEach((i: any) => {
        intentStatus[i.key] = s.intents?.[i.key] !== false ? i.defaultOn : false;
      });
      setIntents(intentStatus);
    } catch { toast.error('Failed to load chatbot settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current/settings', {
        chatbot: {
          botName, greetingMessage: greetMsg, fallbackMessage: fallback,
          offHoursMessage: offHours, intents,
        },
      });
      toast.success('Chatbot settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const testBot = async () => {
    try {
      await api.post('/whatsapp/send', {
        to: '+919876543210',
        message: greetMsg,
      }).catch(() => {});
      toast.success('Test message sent! (Replace phone number in settings)');
    } catch { toast.success('Settings saved — configure WhatsApp phone to test'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#0D7C66] animate-spin" /></div>;
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#0D7C66]" /> Chatbot Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Customise your WhatsApp AI assistant behaviour</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Intent toggles */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0D7C66]" /> Bot Name
            </h3>
            <p className="text-xs text-slate-400 mb-3">Shown in automated responses</p>
            <input className={inputCls.replace('resize-none', '')} value={botName}
              onChange={e => setBotName(e.target.value)} placeholder="HospiBot Assistant" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Intent Modules</h3>
            <p className="text-xs text-slate-400 mb-4">Toggle which capabilities the chatbot handles automatically</p>
            <div className="space-y-2">
              {INTENTS.map((intent: any) => {
                const enabled   = intents[intent.key] !== false;
                const expanded  = expandedIntent === intent.key;
                return (
                  <div key={intent.key} className={`rounded-xl border transition-all ${enabled ? 'border-[#0D7C66]/20 bg-[#E8F5F0]/30' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-[#0D7C66]/10' : 'bg-slate-100'}`}>
                        <intent.icon className={`w-4 h-4 ${enabled ? 'text-[#0D7C66]' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${enabled ? 'text-slate-900' : 'text-slate-400'}`}>{intent.label}</p>
                      </div>
                      <button onClick={() => setExpanded(expanded ? null : intent.key)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setIntents(p => ({ ...p, [intent.key]: !enabled }))}
                        className="flex-shrink-0 transition-colors">
                        {enabled
                          ? <ToggleRight className="w-8 h-8 text-[#0D7C66]" />
                          : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                      </button>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-3 border-t border-slate-100/80">
                        <p className="text-xs text-slate-500 mt-2">{intent.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Message templates */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#25D366]" /> Greeting Message
            </h3>
            <p className="text-xs text-slate-400">Sent when patient first messages or types HELP</p>
            <textarea className={inputCls} rows={7} value={greetMsg}
              onChange={e => setGreetMsg(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">Fallback Message</h3>
            <p className="text-xs text-slate-400">Sent when bot doesn't understand the input</p>
            <textarea className={inputCls} rows={4} value={fallback}
              onChange={e => setFallback(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">After-Hours Message</h3>
            <p className="text-xs text-slate-400">Sent when patient contacts outside clinic hours</p>
            <textarea className={inputCls} rows={4} value={offHours}
              onChange={e => setOffHours(e.target.value)} />
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Live Preview</h3>
            <div className="bg-[#E5DDD5] rounded-xl p-3" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9beb5' fill-opacity='0.3'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" }}>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-xs">
                <p className="text-[11px] font-bold text-[#0D7C66] mb-1">{botName}</p>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed"
                  style={{ wordBreak: 'break-word' }}>
                  {greetMsg.slice(0, 200)}{greetMsg.length > 200 ? '…' : ''}
                </p>
                <p className="text-[10px] text-slate-400 text-right mt-1">12:34 ✓✓</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bot status summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Active Capabilities Summary</h3>
        <div className="flex flex-wrap gap-2">
          {INTENTS.filter((i: any) => intents[i.key] !== false ? i.defaultOn : false).map((i: any) => (
            <span key={i.key} className="flex items-center gap-1.5 text-xs font-semibold bg-[#E8F5F0] text-[#0D7C66] px-3 py-1.5 rounded-full border border-[#0D7C66]/20">
              <i.icon className="w-3 h-3" /> {i.label}
            </span>
          ))}
          {INTENTS.filter((i: any) => intents[i.key] === false || (!i.defaultOn && !intents[i.key])).map((i: any) => (
            <span key={i.key} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full line-through">
              {i.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
