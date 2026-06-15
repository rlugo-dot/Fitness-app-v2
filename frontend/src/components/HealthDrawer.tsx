import { useNavigate } from 'react-router-dom';
import { X, Stethoscope, Activity, Pill, Users, UserPlus, Watch } from 'lucide-react';

const ITEMS = [
  {
    icon: Stethoscope,
    label: 'Comorbidities & Risk Factors',
    sub: 'Manage health conditions',
    to: '/health-profile',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Activity,
    label: 'Vital Signs Log',
    sub: 'Blood pressure, glucose, SpO2',
    to: '/vitals',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Pill,
    label: 'Medications',
    sub: 'Track daily doses',
    to: '/medications',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Users,
    label: 'Find a Professional',
    sub: 'Nutritionists, dietitians & coaches',
    to: '/professionals',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: UserPlus,
    label: 'Join as a Professional',
    sub: 'Apply to become a pro',
    to: '/professional-signup',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Watch,
    label: 'Health Integrations',
    sub: 'Connect wearables & apps',
    to: '/integrations',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HealthDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();

  function go(to: string) {
    onClose();
    navigate(to);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full z-50 w-[82vw] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Health Center</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track, manage & connect</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {ITEMS.map(({ icon: Icon, label, sub, to, color, bg }) => (
            <button
              key={to}
              onClick={() => go(to)}
              className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <p className="text-[10px] text-gray-300 text-center">Phitness Health Center</p>
        </div>
      </div>
    </>
  );
}
