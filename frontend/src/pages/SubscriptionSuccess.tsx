import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscription } from '../services/api';
import type { SubscriptionStatus } from '../services/api';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    getSubscription().then(setSub).catch(() => {});
    const timer = setTimeout(() => navigate('/professionals'), 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const expiresAt = sub?.expires_at
    ? new Date(sub.expires_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="page-enter min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
        <CheckCircle2 size={44} className="text-green-500" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-green-500" />
        <span className="text-green-600 text-xs font-semibold uppercase tracking-widest">Phitness Pro</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're subscribed!</h1>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        You now have unlimited access to book any verified health professional on Phitness.
      </p>

      {expiresAt && (
        <p className="mt-4 text-xs text-gray-400">
          Access valid until <span className="font-semibold text-gray-600">{expiresAt}</span>
        </p>
      )}

      <button
        onClick={() => navigate('/professionals')}
        className="mt-8 flex items-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 transition-all active:scale-95"
      >
        Explore Professionals <ArrowRight size={16} />
      </button>

      <p className="mt-6 text-xs text-gray-400">Redirecting automatically in a few seconds…</p>
    </div>
  );
}
