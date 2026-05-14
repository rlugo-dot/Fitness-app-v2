import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Loader2, Shield } from 'lucide-react'

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!email.trim()) return
    setLoading(true)
    try {
      await sendOtp(email.trim().toLowerCase())
      setStep('otp')
      toast.success('OTP sent — check your email')
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP')
    }
    setLoading(false)
  }

  async function handleVerify() {
    if (otp.length < 6) return
    setLoading(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), otp.trim())
    } catch (e: any) {
      toast.error(e.message || 'Invalid OTP')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_8px_40px_rgba(34,197,94,0.45)]">
            <span className="text-white font-bold text-3xl leading-none">P</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Phitness Admin</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center justify-center gap-1.5">
            <Shield size={12} /> Restricted access
          </p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 border border-slate-700/50 shadow-2xl space-y-4">
          {step === 'email' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="your@email.com"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !email.trim()}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Send OTP
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">One-Time Password</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-3.5 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-white text-xl placeholder-slate-600 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center tracking-[0.5em] font-mono transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-2 text-center">Sent to {email}</p>
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Verify & Enter
              </button>
              <button
                onClick={() => { setStep('email'); setOtp('') }}
                className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                ← Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
