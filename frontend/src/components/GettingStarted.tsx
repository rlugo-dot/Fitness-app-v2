import { useNavigate } from 'react-router-dom';

const DISMISSED_KEY = 'phitness_checklist_dismissed';
const FIRST_MEAL_KEY = 'phitness_first_meal';
const FIRST_WORKOUT_KEY = 'phitness_first_workout';
const FIRST_VITALS_KEY = 'phitness_first_vitals';

export function markFirstMeal()   { try { localStorage.setItem(FIRST_MEAL_KEY, '1'); } catch { /* ignore */ } }
export function markFirstWorkout(){ try { localStorage.setItem(FIRST_WORKOUT_KEY, '1'); } catch { /* ignore */ } }
export function markFirstVitals() { try { localStorage.setItem(FIRST_VITALS_KEY, '1'); } catch { /* ignore */ } }

function flag(key: string): boolean {
  try { return !!localStorage.getItem(key); } catch { return false; }
}

export function shouldShowChecklist(): boolean {
  try { return !localStorage.getItem(DISMISSED_KEY); } catch { return false; }
}

interface Task {
  id: string;
  icon: string;
  label: string;
  detail: string;
  done: boolean;
  to: string;
}

interface Props {
  calorieGoalSet: boolean;
  conditionsSet: boolean;
  mealLogged: boolean;
  workoutLogged: boolean;
  vitalsLogged: boolean;
  waterTracked: boolean;
  onDismiss: () => void;
}

export default function GettingStarted({
  calorieGoalSet,
  conditionsSet,
  mealLogged,
  workoutLogged,
  vitalsLogged,
  waterTracked,
  onDismiss,
}: Props) {
  const navigate = useNavigate();

  const tasks: Task[] = [
    {
      id: 'goal',
      icon: '🎯',
      label: 'Set your daily calorie goal',
      detail: 'Personalise your nutrition targets',
      done: calorieGoalSet,
      to: '/profile',
    },
    {
      id: 'conditions',
      icon: '🏥',
      label: 'Add your health conditions',
      detail: 'Get personalised food alerts',
      done: conditionsSet,
      to: '/health-profile',
    },
    {
      id: 'meal',
      icon: '🍱',
      label: 'Log your first meal',
      detail: 'Start tracking calories & macros',
      done: mealLogged || flag(FIRST_MEAL_KEY),
      to: '/food-search',
    },
    {
      id: 'water',
      icon: '💧',
      label: 'Track your water intake',
      detail: 'Aim for 8 glasses today',
      done: waterTracked,
      to: '/',
    },
    {
      id: 'workout',
      icon: '💪',
      label: 'Log your first workout',
      detail: 'See calories burned vs. eaten',
      done: workoutLogged || flag(FIRST_WORKOUT_KEY),
      to: '/workouts',
    },
    {
      id: 'vitals',
      icon: '❤️',
      label: 'Log your vital signs',
      detail: 'Blood pressure, glucose or SpO2',
      done: vitalsLogged || flag(FIRST_VITALS_KEY),
      to: '/vitals',
    },
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = doneCount === tasks.length;
  const pct = Math.round((doneCount / tasks.length) * 100);

  function handleDismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
    onDismiss();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {allDone ? '🎉 All set! You\'re ready to go.' : 'Getting Started'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allDone
                ? 'You\'ve completed your health profile setup.'
                : `${doneCount} of ${tasks.length} tasks done — keep going!`}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-300 hover:text-gray-500 shrink-0 mt-0.5 transition-colors"
          >
            {allDone ? 'Dismiss' : 'Hide'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-300 mt-1 text-right">{pct}% complete</p>
      </div>

      {/* Task list */}
      <div className="divide-y divide-gray-50">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => !task.done && navigate(task.to)}
            disabled={task.done}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              task.done ? 'opacity-60 cursor-default' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            {/* Circle check */}
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              task.done
                ? 'bg-green-500 border-green-500'
                : 'border-gray-200'
            }`}>
              {task.done
                ? <span className="text-white text-xs font-bold">✓</span>
                : <span className="text-sm">{task.icon}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.label}
              </p>
              {!task.done && (
                <p className="text-xs text-gray-400 mt-0.5">{task.detail}</p>
              )}
            </div>

            {!task.done && (
              <span className="text-gray-300 text-sm shrink-0">→</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
