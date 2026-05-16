import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProfessionals,
  getProfessionalSpecialties,
  bookProfessional,
  getMyBookings,
  getSubscription,
  startConversation,
} from '../services/api';
import type { Professional, BookingOut, SubscriptionStatus } from '../services/api';
import {
  ChevronLeft, Search, MapPin, Star, Calendar, X,
  Check, Loader2, BadgeCheck, Clock, CheckCircle2, XCircle, Lock, Sparkles, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

function ProCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1 skeleton rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-36" />
            <div className="skeleton h-3 w-48" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          <div className="skeleton h-4 w-20 rounded-full" />
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton h-4 w-16 rounded-full" />
        </div>
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

function BookingRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3.5 w-36" />
          <div className="skeleton h-3 w-48" />
        </div>
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-10 w-full rounded-xl" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

function Avatar({ emoji, color, size = 'md' }: { emoji: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-3xl' : size === 'sm' ? 'w-9 h-9 text-lg' : 'w-12 h-12 text-2xl';
  return (
    <div className={`${sz} ${color} rounded-2xl flex items-center justify-center shrink-0`}>
      {emoji}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending:   { label: 'Pending',   icon: <Clock size={11} />,        className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', icon: <CheckCircle2 size={11} />, className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', icon: <XCircle size={11} />,      className: 'bg-red-50 text-red-500 border-red-200' },
};

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ pro, onClose, onSuccess }: { pro: Professional; onClose: () => void; onSuccess: () => void }) {
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit() {
    if (!message.trim()) { toast.error('Please write a message'); return; }
    setSubmitting(true);
    try {
      await bookProfessional({ professional_id: pro.id, message: message.trim(), preferred_date: date || undefined });
      toast.success(`Request sent to ${pro.name.split(',')[0]}!`);
      onSuccess();
    } catch { toast.error('Failed to send request'); }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 px-4 pb-6" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{pro.name}</p>
            <p className="text-xs text-gray-400 truncate">{pro.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Your message <span className="text-red-400">*</span></label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Hi ${pro.name.split(',')[0]}, I'd like to consult about…`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred date <span className="text-gray-400">(optional)</span></label>
          <input
            type="date" value={date} min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-green-700 font-medium">Session rate</span>
          <span className="text-lg font-bold text-green-700">₱{pro.rate_php.toLocaleString()}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Professional Card ─────────────────────────────────────────────────────────
function ProCard({ pro, booked, isSubscribed, onBook }: { pro: Professional; booked: boolean; isSubscribed: boolean; onBook: (p: Professional) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className={`h-1 ${pro.is_available ? 'bg-green-500' : 'bg-gray-200'}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 text-sm leading-snug truncate">{pro.name}</p>
                  <BadgeCheck size={14} className="shrink-0 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{pro.title}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                pro.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {pro.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin size={10} /> {pro.location}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Star size={10} className="text-yellow-400" fill="currentColor" /> {pro.years_exp} yr exp
              </span>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex gap-1.5 flex-wrap mt-3">
          {pro.specialties.map((s) => (
            <span key={s} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-100">
              {s}
            </span>
          ))}
        </div>

        {/* Bio */}
        <p className={`text-xs text-gray-500 mt-2.5 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {pro.bio}
        </p>
        {pro.bio.length > 100 && (
          <button onClick={() => setExpanded((v) => !v)} className="text-xs text-green-600 font-medium mt-1 hover:text-green-700">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div>
          <span className="text-base font-bold text-gray-900">₱{pro.rate_php.toLocaleString()}</span>
          <span className="text-xs text-gray-400 ml-1">/ session</span>
        </div>
        <button
          onClick={() => onBook(pro)}
          disabled={booked || (!isSubscribed ? false : !pro.is_available)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            booked
              ? 'bg-green-100 text-green-700 cursor-default'
              : !isSubscribed
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : pro.is_available
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {booked
            ? <><Check size={13} /> Requested</>
            : !isSubscribed
            ? <><Lock size={13} /> Subscribe</>
            : <><Calendar size={13} /> Book</>}
        </button>
      </div>
    </div>
  );
}

// ─── My Bookings Tab ───────────────────────────────────────────────────────────
function MyBookingsTab({ bookings, loading, onMessage }: { bookings: BookingOut[]; loading: boolean; onMessage: (professionalId: string) => void }) {
  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map((i) => <BookingRowSkeleton key={i} />)}
    </div>
  );
  if (bookings.length === 0) return (
    <div className="text-center py-16 space-y-2">
      <p className="text-3xl">📋</p>
      <p className="text-sm font-medium text-gray-700">No bookings yet</p>
      <p className="text-xs text-gray-400">Find a professional and send a request</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['pending'];
        const pro = b.professional;
        return (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start gap-3">
              {pro ? (
                <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} size="sm" />
              ) : (
                <div className="w-9 h-9 bg-gray-100 rounded-xl" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{pro?.name ?? 'Unknown Professional'}</p>
                <p className="text-xs text-gray-400 truncate">{pro?.title ?? ''}</p>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${status.className}`}>
                {status.icon} {status.label}
              </span>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed line-clamp-2">
              {b.message}
            </p>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Sent {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {b.preferred_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  Preferred: {new Date(b.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <button
              onClick={() => onMessage(b.professional_id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl transition-colors active:scale-95"
            >
              <MessageSquare size={13} /> Message {pro?.name?.split(',')[0] ?? 'Professional'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Professionals() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'find' | 'bookings'>('find');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookingOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [bookingPro, setBookingPro] = useState<Professional | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    Promise.all([getProfessionals(), getProfessionalSpecialties()]).then(([pros, specs]) => {
      setProfessionals(pros);
      setSpecialties(specs);
      setLoading(false);
    });
    getMyBookings().then((bs) => {
      setBookings(bs);
      setBookedIds(new Set(bs.map((b) => b.professional_id)));
      setBookingsLoading(false);
    }).catch(() => setBookingsLoading(false));
    getSubscription().then(setSubStatus).catch(() => {});
  }, []);

  const filtered = professionals.filter((p) => {
    const matchSpec = !activeSpecialty || p.specialties.includes(activeSpecialty);
    const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase()));
    return matchSpec && matchQ;
  });

  const available = filtered.filter((p) => p.is_available);
  const unavailable = filtered.filter((p) => !p.is_available);

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Find a Professional</h1>
              <p className="text-xs text-gray-400">Nutritionists, dietitians & coaches</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
            <button
              onClick={() => setTab('find')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'find' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Find a Pro
            </button>
            <button
              onClick={() => setTab('bookings')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative ${tab === 'bookings' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              My Bookings
              {bookings.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {bookings.length}
                </span>
              )}
            </button>
          </div>

          {/* Search + filters (find tab only) */}
          {tab === 'find' && (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, specialty…"
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['', ...specialties].map((s) => (
                  <button
                    key={s || 'all'}
                    onClick={() => setActiveSpecialty(activeSpecialty === s ? '' : s)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeSpecialty === s ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {tab === 'bookings' ? (
          <MyBookingsTab
            bookings={bookings}
            loading={bookingsLoading}
            onMessage={async (professionalId) => {
              try {
                const conv = await startConversation(professionalId);
                navigate(`/messages/${conv.id}`);
              } catch { toast.error('Could not open conversation'); }
            }}
          />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <ProCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <p className="text-3xl">🔍</p>
            <p className="text-sm">No professionals found.</p>
            <p className="text-xs">Try a different specialty or search term.</p>
            <a href="/professionals/join" className="inline-block mt-2 text-xs text-green-600 font-medium hover:text-green-700">
              Are you a professional? Apply to join →
            </a>
          </div>
        ) : (
          <>
            {/* Subscription banner */}
            {subStatus && !subStatus.is_active && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Subscribe to book professionals</p>
                  <p className="text-xs text-amber-700 mt-0.5">₱299/month · unlimited bookings</p>
                </div>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="shrink-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
                >
                  Get Pro
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400">{available.length} available · {unavailable.length} unavailable</p>
            {available.map((pro) => (
              <ProCard key={pro.id} pro={pro} booked={bookedIds.has(pro.id)}
                isSubscribed={subStatus?.is_active ?? false}
                onBook={(p) => {
                  if (!subStatus?.is_active) { navigate('/subscribe'); return; }
                  if (bookedIds.has(p.id)) { toast.info('You already sent a request.'); return; }
                  setBookingPro(p);
                }}
              />
            ))}
            {unavailable.length > 0 && available.length > 0 && (
              <p className="text-xs text-gray-400 pt-2">Currently unavailable</p>
            )}
            {unavailable.map((pro) => (
              <ProCard key={pro.id} pro={pro} booked={bookedIds.has(pro.id)}
                isSubscribed={subStatus?.is_active ?? false}
                onBook={() => { if (!subStatus?.is_active) navigate('/subscribe'); }}
              />
            ))}

            {/* Join CTA */}
            <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl mb-2">🩺</p>
              <p className="text-sm font-semibold text-gray-800">Are you a health professional?</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">Join Phitness and connect with Filipino health seekers</p>
              <a
                href="/professionals/join"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Apply to Join →
              </a>
            </div>
          </>
        )}
      </div>

      {bookingPro && (
        <BookingModal
          pro={bookingPro}
          onClose={() => setBookingPro(null)}
          onSuccess={() => {
            setBookedIds((prev) => new Set([...prev, bookingPro.id]));
            getMyBookings().then(setBookings).catch(() => {});
            setBookingPro(null);
          }}
        />
      )}
    </div>
  );
}
