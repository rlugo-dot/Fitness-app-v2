import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientData } from '../services/api';
import type { ClientData } from '../services/api';
import { ChevronLeft, Loader2, UtensilsCrossed, Dumbbell, Scale } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'food' | 'workouts' | 'weight';

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const GOAL_LABEL: Record<string, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain',
  gain: 'Gain Muscle',
};

export default function ProClientView() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('food');

  useEffect(() => {
    if (!userId) return;
    getClientData(userId)
      .then(setData)
      .catch(() => { toast.error('Failed to load client data'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, food_logs, workout_logs, weight_logs } = data;

  const foodByDate = food_logs.reduce<Record<string, typeof food_logs>>((acc, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  const workoutByDate = workout_logs.reduce<Record<string, typeof workout_logs>>((acc, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark back-button header */}
      <div className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate">
              {profile?.full_name || 'Client'}
            </p>
            <p className="text-slate-400 text-[10px]">Last 7 days of data</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Profile overview */}
        {profile && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Client Overview
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: profile.weight_kg, unit: 'kg', label: 'Weight' },
                { value: profile.height_cm, unit: 'cm', label: 'Height' },
                { value: profile.age, unit: 'yrs', label: 'Age' },
                { value: profile.daily_calorie_goal, unit: 'kcal', label: 'Goal' },
              ].map(({ value, unit, label }) => (
                <div key={label} className="text-center bg-slate-50 rounded-xl py-2.5 px-1">
                  <p className="text-base font-bold text-gray-900">{value ?? '—'}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{unit}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {profile.goal && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                <span className="text-xs text-gray-400">Goal:</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {GOAL_LABEL[profile.goal] ?? profile.goal}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl">
          {([
            { key: 'food',     icon: UtensilsCrossed, label: `Food (${food_logs.length})` },
            { key: 'workouts', icon: Dumbbell,        label: `Workouts (${workout_logs.length})` },
            { key: 'weight',   icon: Scale,           label: `Weight (${weight_logs.length})` },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* Food tab */}
        {tab === 'food' && (
          Object.keys(foodByDate).length === 0 ? (
            <EmptyState icon={UtensilsCrossed} text="No food logged in the last 7 days" />
          ) : (
            <div className="space-y-4">
              {Object.entries(foodByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, logs]) => {
                const totalCal  = logs.reduce((s, l) => s + (l.foods?.calories ?? 0) * (l.quantity_g / 100), 0);
                const totalProt = logs.reduce((s, l) => s + (l.foods?.protein_g ?? 0) * (l.quantity_g / 100), 0);
                return (
                  <div key={date} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{formatDate(date)}</p>
                      <div className="flex gap-3 text-xs">
                        <span className="font-semibold text-orange-600">{Math.round(totalCal)} kcal</span>
                        <span className="text-gray-400">{totalProt.toFixed(1)}g protein</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {logs.map(log => (
                        <div key={log.id} className="px-4 py-2.5 flex items-center gap-3">
                          <span className="text-[10px] font-medium text-slate-400 w-14 shrink-0">
                            {MEAL_LABEL[log.meal_type] ?? log.meal_type}
                          </span>
                          <span className="text-sm text-gray-800 flex-1 truncate">
                            {log.foods?.name ?? 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">{log.quantity_g}g</span>
                          <span className="text-xs font-semibold text-orange-600 shrink-0 w-16 text-right">
                            {log.foods ? Math.round(log.foods.calories * log.quantity_g / 100) : '—'} kcal
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Workouts tab */}
        {tab === 'workouts' && (
          Object.keys(workoutByDate).length === 0 ? (
            <EmptyState icon={Dumbbell} text="No workouts logged in the last 7 days" />
          ) : (
            <div className="space-y-4">
              {Object.entries(workoutByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, logs]) => {
                const totalMin = logs.reduce((s, l) => s + l.duration_min, 0);
                const totalCal = logs.reduce((s, l) => s + (l.calories_burned ?? 0), 0);
                return (
                  <div key={date} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{formatDate(date)}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{totalMin} min</span>
                        {totalCal > 0 && (
                          <span className="font-semibold text-orange-600">{totalCal} kcal</span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {logs.map(log => (
                        <div key={log.id} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{log.activity}</span>
                            <span className="text-xs text-gray-400">{log.duration_min} min</span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{log.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Weight tab */}
        {tab === 'weight' && (
          weight_logs.length === 0 ? (
            <EmptyState icon={Scale} text="No weight entries recorded" />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Weight History</p>
              </div>
              {weight_logs.map((log, i) => {
                const prev = weight_logs[i + 1];
                const diff = prev ? log.weight_kg - prev.weight_kg : null;
                return (
                  <div
                    key={log.id}
                    className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{log.weight_kg} kg</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.logged_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    {diff !== null && (
                      <span
                        className={`text-xs font-bold ${
                          diff < 0 ? 'text-blue-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-14">
      <Icon size={36} className="mx-auto mb-2 text-gray-200" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
