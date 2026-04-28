import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getIntegrationStatus,
  connectIntegration,
  disconnectIntegration,
  getWeightLogs,
  logWeight,
  deleteWeightLog,
  getOuraToday,
} from '../services/api';
import type { IntegrationStatus, WeightLog, OuraDaily } from '../services/api';
import { ChevronLeft, Plus, Trash2, Link, Unlink, Scale, Moon, Activity, Heart } from 'lucide-react';
import { toast } from 'sonner';

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28;
  const stroke = 5;
  const norm = r - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const pct = score / 100;
  const offset = circ - pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg height={r * 2} width={r * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={norm} cx={r} cy={r} />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={norm}
            cx={r}
            cy={r}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

// ─── Weight Chart (simple SVG sparkline) ─────────────────────────────────────
function WeightSparkline({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return null;
  const weights = [...logs].reverse().map((l) => l.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const w = 280;
  const h = 60;
  const points = weights
    .map((v, i) => {
      const x = (i / (weights.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="w-full">
      <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
      {weights.map((v, i) => {
        const x = (i / (weights.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 10) - 5;
        return <circle key={i} cx={x} cy={y} r="3" fill="#16a34a" />;
      })}
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Integrations() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [ouraData, setOuraData] = useState<OuraDaily | null>(null);

  // Connect modal state
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Weight log form
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [s, w] = await Promise.all([getIntegrationStatus(), getWeightLogs(30)]);
      setStatuses(s);
      setWeightLogs(w);

      const ouraConnected = s.find((x) => x.provider === 'oura' && x.connected);
      if (ouraConnected) {
        try {
          const data = await getOuraToday();
          setOuraData(data);
        } catch {
          // No data for today yet
        }
      }
    } catch {
      toast.error('Failed to load integrations');
    }
  }

  const getStatus = (provider: string) => statuses.find((s) => s.provider === provider);

  async function handleConnect() {
    if (!connectingProvider || !tokenInput.trim()) return;
    setConnecting(true);
    try {
      await connectIntegration(connectingProvider, tokenInput.trim());
      toast.success(`${connectingProvider.charAt(0).toUpperCase() + connectingProvider.slice(1)} connected!`);
      setConnectingProvider(null);
      setTokenInput('');
      await loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to connect');
    }
    setConnecting(false);
  }

  async function handleDisconnect(provider: string) {
    await disconnectIntegration(provider);
    toast.success('Disconnected');
    setStatuses((prev) => prev.map((s) => (s.provider === provider ? { ...s, connected: false, connected_at: null } : s)));
    if (provider === 'oura') setOuraData(null);
  }

  async function handleLogWeight() {
    const kg = parseFloat(weightInput);
    if (!kg || kg < 20 || kg > 300) {
      toast.error('Enter a valid weight (20–300 kg)');
      return;
    }
    setLoggingWeight(true);
    try {
      await logWeight({
        weight_kg: kg,
        body_fat_pct: bodyFatInput ? parseFloat(bodyFatInput) : undefined,
      });
      toast.success('Weight logged!');
      setShowWeightForm(false);
      setWeightInput('');
      setBodyFatInput('');
      const updated = await getWeightLogs(30);
      setWeightLogs(updated);
    } catch {
      toast.error('Failed to log weight');
    }
    setLoggingWeight(false);
  }

  async function handleDeleteWeight(id: string) {
    await deleteWeightLog(id);
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const latestWeight = weightLogs[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Health Integrations</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* ── Oura Ring ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-lg">
                  💍
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Oura Ring</p>
                  <p className="text-xs text-gray-400">Sleep · Readiness · HRV</p>
                </div>
              </div>
              {getStatus('oura')?.connected ? (
                <button
                  onClick={() => handleDisconnect('oura')}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  <Unlink size={13} /> Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setConnectingProvider('oura')}
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  <Link size={13} /> Connect
                </button>
              )}
            </div>

            {/* Oura daily data */}
            {ouraData && (
              <div className="mt-4">
                <div className="flex justify-around">
                  {ouraData.readiness_score != null && (
                    <ScoreRing score={ouraData.readiness_score} label="Readiness" color="#16a34a" />
                  )}
                  {ouraData.sleep_score != null && (
                    <ScoreRing score={ouraData.sleep_score} label="Sleep" color="#6366f1" />
                  )}
                  {ouraData.activity_score != null && (
                    <ScoreRing score={ouraData.activity_score} label="Activity" color="#f59e0b" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {ouraData.hrv_average != null && (
                    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Heart size={14} className="text-rose-500" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{Math.round(ouraData.hrv_average)} ms</p>
                        <p className="text-[10px] text-gray-400">HRV</p>
                      </div>
                    </div>
                  )}
                  {ouraData.resting_heart_rate != null && (
                    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Activity size={14} className="text-red-500" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{ouraData.resting_heart_rate} bpm</p>
                        <p className="text-[10px] text-gray-400">Resting HR</p>
                      </div>
                    </div>
                  )}
                  {ouraData.sleep_hours != null && (
                    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Moon size={14} className="text-indigo-500" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{ouraData.sleep_hours}h</p>
                        <p className="text-[10px] text-gray-400">Sleep</p>
                      </div>
                    </div>
                  )}
                  {ouraData.steps != null && (
                    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="text-sm">👟</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{ouraData.steps.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">Steps</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!getStatus('oura')?.connected && (
              <p className="mt-3 text-xs text-gray-400">
                Connect using a Personal Access Token from{' '}
                <span className="text-indigo-600 font-medium">cloud.ouraring.com → Profile → Personal Access Tokens</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Whoop ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xs">
                W
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Whoop</p>
                <p className="text-xs text-gray-400">Recovery · Strain · Sleep</p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
              Coming soon
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Whoop OAuth integration is in progress. Requires a registered developer app.
          </p>
        </div>

        {/* ── Smart Scale / Weight Log ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Scale size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Weight Tracker</p>
                  <p className="text-xs text-gray-400">Log manually or from a smart scale</p>
                </div>
              </div>
              <button
                onClick={() => setShowWeightForm((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <Plus size={13} /> Log
              </button>
            </div>

            {showWeightForm && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="Weight (kg)"
                    step="0.1"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    value={bodyFatInput}
                    onChange={(e) => setBodyFatInput(e.target.value)}
                    placeholder="Body fat % (optional)"
                    step="0.1"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={handleLogWeight}
                  disabled={loggingWeight}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {loggingWeight ? 'Logging…' : 'Save Weight'}
                </button>
              </div>
            )}

            {latestWeight && (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{latestWeight.weight_kg} kg</span>
                {latestWeight.body_fat_pct && (
                  <span className="text-sm text-gray-400">{latestWeight.body_fat_pct}% body fat</span>
                )}
                <span className="text-xs text-gray-300 ml-auto">{latestWeight.logged_at}</span>
              </div>
            )}

            {weightLogs.length >= 2 && (
              <div className="mt-3">
                <WeightSparkline logs={weightLogs} />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{[...weightLogs].reverse()[0]?.logged_at}</span>
                  <span>{weightLogs[0]?.logged_at}</span>
                </div>
              </div>
            )}

            {weightLogs.length > 0 && (
              <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                {weightLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-600">{log.logged_at}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-900">{log.weight_kg} kg</span>
                      {log.body_fat_pct && (
                        <span className="text-xs text-gray-400">{log.body_fat_pct}% BF</span>
                      )}
                      <button onClick={() => handleDeleteWeight(log.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Connect Modal ───────────────────────────────────────────────── */}
      {connectingProvider && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4">
            <h2 className="font-bold text-gray-900">
              Connect {connectingProvider.charAt(0).toUpperCase() + connectingProvider.slice(1)}
            </h2>

            {connectingProvider === 'oura' && (
              <p className="text-sm text-gray-500">
                Go to <span className="font-medium text-indigo-600">cloud.ouraring.com</span> →
                click your profile → <span className="font-medium">Personal Access Tokens</span> →
                create a token and paste it below.
              </p>
            )}

            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your personal access token"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setConnectingProvider(null); setTokenInput(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting || !tokenInput.trim()}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl disabled:opacity-50"
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
