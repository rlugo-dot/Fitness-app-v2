import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Trash2, Activity } from 'lucide-react';
import { getVitalLogs, logVitals, deleteVitalLog } from '../services/api';
import type { VitalLog } from '../services/api';

function bpStatus(sys: number, dia: number): { label: string; color: string } {
  if (sys >= 180 || dia >= 120) return { label: 'Crisis', color: 'text-red-600 bg-red-50' };
  if (sys >= 140 || dia >= 90)  return { label: 'High', color: 'text-red-500 bg-red-50' };
  if (sys >= 130 || dia >= 80)  return { label: 'High-1', color: 'text-orange-500 bg-orange-50' };
  if (sys >= 120)               return { label: 'Elevated', color: 'text-amber-500 bg-amber-50' };
  return { label: 'Normal', color: 'text-green-600 bg-green-50' };
}

function glucoseStatus(val: number): { label: string; color: string } {
  if (val >= 7.0) return { label: 'High', color: 'text-red-500 bg-red-50' };
  if (val >= 5.6) return { label: 'Pre-DM', color: 'text-amber-500 bg-amber-50' };
  return { label: 'Normal', color: 'text-green-600 bg-green-50' };
}

function spo2Status(val: number): { label: string; color: string } {
  if (val < 90) return { label: 'Low', color: 'text-red-500 bg-red-50' };
  if (val < 95) return { label: 'Fair', color: 'text-amber-500 bg-amber-50' };
  return { label: 'Normal', color: 'text-green-600 bg-green-50' };
}

function hrStatus(val: number): { label: string; color: string } {
  if (val > 100) return { label: 'High', color: 'text-orange-500 bg-orange-50' };
  if (val < 60)  return { label: 'Low', color: 'text-blue-500 bg-blue-50' };
  return { label: 'Normal', color: 'text-green-600 bg-green-50' };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const EMPTY_FORM = {
  bp_systolic: '',
  bp_diastolic: '',
  blood_glucose: '',
  spo2: '',
  heart_rate: '',
  notes: '',
};

export default function VitalSigns() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<VitalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    getVitalLogs().then(setLogs).catch(() => toast.error('Failed to load vitals')).finally(() => setLoading(false));
  }, []);

  function setField(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, number | string> = {};
    if (form.bp_systolic)  payload.bp_systolic  = parseInt(form.bp_systolic);
    if (form.bp_diastolic) payload.bp_diastolic = parseInt(form.bp_diastolic);
    if (form.blood_glucose) payload.blood_glucose = parseFloat(form.blood_glucose);
    if (form.spo2)         payload.spo2         = parseFloat(form.spo2);
    if (form.heart_rate)   payload.heart_rate   = parseInt(form.heart_rate);
    if (form.notes.trim()) payload.notes        = form.notes.trim();

    if (Object.keys(payload).filter(k => k !== 'notes').length === 0) {
      toast.error('Enter at least one reading');
      return;
    }
    setSaving(true);
    try {
      const entry = await logVitals(payload as Parameters<typeof logVitals>[0]);
      setLogs((prev) => [entry, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Reading saved');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteVitalLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast.success('Deleted');
  }

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Vital Signs</h1>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
          >
            <Plus size={16} /> Log
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Log Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">New Reading</h2>

            {/* Blood Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Pressure (mmHg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Systolic"
                  value={form.bp_systolic}
                  onChange={(e) => setField('bp_systolic', e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                <span className="text-gray-400 font-bold">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Diastolic"
                  value={form.bp_diastolic}
                  onChange={(e) => setField('bp_diastolic', e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Glucose (mmol/L)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="5.5"
                  value={form.blood_glucose}
                  onChange={(e) => setField('blood_glucose', e.target.value.replace(/[^\d.]/g, ''))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SpO2 (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="98"
                  value={form.spo2}
                  onChange={(e) => setField('spo2', e.target.value.replace(/[^\d.]/g, ''))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="72"
                  value={form.heart_rate}
                  onChange={(e) => setField('heart_rate', e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. fasting, after exercise"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Reading'}
              </button>
            </div>
          </form>
        )}

        {/* History */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="skeleton h-4 w-32 mb-3" />
                <div className="flex gap-2">
                  <div className="skeleton h-8 w-24 rounded-lg" />
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Activity size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No readings yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-green-600 font-medium hover:text-green-700"
            >
              Log your first reading
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-gray-400">{formatDateTime(log.logged_at)}</p>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1 text-gray-300 hover:text-red-500 active:scale-90 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {log.bp_systolic != null && log.bp_diastolic != null && (() => {
                    const s = bpStatus(log.bp_systolic!, log.bp_diastolic!);
                    return (
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${s.color}`}>
                        <span className="text-[10px] font-normal block leading-none mb-0.5 opacity-60">BP</span>
                        {log.bp_systolic}/{log.bp_diastolic}
                        <span className="ml-1.5 text-[10px] font-normal opacity-70">{s.label}</span>
                      </div>
                    );
                  })()}

                  {log.blood_glucose != null && (() => {
                    const s = glucoseStatus(log.blood_glucose!);
                    return (
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${s.color}`}>
                        <span className="text-[10px] font-normal block leading-none mb-0.5 opacity-60">Glucose</span>
                        {log.blood_glucose} mmol/L
                        <span className="ml-1.5 text-[10px] font-normal opacity-70">{s.label}</span>
                      </div>
                    );
                  })()}

                  {log.spo2 != null && (() => {
                    const s = spo2Status(log.spo2!);
                    return (
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${s.color}`}>
                        <span className="text-[10px] font-normal block leading-none mb-0.5 opacity-60">SpO2</span>
                        {log.spo2}%
                        <span className="ml-1.5 text-[10px] font-normal opacity-70">{s.label}</span>
                      </div>
                    );
                  })()}

                  {log.heart_rate != null && (() => {
                    const s = hrStatus(log.heart_rate!);
                    return (
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${s.color}`}>
                        <span className="text-[10px] font-normal block leading-none mb-0.5 opacity-60">HR</span>
                        {log.heart_rate} bpm
                        <span className="ml-1.5 text-[10px] font-normal opacity-70">{s.label}</span>
                      </div>
                    );
                  })()}
                </div>

                {log.notes && (
                  <p className="mt-2 text-xs text-gray-400 italic">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
