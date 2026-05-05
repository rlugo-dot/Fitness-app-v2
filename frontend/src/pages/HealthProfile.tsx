import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHealthConditions,
  getMyConditions,
  updateMyConditions,
  getDietRecommendations,
} from '../services/api';
import type { HealthCondition, DietRecommendation } from '../types';
import { ChevronLeft, ChevronDown, ChevronUp, Check, UserSearch } from 'lucide-react';
import { toast } from 'sonner';

export default function HealthProfile() {
  const navigate = useNavigate();
  const [allConditions, setAllConditions] = useState<HealthCondition[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<DietRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [conditions, myData] = await Promise.all([
          getHealthConditions(),
          getMyConditions(),
        ]);
        setAllConditions(conditions);
        setSelected(myData.conditions);
      } catch {
        toast.error('Failed to load health conditions');
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (selected.length > 0) {
      getDietRecommendations().then(setRecommendations).catch(() => {});
    } else {
      setRecommendations([]);
    }
  }, [selected]);

  function toggleCondition(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMyConditions(selected);
      const recs = selected.length > 0 ? await getDietRecommendations() : [];
      setRecommendations(recs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Health Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            {/* Condition selector */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="font-semibold text-gray-900 mb-1">My Health Conditions</h2>
              <p className="text-xs text-gray-400 mb-4">
                Select any conditions that apply. We'll tailor your diet recommendations.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {allConditions.map(c => {
                  const isSelected = selected.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCondition(c.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <span className="text-sm font-medium text-gray-800 flex-1">{c.label}</span>
                      {isSelected && <Check size={14} className="text-green-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Conditions'}
              </button>
            </div>

            {/* Diet Recommendations */}
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🥗</div>
                <p className="text-sm">Select a condition above to see personalised diet recommendations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-semibold text-gray-900 px-1">Your Diet Recommendations</h2>
                {recommendations.map(rec => (
                  <div key={rec.condition_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Accordion header */}
                    <button
                      onClick={() => setExpanded(expanded === rec.condition_id ? null : rec.condition_id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{rec.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rec.summary}</p>
                      </div>
                      {expanded === rec.condition_id
                        ? <ChevronUp size={16} className="text-gray-400 shrink-0 ml-2" />
                        : <ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />
                      }
                    </button>

                    {/* Accordion body */}
                    {expanded === rec.condition_id && (
                      <div className="border-t border-gray-50 px-4 py-4 space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">✅ Eat More</h4>
                          <ul className="space-y-1">
                            {rec.eat_more.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="text-green-500 mt-0.5 shrink-0">•</span>{item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">⚠️ Limit / Avoid</h4>
                          <ul className="space-y-1">
                            {rec.limit.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="text-red-400 mt-0.5 shrink-0">•</span>{item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">💡 Tips</h4>
                          <ul className="space-y-1">
                            {rec.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="text-blue-400 mt-0.5 shrink-0">•</span>{tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-xs text-amber-800">📊 {rec.calorie_note}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA to find a professional */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <UserSearch size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Want expert guidance?</p>
            <p className="text-white/70 text-xs">Connect with a certified nutritionist or coach</p>
          </div>
          <button
            onClick={() => navigate('/professionals')}
            className="shrink-0 bg-white text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            Find One
          </button>
        </div>
      </div>
    </div>
  );
}
