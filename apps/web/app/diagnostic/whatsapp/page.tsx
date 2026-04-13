'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, Search, RefreshCw, UserCheck, Bot,
  X, FileText, LayoutTemplate, CheckCheck, Check, Clock,
  ChevronRight, Inbox, FlaskConical,
} from 'lucide-react';

const PORTAL_COLOR = '#1E3A5F';
type FilterTab = 'all' | 'unread' | 'bot' | 'human' | 'closed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'All'    },
  { key: 'unread', label: 'Unread' },
  { key: 'bot',    label: 'Bot'    },
  { key: 'human',  label: 'Human'  },
  { key: 'closed', label: 'Closed' },
];

export default function DiagnosticWhatsAppPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active,        setActive]        = useState<any>(null);
  const [messages,      setMessages]      = useState<any[]>([]);
  const [messageText,   setMessageText]   = useState('');
  const [search,        setSearch]        = useState('');
  const [debSearch,     setDebSearch]     = useState('');
  const [sending,       setSending]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [filter,        setFilter]        = useState<FilterTab>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates,     setTemplates]     = useState<any[]>([]);
  const [loadingTpls,   setLoadingTpls]   = useState(false);
  const [tplSearch,     setTplSearch]     = useState('');
  const [online,        setOnline]        = useState(true);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const prevMsgLen  = useRef(0);

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
      setOnline(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debSearch]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-refresh every 15s
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
        if (msgs.length > prevMsgLen.current) {
          prevMsgLen.current = msgs.length;
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        return msgs;
      });
    } catch { if (!silent) toast.error('Failed to load messages'); }
    finally { if (!silent) setLoadingMsgs(false); }
  }, []);

  // Auto-refresh messages
  useEffect(() => {
    if (!active?.id) return;
    const t = setInterval(() => loadMessages(active.id, true), 15_000);
    return () => clearInterval(t);
  }, [active?.id, loadMessages]);

  const selectConversation = async (conv: any) => {
    setActive(conv);
    prevMsgLen.current = 0;
    loadMessages(conv.id);
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
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const markHumanTakeover = async () => {
    if (!active) return;
    try {
      await api.patch(`/whatsapp/conversations/${active.id}`, { isBot: false });
      setActive((a: any) => ({ ...a, isBot: false }));
      setConversations(cs => cs.map(c => c.id === active.id ? { ...c, isBot: false } : c));
      toast.success('Bot paused — assigned to you');
    } catch { toast.error('Failed'); }
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

  const useTemplate = (tpl: any) => {
    const SAMPLE: Record<string, string> = {
      '{{patient_name}}': active?.waContactName ?? 'Patient',
      '{{clinic_name}}':  'Our Lab',
      '{{test_name}}':    'your test',
      '{{appointment_date}}': new Date().toLocaleDateString('en-IN'),
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
    if (status === 'SENT')      return <Check className="w-3 h-3 text-slate-400" />;
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
              value={search} onChange={e => setSearch(e.target.value)} />
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
            const isActive = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isActive ? 'text-[#1a5080]' : 'text-slate-500 hover:bg-slate-100'
                }`}
                style={isActive ? { background: `${PORTAL_COLOR}15` } : {}}>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1 rounded-full leading-tight ${
                    isActive ? 'text-white' : 'bg-slate-200 text-slate-500'
                  }`} style={isActive ? { background: PORTAL_COLOR } : {}}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="animate-pulse w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="animate-pulse bg-slate-200 rounded h-2.5 w-20" />
                    <div className="animate-pulse bg-slate-200 rounded h-2.5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No conversations</p>
            </div>
          ) : filteredConversations.map(conv => (
            <button key={conv.id} onClick={() => selectConversation(conv)}
              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                active?.id === conv.id ? 'border-l-2' : ''
              }`}
              style={active?.id === conv.id ? { borderLeftColor: PORTAL_COLOR, background: `${PORTAL_COLOR}08` } : {}}>
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${PORTAL_COLOR}15`, color: PORTAL_COLOR }}>
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
                    {conv.isClosed ? (
                      <span className="text-[10px] text-slate-400 italic">Closed</span>
                    ) : conv.isBot ? (
                      <><Bot className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" /><span className="text-[10px] text-slate-400">Bot</span></>
                    ) : (
                      <><UserCheck className="w-2.5 h-2.5 flex-shrink-0" style={{ color: PORTAL_COLOR }} /><span className="text-[10px]" style={{ color: PORTAL_COLOR }}>Human</span></>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      {!active ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50/60">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${PORTAL_COLOR}10` }}>
              <FlaskConical className="w-10 h-10 opacity-40" style={{ color: PORTAL_COLOR }} />
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
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0"
                style={{ background: `${PORTAL_COLOR}15`, color: PORTAL_COLOR }}>
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
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
                  style={{ color: PORTAL_COLOR, borderColor: `${PORTAL_COLOR}40`, background: `${PORTAL_COLOR}08` }}>
                  <UserCheck className="w-3.5 h-3.5" /> Take Over
                </button>
              )}
              {!active.isBot && !active.isClosed && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ color: PORTAL_COLOR, background: `${PORTAL_COLOR}12` }}>
                  <UserCheck className="w-3 h-3" /> You
                </span>
              )}
              {active.isClosed && (
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Closed</span>
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
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 mt-1.5 text-xs hover:underline"
                      style={{ color: PORTAL_COLOR }}>
                      <FileText className="w-3.5 h-3.5" /> View attachment
                    </a>
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
                {showTemplates && (
                  <div className="mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-700">Approved Templates</p>
                      <button onClick={() => setShowTemplates(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <div className="px-3 py-2 border-b border-slate-50">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                        <Search className="w-3 h-3 text-slate-400" />
                        <input className="bg-transparent text-xs outline-none flex-1 placeholder:text-slate-400"
                          placeholder="Search templates…" value={tplSearch}
                          onChange={e => setTplSearch(e.target.value)} autoFocus />
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
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#1E3A5F]" />
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{tpl.body}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => { setShowTemplates(v => !v); if (!showTemplates) loadTemplates(); }}
                    className={`p-2 rounded-xl border transition-colors flex-shrink-0 ${
                      showTemplates
                        ? 'border-current text-white'
                        : 'border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    style={showTemplates ? { background: PORTAL_COLOR, borderColor: PORTAL_COLOR } : {}}
                    title="Insert template">
                    <LayoutTemplate className="w-4 h-4" />
                  </button>
                  <textarea
                    rows={1}
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all resize-none placeholder:text-slate-400"
                    style={{ '--tw-ring-color': PORTAL_COLOR } as any}
                    onFocus={e => e.target.style.borderColor = PORTAL_COLOR}
                    onBlur={e => e.target.style.borderColor = ''}
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    onInput={e => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                    }}
                  />
                  <button onClick={() => sendMessage()} disabled={sending || !messageText.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: '#25D366' }}>
                    {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Enter to send · Shift+Enter new line ·{' '}
                  <button onClick={() => { setShowTemplates(v => !v); if (!showTemplates) loadTemplates(); }}
                    className="hover:underline" style={{ color: PORTAL_COLOR }}>
                    templates
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
