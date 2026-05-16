import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckout } from '../services/api';
import { ChevronLeft, Check, Loader2, Sparkles, ShieldCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const PERKS = [
  { icon: '🩺', title: 'Unlimited bookings', desc: 'Book any verified health professional anytime' },
  { icon: '🥗', title: 'Registered nutritionists', desc: 'RNDs, dietitians, and clinical nutritionists' },
  { icon: '💪', title: 'Certified coaches', desc: 'Personal trainers, strength coaches, yoga instructors' },
  { icon: '🧠', title: 'Mental wellness pros', desc: 'Registered psychologists and counselors' },
  { icon: '🏥', title: 'Medical specialists', desc: 'Doctors, physical therapists, and allied health' },
  { icon: '⚡', title: 'Priority support', desc: 'Faster responses and dedicated help' },
];

export default function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { checkout_url } = await createCheckout();
      window.location.href = checkout_url;
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Could not start checkout. Try again.';
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Phitness Pro</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero card */}
        <div className="relative bg-green-600 rounded-3xl p-6 overflow-hidden text-white shadow-xl shadow-green-200">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-green-500 rounded-full opacity-40" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-green-700 rounded-full opacity-30" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-green-200" />
              <span className="text-green-100 text-xs font-semibold uppercase tracking-widest">Phitness Pro</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-1">
              ₱299
              <span className="text-green-200 text-base font-normal ml-1">/ month</span>
            </h2>
            <p className="text-green-100 text-sm">30-day access · Cancel anytime</p>

            <div className="mt-5 flex gap-4 text-xs text-green-100">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Verified professionals</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> 30-day access</span>
            </div>
          </div>
        </div>

        {/* Perks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">What's included</p>
          </div>
          <div className="divide-y divide-gray-50">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-xl shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                </div>
                <Check size={14} className="text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pay with</p>
          <div className="flex flex-wrap gap-2">
            {['GCash', 'Maya', 'GrabPay', 'Credit Card', 'Debit Card'].map((m) => (
              <span key={m} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600">
                {m}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
            <ShieldCheck size={10} className="text-green-500" />
            Secured by PayMongo · PCI-DSS compliant
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 pb-4">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-green-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Redirecting to payment…</>
            ) : (
              <>Subscribe for ₱299</>
            )}
          </button>
          <p className="text-center text-xs text-gray-400">
            You'll be redirected to PayMongo's secure checkout. <br />
            By subscribing you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
