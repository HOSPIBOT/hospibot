'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, Search, RefreshCw, Phone, User,
  FileText, Bot, UserCheck, X, LayoutTemplate,
  CheckCheck, Check, Clock, ChevronRight, Inbox,
  Calendar, Pill,
} from 'lucide-react';

type FilterTab = 'all' | 'unread' | 'bot' | 'human' | 'closed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'All'    },
  { key: 'unread', label: 'Unread' },
  { key: 'bot',    label: 'Bot'    },
  { key: 'human',  label: 'Human'  },
  { key: 'closed', label: 'Closed' },
];

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive]               = useState<any>(null);
  const [messages, setMessages]           = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [debSearch, setDebSearch]         = useState('');
  const [messageText, setMessageText]     = useState('');
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [filter, setFilter]               = useState<FilterTab>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates]         = useState<any[]>([]);
  const [loadingTpls, setLoadingTpls]     = useState(false);
  const [tplSearch, setTplSearch]         = useState('');
  const [patientData, setPatientData]     = useState<any>(null);
  const [online, setOnline]               = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread') return (c.unreadCount ?? 0) > 0;
    if (filter === 'bot')    return c.isBot && !c.isClosed;
    if (filter === 'human')  return !c.isBot && !c.isClosed;
    if (filter === 'closed') return c.isClosed;
    return true;
  });

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (debSearch) params.search = debSearch;
      const res = await api.get('/whatsapp/conversations', { params });
      setConversations(res.data.data ?? []);
      setOnline(true);
    } catch {
      if (!silent) toast.error('Failed to load conversations');
      setOnline(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debSearch]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-refresh conversations every 15 s
  useEffect(() => {
    const t = setInterval(() => loadConversations(true), 15_000);
    return () => clearInterval(t);
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await api.get(`/whatsapp/conversations/${convId}/messages`);
      const msgs: any[] = res.data.data ?? [];
      setMessages(prev => {
        if (msgs.length > prevMsgCount.current) {
          prevMsgCount.current = msgs.length;
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        return msgs;
      });
    } catch { if (!silent) toast.error('Failed to load messages'); }
    finally { if (!silent) setLoadingMsgs(false); }
  }, []);

  // Auto-refresh messages when a conversation is active
  useEffect(() => {
    if (!active?.id) return;
    const t = setInterval(() => loadMessages(active.id, true), 15_000);
    return () => clearInterval(t);
  }, [active?.id, loadMessages]);

  const loadPatientData = useCallback(async (patientId: string) => {
    try {
      const [aptRes, rxRes] = await Promise.all([
        api.get('/appointments', { params: { patientId, limit: 3, sort: 'desc' } }),
        api.get('/prescriptions', { params: { patientId, limit: 3 } }),
      ]);
      setPatientData({
        appointments: aptRes.data.data ?? [],
        prescriptions: rxRes.data.data ?? [],
      });
    } catch { setPatientData(null); }
  }, []);

  const selectConversation = async (conv: any) => {
    setActive(conv);
    setPatientData(null);
    prevMsgCount.current = 0;
    loadMessages(conv.id);
    if (conv.patient?.id) loadPatientData(conv.patient.id);
    if ((conv.unreadCount ?? 0) > 0) {
      try {
        await api.patch(`/whatsapp/conversations/${conv.id}`, { unreadCount: 0 });
        setConversations(cs => cs.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      } catch { /* silent */ }
    }
  };

  const sendMessage = async (text?: string) => {
    const body = text ?? messageText;
    if (!body.trim() || !active) return;
    setSending(true);
    try {
      await api.post('/whatsapp/send', {
        to: active.waContactPhone,
        message: body,
        conversationId: active.id,
      });
      setMessageText('');
      setShowTemplates(false);
      loadMessages(active.id);
      setConversations(cs => cs.map(c =>
        c.id === active.id ? { ...c, lastMessageAt: new Date().toISOString() } : c
      ));
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const markHumanTakeover = async () => {
    if (!active) return;
    try {
      await api.patch(`/whatsapp/conversations/${active.id}`, { isBot: false });
      setActive((a: any) => ({ ...a, isBot: false }));
      setConversations(cs => cs.map(c => c.id === active.id ? { ...c, isBot: false } : c));
      toast.success('Bot paused — conversation assigned to you');
    } catch { toast.error('Failed to update conversation'); }
  };

  const loadTemplates = useCallback(async () => {
    if (templates.length) return;
    setLoadingTpls(true);
    try {
      const res = await api.get('/whatsapp/templates', { params: { status: 'APPROVED', limit: 50 } });
      setTemplates(res.data.data ?? []);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoadingTpls(false); }
  }, [templates.length]);

  const openTemplatePicker = () => { setShowTemplates(v => !v); if (!showTemplates) loadTemplates(); };

  const useTemplate = (tpl: any) => {
    const SAMPLE: Record<string, string> = {
      '{{patient_name}}':     active?.waContactName ?? 'Patient',
      '{{clinic_name}}':      'Our Clinic',
      '{{appointment_date}}': new Date().toLocaleDateString('en-IN'),
      '{{appointment_time}}': '10:30 AM',
      '{{doctor_name}}':      'your doctor',
      '{{amount}}':           '₹0',
      '{{invoice_number}}':   'INV-0000',
      '{{medicine_name}}':    'your medicine',
      '{{days}}':             '5',
    };
    let body = tpl.body ?? '';
    Object.entries(SAMPLE).forEach(([k, v]) => { body = body.replaceAll(k, v); });
    setMessageText(body);
    setShowTemplates(false);
  };

  const filteredTpls = templates.filter(t =>
    !tplSearch || (t.name ?? '').toLowerCase().includes(tplSearch.toLowerCase())
  );

  const msgStatusIcon = (status: string) => {
    if (status === 'READ')      return <CheckCheck className="w-3 h-3 text-blue-400" />;
    if (status === 'DELIVERED') return <CheckCheck className="w-3 h-3 text-slate-400" />;
    if (status === 'SENT')      return <Check      className="w-3 h-3 text-slate-400" />;
    return <Clock className="w-3 h-3 text-slate-300" />;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-2xl border border-slate-100 overflow-hidden">

      {/* ── Left: conversation list ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm">WhatsApp Inbox</h2>
              <span
                title={online ? 'Live · refreshes every 15s' : 'Offline'}
                className={`w-2 h-2 rounded-full ${online ? 'bg-[#25D366]' : 'bg-red-400'}`}
              />
            </div>
            <button onClick={() => loadConversations()}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              className="bg-transparent text-xs outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-slate-100 px-2 py-1.5 gap-0.5 overflow-x-auto">
          {FILTER_TABS.map(tab => {
            const count =
              tab.key === 'unread' ? conversations.filter(c => (c.unreadCount ?? 0) > 0).length :
              tab.key === 'bot'    ? conversations.filter(c =>  c.isBot && !c.isClosed).length :
              tab.key === 'human'  ? conversations.filter(c => !c.isBot && !c.isClosed).length :
              tab.key === 'closed' ? conversations.filter(c =>  c.isClosed).length :
              conversations.length;
            const active_ = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  active_ ? 'bg-[#25D366]/15 text-[#1a8f4a]' : 'text-slate-500 hover:bg-slate-100'
                }`}>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1 rounded-full leading-tight ${
                    active_ ? 'bg-[#25D366] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="animate-pulse w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="animate-pulse bg-slate-200 rounded h-2.5 w-24" />
                    <div className="animate-pulse bg-slate-200 rounded h-2.5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No conversations</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                  active?.id === conv.id ? 'bg-[#E8F5F0]' : ''
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center text-xs font-bold">
                      {(conv.waContactName || conv.waContactPhone || '?')[0].toUpperCase()}
                    </div>
                    {(conv.unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#25D366] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${(conv.unreadCount ?? 0) > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {conv.waContactName || conv.waContactPhone}
                      </p>
                      <span className="text-[10px] text-slate-400 ml-1 flex-shrink-0">
                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {conv.isClosed
                        ? <span className="text-[10px] text-slate-400 italic">Closed</span>
                        : conv.isBot
                          ? <><Bot className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" /><span className="text-[10px] text-slate-400">Bot</span></>
                          : <><UserCheck className="w-2.5 h-2.5 text-[#0D7C66] flex-shrink-0" /><span className="text-[10px] text-[#0D7C66]">Human</span></>
                      }
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Main: chat + optional patient panel ── */}
      {!active ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50/60">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-[#25D366]/60" />
            </div>
            <p className="text-slate-600 font-semibold">Select a conversation</p>
            <p className="text-slate-400 text-sm mt-1">
              {conversations.length > 0
                ? `${conversations.filter(c => (c.unreadCount ?? 0) > 0).length} unread · ${conversations.length} total`
                : 'No conversations yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-w-0">

          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {(active.waContactName || active.waContactPhone || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{active.waContactName || active.waContactPhone}</p>
                  <p className="text-xs text-slate-400">{active.waContactPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {active.isBot && !active.isClosed && (
                  <button onClick={markHumanTakeover}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0D7C66] border border-[#0D7C66]/30 bg-[#E8F5F0] px-3 py-1.5 rounded-xl hover:bg-[#0D7C66]/10 transition-colors">
                    <UserCheck className="w-3.5 h-3.5" /> Take Over
                  </button>
                )}
                {!active.isBot && !active.isClosed && (
                  <span className="text-xs font-semibold text-[#0D7C66] bg-[#E8F5F0] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> You
                  </span>
                )}
                {active.isClosed && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Closed</span>
                )}
                {active.patient && (
                  <a href={`/clinical/patients/${active.patient.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <User className="w-3.5 h-3.5" /> Patient
                  </a>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#f0f2f5]">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No messages yet</p>
                </div>
              ) : messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[68%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content && <p className="leading-relaxed text-[13px] whitespace-pre-wrap">{msg.content}</p>}
                    {msg.mediaUrl && (
                      <div className="mt-1.5">
                        {msg.mediaType?.startsWith('image') ? (
                          <img src={msg.mediaUrl} alt="media" className="rounded-xl max-w-full" />
                        ) : (
                          <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-[#0D7C66] text-xs hover:underline">
                            <FileText className="w-4 h-4" /> View attachment
                          </a>
                        )}
                      </div>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                      {msg.direction === 'OUTBOUND' && msgStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-slate-100 flex-shrink-0">
              {active.isClosed ? (
                <p className="text-center text-sm text-slate-400 py-2">This conversation is closed.</p>
              ) : (
                <>
                  {/* Template picker */}
                  {showTemplates && (
                    <div className="mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-700">Approved Templates</p>
                        <button onClick={() => setShowTemplates(false)}>
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="px-3 py-2 border-b border-slate-50">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                          <Search className="w-3 h-3 text-slate-400" />
                          <input
                            className="bg-transparent text-xs outline-none flex-1 placeholder:text-slate-400"
                            placeholder="Search templates…"
                            value={tplSearch}
                            onChange={e => setTplSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                        {loadingTpls ? (
                          <div className="py-6 text-center text-xs text-slate-400">Loading…</div>
                        ) : filteredTpls.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            {templates.length === 0 ? 'No approved templates yet' : 'No matches'}
                          </div>
                        ) : filteredTpls.map(tpl => (
                          <button key={tpl.id} onClick={() => useTemplate(tpl)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-semibold text-slate-900">{tpl.name}</p>
                              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#0D7C66]" />
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{tpl.body}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <button onClick={openTemplatePicker} title="Insert template"
                      className={`p-2 rounded-xl border transition-colors flex-shrink-0 ${
                        showTemplates
                          ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                          : 'border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}>
                      <LayoutTemplate className="w-4 h-4" />
                    </button>
                    <textarea
                      rows={1}
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#25D366] outline-none transition-all resize-none placeholder:text-slate-400"
                      placeholder="Type a message… (Enter to send)"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ maxHeight: '120px' }}
                      onInput={e => {
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                    />
                    <button onClick={() => sendMessage()} disabled={sending || !messageText.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: '#25D366' }}>
                      {sending
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                    Enter to send · Shift+Enter new line ·{' '}
                    <button onClick={openTemplatePicker} className="text-[#0D7C66] hover:underline">
                      templates
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── Patient context panel ── */}
          {active.patient && (
            <div className="w-60 flex-shrink-0 border-l border-slate-100 bg-slate-50/50 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-slate-100 bg-white">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Patient</p>
              </div>

              {/* Identity */}
              <div className="px-4 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-full bg-[#0D7C66]/15 text-[#0D7C66] font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {active.patient.firstName?.[0]}{active.patient.lastName?.[0] || ''}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {active.patient.firstName} {active.patient.lastName || ''}
                    </p>
                    <p className="text-xs text-slate-400">{active.patient.phone}</p>
                  </div>
                </div>
                <a href={`/clinical/patients/${active.patient.id}`}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0D7C66] border border-[#0D7C66]/30 bg-[#E8F5F0] py-1.5 rounded-xl hover:bg-[#0D7C66]/10 transition-colors">
                  <User className="w-3 h-3" /> Full Profile
                </a>
              </div>

              {/* Appointments */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Appointments</p>
                </div>
                {patientData === null ? (
                  <div className="space-y-1.5">{[1,2].map(i => <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-10" />)}</div>
                ) : patientData.appointments.length === 0 ? (
                  <p className="text-xs text-slate-400">None on record</p>
                ) : patientData.appointments.map((apt: any) => (
                  <div key={apt.id} className="bg-white rounded-xl px-3 py-2 border border-slate-100 mb-1.5">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">
                      {apt.doctor ? `Dr. ${apt.doctor.firstName}` : 'Appointment'}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(apt.scheduledAt)}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700'     :
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700'       :
                      'bg-amber-100 text-amber-700'
                    }`}>{apt.status}</span>
                  </div>
                ))}
              </div>

              {/* Prescriptions */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Pill className="w-3 h-3 text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Prescriptions</p>
                </div>
                {patientData === null ? (
                  <div className="animate-pulse bg-slate-200 rounded-lg h-10" />
                ) : patientData.prescriptions.length === 0 ? (
                  <p className="text-xs text-slate-400">None on record</p>
                ) : patientData.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="bg-white rounded-xl px-3 py-2 border border-slate-100 mb-1.5">
                    <p className="text-[11px] font-semibold text-slate-800">
                      {rx.medicines?.length ?? 0} medicine{rx.medicines?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(rx.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
