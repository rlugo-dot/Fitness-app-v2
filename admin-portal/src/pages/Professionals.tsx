import { useState, useEffect } from 'react'
import { fetchProfessionals, toggleProfessional, removeProfessional } from '../lib/api'
import { toast } from 'sonner'
import { Search, Trash2, ToggleLeft, ToggleRight, Loader2, MapPin, Star } from 'lucide-react'

type Pro = {
  id: string; name: string; title: string; location: string
  years_exp: number; rate_php: number; specialties: string[]
  is_available: boolean; avatar_emoji: string; avatar_color: string
}

export default function Professionals() {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    try { setPros(await fetchProfessionals()) }
    catch { toast.error('Failed to load') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleToggle(id: string) {
    setBusyId(id)
    try {
      const { is_available } = await toggleProfessional(id)
      setPros(prev => prev.map(p => p.id === id ? { ...p, is_available } : p))
      toast.success(is_available ? 'Set to available' : 'Set to unavailable')
    } catch { toast.error('Failed') }
    setBusyId(null)
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from the directory? This cannot be undone.`)) return
    setBusyId(id)
    try { await removeProfessional(id); setPros(prev => prev.filter(p => p.id !== id)); toast.success(`${name} removed`) }
    catch { toast.error('Failed to remove') }
    setBusyId(null)
  }

  const filtered = pros.filter(p =>
    !search || [p.name, p.title, p.location].some(s => s.toLowerCase().includes(search.toLowerCase()))
  )
  const available = filtered.filter(p => p.is_available)
  const unavailable = filtered.filter(p => !p.is_available)
  const sorted = [...available, ...unavailable]

  return (
    <div className="p-6 space-y-5 fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Professionals</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pros.length} in directory · {pros.filter(p => p.is_available).length} available</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-green-500 w-56 shadow-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 shadow-sm">
              <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2"><div className="skeleton h-4 w-36" /><div className="skeleton h-3 w-52" /></div>
              <div className="skeleton w-20 h-8 rounded-xl" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400"><p className="text-5xl mb-3">🏥</p><p className="text-sm">No professionals found</p></div>
      ) : (
        <div className="space-y-3">
          {sorted.map(pro => (
            <div key={pro.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: pro.avatar_color + '22' }}>
                {pro.avatar_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 truncate">{pro.name}</p>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${pro.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pro.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{pro.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  <span className="flex items-center gap-0.5"><MapPin size={9} />{pro.location}</span>
                  <span className="flex items-center gap-0.5"><Star size={9} />{pro.years_exp}y exp</span>
                  <span>₱{pro.rate_php.toLocaleString()}/hr</span>
                </div>
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {pro.specialties.slice(0, 3).map(s => <span key={s} className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">{s}</span>)}
                  {pro.specialties.length > 3 && <span className="text-[9px] text-gray-400">+{pro.specialties.length - 3}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(pro.id)}
                  disabled={busyId === pro.id}
                  title="Toggle availability"
                  className={`p-2 rounded-xl transition-colors ${pro.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  {busyId === pro.id ? <Loader2 size={18} className="animate-spin" /> : pro.is_available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => handleRemove(pro.id, pro.name)}
                  disabled={busyId === pro.id}
                  title="Remove from directory"
                  className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
