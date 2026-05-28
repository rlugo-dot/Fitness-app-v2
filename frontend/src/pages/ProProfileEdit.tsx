import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProMe, updateProProfile } from '../services/api';
import type { ProProfile } from '../services/api';
import { Loader2, Save, LogOut, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

export default function ProProfileEdit() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [pro, setPro] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: '',
    rate_php: '',
    location: '',
    session_type: 'both',
  });

  useEffect(() => {
    getProMe()
      .then(data => {
        if (!data) { navigate('/'); return; }
        setPro(data);
        setForm({
          bio: data.bio || '',
          rate_php: String(data.rate_php ?? ''),
          location: data.location || '',
          session_type: data.session_type || 'both',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleSave() {
    setSaving(true);
    try {
      const updates: Parameters<typeof updateProProfile>[0] = {};
      if (form.bio.trim())      updates.bio = form.bio.trim();
      if (form.rate_php)        updates.rate_php = parseInt(form.rate_php, 10);
      if (form.location.trim()) updates.location = form.location.trim();
      updates.session_type = form.session_type;
      await updateProProfile(updates);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : pro ? (
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: (pro.avatar_color || '#2563eb') + '33' }}
              >
                {pro.avatar_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{pro.name}</p>
                <p className="text-slate-300 text-sm truncate">{pro.title}</p>
                <span className="inline-block mt-1.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Verified Pro
                </span>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3 text-sm text-gray-600">
              <span>📊</span>
              <span>{pro.years_exp} yr{pro.years_exp !== 1 ? 's' : ''} experience</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-blue-600">₱{pro.rate_php?.toLocaleString()}/session</span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Edit Listing</p>

            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                placeholder="Tell clients about your background and approach..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Rate (₱/session)</label>
                <input
                  type="number"
                  value={form.rate_php}
                  onChange={e => setForm(f => ({ ...f, rate_php: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="e.g. 500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="City, Province"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Session Format</label>
              <div className="flex gap-2">
                {[
                  { value: 'online',    label: '🖥️ Online' },
                  { value: 'in_person', label: '🏢 In-Person' },
                  { value: 'both',      label: '🔄 Both' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, session_type: opt.value }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.session_type === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>

          {/* Availability quick toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Accepting clients</p>
              <p className="text-xs text-gray-400">Manage from Dashboard tab</p>
            </div>
            <div className="flex items-center gap-1.5">
              {pro.is_available ? (
                <ToggleRight size={28} className="text-blue-500" />
              ) : (
                <ToggleLeft size={28} className="text-gray-300" />
              )}
              <span className={`text-sm font-semibold ${pro.is_available ? 'text-blue-600' : 'text-gray-400'}`}>
                {pro.is_available ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:text-red-600 font-semibold text-sm rounded-2xl border border-red-100 hover:border-red-200 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
