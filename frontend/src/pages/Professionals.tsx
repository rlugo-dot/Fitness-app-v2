import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProfessionals,
  getProfessionalSpecialties,
  bookProfessional,
} from '../services/api';
import type { Professional } from '../services/api';
import { ChevronLeft, Search, MapPin, Star, Calendar, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function Avatar({ emoji, color, size = 'md' }: { emoji: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-3xl' : size === 'sm' ? 'w-9 h-9 text-lg' : 'w-12 h-12 text-2xl';
  return (
    <div className={`${sz} ${color} rounded-2xl flex items-center justify-center shrink-0`}>
      {emoji}
    </div>
  );
}

function SpecialtyChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({
  pro,
  onClose,
  onSuccess,
}: {
  pro: Professional;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error('Please write a message to the professional');
      return;
    }
    setSubmitting(true);
    try {
      await bookProfessional({
        professional_id: pro.id,
        message: message.trim(),
        preferred_date: date || undefined,
      });
      toast.success(`Booking request sent to ${pro.name}!`);
      onSuccess();
    } catch {
      toast.error('Failed to send booking request');
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{pro.name}</p>
            <p className="text-xs text-gray-400 truncate">{pro.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Hi ${pro.name.split(',')[0]}, I'd like to consult about…`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Preferred date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs text-gray-500">Session rate</span>
          <span className="text-sm font-bold text-green-700">₱{pro.rate_php.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
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
function ProCard({ pro, onBook }: { pro: Professional; onBook: (p: Professional) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <Avatar emoji={pro.avatar_emoji} color={pro.avatar_color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-snug">{pro.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{pro.title}</p>
              </div>
              {!pro.is_available && (
                <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Unavailable
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin size={10} /> {pro.location}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Star size={10} className="text-yellow-500" fill="currentColor" /> {pro.years_exp}yr exp
              </span>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex gap-1.5 flex-wrap mt-3">
          {pro.specialties.map((s) => (
            <span key={s} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>

        {/* Bio (collapsible) */}
        <p className={`text-xs text-gray-500 mt-2.5 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {pro.bio}
        </p>
        {pro.bio.length > 100 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-green-600 font-medium mt-1 hover:text-green-700"
          >
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
          disabled={!pro.is_available}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            pro.is_available
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Calendar size={14} />
          {pro.is_available ? 'Book' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Professionals() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [bookingPro, setBookingPro] = useState<Professional | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('nutrisyon_booked_pros');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    Promise.all([
      getProfessionals(),
      getProfessionalSpecialties(),
    ]).then(([pros, specs]) => {
      setProfessionals(pros);
      setSpecialties(specs);
      setLoading(false);
    });
  }, []);

  const filtered = professionals.filter((p) => {
    const matchSpec = !activeSpecialty || p.specialties.includes(activeSpecialty);
    const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase()));
    return matchSpec && matchQ;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Find a Professional</h1>
              <p className="text-xs text-gray-400">Nutritionists, dietitians & coaches</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, specialty…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Specialty filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <SpecialtyChip label="All" active={activeSpecialty === ''} onClick={() => setActiveSpecialty('')} />
            {specialties.map((s) => (
              <SpecialtyChip
                key={s}
                label={s}
                active={activeSpecialty === s}
                onClick={() => setActiveSpecialty(activeSpecialty === s ? '' : s)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading professionals…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No professionals found.</p>
            <p className="text-xs mt-1">Try a different specialty or search term.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              {filtered.length} professional{filtered.length !== 1 ? 's' : ''} available
            </p>
            {filtered.map((pro) => (
              <ProCard
                key={pro.id}
                pro={pro}
                onBook={(p) => {
                  if (bookedIds.has(p.id)) {
                    toast.info('You already sent a request to this professional.');
                    return;
                  }
                  setBookingPro(p);
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Booking modal */}
      {bookingPro && (
        <BookingModal
          pro={bookingPro}
          onClose={() => setBookingPro(null)}
          onSuccess={() => {
            const newIds = new Set([...bookedIds, bookingPro.id]);
            setBookedIds(newIds);
            try { localStorage.setItem('nutrisyon_booked_pros', JSON.stringify([...newIds])); } catch {}
            setBookingPro(null);
          }}
        />
      )}
    </div>
  );
}
