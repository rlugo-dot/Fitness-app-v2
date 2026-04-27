import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { getProfile } from './services/api';
import type { Profile } from './types';
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

function AppContent() {
  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (!session) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    setProfileError(false);
    getProfile()
      .then(setProfile)
      .catch(() => setProfileError(true))
      .finally(() => setProfileLoading(false));
  }, [session]);

  if (authLoading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-gray-500 text-sm">Loading Nutrisyon…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={signIn} onSignUp={signUp} />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Failed to load profile. Please try again.</p>
          <button onClick={signOut} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const needsSetup = profile && (!profile.height_cm || !profile.weight_kg);

  return (
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
