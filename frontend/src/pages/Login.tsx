import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Leaf, Mail, ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  onSendOtp: (email: string) => Promise<{ error: { message: string } | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: { message: string } | null }>;
}

export default function Login({ onSendOtp, onVerifyOtp }: Props) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    const { error: err } = await onSendOtp(email.trim());
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp');
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function handleVerifyOtp(token: string) {
    setError('');
    setLoading(true);
    const { error: err } = await onVerifyOtp(email.trim(), token);
    setLoading(false);
    if (err) {
      setError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }

  function handleOtpInput(index: number, value: string) {
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...otp];
      digits.forEach((d, i) => { if (i < 6) next[i] = d; });
      setOtp(next);
      if (digits.length === 6) handleVerifyOtp(digits.join(''));
      else inputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '');
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(Boolean)) handleVerifyOtp(next.join(''));
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    const { error: err } = await onSendOtp(email.trim());
    setLoading(false);
    if (err) { setError(err.message); return; }
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  return (
    <div className="page-enter min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Leaf className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nutrisyon</h1>
          <p className="text-gray-500 mt-1 text-sm">Filipino Health & Nutrition Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 'email' ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Sign in</h2>
                <p className="text-sm text-gray-400 mt-0.5">We'll send a 6-digit code to your email</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="juan@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending…' : <><ArrowRight size={16} /> Send Code</>}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                New? Just enter your email — we'll create your account automatically.
              </p>
            </>
          ) : (
            <>
              <div className="mb-5">
                <button onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']); }} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
                  ← Back
                </button>
                <h2 className="text-lg font-bold text-gray-900">Enter your code</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Sent to <span className="font-medium text-gray-600">{email}</span>
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-colors disabled:opacity-50 bg-gray-50"
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-3">{error}</div>
              )}

              {loading && (
                <p className="text-center text-sm text-gray-400 mb-3">Verifying…</p>
              )}

              <div className="flex items-center justify-center gap-1 text-sm">
                <span className="text-gray-400">Didn't get it?</span>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="font-medium text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
