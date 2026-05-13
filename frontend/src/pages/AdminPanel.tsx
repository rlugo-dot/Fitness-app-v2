import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2, Check, X, Zap, ChevronLeft, RefreshCw,
  Phone, MapPin, Briefcase, Star, Calendar, MessageSquare,
} from 'lucide-react';
import {
  getApplications,
  approveApplication,
  rejectApplication,
  activateApplication,
} from '../services/api';
import type { ProfessionalApplication } from '../services/api';

type Tab = 'pending' | 'approved' | 'rejected' | 'active';

const TABS: { key: Tab; label: string; dot: string }[] = [
  { key: 'pending',  label: 'Pending',  dot: 'bg-amber-400' },
  { key: 'approved', label: 'Approved', dot: 'bg-blue-500' },
  { key: 'active',   label: 'Active',   dot: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', dot: 'bg-red-400' },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  active:   'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-500 border-red-200',
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [apps, setApps] = useState<ProfessionalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState<Record<Tab, number>>({ pending: 0, approved: 0, active: 0, rejected: 0 });

  const loadCounts = useCallback(() => {
    Promise.all(TABS.map(t => getApplications(t.key).catch(() => []))).then(results => {
      const c = {} as Record<Tab, number>;
      TABS.forEach((t, i) => { c[t.key] = (results[i] as ProfessionalApplication[]).length; });
      setCounts(c);
    });
  }, []);

  const load = useCallback(async (t: Tab, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getApplications(t);
      setApps(data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function refresh() { load(tab, true); loadCounts(); }

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-400">Professional applications</p>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`bg-white rounded-xl p-3 shadow-sm text-center transition-all border-2 ${tab === t.key ? 'border-green-500' : 'border-transparent'}`}
            >
              <p className="text-xl font-bold text-gray-900">{counts[t.key]}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                <p className="text-[10px] text-gray-500 capitalize">{t.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all relative ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {t.label}
              {counts[t.key] > 0 && tab !== t.key && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 ${t.dot} text-white text-[9px] font-bold rounded-full flex items-center justify-center`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-36" />
                    <div className="skeleton h-3 w-48" />
                    <div className="skeleton h-3 w-28" />
                  </div>
                </div>
                <div className="skeleton h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium text-gray-600">No {tab} applications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => (
              <AppCard key={app.id} app={app} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app, onRefresh }: { app: ProfessionalApplication; onRefresh: () => void }) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [showActions, setShowActions] = useState(app.status === 'pending');

  async function doApprove() {
    setBusy(true);
    try {
      await approveApplication(app.id, notes.trim() || undefined);
      toast.success(`✅ ${app.name} approved`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to approve');
    } finally { setBusy(false); }
  }

  async function doReject() {
    if (!notes.trim()) { toast.error('Add a rejection reason'); return; }
    setBusy(true);
    try {
      await rejectApplication(app.id, notes.trim());
      toast.success(`${app.name} rejected`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to reject');
    } finally { setBusy(false); }
  }

  async function doActivate() {
    setBusy(true);
    try {
      await activateApplication(app.id);
      toast.success(`🎉 ${app.name} is now live!`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to activate');
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Status accent bar */}
      <div className={`h-1 ${app.status === 'active' ? 'bg-green-500' : app.status === 'approved' ? 'bg-blue-500' : app.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />

      <div className="p-4 space-y-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: app.avatar_color + '22' }}
          >
            {app.avatar_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900">{app.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLES[app.status]}`}>
                {app.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{app.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={10} /> Applied {timeAgo(app.applied_at)}
              {app.reviewed_at && <> · Reviewed {timeAgo(app.reviewed_at)}</>}
            </p>
          </div>
        </div>

        {/* Contact + location */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Contact</p>
            <p className="text-xs text-gray-700 font-medium break-all">{app.email}</p>
            {app.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{app.phone}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Location & Rate</p>
            <p className="text-xs text-gray-700 flex items-center gap-1"><MapPin size={10} />{app.location}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Star size={10} />{app.years_exp}y exp · ₱{app.rate_php.toLocaleString()}/hr</p>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1 mb-1.5">
            <Briefcase size={10} /> Specialties ({app.specialties.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {app.specialties.map(s => (
              <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full border border-green-100 font-medium">{s}</span>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1 mb-1">
            <MessageSquare size={10} /> Bio
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">{app.bio}</p>
        </div>

        {/* Reviewer notes (if any) */}
        {app.reviewer_notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-0.5">Reviewer Notes</p>
            <p className="text-xs text-amber-800">{app.reviewer_notes}</p>
          </div>
        )}

        {/* Actions toggle for non-pending */}
        {app.status !== 'pending' && (
          <button
            onClick={() => setShowActions(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            {showActions ? 'Hide actions' : 'Show actions'}
          </button>
        )}

        {/* Actions */}
        {showActions && app.status === 'pending' && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes — required for rejection, optional for approval…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={doReject}
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
              </button>
              <button
                onClick={doApprove}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
              </button>
            </div>
          </div>
        )}

        {(showActions && app.status === 'approved') && (
          <div className="pt-1 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Payment status</span>
              <span className={`font-semibold ${app.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                {app.payment_status}
              </span>
            </div>
            <button
              onClick={doActivate}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />} Activate & Go Live
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
