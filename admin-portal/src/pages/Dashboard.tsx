import { useState, useEffect } from 'react'
import { fetchStats, fetchApplications } from '../lib/api'
import { Users, Briefcase, FileText, Calendar, TrendingUp, Dumbbell, Clock } from 'lucide-react'

type Stats = {
  total_users: number
  active_professionals: number
  pending_applications: number
  total_bookings: number
  total_food_logs: number
  total_workout_logs: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchStats(), fetchApplications('pending')])
      .then(([s, p]) => { setStats(s); setPending(p.slice(0, 6)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Total Users',           value: stats.total_users,           icon: Users,      bg: 'bg-blue-50',   icon_cls: 'text-blue-600',   border: 'border-blue-100' },
    { label: 'Active Professionals',  value: stats.active_professionals,  icon: Briefcase,  bg: 'bg-green-50',  icon_cls: 'text-green-600',  border: 'border-green-100' },
    { label: 'Pending Applications',  value: stats.pending_applications,  icon: FileText,   bg: 'bg-amber-50',  icon_cls: 'text-amber-600',  border: 'border-amber-100' },
    { label: 'Total Bookings',        value: stats.total_bookings,        icon: Calendar,   bg: 'bg-purple-50', icon_cls: 'text-purple-600', border: 'border-purple-100' },
    { label: 'Food Logs',             value: stats.total_food_logs,       icon: TrendingUp, bg: 'bg-rose-50',   icon_cls: 'text-rose-600',   border: 'border-rose-100' },
    { label: 'Workout Logs',          value: stats.total_workout_logs,    icon: Dumbbell,   bg: 'bg-orange-50', icon_cls: 'text-orange-600', border: 'border-orange-100' },
  ] : []

  return (
    <div className="p-6 space-y-6 fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Phitness at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
                <div className="skeleton w-9 h-9 rounded-xl" />
                <div className="skeleton h-7 w-12" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))
          : cards.map(c => (
              <div key={c.label} className={`bg-white rounded-2xl border ${c.border} p-4 shadow-sm`}>
                <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <c.icon size={16} className={c.icon_cls} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{c.value.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{c.label}</p>
              </div>
            ))}
      </div>

      {/* Pending applications queue */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Pending Applications</h2>
          {pending.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
              {pending.length} waiting
            </span>
          )}
        </div>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-2.5 w-48" />
                </div>
                <div className="skeleton h-3 w-14" />
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm">All caught up — no pending applications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pending.map(app => (
              <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: app.avatar_color + '22' }}>
                  {app.avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{app.name}</p>
                  <p className="text-xs text-gray-400 truncate">{app.title} · {app.location}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <Clock size={10} /> {timeAgo(app.applied_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
