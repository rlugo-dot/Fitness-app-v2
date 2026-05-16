import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../services/api';
import type { ConversationOut } from '../services/api';
import { ChevronLeft, MessageSquare, ChevronRight } from 'lucide-react';

function Avatar({ emoji, color }: { emoji: string; color: string }) {
  return (
    <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center shrink-0 text-xl`}>
      {emoji}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function ConvoSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-32" />
        <div className="skeleton h-3 w-48" />
      </div>
      <div className="skeleton h-3 w-10" />
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const [convos, setConvos] = useState<ConversationOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations().then(setConvos).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 mt-4 overflow-hidden divide-y divide-gray-50">
            {[1, 2, 3].map((i) => <ConvoSkeleton key={i} />)}
          </div>
        ) : convos.length === 0 ? (
          <div className="text-center py-20 space-y-3 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400">
              Book a professional and use the Message button to start a conversation.
            </p>
            <button
              onClick={() => navigate('/professionals')}
              className="mt-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
            >
              Find a Professional
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 mt-4 overflow-hidden divide-y divide-gray-50">
            {convos.map((conv) => {
              const pro = conv.professional;
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {pro ? (
                    <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />
                  ) : (
                    <div className="w-11 h-11 bg-gray-100 rounded-2xl shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{pro?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.last_message
                        ? conv.last_message.sender_type === 'user'
                          ? `You: ${conv.last_message.content}`
                          : conv.last_message.content
                        : pro?.title ?? ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {conv.last_message && (
                      <span className="text-[10px] text-gray-400">{timeAgo(conv.last_message.created_at)}</span>
                    )}
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
