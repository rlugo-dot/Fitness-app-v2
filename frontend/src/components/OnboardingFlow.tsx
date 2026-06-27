import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '👋',
    bg: 'from-green-400 to-emerald-500',
    title: "Welcome to Phitness!",
    subtitle: "Your personal health & nutrition companion.",
    body: "In just a few seconds we'll show you around so you can hit the ground running.",
    tip: null,
  },
  {
    emoji: '🍱',
    bg: 'from-orange-400 to-amber-500',
    title: "Log What You Eat",
    subtitle: "Hit your calorie & macro goals every day.",
    body: "Tap the big green + button at the bottom to search local Filipino dishes, scan a barcode, or even use AI to identify food from a photo.",
    tip: '💡 Log breakfast first — it sets the tone for the rest of the day.',
  },
  {
    emoji: '💧',
    bg: 'from-sky-400 to-blue-500',
    title: "Track Your Hydration",
    subtitle: "Small habit, big impact.",
    body: "Your Today page has a water tracker. Tap the + glass to log each cup. Aim for 8 glasses daily and watch your streak grow.",
    tip: '💡 Keep a glass of water at your desk as a reminder.',
  },
  {
    emoji: '💪',
    bg: 'from-violet-500 to-purple-600',
    title: "Log Your Workouts",
    subtitle: "See calories burned alongside calories eaten.",
    body: "Head to the Workouts tab to record any exercise — cardio, strength, or yoga. Your Progress page will show the full picture.",
    tip: '💡 Even a 20-minute walk counts — log everything!',
  },
  {
    emoji: '❤️',
    bg: 'from-rose-400 to-pink-500',
    title: "Health Center",
    subtitle: "More than just calories.",
    body: "Tap the Health tab in the nav bar to track vital signs, manage daily medications, and connect with registered nutritionists and dietitians.",
    tip: '💡 Add your health conditions to get personalised food alerts.',
  },
  {
    emoji: '🚀',
    bg: 'from-green-500 to-teal-500',
    title: "You're All Set!",
    subtitle: "Let's start your health journey.",
    body: "Log your first meal today and check your Progress page after a week — you'll be amazed at what consistency looks like.",
    tip: null,
    cta: true,
  },
];

const STORAGE_KEY = 'phitness_onboarding_v1';

export function shouldShowOnboarding(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch { /* ignore */ }
}

interface Props {
  name?: string;
  onDone: () => void;
}

export default function OnboardingFlow({ name, onDone }: Props) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  function go(delta: number) {
    if (animating) return;
    const next = current + delta;
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(delta > 0 ? 'forward' : 'back');
    setAnimating(true);
    setTimeout(() => {
      setCurrent(next);
      setAnimating(false);
    }, 220);
  }

  function finish(path?: string) {
    markOnboardingDone();
    onDone();
    if (path) navigate(path);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">

      {/* Coloured hero area */}
      <div className={`bg-gradient-to-br ${slide.bg} flex-none flex flex-col items-center justify-center pt-16 pb-10 px-6 transition-colors duration-500`}>
        {/* Skip */}
        <button
          onClick={() => finish()}
          className="absolute top-5 right-5 text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          Skip
        </button>

        {/* Animated emoji */}
        <div
          key={current}
          className={`text-8xl mb-4 transition-all duration-200 ${
            animating
              ? direction === 'forward' ? '-translate-x-8 opacity-0' : 'translate-x-8 opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
          style={{ lineHeight: 1 }}
        >
          {slide.emoji}
        </div>

        <div
          key={`title-${current}`}
          className={`text-center transition-all duration-200 ${
            animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            {current === 0 && name ? `Welcome, ${name.split(' ')[0]}!` : slide.title}
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium">{slide.subtitle}</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8 overflow-y-auto">
        <div
          key={`body-${current}`}
          className={`flex-1 transition-all duration-200 ${
            animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-gray-700 text-base leading-relaxed">{slide.body}</p>

          {slide.tip && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <p className="text-sm text-amber-800 leading-snug">{slide.tip}</p>
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6 mb-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 'forward' : 'back'); setCurrent(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-green-500' : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* CTA buttons */}
        {isLast ? (
          <div className="space-y-2">
            <button
              onClick={() => finish('/food-search')}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-all shadow-lg shadow-green-200"
            >
              🍱 Log My First Meal
            </button>
            <button
              onClick={() => finish()}
              className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => go(-1)}
                className="flex-none w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
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
