import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getClientData, updateClientProfile,
  getClientNotes, createClientNote, updateClientNote, deleteClientNote,
  logClientFood, logClientWorkout, logClientWeight,
} from '../services/api';
import type { ClientData, ProNote } from '../services/api';
import {
  ChevronLeft, Loader2, UtensilsCrossed, Dumbbell, Scale,
  Pencil, Plus, X, Trash2, StickyNote, Check,
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'food' | 'workouts' | 'weight' | 'notes';

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};
const GOAL_LABEL: Record<string, string> = {
  lose: 'Lose Weight', maintain: 'Maintain', gain: 'Gain Muscle',
};

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white';
const LABEL = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1';

const todayStr = new Date().toISOString().split('T')[0];

export default function ProClientView() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [data, setData] = useState<ClientData | null>(null);
  const [notes, setNotes] = useState<ProNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('food');

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ weight_kg: '', height_cm: '', age: '', daily_calorie_goal: '', goal: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Log on behalf
  const [showLog, setShowLog] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [foodDraft, setFoodDraft] = useState({
    log_date: todayStr, meal_type: 'lunch', food_name: '',
    quantity: '1', calories: '', protein_g: '0', carbs_g: '0', fat_g: '0',
  });
  const [workoutDraft, setWorkoutDraft] = useState({
    log_date: todayStr, activity: '', duration_min: '30', calories_burned: '', workout_notes: '',
  });
  const [weightDraft, setWeightDraft] = useState({ weight_kg: '', body_fat_pct: '' });

  // Notes
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getClientData(userId), getClientNotes(userId)])
      .then(([d, n]) => {
        setData(d);
        setNotes(n);
        const p = d.profile;
        if (p) setProfileDraft({
          weight_kg: String(p.weight_kg ?? ''),
          height_cm: String(p.height_cm ?? ''),
          age: String(p.age ?? ''),
          daily_calorie_goal: String(p.daily_calorie_goal ?? ''),
          goal: p.goal ?? '',
        });
      })
      .catch(() => {
        toast.error('Failed to load client data');
        navigate('/pro/clients', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  function switchTab(t: Tab) {
    setTab(t);
    setShowLog(false);
    if (t !== 'notes') setShowNoteForm(false);
  }

  // ── Profile save ─────────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!userId) return;
    setSavingProfile(true);
    try {
      const updates: Record<string, number | string> = {};
      if (profileDraft.weight_kg)        updates.weight_kg        = parseFloat(profileDraft.weight_kg);
      if (profileDraft.height_cm)        updates.height_cm        = parseFloat(profileDraft.height_cm);
      if (profileDraft.age)              updates.age              = parseInt(profileDraft.age);
      if (profileDraft.daily_calorie_goal) updates.daily_calorie_goal = parseInt(profileDraft.daily_calorie_goal);
      if (profileDraft.goal)             updates.goal             = profileDraft.goal;
      if (!Object.keys(updates).length) { setEditingProfile(false); return; }
      await updateClientProfile(userId, updates);
      setData(prev => prev ? {
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } as typeof prev.profile : prev.profile,
      } : prev);
      setEditingProfile(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Log food ─────────────────────────────────────────────────────────────────
  async function submitFoodLog() {
    if (!userId || !foodDraft.food_name || !foodDraft.calories) return;
    setSubmittingLog(true);
    try {
      const entry = await logClientFood(userId, {
        log_date: foodDraft.log_date,
        meal_type: foodDraft.meal_type,
        food_name: foodDraft.food_name,
        quantity: parseFloat(foodDraft.quantity) || 1,
        calories: parseFloat(foodDraft.calories),
        protein_g: parseFloat(foodDraft.protein_g) || 0,
        carbs_g: parseFloat(foodDraft.carbs_g) || 0,
        fat_g: parseFloat(foodDraft.fat_g) || 0,
      });
      setData(prev => prev ? { ...prev, food_logs: [entry, ...prev.food_logs] } : prev);
      setFoodDraft({ log_date: todayStr, meal_type: 'lunch', food_name: '', quantity: '1', calories: '', protein_g: '0', carbs_g: '0', fat_g: '0' });
      setShowLog(false);
      toast.success('Food logged');
    } catch {
      toast.error('Failed to log food');
    } finally {
      setSubmittingLog(false);
    }
  }

  // ── Log workout ──────────────────────────────────────────────────────────────
  async function submitWorkoutLog() {
    if (!userId || !workoutDraft.activity || !workoutDraft.duration_min) return;
    setSubmittingLog(true);
    try {
      const entry = await logClientWorkout(userId, {
        log_date: workoutDraft.log_date,
        activity: workoutDraft.activity,
        duration_min: parseInt(workoutDraft.duration_min),
        calories_burned: workoutDraft.calories_burned ? parseFloat(workoutDraft.calories_burned) : undefined,
        notes: workoutDraft.workout_notes || undefined,
      });
      setData(prev => prev ? { ...prev, workout_logs: [entry, ...prev.workout_logs] } : prev);
      setWorkoutDraft({ log_date: todayStr, activity: '', duration_min: '30', calories_burned: '', workout_notes: '' });
      setShowLog(false);
      toast.success('Workout logged');
    } catch {
      toast.error('Failed to log workout');
    } finally {
      setSubmittingLog(false);
    }
  }

  // ── Log weight ───────────────────────────────────────────────────────────────
  async function submitWeightLog() {
    if (!userId || !weightDraft.weight_kg) return;
    setSubmittingLog(true);
    try {
      const entry = await logClientWeight(userId, {
        weight_kg: parseFloat(weightDraft.weight_kg),
        body_fat_pct: weightDraft.body_fat_pct ? parseFloat(weightDraft.body_fat_pct) : undefined,
      });
      setData(prev => prev ? { ...prev, weight_logs: [entry, ...prev.weight_logs] } : prev);
      setWeightDraft({ weight_kg: '', body_fat_pct: '' });
      setShowLog(false);
      toast.success('Weight logged');
    } catch {
      toast.error('Failed to log weight');
    } finally {
      setSubmittingLog(false);
    }
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  async function saveNote() {
    if (!userId || !noteDraft.trim()) return;
    setSavingNote(true);
    try {
      if (noteEditId) {
        const updated = await updateClientNote(userId, noteEditId, noteDraft);
        setNotes(prev => prev.map(n => n.id === noteEditId ? updated : n));
        toast.success('Note updated');
      } else {
        const created = await createClientNote(userId, noteDraft);
        setNotes(prev => [created, ...prev]);
        toast.success('Note added');
      }
      setNoteDraft('');
      setNoteEditId(null);
      setShowNoteForm(false);
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!userId) return;
    try {
      await deleteClientNote(userId, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
      {/* Dark header */}
      <div className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/pro/clients')}
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate">{profile?.full_name || 'Client'}</p>
            <p className="text-slate-400 text-[10px]">Last 7 days of data</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Profile card ─────────────────────────────────────────────────────── */}
        {profile && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Overview</p>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  <Pencil size={12} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingProfile(false)} className="text-xs text-slate-400 hover:text-slate-600">
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-1 text-xs text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1 rounded-lg disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                  </button>
                </div>
              )}
            </div>

            {!editingProfile ? (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: profile.weight_kg, unit: 'kg',   label: 'Weight' },
                    { value: profile.height_cm, unit: 'cm',   label: 'Height' },
                    { value: profile.age,        unit: 'yrs',  label: 'Age'    },
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
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Weight (kg)</label>
                    <input type="number" className={INPUT} value={profileDraft.weight_kg} placeholder="e.g. 70"
                      onChange={e => setProfileDraft(d => ({ ...d, weight_kg: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Height (cm)</label>
                    <input type="number" className={INPUT} value={profileDraft.height_cm} placeholder="e.g. 165"
                      onChange={e => setProfileDraft(d => ({ ...d, height_cm: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Age</label>
                    <input type="number" className={INPUT} value={profileDraft.age} placeholder="e.g. 28"
                      onChange={e => setProfileDraft(d => ({ ...d, age: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Calorie Goal (kcal)</label>
                    <input type="number" className={INPUT} value={profileDraft.daily_calorie_goal} placeholder="e.g. 1800"
                      onChange={e => setProfileDraft(d => ({ ...d, daily_calorie_goal: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Fitness Goal</label>
                  <select className={INPUT} value={profileDraft.goal}
                    onChange={e => setProfileDraft(d => ({ ...d, goal: e.target.value }))}>
                    <option value="">— select —</option>
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain</option>
                    <option value="gain">Gain Muscle</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl">
          {([
            { key: 'food',     icon: UtensilsCrossed, label: `Food (${food_logs.length})`       },
            { key: 'workouts', icon: Dumbbell,        label: `Workouts (${workout_logs.length})` },
            { key: 'weight',   icon: Scale,           label: `Weight (${weight_logs.length})`    },
            { key: 'notes',    icon: StickyNote,      label: `Notes (${notes.length})`           },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        {/* ── Log on behalf (Food / Workouts / Weight) ──────────────────────────── */}
        {tab !== 'notes' && (
          !showLog ? (
            <button
              onClick={() => setShowLog(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              <Plus size={15} /> Log on behalf of client
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-800">
                  Log {tab === 'food' ? 'Food' : tab === 'workouts' ? 'Workout' : 'Weight'}
                </p>
                <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>

              {/* Food form */}
              {tab === 'food' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Date</label>
                      <input type="date" className={INPUT} value={foodDraft.log_date}
                        onChange={e => setFoodDraft(d => ({ ...d, log_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Meal</label>
                      <select className={INPUT} value={foodDraft.meal_type}
                        onChange={e => setFoodDraft(d => ({ ...d, meal_type: e.target.value }))}>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Food Name</label>
                    <input type="text" className={INPUT} value={foodDraft.food_name} placeholder="e.g. Sinangag"
                      onChange={e => setFoodDraft(d => ({ ...d, food_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Quantity / Serving</label>
                      <input type="number" className={INPUT} value={foodDraft.quantity} min="0.1" step="0.1" placeholder="1"
                        onChange={e => setFoodDraft(d => ({ ...d, quantity: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Calories (kcal)</label>
                      <input type="number" className={INPUT} value={foodDraft.calories} placeholder="0"
                        onChange={e => setFoodDraft(d => ({ ...d, calories: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL}>Protein (g)</label>
                      <input type="number" className={INPUT} value={foodDraft.protein_g} placeholder="0"
                        onChange={e => setFoodDraft(d => ({ ...d, protein_g: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Carbs (g)</label>
                      <input type="number" className={INPUT} value={foodDraft.carbs_g} placeholder="0"
                        onChange={e => setFoodDraft(d => ({ ...d, carbs_g: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Fat (g)</label>
                      <input type="number" className={INPUT} value={foodDraft.fat_g} placeholder="0"
                        onChange={e => setFoodDraft(d => ({ ...d, fat_g: e.target.value }))} />
                    </div>
                  </div>
                  <button
                    onClick={submitFoodLog}
                    disabled={submittingLog || !foodDraft.food_name || !foodDraft.calories}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submittingLog && <Loader2 size={15} className="animate-spin" />} Log Food
                  </button>
                </div>
              )}

              {/* Workout form */}
              {tab === 'workouts' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Date</label>
                      <input type="date" className={INPUT} value={workoutDraft.log_date}
                        onChange={e => setWorkoutDraft(d => ({ ...d, log_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Duration (min)</label>
                      <input type="number" className={INPUT} value={workoutDraft.duration_min} placeholder="30"
                        onChange={e => setWorkoutDraft(d => ({ ...d, duration_min: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Activity</label>
                    <input type="text" className={INPUT} value={workoutDraft.activity} placeholder="e.g. Running, Gym, Swimming"
                      onChange={e => setWorkoutDraft(d => ({ ...d, activity: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Calories Burned (optional)</label>
                    <input type="number" className={INPUT} value={workoutDraft.calories_burned} placeholder="0"
                      onChange={e => setWorkoutDraft(d => ({ ...d, calories_burned: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Notes (optional)</label>
                    <input type="text" className={INPUT} value={workoutDraft.workout_notes} placeholder="e.g. Felt strong today"
                      onChange={e => setWorkoutDraft(d => ({ ...d, workout_notes: e.target.value }))} />
                  </div>
                  <button
                    onClick={submitWorkoutLog}
                    disabled={submittingLog || !workoutDraft.activity || !workoutDraft.duration_min}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submittingLog && <Loader2 size={15} className="animate-spin" />} Log Workout
                  </button>
                </div>
              )}

              {/* Weight form */}
              {tab === 'weight' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Weight (kg)</label>
                      <input type="number" className={INPUT} value={weightDraft.weight_kg} placeholder="e.g. 68.5" step="0.1"
                        onChange={e => setWeightDraft(d => ({ ...d, weight_kg: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Body Fat % (optional)</label>
                      <input type="number" className={INPUT} value={weightDraft.body_fat_pct} placeholder="e.g. 22" step="0.1"
                        onChange={e => setWeightDraft(d => ({ ...d, body_fat_pct: e.target.value }))} />
                    </div>
                  </div>
                  <button
                    onClick={submitWeightLog}
                    disabled={submittingLog || !weightDraft.weight_kg}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submittingLog && <Loader2 size={15} className="animate-spin" />} Log Weight
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* ── Food tab ─────────────────────────────────────────────────────────── */}
        {tab === 'food' && (
          Object.keys(foodByDate).length === 0 ? (
            <EmptyState icon={UtensilsCrossed} text="No food logged in the last 7 days" />
          ) : (
            <div className="space-y-4">
              {Object.entries(foodByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, logs]) => {
                const totalCal  = logs.reduce((s, l) => s + (l.calories ?? 0), 0);
                const totalProt = logs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
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
                          <span className="text-sm text-gray-800 flex-1 truncate">{log.food_name ?? 'Unknown'}</span>
                          <span className="text-xs text-gray-400 shrink-0">{log.quantity}×</span>
                          <span className="text-xs font-semibold text-orange-600 shrink-0 w-16 text-right">
                            {Math.round(log.calories ?? 0)} kcal
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

        {/* ── Workouts tab ─────────────────────────────────────────────────────── */}
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
                        {totalCal > 0 && <span className="font-semibold text-orange-600">{totalCal} kcal</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {logs.map(log => (
                        <div key={log.id} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{log.activity}</span>
                            <span className="text-xs text-gray-400">{log.duration_min} min</span>
                          </div>
                          {log.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Weight tab ───────────────────────────────────────────────────────── */}
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
                  <div key={log.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{log.weight_kg} kg</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {diff !== null && (
                      <span className={`text-xs font-bold ${diff < 0 ? 'text-blue-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Notes tab ────────────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <div className="space-y-3">
            {!showNoteForm ? (
              <button
                onClick={() => { setNoteDraft(''); setNoteEditId(null); setShowNoteForm(true); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                <Plus size={15} /> Add session note
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">{noteEditId ? 'Edit Note' : 'New Session Note'}</p>
                  <button onClick={() => { setShowNoteForm(false); setNoteEditId(null); setNoteDraft(''); }} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none bg-white"
                  rows={4}
                  placeholder="Session notes, observations, recommendations…"
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                />
                <button
                  onClick={saveNote}
                  disabled={savingNote || !noteDraft.trim()}
                  className="mt-2 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {savingNote && <Loader2 size={15} className="animate-spin" />}
                  {noteEditId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            )}

            {notes.length === 0 ? (
              <EmptyState icon={StickyNote} text="No session notes yet" />
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 flex-1 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setNoteDraft(note.content); setNoteEditId(note.id); setShowNoteForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(note.created_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                    {note.updated_at !== note.created_at && ' · edited'}
                  </p>
                </div>
              ))
            )}
          </div>
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
