import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProMe,
  getProBookings,
  updateBookingStatus,
  toggleProAvailability,
} from '../services/api';
import type { ProProfile, ProBooking } from '../services/api';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CalendarDays,
  MessageSquare,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const FILTER_LABELS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function ProPortal() {
  const navigate = useNavigate();
  const [pro, setPro] = useState<ProProfile | null>(null);
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [toggling, setToggling] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [proData, bookingData] = await Promise.all([getProMe(), getProBookings()]);
        if (!proData) { navigate('/'); return; }
        setPro(proData);
        setBookings(bookingData);
      } catch {
        toast.error('Failed to load portal data');
        navigate('/');
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleToggle() {
    if (!pro || toggling) return;
    setToggling(true);
    try {
      const res = await toggleProAvailability();
      setPro({ ...pro, is_available: res.is_available });
      toast.success(res.is_available ? 'You are now available' : 'You are now unavailable');
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
      toast.success(status === 'confirmed' ? 'Booking confirmed' : 'Booking cancelled');
    } catch {
      toast.error('Failed to update booking');
    }
    setUpdatingId(null);
  }

  const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (!pro) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Pro Portal</h1>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Pro card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: pro.avatar_color + '22' }}
            >
              {pro.avatar_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{pro.name}</p>
              <p className="text-sm text-gray-500">{pro.title}</p>
              <p className="text-xs text-gray-400">{pro.location}</p>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">Accepting clients</p>
              <p className="text-xs text-gray-400">Toggle your availability status</p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              {toggling ? (
                <Loader2 size={22} className="animate-spin text-green-600" />
              ) : pro.is_available ? (
                <ToggleRight size={32} className="text-green-600" />
              ) : (
                <ToggleLeft size={32} className="text-gray-400" />
              )}
              <span className={`text-sm font-semibold ${pro.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                {pro.is_available ? 'Open' : 'Closed'}
              </span>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                <Users size={10} /> Total
              </p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-xl">
              <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
              <p className="text-[10px] text-amber-500">Pending</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-700">{bookings.filter(b => b.status === 'confirmed').length}</p>
              <p className="text-[10px] text-green-500">Confirmed</p>
            </div>
          </div>
        </div>

        {/* Bookings section */}
        <div>
          <h2 className="font-semibold text-gray-900 px-1 mb-3">Booking Requests</h2>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
            {FILTER_LABELS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.label}
                {f.value === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {filter === 'all' ? '' : filter} bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {booking.client?.full_name || 'Unknown Client'}
                      </p>
                      {booking.preferred_date && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <CalendarDays size={11} />
                          {new Date(booking.preferred_date).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-500'}`}>
                      {booking.status}
                    </span>
                  </div>

                  {booking.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 line-clamp-2">
                      "{booking.message}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => navigate(`/pro/client/${booking.user_id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm rounded-xl transition-colors"
                      >
                        <Eye size={14} /> View Client Data
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatus(booking, 'confirmed')}
                          disabled={updatingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors"
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
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-medium text-sm rounded-xl transition-colors"
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
