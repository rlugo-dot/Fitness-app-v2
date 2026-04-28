import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRecommendations, logFood } from '../services/api';
import type { MealSuggestion, RecommendationsResponse } from '../services/api';
import type { MealType } from '../types';
import { ChevronLeft, Sparkles, Plus, Check, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  restaurant: { emoji: '🍽️', label: 'Restaurant', color: 'bg-orange-50 text-orange-700' },
  recipe:     { emoji: '👨‍🍳', label: 'Home Recipe', color: 'bg-green-50 text-green-700' },
  store:      { emoji: '🏪', label: 'Convenience', color: 'bg-blue-50 text-blue-700' },
};

function MacroChip({ label, value, unit = 'g', color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-xs font-bold ${color}`}>{Math.round(value)}{unit}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialMeal = searchParams.get('meal') || undefined;

  const [result, setResult] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>(initialMeal || '');
  const [logged, setLogged] = useState<Set<number>>(new Set());
  const [logging, setLogging] = useState<number | null>(null);

  async function load(mealOverride?: string) {
    setLoading(true);
    setLogged(new Set());
    try {
      const data = await getRecommendations(initialDate, mealOverride ?? (selectedMeal || undefined));
      setResult(data);
      setSelectedMeal(data.meal_type);
    } catch {
      toast.error('Could not load recommendations. Make sure the AI key is configured.');
    }
    setLoading(false);
  }

  async function handleLog(suggestion: MealSuggestion, index: number) {
    setLogging(index);
    try {
      await logFood({
        food_id: `rec_${Date.now()}_${index}`,
        meal_type: (result?.meal_type ?? 'snack') as MealType,
        quantity: 1,
        log_date: initialDate,
        food_name: suggestion.name,
        calories: suggestion.calories,
        protein_g: suggestion.protein_g,
        carbs_g: suggestion.carbs_g,
        fat_g: suggestion.fat_g,
      });
      setLogged((prev) => new Set([...prev, index]));
      toast.success(`${suggestion.name} logged!`);
    } catch {
      toast.error('Failed to log meal');
    }
    setLogging(null);
  }

  const remainingPct = result ? Math.min((result.remaining_calories / result.daily_calorie_goal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">What Should I Eat?</h1>
            {result && (
              <button
                onClick={() => load()}
                disabled={loading}
                className="ml-auto text-gray-400 hover:text-green-600 disabled:opacity-40"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {/* Meal type selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {Object.entries(MEAL_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedMeal(key);
                  load(key);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedMeal === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Empty state — first load */}
        {!result && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-green-600" size={36} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI Meal Planner</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Get smart meal suggestions tailored to your remaining macros — local chains, recipes, and more.
            </p>
            <button
              onClick={() => load()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center gap-2 mx-auto transition-colors"
            >
              <Sparkles size={16} /> Get Recommendations
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="animate-spin text-green-600 mx-auto" size={32} />
            <p className="text-sm text-gray-500">Finding meals that fit your macros…</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Remaining macros summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-3">
                Remaining for {MEAL_LABELS[result.meal_type] ?? result.meal_type}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-gray-900 text-base">{result.remaining_calories}</span>
                    <span className="text-gray-400">kcal left</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${remainingPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <MacroChip label="Protein" value={result.remaining_protein_g} color="text-blue-600" />
                  <MacroChip label="Carbs" value={result.remaining_carbs_g} color="text-amber-600" />
                  <MacroChip label="Fat" value={result.remaining_fat_g} color="text-rose-500" />
                </div>
              </div>
            </div>

            {/* Suggestion cards */}
            {result.suggestions.map((s, i) => {
              const typeConf = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.restaurant;
              const isLogged = logged.has(i);
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeConf.color}`}>
                            {typeConf.emoji} {s.where}
                          </span>
                          <span className="text-xs font-semibold text-green-700">₱{s.price_php}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => !isLogged && handleLog(s, i)}
                        disabled={logging === i || isLogged}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isLogged
                            ? 'bg-green-100 text-green-600'
                            : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                        }`}
                      >
                        {logging === i ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isLogged ? (
                          <Check size={14} />
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>
                    </div>

                    {/* Macros row */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: 'Calories', value: s.calories, unit: 'kcal', color: 'text-gray-900' },
                        { label: 'Protein', value: s.protein_g, unit: 'g', color: 'text-blue-600' },
                        { label: 'Carbs', value: s.carbs_g, unit: 'g', color: 'text-amber-600' },
                        { label: 'Fat', value: s.fat_g, unit: 'g', color: 'text-rose-500' },
                      ].map(({ label, value, unit, color }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                          <p className={`text-xs font-bold ${color}`}>
                            {Math.round(value)}<span className="font-normal text-[10px]">{unit}</span>
                          </p>
                          <p className="text-[10px] text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Why + tip */}
                    <p className="text-xs text-gray-500 italic">{s.why}</p>
                    {s.tip && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5 mt-2">
                        💡 {s.tip}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => load()}
              className="w-full py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Suggest different meals
            </button>
          </>
        )}
      </div>
    </div>
  );
}
