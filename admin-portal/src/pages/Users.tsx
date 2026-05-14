import { useState, useEffect } from 'react'
import { fetchUsers } from '../lib/api'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

type UserProfile = {
  id: string; full_name?: string; age?: number; weight_kg?: number
  height_cm?: number; goal?: string; daily_calorie_goal?: number; created_at: string
}

const GOAL: Record<string, string> = { lose: '🔥 Lose', maintain: '⚖️ Maintain', gain: '💪 Gain' }

function joined(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    !search || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const setup = users.filter(u => u.full_name).length
  const incomplete = users.length - setup

  return (
    <div className="p-6 space-y-5 fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} total · {setup} set up · {incomplete} pending setup</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-green-500 w-56 shadow-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['User', 'Goal', 'Stats', 'Calorie Goal', 'Joined'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="skeleton w-8 h-8 rounded-full shrink-0" /><div className="skeleton h-3 w-28" /></div></td>
                      {[1,2,3,4].map(j => <td key={j} className="px-5 py-3"><div className="skeleton h-3 w-16" /></td>)}
                    </tr>
                  ))
                : filtered.length === 0
                ? <tr><td colSpan={5} className="text-center py-20 text-gray-400">No users found</td></tr>
                : filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                            {(u.full_name ?? '?')[0].toUpperCase()}
                          </div>
                          <span className={`font-medium ${u.full_name ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                            {u.full_name ?? 'No name yet'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{u.goal ? (GOAL[u.goal] ?? u.goal) : '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {u.weight_kg && u.height_cm ? `${u.weight_kg}kg · ${u.height_cm}cm` : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 font-medium">
                        {u.daily_calorie_goal ? `${u.daily_calorie_goal.toLocaleString()} kcal` : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{joined(u.created_at)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
