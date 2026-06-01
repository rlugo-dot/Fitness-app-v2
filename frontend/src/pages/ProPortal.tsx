import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProBookings,
  updateBookingStatus,
  toggleProAvailability,
} from '../services/api';
import type { ProProfile, ProBooking } from '../services/api';
import {
  CheckCircle,
  XCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CalendarDays,
  Users,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const FILTER_LABELS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

interface Props {
  proProfile: ProProfile;
}

export default function ProPortal({ proProfile }: Props) {
  const navigate = useNavigate();
  const [pro, setPro] = useState<ProProfile>(proProfile);
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const autoRetryCount = useRef(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [toggling, setToggling] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadBookings() {
    setBookingError(false);
    setLoading(true);
    try {
      const data = await getProBookings();
      setBookings(data);
    } catch {
      setBookingError(true);
    }
    setLoading(false);
  }

  useEffect(() => { loadBookings(); }, []);

  // Auto-retry up to 3 times with 15s gaps (covers Render ~30-60s cold start)
  useEffect(() => {
    if (!bookingError || autoRetryCount.current >= 3) return;
    let t = 15;
    setRetryCountdown(t);
    const id = setInterval(() => {
      t -= 1;
      if (t <= 0) {
        clearInterval(id);
        setRetryCountdown(null);
        autoRetryCount.current += 1;
        loadBookings();
      } else {
        setRetryCountdown(t);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [bookingError]);

  async function handleToggle() {
    if (!pro || toggling) return;
    setToggling(true);
    try {
      const res = await toggleProAvailability();
      setPro({ ...pro, is_available: res.is_available });
      toast.success(res.is_available ? 'You are now accepting clients' : 'You are now unavailable');
    } catch {
      toast.error('Failed to update availability');
    }
    setToggling(false);
  }

  async function handleStatus(booking: ProBooking, status: 'confirmed' | 'cancelled') {
    setUpdatingId(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
      toast.success(status === 'confirmed' ? 'Booking confirmed' : 'Booking declined');
    } catch {
      toast.error('Failed to update booking');
    }
    setUpdatingId(null);
  }

  const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
  const pendingCount  = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  if (loading || retryCountdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="animate-spin text-blue-400" />
        {retryCountdown !== null && (
          <p className="text-slate-400 text-sm">
            Server is waking up… retrying in {retryCountdown}s
          </p>
        )}
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
        <p className="text-gray-500 text-sm text-center">
          Could not load bookings. The server may be waking up.
        </p>
        <button
          onClick={() => { autoRetryCount.current = 0; loadBookings(); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {pendingCount > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center font-bold text-[11px]">{pendingCount}</span>
            pending booking request{pendingCount !== 1 ? 's' : ''} — review below
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Welcome + availability */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: (pro.avatar_color || '#2563eb') + '33' }}
              >
                {pro.avatar_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{pro.name}</p>
                <p className="text-slate-300 text-sm truncate">{pro.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {pro.location}
                  {pro.session_type && (
                    <> · {pro.session_type === 'online' ? '🖥️ Online' : pro.session_type === 'in_person' ? '🏢 In-person' : '🔄 Both'}</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">Accepting clients</p>
              <p className="text-xs text-gray-400">
                {pro.is_available ? 'Your listing is visible to clients' : 'Hidden from directory'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              {toggling ? (
                <Loader2 size={22} className="animate-spin text-blue-500" />
              ) : pro.is_available ? (
                <ToggleRight size={34} className="text-blue-500" />
              ) : (
                <ToggleLeft size={34} className="text-gray-300" />
              )}
              <span className={`text-sm font-bold ${pro.is_available ? 'text-blue-600' : 'text-gray-400'}`}>
                {pro.is_available ? 'Open' : 'Closed'}
              </span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Activity size={14} className="text-slate-400" />
            </div>
            <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-[10px] text-gray-400 font-medium">Total</p>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock size={14} className="text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-[10px] text-amber-500 font-medium">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users size={14} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-700">{confirmedCount}</p>
            <p className="text-[10px] text-blue-500 font-medium">Confirmed</p>
          </div>
        </div>

        {/* Bookings */}
        <div>
          <h2 className="font-bold text-gray-900 px-1 mb-3 text-base">Booking Requests</h2>

          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
            {FILTER_LABELS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.label}
                {f.value === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <CalendarDays size={36} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-slate-600 font-bold text-sm">
                          {(booking.client?.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {booking.client?.full_name || 'Unknown Client'}
                        </p>
                        {booking.preferred_date && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <CalendarDays size={10} />
                            {new Date(booking.preferred_date).toLocaleDateString('en-PH', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {booking.message && (
                    <p className="text-sm text-gray-600 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed line-clamp-2 italic">
                      "{booking.message}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => navigate(`/pro/client/${booking.user_id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition-colors"
                      >
                        <Eye size={14} /> View Client Data
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatus(booking, 'confirmed')}
                          disabled={updatingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
                        >
                          {updatingId === booking.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatus(booking, 'cancelled')}
                          disabled={updatingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-semibold text-sm rounded-xl transition-colors"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'cancelled' && (
                      <p className="flex-1 text-center text-xs text-gray-400 py-2">No actions available</p>
                    )}
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
