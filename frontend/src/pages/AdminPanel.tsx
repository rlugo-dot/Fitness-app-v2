import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getApplications,
  approveApplication,
  rejectApplication,
  activateApplication,
} from '../services/api';
import type { ProfessionalApplication } from '../services/api';

type Tab = 'pending' | 'approved' | 'rejected' | 'active';

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'pending',  label: 'Pending',  color: 'text-amber-600 border-amber-500' },
  { key: 'approved', label: 'Approved', color: 'text-blue-600 border-blue-500' },
  { key: 'active',   label: 'Active',   color: 'text-green-600 border-green-500' },
  { key: 'rejected', label: 'Rejected', color: 'text-red-500 border-red-400' },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending');
  const [apps, setApps] = useState<ProfessionalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<Tab, number>>({ pending: 0, approved: 0, active: 0, rejected: 0 });

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const data = await getApplications(t);
      setApps(data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  // Load counts for all tabs once on mount
  useEffect(() => {
    Promise.all(TABS.map(t => getApplications(t.key).catch(() => []))).then(results => {
      const c = {} as Record<Tab, number>;
      TABS.forEach((t, i) => { c[t.key] = results[i].length; });
      setCounts(c);
    });
  }, []);

  function refreshCounts() {
    Promise.all(TABS.map(t => getApplications(t.key).catch(() => []))).then(results => {
      const c = {} as Record<Tab, number>;
      TABS.forEach((t, i) => { c[t.key] = results[i].length; });
      setCounts(c);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage professional applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {TABS.map(t => (
            <div key={t.key} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{counts[t.key]}</p>
              <p className="text-xs text-gray-500 capitalize">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-4 no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t.key ? t.color : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}>
              {t.label}
              {counts[t.key] > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No {tab} applications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                onRefresh={() => { load(tab); refreshCounts(); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app, onRefresh }: { app: ProfessionalApplication; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function doApprove() {
    setBusy(true);
    try {
      await approveApplication(app.id, notes.trim() || undefined);
      toast.success(`${app.name} approved`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to approve');
    } finally {
      setBusy(false);
    }
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
    } finally {
      setBusy(false);
    }
  }

  async function doActivate() {
    setBusy(true);
    try {
      await activateApplication(app.id);
      toast.success(`${app.name} is now live!`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to activate');
    } finally {
      setBusy(false);
    }
  }

  const statusBadge: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    active:   'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: app.avatar_color + '22' }}>
          {app.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{app.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[app.status]}`}>
              {app.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">{app.title}</p>
          <p className="text-xs text-gray-400">{app.email} · {app.location}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 shrink-0">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs min-w-0">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="font-semibold text-gray-900">{app.years_exp}y</p>
              <p className="text-gray-400">Experience</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="font-semibold text-gray-900">₱{app.rate_php.toLocaleString()}</p>
              <p className="text-gray-400">Per hour</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="font-semibold text-gray-900">{app.specialties.length}</p>
              <p className="text-gray-400">Specialties</p>
            </div>
          </div>

          {app.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {app.specialties.map(s => (
                <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">{s}</span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-600 leading-relaxed">{app.bio}</p>

          {app.phone && <p className="text-xs text-gray-400">Phone: {app.phone}</p>}
          {app.reviewer_notes && (
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500 font-medium">Notes</p>
              <p className="text-sm text-gray-700">{app.reviewer_notes}</p>
            </div>
          )}
          <p className="text-xs text-gray-400">
            Applied {new Date(app.applied_at).toLocaleDateString()}
            {app.reviewed_at && ` · Reviewed ${new Date(app.reviewed_at).toLocaleDateString()}`}
          </p>
        </div>
      )}

      {/* Actions */}
      {app.status === 'pending' && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (required for rejection, optional for approval)…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={doReject}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
            </button>
            <button
              onClick={doApprove}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
            </button>
          </div>
        </div>
      )}

      {app.status === 'approved' && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-500 mb-2">
            Payment status: <span className={`font-medium ${app.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
              {app.payment_status}
            </span>. Activate once you've confirmed payment.
          </p>
          <button
            onClick={doActivate}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />} Activate & Go Live
          </button>
        </div>
      )}
    </div>
  );
}
