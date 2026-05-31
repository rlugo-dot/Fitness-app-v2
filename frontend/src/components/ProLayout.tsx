import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, UserCircle, LogOut } from 'lucide-react';

const PRO_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/pro',          exact: true  },
  { icon: CalendarDays,    label: 'Schedule',  to: '/pro/calendar', exact: false },
  { icon: Users,           label: 'Clients',   to: '/pro/clients',  exact: false },
  { icon: UserCircle,      label: 'Profile',   to: '/pro/profile',  exact: false },
];

export default function ProLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Client detail page manages its own header (back button + client name)
  const isClientDetail = location.pathname.startsWith('/pro/client/');

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to;
    if (to === '/pro/clients') {
      return (
        location.pathname.startsWith('/pro/clients') ||
        location.pathname.startsWith('/pro/client/')
      );
    }
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared pro header — hidden on client detail so it can use its own */}
      {!isClientDetail && (
        <div className="bg-slate-900 sticky top-0 z-20">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm leading-none">P</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Phitness Pro</p>
              <p className="text-slate-400 text-[10px] leading-tight">Professional Portal</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut size={12} />
              Exit
            </button>
          </div>
        </div>
      )}

      <div className="pb-[68px]"><Outlet /></div>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-lg mx-auto flex">
          {PRO_NAV.map(({ icon: Icon, label, to, exact }) => {
            const active = isActive(to, exact);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all active:scale-95"
              >
                <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-blue-500/20' : ''}`}>
                  <Icon
                    size={20}
                    className={`transition-colors ${active ? 'text-blue-400' : 'text-slate-500'}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${active ? 'text-blue-400' : 'text-slate-500'}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
