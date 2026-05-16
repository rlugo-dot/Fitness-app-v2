import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConversationMessages, sendMessage } from '../services/api';
import type { MessageOut, ConversationOut } from '../services/api';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function Avatar({ emoji, color }: { emoji: string; color: string }) {
  return (
    <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center shrink-0 text-base`}>
      {emoji}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Conversation() {
  const { convId } = useParams<{ convId: string }>();
  const navigate = useNavigate();
  const [conv, setConv] = useState<ConversationOut | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!convId) return;
    getConversationMessages(convId)
      .then(({ conversation, messages: msgs }) => {
        setConv(conversation);
        setMessages(msgs);
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [convId]);

  // Supabase Realtime — live new messages
  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`messages-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === (payload.new as MessageOut).id);
            return exists ? prev : [...prev, payload.new as MessageOut];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!convId || !input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const msg = await sendMessage(convId, content);
      // Optimistic update — realtime will also fire but we dedupe
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    } catch {
      toast.error('Failed to send message');
      setInput(content);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const pro = conv?.professional;

  // Group messages by date
  const groups: { date: string; msgs: MessageOut[] }[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.created_at);
    const last = groups[groups.length - 1];
    if (last?.date === label) last.msgs.push(msg);
    else groups.push({ date: label, msgs: [msg] });
  }

  return (
    <div className="page-enter flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/messages')} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          {pro ? (
            <>
              <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{pro.name}</p>
                <p className="text-xs text-gray-400 truncate">{pro.title}</p>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <div className="skeleton h-4 w-32" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4 space-y-4 pb-32">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`skeleton h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            {pro && <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />}
            <p className="text-sm font-semibold text-gray-700 mt-3">Start the conversation</p>
            <p className="text-xs text-gray-400">Send a message to {pro?.name?.split(',')[0] ?? 'the professional'}.</p>
          </div>
        ) : (
          groups.map(({ date, msgs }) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-medium">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {msgs.map((msg) => {
                const isUser = msg.sender_type === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isUser && pro && <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />}
                    <div className={`max-w-[75%] space-y-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : msg.sender_type === 'system'
                          ? 'bg-amber-50 text-amber-800 border border-amber-100 text-xs italic'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-gray-400 ${isUser ? 'text-right' : 'text-left'} px-1`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="pb-safe" />
      </div>
    </div>
  );
}
