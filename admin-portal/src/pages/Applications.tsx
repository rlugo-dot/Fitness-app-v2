import { useState, useEffect } from 'react'
import { fetchApplications, approveApp, rejectApp, activateApp } from '../lib/api'
import { toast } from 'sonner'
import { Check, X, Zap, Loader2, ChevronDown, ChevronUp, Phone, MapPin, Star, Calendar, MessageSquare } from 'lucide-react'

type App = {
  id: string; name: string; email: string; phone?: string; title: string
  bio: string; location: string; years_exp: number; rate_php: number
  specialties: string[]; avatar_emoji: string; avatar_color: string
  status: string; payment_status: string; reviewer_notes?: string
  applied_at: string; reviewed_at?: string
}

const STATUSES = ['pending', 'approved', 'active', 'rejected']
const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',  rejected: 'bg-red-100 text-red-600',
}
const ACCENT: Record<string, string> = {
  pending: 'bg-amber-400', approved: 'bg-blue-500', active: 'bg-green-500', rejected: 'bg-red-400',
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Applications() {
  const [status, setStatus] = useState('pending')
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({})

  async function load(s: string) {
    setLoading(true)
    try { setApps(await fetchApplications(s)) }
    catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load(status) }, [status])
  useEffect(() => {
    Promise.all(STATUSES.map(s => fetchApplications(s).catch(() => []))).then(res => {
      const c: Record<string, number> = {}
      STATUSES.forEach((s, i) => { c[s] = (res[i] as any[]).length })
      setCounts(c)
    })
  }, [])

  return (
    <div className="p-6 space-y-5 fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and manage professional sign-up requests</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${status === s ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
            {(counts[s] ?? 0) > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${status === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
              <div className="flex gap-3"><div className="skeleton w-12 h-12 rounded-2xl shrink-0" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-36" /><div className="skeleton h-3 w-48" /></div></div>
              <div className="grid grid-cols-2 gap-2"><div className="skeleton h-16 rounded-xl" /><div className="skeleton h-16 rounded-xl" /></div>
              <div className="skeleton h-16 rounded-xl" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-24 text-gray-400"><p className="text-5xl mb-3">📋</p><p className="text-sm">No {status} applications</p></div>
      ) : (
        <div className="space-y-4">{apps.map(app => <AppCard key={app.id} app={app} onRefresh={() => load(status)} />)}</div>
      )}
    </div>
  )
}

function AppCard({ app, onRefresh }: { app: App; onRefresh: () => void }) {
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function doApprove() {
    setBusy(true)
    try { await approveApp(app.id, notes || undefined); toast.success(`✅ ${app.name} approved`); onRefresh() }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed') }
    setBusy(false)
  }
  async function doReject() {
    if (!notes.trim()) { toast.error('Rejection reason required'); return }
    setBusy(true)
    try { await rejectApp(app.id, notes); toast.success(`${app.name} rejected`); onRefresh() }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed') }
    setBusy(false)
  }
  async function doActivate() {
    setBusy(true)
    try { await activateApp(app.id); toast.success(`🎉 ${app.name} is now live!`); onRefresh() }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed') }
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${ACCENT[app.status] ?? 'bg-gray-300'}`} />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: app.avatar_color + '22' }}>{app.avatar_emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900">{app.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[app.status]}`}>{app.status.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{app.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={10} /> Applied {timeAgo(app.applied_at)}{app.reviewed_at && ` · Reviewed ${timeAgo(app.reviewed_at)}`}</p>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Contact + details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Contact</p>
            <p className="text-gray-800 font-medium break-all">{app.email}</p>
            {app.phone && <p className="text-gray-500 flex items-center gap-1"><Phone size={9} />{app.phone}</p>}
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Location & Rate</p>
            <p className="text-gray-800 flex items-center gap-1"><MapPin size={9} className="shrink-0" />{app.location}</p>
            <p className="text-gray-500 flex items-center gap-1"><Star size={9} />{app.years_exp}y exp · ₱{app.rate_php.toLocaleString()}/hr</p>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {app.specialties.map(s => <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full border border-green-100 font-medium">{s}</span>)}
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs">
              <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mb-1.5"><MessageSquare size={9} /> Bio</p>
              <p className="text-gray-700 leading-relaxed">{app.bio}</p>
            </div>
            {app.reviewer_notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs">
                <p className="text-amber-600 font-bold uppercase text-[10px] mb-0.5">Reviewer Notes</p>
                <p className="text-amber-800">{app.reviewer_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {app.status === 'pending' && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes — required for rejection, optional for approval…" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            <div className="flex gap-2">
              <button onClick={doReject} disabled={busy} className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
              </button>
              <button onClick={doApprove} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
              </button>
            </div>
          </div>
        )}
        {app.status === 'approved' && (
          <div className="pt-1 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Payment status</span>
              <span className={`font-semibold ${app.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{app.payment_status}</span>
            </div>
            <button onClick={doActivate} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Activate & Go Live
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
