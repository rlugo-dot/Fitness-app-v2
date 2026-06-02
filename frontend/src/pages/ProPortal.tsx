import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProDashboard,
  getProBookings,
  updateBookingStatus,
  toggleProAvailability,
} from '../services/api';
import type { ProProfile, ProBooking, ProDashboardData, ClientSummary } from '../services/api';
import {
  CheckCircle,
  XCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CalendarDays,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Dumbbell,
  Scale,
  PhilippinePeso,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type BookingFilter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

interface Props {
  proProfile: ProProfile;
}

function fmt(n: number) {
  return n.toLocaleString('en-PH');
}

function WeightTrend({ change }: { change: number | null }) {
  if (change === null) return <span className="text-slate-400 text-xs">—</span>;
  if (Math.abs(change) < 0.1) return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus size={10} /> stable</span>;
  const down = change < 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${down ? 'text-green-600' : 'text-red-500'}`}>
      {down ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
      {down ? '' : '+'}{change} kg
    </span>
  );
}

function EngagementBar({ days }: { days: number }) {
  return (
    <div className="flex gap-0.5 mt-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < days ? 'bg-blue-400' : 'bg-slate-100'}`}
        />
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: ClientSummary }) {
  const navigate = useNavigate();
  const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <button
      onClick={() => navigate(`/pro/client/${client.user_id}`)}
      className="w-full bg-white rounded-2xl border border-slate-100 p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-sm">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
            <p className="text-[10px] text-slate-400">{client.days_logged_7d}/7 days logged this week</p>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-300 shrink-0" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {/* Calories */}
        <div className="bg-orange-50 rounded-xl p-2.5 text-center">
          <Flame size={12} className="text-orange-400 mx-auto mb-0.5" />
          <p className="text-sm font-bold text-gray-900">
            {client.avg_calories_7d !== null ? fmt(client.avg_calories_7d) : '—'}
          </p>
          <p className="text-[9px] text-gray-400 leading-tight">kcal avg/day</p>
        </div>

        {/* Workouts */}
        <div className="bg-purple-50 rounded-xl p-2.5 text-center">
          <Dumbbell size={12} className="text-purple-400 mx-auto mb-0.5" />
          <p className="text-sm font-bold text-gray-900">{client.workouts_7d}</p>
          <p className="text-[9px] text-gray-400 leading-tight">workouts</p>
        </div>

        {/* Weight */}
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <Scale size={12} className="text-slate-400 mx-auto mb-0.5" />
          <p className="text-sm font-bold text-gray-900">
            {client.latest_weight_kg !== null ? `${client.latest_weight_kg}` : '—'}
          </p>
          <p className="text-[9px] text-gray-400 leading-tight">kg latest</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <WeightTrend change={client.weight_change_kg} />
        {client.calories_burned_7d > 0 && (
          <span className="text-[10px] text-orange-500 font-medium">
            {fmt(client.calories_burned_7d)} kcal burned
          </span>
        )}
      </div>

      <EngagementBar days={client.days_logged_7d} />
    </button>
  );
}

