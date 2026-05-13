import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { getProfile } from './services/api';
import type { Profile } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FoodSearch from './pages/FoodSearch';
import ProfilePage from './pages/Profile';
import WorkoutLog from './pages/WorkoutLog';
import Integrations from './pages/Integrations';
import Feed from './pages/Feed';
import Recommendations from './pages/Recommendations';
import GymMap from './pages/GymMap';
import Progress from './pages/Progress';
import Professionals from './pages/Professionals';
import HealthProfile from './pages/HealthProfile';
import ProfessionalSignup from './pages/ProfessionalSignup';
import AdminPanel from './pages/AdminPanel';

const ADMIN_EMAIL = 'richardlyonneuygo@gmail.com';

function SplashScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center select-none">
      {/* Logo */}
      <div className="splash-logo relative mb-7">
        {/* Outer glow ring */}
        <div
          className="absolute -inset-5 rounded-[44px] bg-green-500"
          style={{ animation: 'ringPulse 2.4s ease-in-out infinite' }}
        />
        {/* Inner soft ring */}
        <div className="absolute -inset-2 rounded-[36px] bg-green-100/60" />
        {/* Logo tile */}
        <div className="relative w-24 h-24 bg-green-600 rounded-[28px] flex items-center justify-center shadow-[0_16px_48px_rgba(22,163,74,0.38)]">
          <span
            className="text-white font-bold leading-none"
            style={{ fontSize: 56, fontFamily: "'Sora', system-ui, sans-serif" }}
          >
            P
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="splash-text text-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Phitness</h1>
        <p className="text-sm text-gray-400 mt-1">Filipino Health &amp; Nutrition</p>
      </div>

      {/* Bouncing dots */}
      <div className="splash-dots flex items-center gap-2 mt-12">
        {[0, 160, 320].map((delay, i) => (
          <span
            key={i}
            className="dot-bounce block w-2 h-2 rounded-full bg-green-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { session, loading: authLoading, sendOtp, verifyOtp, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!session) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    setProfileError(false);
    getProfile()
      .then(setProfile)
      .catch(() => setProfileError(true))
      .finally(() => setProfileLoading(false));
  }, [session]);

  // Public route — no auth required (after all hooks)
  if (location.pathname === '/professionals/join') {
    return <ProfessionalSignup />;
  }

  if (authLoading || (session && (profileLoading || (!profile && !profileError)))) {
    return <SplashScreen />;
  }

  if (!session) {
    return <Login onSendOtp={sendOtp} onVerifyOtp={verifyOtp} />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Failed to load profile. Please try again.</p>
          <button onClick={signOut} className="px-4 py-2 bg-gray-100 rounded-lg text-sm active:scale-95 transition-transform">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const needsSetup = profile && !profile.full_name;
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <Layout showNav={!needsSetup}>
      <Routes>
        {needsSetup ? (
          <>
            <Route
              path="/profile"
              element={
                <ProfilePage
                  profile={profile!}
                  onUpdated={setProfile}
                  onSignOut={signOut}
                  isSetup={true}
                />
              }
            />
            <Route path="*" element={<Navigate to="/profile" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard profile={profile!} onSignOut={signOut} />} />
            <Route path="/food-search" element={<FoodSearch />} />
            <Route path="/workouts" element={<WorkoutLog />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/gyms" element={<GymMap />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/health" element={<HealthProfile />} />
            {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
            <Route
              path="/profile"
              element={
                <ProfilePage
                  profile={profile!}
                  onUpdated={setProfile}
                  onSignOut={signOut}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}
