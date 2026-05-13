import { useLocation, useNavigate } from 'react-router-dom';
import { Utensils, TrendingUp, Plus, Dumbbell, Users } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV = [
  { icon: Utensils,   label: 'Today',    to: '/',          exact: true },
  { icon: TrendingUp, label: 'Progress', to: '/progress',  exact: false },
  { icon: Plus,       label: 'Log',      to: '/food-search', exact: false, center: true },
  { icon: Dumbbell,   label: 'Workouts', to: '/workouts',  exact: false },
  { icon: Users,      label: 'Feed',     to: '/feed',      exact: false },
];

function ProfileIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

interface Props {
  children: ReactNode;
  showNav?: boolean;
}

export default function Layout({ children, showNav = true }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(to: string, exact: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to);
  }

  const profileActive = location.pathname === '/profile';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={showNav ? 'pb-20' : ''}>{children}</div>

      {showNav && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100">
          <div className="max-w-lg mx-auto flex items-end">
            {NAV.map(({ icon: Icon, label, to, exact, center }) => {
              const active = isActive(to, exact);
              if (center) {
                return (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="flex-1 flex flex-col items-center pb-3 pt-1 -mt-3 active:scale-95 transition-transform duration-100"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                      active
                        ? 'bg-green-700 scale-105'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-medium mt-1 transition-colors ${active ? 'text-green-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="flex-1 py-2 flex flex-col items-center gap-0.5 active:scale-90 transition-transform duration-100"
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-green-50' : ''}`}>
                    <Icon
                      size={20}
                      className={`transition-colors duration-200 ${active ? 'text-green-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* Profile tab */}
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-2 flex flex-col items-center gap-0.5 active:scale-90 transition-transform duration-100"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${profileActive ? 'bg-green-50' : ''}`}>
                <span className={`transition-colors duration-200 ${profileActive ? 'text-green-600' : 'text-gray-400'}`}>
                  <ProfileIcon />
                </span>
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${profileActive ? 'text-green-600' : 'text-gray-400'}`}>
                Profile
              </span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
