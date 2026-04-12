'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, Search, RefreshCw, UserCheck, Bot, X, FileText,
} from 'lucide-react';

export default function DiagnosticWhatsAppPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive]     = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch]     = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (debSearch) params.search = debSearch;
      const res = await api.get('/whatsapp/conversations', { params });
      setConversations(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debSearch]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!active?.id) return;
    setLoadingMsgs(true);
    api.get(`/whatsapp/conversations/${active.id}/messages`).then(r => {
      setMessages(r.data.data ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => {}).finally(() => setLoadingMsgs(false));
  }, [active?.id]);

  const sendMessage = async () => {
    if (!messageText.trim() || !active) return;
    setSending(true);
    try {
      await api.post('/whatsapp/send', {
        to: active.waContactPhone,
        message: messageText,
        conversationId: active.id,
      });
      setMessageText('');
      const r = await api.get(`/whatsapp/conversations/${active.id}/messages`);
      setMessages(r.data.data ?? []);
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const markHumanTakeover = async () => {
    if (!active) return;
    try {
      await api.patch(`/whatsapp/conversations/${active.id}`, { isBot: false });
      setActive((a: any) => ({ ...a, isBot: false }));
      setConversations(c => c.map(conv => conv.id === active.id ? { ...conv, isBot: false } : conv));
      toast.success('Assigned to you. Bot paused.');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-900 text-sm">WhatsApp Inbox</h2>
            <button onClick={loadConversations} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input className="bg-transparent text-xs outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search conversations…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="animate-pulse w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-slate-200 rounded h-3 w-20" />
                    <div className="animate-pulse bg-slate-200 rounded h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No conversations</p>
            </div>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => setActive(conv)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${active?.id === conv.id ? 'bg-[#1E3A5F]/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-sm font-bold">
                    {(conv.waContactName || conv.waContactPhone || '?')[0].toUpperCase()}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#25D366] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 truncate">{conv.waContactName || conv.waContactPhone}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!conv.isBot && <UserCheck className="w-3 h-3 text-[#1E3A5F]" />}
                    {conv.isBot && <Bot className="w-3 h-3 text-slate-400" />}
                    <p className="text-[10px] text-slate-400 truncate">{conv.messageCount} messages</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {!active ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageSquare className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Select a conversation</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] font-bold text-sm flex items-center justify-center">
                {(active.waContactName || active.waContactPhone || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{active.waContactName || active.waContactPhone}</p>
                <p className="text-xs text-slate-400">{active.waContactPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {active.isBot ? (
                <button onClick={markHumanTakeover}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1E3A5F] border border-[#1E3A5F]/30 bg-[#1E3A5F]/5 px-3 py-1.5 rounded-xl hover:bg-[#1E3A5F]/10 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" /> Take Over
                </button>
              ) : (
                <span className="text-xs font-semibold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Assigned to you
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 text-sm">No messages yet</p>
              </div>
            ) : messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.direction === 'OUTBOUND'
                    ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-sm'
                    : 'bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-100'
                }`}>
                  {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                  {msg.mediaUrl && (
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-[#1E3A5F] text-xs mt-1 hover:underline">
                      <FileText className="w-3.5 h-3.5" /> View attachment
                    </a>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                    {msg.direction === 'OUTBOUND' && (
                      <span className="text-[10px]">{msg.status === 'READ' ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 bg-white border-t border-slate-100">
            <div className="flex items-end gap-3">
              <textarea rows={1}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] outline-none transition-all resize-none placeholder:text-slate-400"
                placeholder="Type a message…"
                value={messageText} onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{ maxHeight: '120px' }} />
              <button onClick={sendMessage} disabled={sending || !messageText.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                style={{ background: '#25D366' }}>
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}
