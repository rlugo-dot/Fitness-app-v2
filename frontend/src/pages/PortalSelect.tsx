import { Utensils, Stethoscope, ChevronRight } from 'lucide-react';
import type { ProProfile } from '../services/api';

interface Props {
  proProfile: ProProfile;
  onChoose: (portal: 'user' | 'pro') => void;
}

export default function PortalSelect({ proProfile, onChoose }: Props) {
  const firstName = proProfile.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo + greeting */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-600 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_32px_rgba(22,163,74,0.3)]">
            <span
              className="text-white font-bold leading-none"
              style={{ fontSize: 36, fontFamily: "'Sora', system-ui, sans-serif" }}
            >
              P
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-400 mt-1">Where would you like to go?</p>
        </div>

        {/* Portal cards */}
        <div className="space-y-3">
          {/* User Portal */}
          <button
            onClick={() => onChoose('user')}
            className="w-full bg-white rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:shadow-md p-5 text-left transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-500 transition-colors">
                <Utensils
                  size={20}
                  className="text-green-600 group-hover:text-white transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">User Portal</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Track your personal health & nutrition
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 shrink-0 group-hover:text-green-500 transition-colors"
              />
            </div>
          </button>

          {/* Pro Portal */}
          <button
            onClick={() => onChoose('pro')}
            className="w-full bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:shadow-md p-5 text-left transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-800 transition-colors">
                <Stethoscope
                  size={20}
                  className="text-slate-500 group-hover:text-blue-400 transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">Pro Portal</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Manage clients, bookings & sessions
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 shrink-0 group-hover:text-blue-500 transition-colors"
              />
            </div>

            {/* Pro badge */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                style={{ backgroundColor: (proProfile.avatar_color || '#2563eb') + '22' }}
              >
                {proProfile.avatar_emoji}
              </div>
              <span className="text-xs text-gray-400 truncate">
                {proProfile.name} · {proProfile.title}
              </span>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          You can switch portals from within each portal at any time.
        </p>
      </div>
    </div>
  );
}
