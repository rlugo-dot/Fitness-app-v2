import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { getAnalyticsOverview, getWeightLogs } from '../services/api';
import type { AnalyticsOverview, WeightLog } from '../services/api';
import { ChevronLeft, Flame, Dumbbell, TrendingUp, Award } from 'lucide-react';

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'short' });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{shortDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-medium">{Math.round(p.value)}{p.unit ?? ''}</span>
        </p>
      ))}
    </div>
  );
};

export default function Progress() {
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30>(7);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load(range);
  }, [range]);

  async function load(days: number) {
    setLoading(true);
    setError(false);
    try {
      const [data, weights] = await Promise.all([
        getAnalyticsOverview(days),
        getWeightLogs(days),
      ]);
      setOverview(data);
      setWeightLogs(weights.slice(0, days).reverse());
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading progress…</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Failed to load progress data.</p>
          <button onClick={() => load(range)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const data = overview;

  // Workout lookup by date
  const workoutMap = Object.fromEntries(data.workout_days.map((w) => [w.date, w]));

  // Calorie chart data
  const calChartData = data.days.map((d) => ({
    date: d.date,
    eaten: Math.round(d.calories),
    burned: Math.round(workoutMap[d.date]?.calories_burned ?? 0),
    net: Math.max(0, Math.round(d.calories - (workoutMap[d.date]?.calories_burned ?? 0))),
    label: range === 7 ? shortDay(d.date) : shortDate(d.date),
  }));

  // Macro chart data
  const macroChartData = data.days.map((d) => ({
    date: d.date,
    protein: Math.round(d.protein_g),
    carbs: Math.round(d.carbs_g),
    fat: Math.round(d.fat_g),
    label: range === 7 ? shortDay(d.date) : shortDate(d.date),
  }));

  // Weight chart data
  const weightChartData = weightLogs.map((w) => ({
    date: w.logged_at,
    weight: w.weight_kg,
    label: shortDate(w.logged_at),
  }));

  const loggedDays = data.days.filter((d) => d.entries > 0).length;
  const goalHitDays = data.days.filter((d) => d.calories >= data.calorie_goal * 0.9 && d.calories <= data.calorie_goal * 1.1).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Progress</h1>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setRange(7)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${range === 7 ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange(30)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${range === 30 ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Streak + quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🔥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.streak}</p>
              <p className="text-xs text-gray-400">day streak</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.longest_streak}</p>
              <p className="text-xs text-gray-400">best streak</p>
            </div>
          </div>
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Logged', value: `${loggedDays}d`, color: 'text-green-600' },
            { label: 'Avg Cal', value: Math.round(data.avg_calories), color: 'text-gray-900' },
            { label: 'Goal Hit', value: `${goalHitDays}d`, color: 'text-blue-600' },
            { label: 'Workouts', value: data.total_workouts, color: 'text-orange-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center shadow-sm">
              <p className={`text-sm font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Calorie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Calories</p>
              <p className="text-xs text-gray-400">Eaten vs goal (avg {Math.round(data.avg_calories)} kcal)</p>
            </div>
            <Flame size={18} className="text-orange-500" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={calChartData} barGap={2} barSize={range === 7 ? 20 : 8}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, Math.max(data.calorie_goal * 1.2, 500)]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={data.calorie_goal} stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1} />
              <Bar dataKey="net" name="Net Cal" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-3 h-1 bg-green-600 rounded inline-block" /> Net calories
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-3 h-0 border-t-2 border-dashed border-green-600 inline-block" /> Daily goal
            </span>
          </div>
        </div>

        {/* Macro trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900 text-sm">Macros Trend</p>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Avg — P: {Math.round(data.avg_protein_g)}g · C: {Math.round(data.avg_carbs_g)}g · F: {Math.round(data.avg_fat_g)}g
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={macroChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="protein" name="Protein" stroke="#3b82f6" strokeWidth={2} dot={false} unit="g" />
              <Line type="monotone" dataKey="carbs" name="Carbs" stroke="#f59e0b" strokeWidth={2} dot={false} unit="g" />
              <Line type="monotone" dataKey="fat" name="Fat" stroke="#f43f5e" strokeWidth={2} dot={false} unit="g" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-2">
            {[
              { label: 'Protein', color: '#3b82f6' },
              { label: 'Carbs', color: '#f59e0b' },
              { label: 'Fat', color: '#f43f5e' },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Workout stats */}
        {data.total_workouts > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900 text-sm">Workout Activity</p>
              <Dumbbell size={18} className="text-purple-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Sessions', value: data.total_workouts, color: 'text-purple-600' },
                { label: 'Kcal Burned', value: Math.round(data.total_calories_burned), color: 'text-orange-600' },
                { label: 'Avg/Session', value: data.total_workouts ? Math.round(data.total_calories_burned / data.total_workouts) : 0, color: 'text-gray-900' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weight trend */}
        {weightChartData.length === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center py-6">
            <p className="text-sm text-gray-500">⚖️ Log one more weight entry to see your trend chart.</p>
          </div>
        )}
        {weightChartData.length >= 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-900 text-sm">Weight Trend</p>
              <span className="text-lg">⚖️</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-900">{weightChartData[weightChartData.length - 1].weight} kg</span>
              {weightChartData.length >= 2 && (() => {
                const diff = weightChartData[weightChartData.length - 1].weight - weightChartData[0].weight;
                return (
                  <span className={`text-sm font-medium ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                  </span>
                );
              })()}
              <span className="text-xs text-gray-400 ml-auto">last {weightChartData.length} entries</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  hide
                  domain={[
                    (min: number) => Math.floor(min - 1),
                    (max: number) => Math.ceil(max + 1),
                  ]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16a34a' }}
                  unit=" kg"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Empty state */}
        {loggedDays === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No data yet for this period.</p>
            <p className="text-xs mt-1">Start logging meals to see your progress here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
