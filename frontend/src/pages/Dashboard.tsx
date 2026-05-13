import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeals, getDailySummary, getWater, updateWater, deleteMealLog, getWorkoutSummary } from '../services/api';
import type { FoodLog, DailySummary, WaterLog, WorkoutSummary, MealType, Profile } from '../types';
import { Plus, Trash2, Droplets, Utensils, LogOut, Dumbbell, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
  profile: Profile;
  onSignOut: () => void;
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

function CalorieRing({
  eaten,
  burned,
  goal,
}: {
  eaten: number;
  burned: number;
  goal: number;
}) {
  const net = Math.max(eaten - burned, 0);
  const remaining = goal - net;
  const over = net > goal;
  const pct = Math.min(net / goal, 1);

  const radius = 78;
  const stroke = 13;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const offset = circ - pct * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={norm} cx={radius} cy={radius} />
          <circle
            stroke={over ? '#ef4444' : pct >= 0.9 ? '#f59e0b' : '#16a34a'}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={norm}
            cx={radius}
            cy={radius}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{Math.round(net)}</span>
          <span className="text-[10px] text-gray-400 leading-tight">net kcal</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-3 text-center">
        <div>
          <p className="text-xs font-semibold text-gray-900">{Math.round(eaten)}</p>
          <p className="text-[10px] text-gray-400">eaten</p>
        </div>
        <div className="text-gray-300">|</div>
        <div>
          <p className="text-xs font-semibold text-orange-500">{Math.round(burned)}</p>
          <p className="text-[10px] text-gray-400">burned</p>
        </div>
        <div className="text-gray-300">|</div>
        <div>
          <p className={`text-xs font-semibold ${over ? 'text-red-500' : 'text-green-600'}`}>
            {over ? `+${Math.round(Math.abs(remaining))}` : Math.round(remaining)}
          </p>
          <p className="text-[10px] text-gray-400">{over ? 'over' : 'left'}</p>
        </div>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.min((value / target) * 100, 100);
  const remaining = Math.max(target - value, 0);
  const over = value > target;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">
          {Math.round(value)}
          <span className="text-gray-400 font-normal">/{Math.round(target)}g</span>
          {over ? (
            <span className="text-red-500 ml-1">+{Math.round(value - target)}g over</span>
          ) : (
            <span className="text-gray-400 ml-1">{Math.round(remaining)}g left</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WaterTracker({
  glasses,
  goal,
  onUpdate,
}: {
  glasses: number;
  goal: number;
  onUpdate: (n: number) => void;
}) {
  return (
    <div className="bg-blue-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="text-blue-500" size={18} />
          <span className="font-semibold text-gray-900 text-sm">Water</span>
        </div>
        <span className="text-sm text-blue-700 font-medium">
          {glasses}/{goal} glasses
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: goal }).map((_, i) => (
          <button
            key={i}
            onClick={() => onUpdate(i < glasses ? i : i + 1)}
            className={`w-8 h-8 rounded-lg text-sm transition-all active:scale-90 ${
              i < glasses
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-blue-300 border border-blue-200 hover:border-blue-400'
            }`}
          >
            💧
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function Dashboard({ profile, onSignOut }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [water, setWater] = useState<WaterLog>({ glasses: 0, goal: 8 });
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [mealsData, summaryData, waterData, workoutData] = await Promise.all([
        getMeals(date),
        getDailySummary(date),
        getWater(date),
        getWorkoutSummary(date),
      ]);
      setLogs(mealsData);
      setSummary(summaryData);
      setWater(waterData);
      setWorkoutSummary(workoutData);
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteLog(id: string) {
    try {
      await deleteMealLog(id);
      loadData();
    } catch {}
  }

  async function handleWaterUpdate(glasses: number) {
    const updated = await updateWater(glasses, date);
    setWater(updated);
  }

  const logsByMeal = MEAL_ORDER.reduce<Record<MealType, FoodLog[]>>((acc, m) => {
    acc[m] = logs.filter((l) => l.meal_type === m);
    return acc;
  }, {} as Record<MealType, FoodLog[]>);

  const goal = profile.daily_calorie_goal || 2000;
  const burned = workoutSummary?.total_calories_burned ?? 0;
  const eaten = summary?.calories ?? 0;

  // Macro targets derived from calorie goal
  const proteinTarget = Math.round((goal * 0.30) / 4);
  const carbsTarget = Math.round((goal * 0.45) / 4);
  const fatTarget = Math.round((goal * 0.25) / 9);
  const fiberTarget = 30;

  const isToday = date === today;

  return (
    <div className="page-enter min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {isToday ? "Today" : formatDate(date)}
              </h1>
              <p className="text-xs text-gray-400">Hi, {profile.full_name.split(' ')[0]} 👋</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDate(addDays(date, -1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-90 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={isToday}
                onClick={() => setDate(addDays(date, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
              {!isToday && (
                <button
                  onClick={() => setDate(today)}
                  className="text-xs text-green-600 font-medium px-2 py-1 rounded-lg hover:bg-green-50"
                >
                  Today
                </button>
              )}
              <button onClick={onSignOut} className="text-gray-400 hover:text-gray-700 p-1.5 ml-1">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-4">
              <div className="skeleton w-40 h-40 rounded-full" />
              <div className="w-full space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-4/6" />
              </div>
            </div>
            <div className="skeleton h-12 w-full rounded-2xl" />
            <div className="skeleton h-24 w-full rounded-2xl" />
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-4 w-12" />
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-3">Failed to load data.</p>
            <button onClick={loadData} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Calorie Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col items-center mb-5">
                <CalorieRing eaten={eaten} burned={burned} goal={goal} />
              </div>
              <div className="space-y-3">
                <MacroBar label="Protein" value={summary?.protein_g ?? 0} target={proteinTarget} color="bg-blue-500" />
                <MacroBar label="Carbs" value={summary?.carbs_g ?? 0} target={carbsTarget} color="bg-amber-400" />
                <MacroBar label="Fat" value={summary?.fat_g ?? 0} target={fatTarget} color="bg-rose-400" />
                <MacroBar label="Fiber" value={summary?.fiber_g ?? 0} target={fiberTarget} color="bg-green-500" />
              </div>
            </div>

            {/* What should I eat */}
            <button
              onClick={() => navigate(`/recommendations?date=${date}`)}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
            >
              <Sparkles size={16} /> What should I eat next?
            </button>

            {/* Water */}
            <WaterTracker glasses={water.glasses} goal={water.goal} onUpdate={handleWaterUpdate} />

            {/* Workout summary (if any) */}
            {workoutSummary && workoutSummary.sessions > 0 && (
              <div className="bg-orange-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="text-orange-500" size={18} />
                    <span className="font-semibold text-gray-900 text-sm">Workouts</span>
                  </div>
                  <button
                    onClick={() => navigate('/workouts')}
                    className="text-xs text-orange-600 font-medium hover:text-orange-700"
                  >
                    View all
                  </button>
                </div>
                <div className="flex gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{workoutSummary.sessions}</p>
                    <p className="text-[10px] text-gray-400">sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-orange-500">{Math.round(burned)}</p>
                    <p className="text-[10px] text-gray-400">kcal burned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{workoutSummary.total_duration_min}</p>
                    <p className="text-[10px] text-gray-400">min</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Sections */}
            {MEAL_ORDER.map((meal) => {
              const mealLogs = logsByMeal[meal];
              const mealCals = Math.round(mealLogs.reduce((s, l) => s + l.calories, 0));
              return (
                <div key={meal} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm">{MEAL_LABELS[meal]}</h3>
                    <div className="flex items-center gap-3">
                      {mealLogs.length > 0 && (
                        <span className="text-xs text-gray-400">{mealCals} kcal</span>
                      )}
                      <button
                        onClick={() => navigate(`/food-search?meal=${meal}&date=${date}`)}
                        className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 active:scale-95 transition-transform"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {mealLogs.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                      <Utensils size={12} /> Nothing logged yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {mealLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{log.food_name}</p>
                            <p className="text-xs text-gray-400">
                              {Math.round(log.calories)} kcal · P:{Math.round(log.protein_g)}g · C:{Math.round(log.carbs_g)}g · F:{Math.round(log.fat_g)}g
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="ml-3 p-1 text-gray-300 hover:text-red-500 active:scale-90 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

    </div>
  );
}
