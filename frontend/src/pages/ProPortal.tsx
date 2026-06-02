import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProBookings,
  getProDashboard,
  updateBookingStatus,
  toggleProAvailability,
} from '../services/api';
import type { ProProfile, ProBooking, ProDashboardData } from '../services/api';
import {
  Loader2, RefreshCw, ToggleLeft, ToggleRight,
  CheckCircle, XCircle, Eye, CalendarDays,
  PhilippinePeso, Users, Flame, Dumbbell, Scale,
  TrendingUp, TrendingDown, Minus, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').trim();

type Status = 'loading' | 'error' | 'ready';
type BookingFilter = 'pending' | 'confirmed' | 'cancelled' | 'all';

interface Props { proProfile: ProProfile }

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-PH');
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

// ── sub-components ───────────────────────────────────────────────────────────

function WeightBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-slate-400 text-xs">—</span>;
  if (Math.abs(change) < 0.05)
    return <span className="text-slate-400 text-xs flex items-center gap-0.5"><Minus size={10} />stable</span>;
  const down = change < 0;
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${down ? 'text-green-600' : 'text-red-500'}`}>
      {down ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
      {down ? '' : '+'}{change} kg
    </span>
  );
}

function DaysBar({ days }: { days: number }) {
  return (
    <div className="flex gap-0.5 mt-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i < days ? 'bg-blue-400' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ProPortal({ proProfile }: Props) {
  const navigate = useNavigate();
  const [pro, setPro] = useState(proProfile);
  const [status, setStatus] = useState<Status>('loading');
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [dashboard, setDashboard] = useState<ProDashboardData | null>(null);
  const [filter, setFilter] = useState<BookingFilter>('pending');
  const [toggling, setToggling] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setStatus('loading');
    try {
      // Warm Render before authenticated calls
      await fetch(`${API_BASE}/health`).catch(() => {});
      // Fetch bookings (primary) + dashboard (secondary) in parallel
      const [b, d] = await Promise.all([
        getProBookings(),
        getProDashboard().catch(() => null),
      ]);
      setBookings(b);
      setDashboard(d);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await toggleProAvailability();
      setPro(p => ({ ...p, is_available: res.is_available }));
      toast.success(res.is_available ? 'Now accepting clients' : 'Now unavailable');
    } catch {
      toast.error('Failed to update availability');
    }
    setToggling(false);
  }

  async function handleStatus(booking: ProBooking, newStatus: 'confirmed' | 'cancelled') {
    setUpdatingId(booking.id);
    try {
      await updateBookingStatus(booking.id, newStatus);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
      toast.success(newStatus === 'confirmed' ? 'Booking confirmed' : 'Booking declined');
    } catch {
      toast.error('Failed to update booking');
    }
    setUpdatingId(null);
  }

  const pending  = bookings.filter(b => b.status === 'pending');
  const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const rate     = pro.rate_php ?? 0;
  const earned   = confirmed.length * rate;

  // ── loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Pro card placeholder - show real data immediately */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: (pro.avatar_color || '#2563eb') + '33' }}
            >
              {pro.avatar_emoji}
            </div>
            <div>
              <p className="text-white font-bold">{pro.name}</p>
              <p className="text-slate-300 text-sm">{pro.title}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">Accepting clients</p>
            <div className={`text-sm font-bold ${pro.is_available ? 'text-blue-600' : 'text-gray-400'}`}>
              {pro.is_available ? 'Open' : 'Closed'}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={28} className="animate-spin text-blue-400" />
          <p className="text-sm text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── error ────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-2xl">⚡</p>
        <p className="font-semibold text-gray-800">Server is waking up</p>
        <p className="text-sm text-gray-400 max-w-xs">
          The backend is on a free tier that sleeps after inactivity. It usually wakes within 30–60 seconds.
        </p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  // ── ready ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {pending.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <button
            onClick={() => setFilter('pending')}
            className="w-full bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 active:scale-[0.99] transition-transform"
          >
            <span className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center font-bold text-[11px]">
              {pending.length}
            </span>
            {pending.length} pending booking request{pending.length !== 1 ? 's' : ''} — tap to review
          </button>
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
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Accepting clients</p>
              <p className="text-xs text-gray-400">{pro.is_available ? 'Visible in directory' : 'Hidden from directory'}</p>
            </div>
            <button onClick={handleToggle} disabled={toggling} className="flex items-center gap-2 disabled:opacity-50">
              {toggling
                ? <Loader2 size={22} className="animate-spin text-blue-500" />
                : pro.is_available
                  ? <ToggleRight size={34} className="text-blue-500" />
                  : <ToggleLeft size={34} className="text-gray-300" />}
              <span className={`text-sm font-bold ${pro.is_available ? 'text-blue-600' : 'text-gray-400'}`}>
                {pro.is_available ? 'Open' : 'Closed'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Revenue ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Revenue</p>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <PhilippinePeso size={18} className="text-green-600 mb-0.5 shrink-0" />
                  <span className="text-3xl font-bold text-gray-900">{fmt(earned)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {confirmed.length} confirmed session{confirmed.length !== 1 ? 's' : ''}
                  {rate > 0 ? ` · ₱${fmt(rate)}/session` : ''}
                </p>
              </div>
              {pending.length > 0 && rate > 0 && (
                <div className="text-right">
                  <p className="text-base font-bold text-amber-600">+₱{fmt(pending.length * rate)}</p>
                  <p className="text-[10px] text-amber-500">{pending.length} pending</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-50 border-t border-slate-50">
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{confirmed.length}</p>
              <p className="text-[10px] text-gray-400">Confirmed</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-amber-500">{pending.length}</p>
              <p className="text-[10px] text-gray-400">Pending</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
              <p className="text-[10px] text-gray-400">Total</p>
            </div>
          </div>
        </div>

        {/* ── Client health overview ── */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="font-bold text-gray-900">Client Overview — This Week</h2>
            <button
              onClick={() => navigate('/pro/clients')}
              className="text-xs text-blue-500 font-semibold flex items-center gap-0.5"
            >
              All <ChevronRight size={12} />
            </button>
          </div>

          {!dashboard || dashboard.clients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center">
              <Users size={28} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">No confirmed clients yet</p>
              <p className="text-xs text-slate-300 mt-1">Confirm a booking to start tracking health data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.clients.map(c => {
                const initials = c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <button
                    key={c.user_id}
                    onClick={() => navigate(`/pro/client/${c.user_id}`)}
                    className="w-full bg-white rounded-2xl border border-slate-100 p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-blue-600 font-bold text-sm">{initials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.days_logged_7d}/7 days logged</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div className="bg-orange-50 rounded-xl p-2 text-center">
                        <Flame size={11} className="text-orange-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-900">
                          {c.avg_calories_7d !== null ? fmt(c.avg_calories_7d) : '—'}
                        </p>
                        <p className="text-[9px] text-gray-400">kcal avg</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-2 text-center">
                        <Dumbbell size={11} className="text-purple-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-900">{c.workouts_7d}</p>
                        <p className="text-[9px] text-gray-400">workouts</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <Scale size={11} className="text-slate-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-900">
                          {c.latest_weight_kg !== null ? `${c.latest_weight_kg}` : '—'}
                        </p>
                        <p className="text-[9px] text-gray-400">kg</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <WeightBadge change={c.weight_change_kg} />
                      {c.calories_burned_7d > 0 && (
                        <span className="text-[10px] text-orange-400">{fmt(c.calories_burned_7d)} kcal burned</span>
                      )}
                    </div>
                    <DaysBar days={c.days_logged_7d} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Booking requests ── */}
        <div>
          <h2 className="font-bold text-gray-900 px-1 mb-3">Booking Requests</h2>

          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
            {(['pending', 'confirmed', 'cancelled', 'all'] as BookingFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f}
                {f === 'pending' && pending.length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-slate-600 text-sm">
                        {(b.client?.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{b.client?.full_name || 'Unknown'}</p>
                        {b.preferred_date && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <CalendarDays size={10} />
                            {new Date(b.preferred_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                      b.status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-700'   :
                                                 'bg-slate-100 text-slate-500'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  {b.message && (
                    <p className="text-sm text-gray-600 bg-slate-50 rounded-xl px-3 py-2.5 italic line-clamp-2">
                      "{b.message}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => navigate(`/pro/client/${b.user_id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition-colors"
                      >
                        <Eye size={14} /> View Health Data
                      </button>
                    )}
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatus(b, 'confirmed')}
                          disabled={updatingId === b.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
                        >
                          {updatingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatus(b, 'cancelled')}
                          disabled={updatingId === b.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-semibold text-sm rounded-xl transition-colors"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    )}
                    {b.status === 'cancelled' && (
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