export default function ProPortal({ proProfile }: Props) {
  const navigate = useNavigate();
  const [pro, setPro] = useState<ProProfile>(proProfile);

  // Dashboard data
  const [dashboard, setDashboard] = useState<ProDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(false);
  const dashRetryCount = useRef(0);
  const [dashCountdown, setDashCountdown] = useState<number | null>(null);

  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('pending');
  const [toggling, setToggling] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadDashboard() {
    setDashError(false);
    setDashLoading(true);
    try {
      const data = await getProDashboard();
      setDashboard(data);
      // Use bookings from dashboard if available, else fetch separately
      if (data.bookings && data.bookings.length >= 0) {
        setBookings(data.bookings);
      } else {
        const b = await getProBookings();
        setBookings(b);
      }
    } catch {
      setDashError(true);
      // Try fetching bookings independently as a fallback
      try {
        const b = await getProBookings();
        setBookings(b);
      } catch {}
    }
    setDashLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  // Auto-retry dashboard on cold start (up to 3 × 15s)
  useEffect(() => {
    if (!dashError || dashRetryCount.current >= 3) return;
    let t = 15;
    setDashCountdown(t);
    const id = setInterval(() => {
      t -= 1;
      if (t <= 0) {
        clearInterval(id);
        setDashCountdown(null);
        dashRetryCount.current += 1;
        loadDashboard();
      } else {
        setDashCountdown(t);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [dashError]);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await toggleProAvailability();
      setPro({ ...pro, is_available: res.is_available });
      toast.success(res.is_available ? 'Now accepting clients' : 'Now unavailable');
    } catch {
      toast.error('Failed to update availability');
    }
    setToggling(false);
  }

  async function handleStatus(booking: ProBooking, status: 'confirmed' | 'cancelled') {
    setUpdatingId(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
      setDashboard(d => d ? { ...d, bookings: d.bookings.map(b => b.id === booking.id ? { ...b, status } : b) } : d);
      if (dashboard) {
        // update local revenue counts optimistically
        const delta = status === 'confirmed' ? 1 : 0;
        const rate = dashboard.revenue.rate_php;
        setDashboard(d => d ? {
          ...d,
          revenue: {
            ...d.revenue,
            confirmed_sessions: d.revenue.confirmed_sessions + delta,
            pending_sessions: d.revenue.pending_sessions - 1,
            earned: (d.revenue.confirmed_sessions + delta) * rate,
            pending_amount: (d.revenue.pending_sessions - 1) * rate,
          },
        } : d);
      }
      toast.success(status === 'confirmed' ? 'Booking confirmed' : 'Booking declined');
    } catch {
      toast.error('Failed to update booking');
    }
    setUpdatingId(null);
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const filtered = bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter);

  const rev = dashboard?.revenue;

  return (
    <div className="min-h-screen bg-slate-50">
      {pendingCount > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center font-bold text-[11px]">{pendingCount}</span>
            {pendingCount} pending booking request{pendingCount !== 1 ? 's' : ''} — review below
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Pro info + availability ── */}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">Accepting clients</p>
              <p className="text-xs text-gray-400">
                {pro.is_available ? 'Your listing is visible' : 'Hidden from directory'}
              </p>
            </div>
            <button onClick={handleToggle} disabled={toggling} className="flex items-center gap-2 disabled:opacity-50">
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

        {/* ── Revenue & session stats ── */}
        {(dashLoading || dashCountdown !== null) ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-2">
            <Loader2 size={22} className="animate-spin text-blue-400" />
            {dashCountdown !== null && (
              <p className="text-xs text-slate-400">Server waking up… retrying in {dashCountdown}s</p>
            )}
          </div>
        ) : dashError ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500 text-center">Could not load dashboard data.</p>
            <button
              onClick={() => { dashRetryCount.current = 0; loadDashboard(); }}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : rev && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Revenue</p>
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <PhilippinePeso size={18} className="text-green-600 mb-0.5" />
                    <span className="text-3xl font-bold text-gray-900">{fmt(rev.earned)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    from {rev.confirmed_sessions} confirmed session{rev.confirmed_sessions !== 1 ? 's' : ''}
                    {rev.rate_php ? ` · ₱${fmt(rev.rate_php)}/session` : ''}
                  </p>
                </div>
                {rev.pending_sessions > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">+₱{fmt(rev.pending_amount)}</p>
                    <p className="text-[10px] text-amber-500">{rev.pending_sessions} pending</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-50">
              <div className="p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{rev.confirmed_sessions}</p>
                <p className="text-[10px] text-gray-400">Confirmed</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{rev.pending_sessions}</p>
                <p className="text-[10px] text-gray-400">Pending</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{rev.total_sessions}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Client health overview ── */}
        {!dashLoading && !dashError && dashboard && (
          <div>
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="font-bold text-gray-900 text-base">Client Overview — This Week</h2>
              <button
                onClick={() => navigate('/pro/clients')}
                className="text-xs text-blue-500 font-semibold flex items-center gap-0.5"
              >
                All clients <ChevronRight size={12} />
              </button>
            </div>

            {dashboard.clients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <Users size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">No confirmed clients yet.</p>
                <p className="text-xs text-slate-300 mt-1">Confirm a booking to start tracking client health.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.clients.map(c => (
                  <ClientCard key={c.user_id} client={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Booking requests ── */}
        <div>
          <h2 className="font-bold text-gray-900 px-1 mb-3 text-base">Booking Requests</h2>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
            {(['pending', 'confirmed', 'cancelled', 'all'] as BookingFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                  bookingFilter === f
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {(dashLoading || dashCountdown !== null) ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No {bookingFilter === 'all' ? '' : bookingFilter} bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
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
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-500'}`}>
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
                        <Eye size={14} /> View Health Data
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
                          ) : <CheckCircle size={14} />}
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
