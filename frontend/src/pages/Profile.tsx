import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, sendTestNotification } from '../services/api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import type { Profile } from '../types';
import { ChevronLeft, Save, Bell, BellOff } from 'lucide-react';

interface Props {
  profile: Profile;
  onUpdated: (p: Profile) => void;
  onSignOut: () => void;
  isSetup?: boolean;
}

const GOAL_OPTIONS = [
  { value: 'lose', label: '🔥 Lose Weight', desc: 'Calorie deficit' },
  { value: 'maintain', label: '⚖️ Maintain', desc: 'Stay at current weight' },
  { value: 'gain', label: '💪 Gain Muscle', desc: 'Calorie surplus' },
];

function bmi(weight: number | null, height: number | null): string {
  if (!weight || !height) return '—';
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiLabel(bmiVal: string): { label: string; color: string } {
  const n = parseFloat(bmiVal);
  if (isNaN(n)) return { label: '', color: '' };
  if (n < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (n < 25) return { label: 'Normal', color: 'text-green-600' };
  if (n < 30) return { label: 'Overweight', color: 'text-amber-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

export default function ProfilePage({ profile, onUpdated, onSignOut, isSetup = false }: Props) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [weight, setWeight] = useState(profile.weight_kg?.toString() || '');
  const [height, setHeight] = useState(profile.height_cm?.toString() || '');
  const [goal, setGoal] = useState<Profile['goal']>(profile.goal || 'maintain');
  const [calorieGoal, setCalorieGoal] = useState(profile.daily_calorie_goal?.toString() || '2000');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { isSupported, isIOS, isStandalone, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  // Auto-calculate calorie goal based on goal type
  function suggestCalories() {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) return;
    // Mifflin-St Jeor (assumed male for simplicity — could add gender field later)
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * 1.5); // moderate activity
    const adjusted = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee;
    setCalorieGoal(adjusted.toString());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = await updateProfile({
      full_name: fullName,
      age: age ? parseInt(age) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      height_cm: height ? parseFloat(height) : undefined,
      goal,
      daily_calorie_goal: calorieGoal ? parseInt(calorieGoal) : 2000,
    });
    onUpdated({ ...profile, ...updated });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    if (isSetup) navigate('/');
  }

  const bmiVal = bmi(parseFloat(weight) || null, parseFloat(height) || null);
  const { label: bmiLbl, color: bmiColor } = bmiLabel(bmiVal);

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {!isSetup && (
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900">
            {isSetup ? 'Set Up Your Profile' : 'Profile'}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {isSetup && (
          <p className="text-sm text-gray-500 mb-5">
            Fill in your details so we can personalise your calorie goals.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Basic Info</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Juan dela Cruz"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={10} max={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1" min={30} max={300}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="65"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min={100} max={250}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="170"
                />
              </div>
            </div>

            {bmiVal !== '—' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">BMI:</span>
                <span className="font-semibold text-gray-900">{bmiVal}</span>
                <span className={`font-medium ${bmiColor}`}>{bmiLbl}</span>
              </div>
            )}
          </div>

          {/* Goal */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fitness Goal</h2>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoal(opt.value as Profile['goal'])}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    goal === opt.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calorie Goal */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Daily Calorie Goal</h2>
              <button
                type="button"
                onClick={suggestCalories}
                className="text-xs text-green-600 font-medium hover:text-green-700"
              >
                Auto-calculate
              </button>
            </div>
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              min={1000} max={5000} step={50}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <p className="text-xs text-gray-400">
              Tap "Auto-calculate" after filling in your age, weight, height and goal.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saved ? (
              '✓ Saved!'
            ) : (
              <>
                <Save size={16} />
                {saving ? 'Saving…' : isSetup ? 'Continue to Dashboard' : 'Save Profile'}
              </>
            )}
          </button>

          {isSetup && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          )}

          {!isSetup && (
            <>
              <button
                type="button"
                onClick={() => navigate('/health')}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>🩺</span> Health Conditions & Diet
              </button>
              <button
                type="button"
                onClick={() => navigate('/professionals')}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>👩‍⚕️</span> Find a Professional
              </button>
              <button
                type="button"
                onClick={() => navigate('/integrations')}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>⌚</span> Health Integrations
              </button>
              <button
                type="button"
                onClick={() => navigate('/gyms')}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>🗺️</span> Find Gyms Nearby
              </button>
              {(isSupported || isIOS) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notifications</h2>
                  {isIOS && !isStandalone ? (
                    <div className="flex items-start gap-3">
                      <Bell size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable Meal Reminders</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          To get notifications on iPhone, tap{' '}
                          <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>, then open the app from your home screen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Meal Reminders</p>
                          <p className="text-xs text-gray-400 mt-0.5">Breakfast, lunch & dinner nudges</p>
                        </div>
                        <button
                          type="button"
                          onClick={isSubscribed ? unsubscribe : subscribe}
                          disabled={pushLoading}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                            isSubscribed
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isSubscribed ? <Bell size={14} /> : <BellOff size={14} />}
                          {isSubscribed ? 'On' : 'Off'}
                        </button>
                      </div>
                      {isSubscribed && (
                        <button
                          type="button"
                          onClick={() => sendTestNotification().catch(() => {})}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Send test notification
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
