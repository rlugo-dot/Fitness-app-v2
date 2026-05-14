import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Briefcase, Calendar,
  LogOut, Menu, ChevronRight,
} from 'lucide-react'

const NAV = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { to: '/applications',  label: 'Applications',  icon: FileText,        exact: false },
  { to: '/users',         label: 'Users',         icon: Users,           exact: false },
  { to: '/professionals', label: 'Professionals', icon: Briefcase,       exact: false },
  { to: '/bookings',      label: 'Bookings',      icon: Calendar,        exact: false },
]

export default function Layout({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function active(item: typeof NAV[0]) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(34,197,94,0.4)]">
          P
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Phitness</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-0.5">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const on = active(item)
          return (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                on ? 'bg-green-500/15 text-green-400' : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {on && <ChevronRight size={12} className="text-green-400 shrink-0" />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  const currentPage = NAV.find(n => active(n))?.label ?? 'Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-slate-900 flex-col shrink-0 border-r border-slate-800">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-56 bg-slate-900 flex flex-col border-r border-slate-800">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">P</div>
          <span className="text-white font-semibold text-sm">{currentPage}</span>
        </header>

        {/* Desktop page header bar */}
        <header className="hidden lg:flex items-center px-6 py-3 bg-white border-b border-gray-100 shrink-0">
          <p className="text-xs text-gray-400">
            Phitness Admin <span className="mx-1.5 text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{currentPage}</span>
          </p>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
