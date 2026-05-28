import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, UserCircle } from 'lucide-react';
import type { ReactNode } from 'react';

const PRO_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/pro',          exact: true  },
  { icon: CalendarDays,    label: 'Schedule',  to: '/pro/calendar', exact: false },
  { icon: Users,           label: 'Clients',   to: '/pro/clients',  exact: false },
  { icon: UserCircle,      label: 'Profile',   to: '/pro/profile',  exact: false },
];

export default function ProLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to;
    // /pro/client/:id should highlight the Clients tab
    if (to === '/pro/clients') {
      return location.pathname.startsWith('/pro/clients') || location.pathname.startsWith('/pro/client/');
    }
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pb-[68px]">{children}</div>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800">
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
