'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { MessageSquare, Send, User, Bot, ArrowLeftRight, Search } from 'lucide-react';

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/conversations');
      setConversations(res.data);
    } catch { toast.error('Failed to load inbox'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const selectConversation = async (conv: any) => {
    setSelected(conv);
    try {
      const res = await api.get(`/whatsapp/conversations/${conv.id}/messages`);
      setMessages(res.data.reverse());
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { toast.error('Failed to load messages'); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    try {
      await api.post('/whatsapp/send', { to: selected.waContactPhone, message: newMsg });
      setMessages(prev => [...prev, { direction: 'OUTBOUND', content: newMsg, senderType: 'staff', createdAt: new Date().toISOString() }]);
      setNewMsg('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { toast.error('Failed to send message'); }
  };

  const toggleBot = async () => {
    if (!selected) return;
    try {
      if (selected.isBot) {
        await api.put(`/whatsapp/conversations/${selected.id}/assign`, { assignTo: 'current-user' });
        toast.success('You took over this conversation');
      } else {
        await api.put(`/whatsapp/conversations/${selected.id}/bot`);
        toast.success('Switched to bot');
      }
      fetchConversations();
    } catch { toast.error('Failed to switch'); }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Conversation list */}
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search conversations..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No conversations yet</div>
          ) : (
            conversations.map((conv: any) => (
              <div key={conv.id} onClick={() => selectConversation(conv)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === conv.id ? 'bg-primary-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {conv.patient ? `${conv.patient.firstName} ${conv.patient.lastName || ''}` : conv.waContactName || conv.waContactPhone}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-whatsapp text-white text-[10px] rounded-full flex items-center justify-center font-bold">{conv.unreadCount}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.messages?.[0]?.content || 'No messages'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${conv.isBot ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {conv.isBot ? 'Bot' : 'Human'}
                  </span>
                  {conv.patient?.healthId && <span className="text-[10px] text-primary-600 font-mono">{conv.patient.healthId}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName || ''}` : selected.waContactName || selected.waContactPhone}
                </p>
                <p className="text-xs text-gray-500">{selected.waContactPhone}</p>
              </div>
              <button onClick={toggleBot} className="btn-outline text-xs py-1.5 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                {selected.isBot ? 'Take over' : 'Switch to bot'}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 ${msg.direction === 'OUTBOUND' ? 'text-primary-200' : 'text-gray-400'} flex items-center gap-1`}>
                      {msg.senderType === 'bot' && <Bot className="w-2.5 h-2.5" />}
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input className="input-field flex-1" placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
              <button type="submit" className="btn-whatsapp px-4"><Send className="w-4 h-4" /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
