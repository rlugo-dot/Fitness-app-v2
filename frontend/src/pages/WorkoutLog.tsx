import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkouts, logWorkout, deleteWorkout } from '../services/api';
import type { WorkoutLog, WorkoutType, Exercise } from '../types';
import { ChevronLeft, Plus, Trash2, Flame, Clock, Dumbbell, MapPin } from 'lucide-react';

const WORKOUT_TYPES: { value: WorkoutType; label: string; emoji: string; color: string }[] = [
  { value: 'weights',  label: 'Weights',   emoji: '🏋️', color: 'bg-blue-50 border-blue-300 text-blue-700' },
  { value: 'cardio',   label: 'Cardio',    emoji: '🏃', color: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'bjj_mma',  label: 'BJJ / MMA', emoji: '🥋', color: 'bg-red-50 border-red-300 text-red-700' },
  { value: 'other',    label: 'Other',     emoji: '⚡', color: 'bg-purple-50 border-purple-300 text-purple-700' },
];

const PRESET_EXERCISES: Record<WorkoutType, string[]> = {
  weights: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Dumbbell Curl', 'Tricep Pushdown'],
  cardio:  ['Running', 'Cycling', 'Jump Rope', 'Swimming', 'Elliptical', 'Stair Climber'],
  bjj_mma: ['Drilling', 'Sparring', 'Pad Work', 'Shadow Boxing', 'Grappling', 'Takedown Practice'],
  other:   ['Yoga', 'Stretching', 'Calisthenics', 'HIIT', 'Circuit Training'],
};

const emptyExercise = (): Exercise => ({ name: '', sets: undefined, reps: undefined, weight_kg: undefined });

export default function WorkoutLog() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [type, setType] = useState<WorkoutType>('weights');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      setWorkouts(await getWorkouts(date));
    } catch {
      setWorkouts([]);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);

  // Auto-set workout name when type changes
  useEffect(() => {
    const t = WORKOUT_TYPES.find(t => t.value === type);
    if (t) setName(t.label + ' Session');
  }, [type]);

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()]);
  }

  function updateExercise(i: number, field: keyof Exercise, value: string) {
    setExercises(prev => prev.map((ex, idx) =>
      idx === i ? { ...ex, [field]: value === '' ? undefined : (field === 'name' ? value : Number(value)) } : ex
    ));
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  }

  function resetForm() {
    setType('weights');
    setName('');
    setDuration('');
    setExercises([emptyExercise()]);
    setShareToFeed(false);
    setCaption('');
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!duration || parseInt(duration) <= 0) return;
    setSaving(true);
    try {
      const validExercises = exercises.filter(e => e.name.trim());
      await logWorkout({
        workout_type: type,
        name: name || WORKOUT_TYPES.find(t => t.value === type)!.label,
        duration_min: parseInt(duration),
        exercises: validExercises,
        log_date: date,
        is_shared: shareToFeed,
        caption: shareToFeed && caption.trim() ? caption.trim() : undefined,
      });
      resetForm();
      loadWorkouts();
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteWorkout(id);
      loadWorkouts();
    } catch {}
  }

  const totalCalories = workouts.reduce((s, w) => s + w.calories_burned, 0);
  const totalMinutes = workouts.reduce((s, w) => s + w.duration_min, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Workout Log</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/gyms')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 font-medium px-2 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            >
              <MapPin size={14} /> Gyms
            </button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Summary strip */}
        {workouts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <Flame className="mx-auto text-orange-500 mb-1" size={18} />
              <p className="text-lg font-bold text-gray-900">{totalCalories}</p>
              <p className="text-[10px] text-gray-500">kcal burned</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Clock className="mx-auto text-blue-500 mb-1" size={18} />
              <p className="text-lg font-bold text-gray-900">{totalMinutes}</p>
              <p className="text-[10px] text-gray-500">minutes</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <Dumbbell className="mx-auto text-purple-500 mb-1" size={18} />
              <p className="text-lg font-bold text-gray-900">{workouts.length}</p>
              <p className="text-[10px] text-gray-500">session{workouts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Log Workout button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} /> Log Workout
          </button>
        )}

        {/* Add Workout Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">New Workout</h2>

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-2">
              {WORKOUT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    type === t.value ? t.color + ' border-2' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{t.emoji}</div>
                  <div className="text-[10px] font-medium mt-0.5 text-gray-700">{t.label}</div>
                </button>
              ))}
            </div>

            {/* Name + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Push Day"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  min={1} max={300}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="60"
                />
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Exercises (optional)</label>
                <button onClick={addExercise} className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>

              {/* Preset chips */}
              <div className="flex gap-1.5 flex-wrap mb-2">
                {PRESET_EXERCISES[type].slice(0, 5).map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      const empty = exercises.findIndex(e => !e.name.trim());
                      if (empty >= 0) {
                        updateExercise(empty, 'name', preset);
                      } else {
                        setExercises(prev => [...prev, { name: preset }]);
                      }
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 rounded-full text-[10px] font-medium transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={ex.name}
                      onChange={e => updateExercise(i, 'name', e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {type === 'weights' && (
                      <>
                        <input
                          type="number"
                          value={ex.sets ?? ''}
                          onChange={e => updateExercise(i, 'sets', e.target.value)}
                          placeholder="Sets"
                          className="w-14 px-2 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                        <input
                          type="number"
                          value={ex.reps ?? ''}
                          onChange={e => updateExercise(i, 'reps', e.target.value)}
                          placeholder="Reps"
                          className="w-14 px-2 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                        <input
                          type="number"
                          value={ex.weight_kg ?? ''}
                          onChange={e => updateExercise(i, 'weight_kg', e.target.value)}
                          placeholder="kg"
                          className="w-14 px-2 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                      </>
                    )}
                    {type === 'cardio' && (
                      <>
                        <input
                          type="number"
                          value={ex.duration_min ?? ''}
                          onChange={e => updateExercise(i, 'duration_min', e.target.value)}
                          placeholder="min"
                          className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                        <input
                          type="number"
                          value={ex.distance_km ?? ''}
                          onChange={e => updateExercise(i, 'distance_km', e.target.value)}
                          placeholder="km"
                          className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                      </>
                    )}
                    <button onClick={() => removeExercise(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Share to feed toggle */}
            <div className="border border-gray-100 rounded-xl p-3 space-y-2">
              <button
                type="button"
                onClick={() => setShareToFeed(v => !v)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📣</span>
                  <span className="text-sm font-medium text-gray-700">Share to feed</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${shareToFeed ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${shareToFeed ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>
              {shareToFeed && (
                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption… (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !duration}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : shareToFeed ? 'Save & Share' : 'Save Workout'}
              </button>
            </div>
          </div>
        )}

        {/* Workout list */}
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : workouts.length === 0 && !showForm ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-sm">No workouts logged yet.</p>
            <p className="text-xs mt-1">Tap "Log Workout" to add one.</p>
          </div>
        ) : (
          workouts.map(w => {
            const typeInfo = WORKOUT_TYPES.find(t => t.value === w.workout_type);
            return (
              <div key={w.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeInfo?.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{w.name}</p>
                      <p className="text-xs text-gray-400">{w.duration_min} min · {w.calories_burned} kcal burned</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(w.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                {w.exercises.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {w.exercises.map((ex, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-700">{ex.name}</span>
                        <span className="text-xs text-gray-400">
                          {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}${ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''}` : ''}
                          {ex.duration_min ? `${ex.duration_min} min` : ''}
                          {ex.distance_km ? ` · ${ex.distance_km}km` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
