import { useState, useEffect } from 'react'
import { fetchBookings } from '../lib/api'
import { toast } from 'sonner'
import { Search, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react'

type Booking = {
  id: string; user_id: string; professional_id: string
  message: string; preferred_date?: string
  status: 'pending' | 'confirmed' | 'cancelled'; created_at: string
  professional?: { name: string; title: string; avatar_emoji: string; avatar_color: string }
}

const STATUS_CFG = {
  pending:   { label: 'Pending',   Icon: Clock,        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', Icon: XCircle,      cls: 'bg-red-50 text-red-500 border-red-200' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBookings()
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      (b.professional?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      b.message.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts: Record<string, number> = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="p-6 space-y-5 fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{bookings.length} total booking requests</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings…" className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-green-500 w-56 shadow-sm" />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === s ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s} {counts[s] > 0 && <span className={`ml-1 ${filter === s ? 'opacity-60' : 'text-gray-400'}`}>({counts[s]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-44" /></div>
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400"><p className="text-5xl mb-3">📋</p><p className="text-sm">No bookings found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending
            const Icon = cfg.Icon
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {b.professional ? (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: b.professional.avatar_color + '22' }}>
                      {b.professional.avatar_emoji}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{b.professional?.name ?? 'Unknown Professional'}</p>
                    <p className="text-xs text-gray-400">{b.professional?.title ?? ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={9} /> {fmt(b.created_at)}
                      {b.preferred_date && <> · Preferred: {new Date(b.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</>}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 ${cfg.cls}`}>
                    <Icon size={9} /> {cfg.label}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {b.message}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
