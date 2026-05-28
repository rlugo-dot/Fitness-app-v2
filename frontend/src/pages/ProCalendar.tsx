import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProBookings, getClientData } from '../services/api';
import type { ProBooking, ClientData } from '../services/api';
import { ChevronLeft, ChevronRight, Loader2, Eye, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOAL_LABEL: Record<string, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain',
  gain: 'Gain Muscle',
};

type Popup = {
  booking: ProBooking;
  clientData: ClientData | null;
  loading: boolean;
};

export default function ProCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    getProBookings()
      .then(data => setBookings(data.filter(b => b.status === 'confirmed' && b.preferred_date)))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const { year, month } = current;
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  function dayStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function getBookingsForDay(day: number) {
    const d = dayStr(day);
    return bookings.filter(b => b.preferred_date?.startsWith(d));
  }

  function prevMonth() {
    setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
    setSelectedDay(null);
  }

  function openPopup(booking: ProBooking) {
    setPopup({ booking, clientData: null, loading: true });
    getClientData(booking.user_id)
      .then(data => setPopup(p => p ? { ...p, clientData: data, loading: false } : null))
      .catch(() => setPopup(p => p ? { ...p, loading: false } : null));
  }

  // Build calendar grid
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split('T')[0];
  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  const upcomingSessions = bookings
    .filter(b => b.preferred_date && b.preferred_date >= todayStr)
    .sort((a, b) => (a.preferred_date ?? '').localeCompare(b.preferred_date ?? ''))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Calendar card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <p className="font-bold text-gray-900">{MONTHS[month]} {year}</p>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-50">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`e-${i}`}
                    className={`h-14 border-b border-gray-50 ${(i + 1) % 7 !== 0 ? 'border-r' : ''}`}
                  />
                );
              }

              const dayBookings = getBookingsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = day === selectedDay;
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => hasBookings && setSelectedDay(day === selectedDay ? null : day)}
                  disabled={!hasBookings}
                  className={`h-14 border-b border-gray-50 ${(i + 1) % 7 !== 0 ? 'border-r' : ''} p-1 flex flex-col items-center transition-colors ${
                    isSelected
                      ? 'bg-blue-50'
                      : hasBookings
                      ? 'hover:bg-slate-50 cursor-pointer active:bg-blue-50'
                      : 'cursor-default'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'text-blue-700 font-bold'
                        : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                  {/* Booking dots */}
                  {hasBookings && (
                    <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center">
                      {dayBookings.slice(0, 3).map(b => (
                        <span key={b.id} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[8px] text-blue-600 font-bold">+{dayBookings.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day sessions */}
        {selectedDay && selectedBookings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {MONTHS[month]} {selectedDay}, {year}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedBookings.length} session{selectedBookings.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {selectedBookings.map(booking => (
                <button
                  key={booking.id}
                  onClick={() => openPopup(booking)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold text-sm">
                      {(booking.client?.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {booking.client?.full_name || 'Unknown'}
                    </p>
                    {booking.message && (
                      <p className="text-xs text-gray-400 truncate">{booking.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors">
                    <span className="text-xs font-semibold">View</span>
                    <Eye size={13} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming sessions (shown when no day selected) */}
        {!selectedDay && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">
              Upcoming Sessions
            </p>

            {upcomingSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={24} className="text-slate-300" />
                </div>
                <p className="font-semibold text-gray-600 mb-1">No upcoming sessions</p>
                <p className="text-sm text-gray-400">
                  Confirmed bookings with a date will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map(booking => {
                  const date = new Date(booking.preferred_date! + 'T00:00:00');
                  const isToday2 = booking.preferred_date === todayStr;
                  return (
                    <button
                      key={booking.id}
                      onClick={() => openPopup(booking)}
                      className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all text-left group active:scale-[0.99]"
                    >
                      {/* Date block */}
                      <div className="w-11 shrink-0 text-center">
                        <p className="text-[10px] font-bold text-blue-500 uppercase leading-tight">
                          {date.toLocaleDateString('en-PH', { month: 'short' })}
                        </p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">{date.getDate()}</p>
                        {isToday2 && (
                          <span className="text-[9px] bg-blue-500 text-white font-bold px-1 rounded">TODAY</span>
                        )}
                      </div>
                      <div className="w-px h-8 bg-gray-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {booking.client?.full_name || 'Unknown'}
                        </p>
                        {booking.message && (
                          <p className="text-xs text-gray-400 truncate">{booking.message}</p>
                        )}
                      </div>
                      <Eye size={15} className="text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client data popup (bottom sheet style) */}
      {popup && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setPopup(null)}
          />

          {/* Card */}
          <div className="fixed bottom-[68px] inset-x-0 z-50 px-4 pb-2 max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Popup header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-blue-300 font-bold text-base">
                    {(popup.booking.client?.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">
                    {popup.booking.client?.full_name || 'Unknown'}
                  </p>
                  {popup.booking.preferred_date && (
                    <p className="text-slate-400 text-xs">
                      {new Date(popup.booking.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', {
                        weekday: 'short', month: 'long', day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPopup(null)}
                  className="text-slate-400 hover:text-white transition-colors text-2xl leading-none w-7 h-7 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Health snapshot */}
              <div className="p-4 space-y-3">
                {popup.loading ? (
                  <div className="flex items-center justify-center py-5">
                    <Loader2 size={20} className="animate-spin text-blue-400" />
                    <span className="ml-2 text-sm text-gray-400">Loading health data…</span>
                  </div>
                ) : popup.clientData?.profile ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: popup.clientData.profile.weight_kg,       unit: 'kg',   label: 'Weight' },
                        { value: popup.clientData.profile.height_cm,       unit: 'cm',   label: 'Height' },
                        { value: popup.clientData.profile.age,             unit: 'yrs',  label: 'Age'    },
                        { value: popup.clientData.profile.daily_calorie_goal, unit: 'kcal', label: 'Goal' },
                      ].map(({ value, unit, label }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                          <p className="text-sm font-bold text-gray-900">{value ?? '—'}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{unit}</p>
                          <p className="text-[9px] text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {popup.clientData.profile.goal && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Health goal:</span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {GOAL_LABEL[popup.clientData.profile.goal] ?? popup.clientData.profile.goal}
                        </span>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex gap-2 text-[11px]">
                      <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2 text-center">
                        <p className="font-bold text-orange-700">
                          {popup.clientData.food_logs.length}
                        </p>
                        <p className="text-orange-500">food logs (7d)</p>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
                        <p className="font-bold text-green-700">
                          {popup.clientData.workout_logs.length}
                        </p>
                        <p className="text-green-600">workouts (7d)</p>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
                        <p className="font-bold text-slate-700">
                          {popup.clientData.weight_logs[0]?.weight_kg ?? '—'}
                        </p>
                        <p className="text-slate-400">latest kg</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-400">No health data available yet</p>
                  </div>
                )}

                {/* Booking message */}
                {popup.booking.message && !popup.loading && (
                  <p className="text-xs text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
                    "{popup.booking.message}"
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => {
                    const uid = popup.booking.user_id;
                    setPopup(null);
                    navigate(`/pro/client/${uid}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-colors"
                >
                  <Eye size={15} /> View Full Health Data
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
