import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import Users from './pages/Users'
import Professionals from './pages/Professionals'
import Bookings from './pages/Bookings'

function AppContent() {
  const { session, loading, isAdmin, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_32px_rgba(34,197,94,0.35)]">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <p className="text-slate-500 text-sm animate-pulse">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-white font-bold text-lg mb-1">Access Denied</p>
          <p className="text-slate-400 text-sm mb-6">This portal is restricted to Phitness administrators.</p>
          <button onClick={signOut} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout onSignOut={signOut}>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/applications"  element={<Applications />} />
        <Route path="/users"         element={<Users />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/bookings"      element={<Bookings />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}
