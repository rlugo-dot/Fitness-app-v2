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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, food_logs, workout_logs, weight_logs } = data;

  // Group food logs by date
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
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {profile?.full_name || 'Client'}
            </h1>
            <p className="text-xs text-gray-400">Last 7 days of data</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Profile summary */}
        {profile && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Client Overview</h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{profile.weight_kg ?? '—'}</p>
                <p className="text-[10px] text-gray-400">kg</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{profile.height_cm ?? '—'}</p>
                <p className="text-[10px] text-gray-400">cm</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{profile.age ?? '—'}</p>
                <p className="text-[10px] text-gray-400">years</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{profile.daily_calorie_goal ?? '—'}</p>
                <p className="text-[10px] text-gray-400">kcal goal</p>
              </div>
            </div>
            {profile.goal && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                <span className="text-xs text-gray-400">Goal:</span>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {GOAL_LABEL[profile.goal] ?? profile.goal}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { key: 'food', icon: UtensilsCrossed, label: `Food (${food_logs.length})` },
            { key: 'workouts', icon: Dumbbell, label: `Workouts (${workout_logs.length})` },
            { key: 'weight', icon: Scale, label: `Weight (${weight_logs.length})` },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Food tab */}
        {tab === 'food' && (
          Object.keys(foodByDate).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No food logged in the last 7 days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(foodByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, logs]) => {
                const totalCal = logs.reduce((s, l) => s + (l.foods?.calories ?? 0) * (l.quantity_g / 100), 0);
                const totalProt = logs.reduce((s, l) => s + (l.foods?.protein_g ?? 0) * (l.quantity_g / 100), 0);
                return (
                  <div key={date} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{formatDate(date)}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="font-medium text-orange-600">{Math.round(totalCal)} kcal</span>
                        <span>{totalProt.toFixed(1)}g protein</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {logs.map(log => (
                        <div key={log.id} className="px-4 py-2.5 flex items-center gap-3">
                          <span className="text-[10px] font-medium text-gray-400 w-14 shrink-0">
                            {MEAL_LABEL[log.meal_type] ?? log.meal_type}
                          </span>
                          <span className="text-sm text-gray-800 flex-1 truncate">
                            {log.foods?.name ?? 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">{log.quantity_g}g</span>
                          <span className="text-xs font-medium text-orange-600 shrink-0 w-16 text-right">
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
            <div className="text-center py-12 text-gray-400">
              <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No workouts in the last 7 days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(workoutByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, logs]) => {
                const totalMin = logs.reduce((s, l) => s + l.duration_min, 0);
                const totalCal = logs.reduce((s, l) => s + (l.calories_burned ?? 0), 0);
                return (
                  <div key={date} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{formatDate(date)}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{totalMin} min</span>
                        {totalCal > 0 && <span className="font-medium text-orange-600">{totalCal} kcal</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {logs.map(log => (
                        <div key={log.id} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{log.activity}</span>
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
            <div className="text-center py-12 text-gray-400">
              <Scale size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No weight entries recorded</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Weight History</p>
              </div>
              {weight_logs.map((log, i) => {
                const prev = weight_logs[i + 1];
                const diff = prev ? log.weight_kg - prev.weight_kg : null;
                return (
                  <div key={log.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{log.weight_kg} kg</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {diff !== null && (
                      <span className={`text-xs font-semibold ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
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
