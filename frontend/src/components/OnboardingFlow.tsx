import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '👋',
    bg: 'from-green-500 to-emerald-600',
    title: 'Welcome to Phitness!',
    subtitle: 'Your personal health & nutrition companion.',
    body: "We'll guide you through everything — from tracking your meals to monitoring your vitals and connecting with health professionals.",
    tip: null,
  },
  {
    emoji: '🎯',
    bg: 'from-indigo-500 to-violet-600',
    title: 'Start with Your Profile',
    subtitle: 'Tell us about your health goals.',
    body: "Set your daily calorie goal, add any health conditions you have (diabetes, hypertension, etc.), and Phitness will personalise your experience — including food alerts when something you log may not suit your condition.",
    tip: '💡 Tap Profile → Comorbidities & Risk Factors to set this up.',
  },
  {
    emoji: '🍱',
    bg: 'from-orange-400 to-amber-500',
    title: 'Log Every Meal',
    subtitle: 'Track calories, protein, carbs & fat.',
    body: "Tap the green + button at the bottom to log food. Search from thousands of local dishes, scan a product barcode, or use AI Scan — just take a photo of your food and it identifies it for you.",
    tip: '💡 Even snacks count. The more you log, the clearer your picture.',
  },
  {
    emoji: '❤️',
    bg: 'from-rose-400 to-pink-500',
    title: 'Monitor Your Vitals',
    subtitle: 'Blood pressure, glucose, SpO2 & heart rate.',
    body: "Tap the Health tab → Vital Signs Log to record your readings over time. Phitness colour-codes each reading so you can spot trends before they become problems.",
    tip: '💡 Log vitals at the same time each day for the most accurate trends.',
  },
  {
    emoji: '💊',
    bg: 'from-purple-500 to-violet-600',
    title: 'Never Miss a Dose',
    subtitle: 'Medication tracker with daily reminders.',
    body: "Add all your medications under Health → Medications. Each day shows exactly how many doses you've taken vs. how many are needed — with a progress bar and one-tap dose logging.",
    tip: '💡 Set \"As needed\" frequency for supplements like Vitamin C.',
  },
  {
    emoji: '💪',
    bg: 'from-sky-500 to-blue-600',
    title: 'Track Your Workouts',
    subtitle: 'Calories burned + session history.',
    body: "Head to the Workouts tab to log any exercise. Your Today page shows calories burned alongside calories eaten so you can see your true net balance every day.",
    tip: '💡 Even a 30-minute walk burns significant calories — log it!',
  },
  {
    emoji: '👩‍⚕️',
    bg: 'from-teal-500 to-cyan-600',
    title: 'Connect with Professionals',
    subtitle: 'Nutritionists, dietitians & coaches.',
    body: "Health → Find a Professional lets you browse registered nutritionists and dietitians, view their specialties and rates, and book a session directly from the app. Your pro can also view your logs and leave notes.",
    tip: '💡 Booking a pro is the fastest way to get a plan tailored to your conditions.',
  },
  {
    emoji: '📊',
    bg: 'from-green-500 to-teal-500',
    title: 'Watch Your Progress',
    subtitle: 'Charts, trends & weekly summaries.',
    body: "The Progress tab shows your calorie trends, weight history, and workout consistency over time. Keep logging and the charts will tell your story.",
    tip: null,
    cta: true,
  },
];

export const ONBOARDING_KEY = 'phitness_onboarding_v1';

export function shouldShowOnboarding(): boolean {
  try { return !localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
}

export function markOnboardingDone(): void {
  try { localStorage.setItem(ONBOARDING_KEY, Date.now().toString()); } catch { /* ignore */ }
}

interface Props {
  name?: string;
  onDone: () => void;
}

export default function OnboardingFlow({ name, onDone }: Props) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const progress = ((current + 1) / SLIDES.length) * 100;

  function go(delta: 1 | -1) {
    if (exiting) return;
    const next = current + delta;
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(delta);
    setExiting(true);
    setTimeout(() => { setCurrent(next); setExiting(false); }, 200);
  }

  function finish(path?: string) {
    markOnboardingDone();
    onDone();
    if (path) navigate(path);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden">

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-10">
        <div
          className="h-full bg-white/70 transition-all duration-400 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${slide.bg} flex-none flex flex-col items-center justify-center pt-16 pb-10 px-6 relative transition-colors duration-500 min-h-[45vh]`}>
        <button
          onClick={() => finish()}
          className="absolute top-6 right-5 text-white/60 text-sm font-medium hover:text-white transition-colors"
        >
          Skip
        </button>

        <div
          key={`emoji-${current}`}
          className={`text-8xl mb-5 transition-all duration-200 ${exiting ? (direction > 0 ? '-translate-x-10 opacity-0' : 'translate-x-10 opacity-0') : 'translate-x-0 opacity-100'}`}
          style={{ lineHeight: 1 }}
        >
          {slide.emoji}
        </div>

        <div
          key={`heading-${current}`}
          className={`text-center transition-all duration-200 ${exiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            {current === 0 && name ? `Hi ${name.split(' ')[0]}, welcome!` : slide.title}
          </h1>
          <p className="text-white/80 text-sm mt-1.5 font-medium">{slide.subtitle}</p>
        </div>

        {/* Step label */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-5 h-1.5 bg-white' : i < current ? 'w-1.5 h-1.5 bg-white/60' : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-5 pb-8 overflow-y-auto">
        <div
          key={`body-${current}`}
          className={`flex-1 transition-all duration-200 ${exiting ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}
        >
          <p className="text-gray-700 text-base leading-relaxed">{slide.body}</p>

          {slide.tip && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
              <p className="text-sm text-amber-800 leading-snug">{slide.tip}</p>
            </div>
          )}

          {/* Step counter */}
          <p className="text-xs text-gray-300 mt-4 text-center">
            Step {current + 1} of {SLIDES.length}
          </p>
        </div>

        {/* Buttons */}
        {isLast ? (
          <div className="space-y-2.5 mt-4">
            <button
              onClick={() => finish('/food-search')}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-all shadow-lg shadow-green-200"
            >
              🍱 Log My First Meal
            </button>
            <button
              onClick={() => finish('/health-profile')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-all"
            >
              🎯 Set Up My Health Profile
            </button>
            <button
              onClick={() => finish()}
              className="w-full py-2.5 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex gap-3 mt-4">
            {current > 0 && (
              <button
                onClick={() => go(-1)}
                className="flex-none w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all text-lg"
              >
                ←
              </button>
            )}
            <button
              onClick={() => go(1)}
              className="flex-1 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
