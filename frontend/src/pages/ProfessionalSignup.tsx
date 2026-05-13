import { useState, useRef, useEffect } from 'react';
import { Leaf, ChevronRight, ChevronLeft, Check, Loader2, ChevronDown } from 'lucide-react';
import { submitApplication } from '../services/api';
import type { ApplicationInput } from '../services/api';
import { toast } from 'sonner';

const SPECIALTIES = [
  'Nutrition', 'Weight Management', 'Sports Nutrition', 'Diabetes Management',
  'Heart Health', 'Pediatric Nutrition', 'Eating Disorders', 'Personal Training',
  'Yoga & Wellness', 'Physical Therapy', 'Mental Wellness', 'General Fitness',
  'Strength & Conditioning', 'Prenatal Nutrition', 'Elderly Care',
];

const EMOJIS = ['👨‍⚕️','👩‍⚕️','🧑‍⚕️','💪','🏋️','🧘','🥗','🏃','🩺','⚡','🌿','🎯'];

const COLORS = [
  { label: 'Green',  value: '#16a34a' },
  { label: 'Blue',   value: '#2563eb' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Rose',   value: '#e11d48' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Teal',   value: '#0d9488' },
  { label: 'Indigo', value: '#4338ca' },
  { label: 'Amber',  value: '#d97706' },
];

const MONTHLY_FEE = 999;

const COUNTRIES = [
  { code: 'PH', name: 'Philippines',   dial: '63',  flag: '🇵🇭' },
  { code: 'US', name: 'United States', dial: '1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',        dial: '1',   flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom',dial: '44',  flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',     dial: '61',  flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand',   dial: '64',  flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore',     dial: '65',  flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia',      dial: '60',  flag: '🇲🇾' },
  { code: 'HK', name: 'Hong Kong',     dial: '852', flag: '🇭🇰' },
  { code: 'JP', name: 'Japan',         dial: '81',  flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea',   dial: '82',  flag: '🇰🇷' },
  { code: 'CN', name: 'China',         dial: '86',  flag: '🇨🇳' },
  { code: 'TW', name: 'Taiwan',        dial: '886', flag: '🇹🇼' },
  { code: 'IN', name: 'India',         dial: '91',  flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia',     dial: '62',  flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand',      dial: '66',  flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam',       dial: '84',  flag: '🇻🇳' },
  { code: 'AE', name: 'UAE',           dial: '971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',  dial: '966', flag: '🇸🇦' },
  { code: 'KW', name: 'Kuwait',        dial: '965', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar',         dial: '974', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain',       dial: '973', flag: '🇧🇭' },
  { code: 'DE', name: 'Germany',       dial: '49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',        dial: '33',  flag: '🇫🇷' },
  { code: 'IT', name: 'Italy',         dial: '39',  flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',         dial: '34',  flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands',   dial: '31',  flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland',   dial: '41',  flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden',        dial: '46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',        dial: '47',  flag: '🇳🇴' },
  { code: 'BR', name: 'Brazil',        dial: '55',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',        dial: '52',  flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa',  dial: '27',  flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria',       dial: '234', flag: '🇳🇬' },
];

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Your Info', 'Expertise', 'About You', 'Review'];

export default function ProfessionalSignup() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<ApplicationInput>({
    name: '',
    email: '',
    phone: '',
    title: '',
    specialties: [],
    bio: '',
    location: '',
    years_exp: 0,
    rate_php: 0,
    avatar_emoji: '👨‍⚕️',
    avatar_color: '#16a34a',
  });

  function set(field: keyof ApplicationInput, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleSpecialty(s: string) {
    set('specialties', form.specialties.includes(s)
      ? form.specialties.filter(x => x !== s)
      : [...form.specialties, s]);
  }

  function canAdvance() {
    if (step === 1) return form.name.trim() && form.email.trim() && form.title.trim() && form.location.trim();
    if (step === 2) return form.specialties.length > 0 && form.years_exp > 0 && form.rate_php > 0;
    if (step === 3) return form.bio.trim().length >= 50;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitApplication({
        ...form,
        phone: form.phone?.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit. Please try again.');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Thanks, <span className="font-semibold text-gray-700">{form.name.split(' ')[0]}</span>! We'll review your application and get back to you at{' '}
            <span className="font-semibold text-gray-700">{form.email}</span> within 48 hours.
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-left space-y-2 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What happens next</p>
            {[
              'We review your application',
              'You receive an approval email',
              'You pay the ₱999/month listing fee',
              'Your profile goes live on Phitness',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
          <a href="/" className="text-sm text-green-600 font-medium hover:text-green-700">
            ← Back to Phitness
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-2xl mb-3 shadow-lg">
            <Leaf className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join as a Professional</h1>
          <p className="text-gray-500 text-sm mt-1">₱{MONTHLY_FEE}/month · Reach Filipino health seekers</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 flex-1 ${i > 0 ? 'ml-1' : ''}`}>
                  {i > 0 && <div className={`h-px flex-1 ${done || active ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? 'bg-green-600 text-white' : active ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check size={13} /> : n}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-4">{STEPS[step - 1]}</p>

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Full Name *">
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Dr. Maria Santos" className={input} />
              </Field>
              <Field label="Email Address *">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="maria@example.com" className={input} />
              </Field>
              <Field label="Phone (optional)">
                <PhoneInput value={form.phone ?? ''} onChange={v => set('phone', v)} />
              </Field>
              <Field label="Professional Title *">
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Registered Nutritionist-Dietitian" className={input} />
              </Field>
              <Field label="City / Location *">
                <input value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Makati, Metro Manila" className={input} />
              </Field>
            </div>
          )}

          {/* ── Step 2: Expertise ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Years of Experience *">
                  <input type="number" min={0} max={60} value={form.years_exp || ''}
                    onChange={e => set('years_exp', parseInt(e.target.value) || 0)}
                    placeholder="5" className={input} />
                </Field>
                <Field label="Session Rate (₱/hr) *">
                  <input type="number" min={0} value={form.rate_php || ''}
                    onChange={e => set('rate_php', parseInt(e.target.value) || 0)}
                    placeholder="500" className={input} />
                </Field>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties * <span className="text-gray-400 font-normal">({form.specialties.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(s => {
                    const on = form.specialties.includes(s);
                    return (
                      <button key={s} onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          on ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                        }`}>
                        {on && <Check size={10} className="inline mr-1" />}{s}
                      </button>
                    );
                  })}
                </div>
                {form.specialties.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">Select at least one specialty</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: About You ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio * <span className="text-gray-400 font-normal">({form.bio.length}/500 chars, min 50)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value.slice(0, 500))}
                  rows={5}
                  placeholder="Tell clients about your background, approach, and what makes you unique…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                {form.bio.length < 50 && form.bio.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{50 - form.bio.length} more characters needed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Avatar</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => set('avatar_emoji', e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.avatar_emoji === e ? 'ring-2 ring-green-500 bg-green-50 scale-110' : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.value} onClick={() => set('avatar_color', c.value)}
                      title={c.label}
                      className={`w-10 h-10 rounded-full transition-all ${form.avatar_color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: form.avatar_color + '22' }}>
                  {form.avatar_emoji}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{form.name || 'Your Name'}</p>
                  <p className="text-xs text-gray-500">{form.title || 'Your Title'}</p>
                  <p className="text-xs text-gray-400">{form.location || 'Your City'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Fee banner */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="text-2xl">💳</div>
                <div>
                  <p className="font-semibold text-green-800 text-sm">₱{MONTHLY_FEE}/month listing fee</p>
                  <p className="text-xs text-green-700 mt-0.5">Billed after approval. Cancel anytime.</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <Row label="Name" value={form.name} />
                <Row label="Email" value={form.email} />
                {form.phone && <Row label="Phone" value={form.phone} />}
                <Row label="Title" value={form.title} />
                <Row label="Location" value={form.location} />
                <Row label="Experience" value={`${form.years_exp} year${form.years_exp !== 1 ? 's' : ''}`} />
                <Row label="Rate" value={`₱${form.rate_php.toLocaleString()}/hr`} />
                <div className="flex gap-2 pt-1">
                  <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">Specialties</span>
                  <div className="flex flex-wrap gap-1">
                    {form.specialties.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">
                  By submitting you agree to Phitness's professional listing terms. We'll contact you at{' '}
                  <span className="font-medium text-gray-600">{form.email}</span> with next steps.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canAdvance()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <>Submit Application <Check size={16} /></>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already a member?{' '}
          <a href="/" className="text-green-600 font-medium hover:text-green-700">Sign in to Phitness</a>
        </p>
      </div>
    </div>
  );
}

const input = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500';

function formatPhoneDisplay(dial: string, local: string): string {
  if (dial === '63' && local.length === 10) {
    return `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return local ? `+${dial} ${local}` : '';
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [countryCode, setCountryCode] = useState('PH');
  const [localNumber, setLocalNumber] = useState(value ? value.replace(/^\+\d+\s?/, '') : '');
  const [showDrop, setShowDrop] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDrop) return;
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showDrop]);

  const country = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search.replace('+', ''))
  );

  function handleLocalChange(raw: string) {
    const digits = raw.replace(/\D/g, '');

    // Auto-detect Philippine format: starts with 09, up to 11 digits
    if (digits.startsWith('09') && digits.length <= 11) {
      const stripped = digits.slice(1); // remove leading 0
      setCountryCode('PH');
      setLocalNumber(stripped);
      onChange(formatPhoneDisplay('63', stripped));
      return;
    }

    setLocalNumber(digits);
    onChange(formatPhoneDisplay(country.dial, digits));
  }

  function selectCountry(code: string) {
    setCountryCode(code);
    setShowDrop(false);
    setSearch('');
    const c = COUNTRIES.find(c => c.code === code)!;
    onChange(formatPhoneDisplay(c.dial, localNumber));
  }

  return (
    <div className="flex gap-2 relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setShowDrop(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:border-green-400 shrink-0 transition-colors"
      >
        <span>{country.flag}</span>
        <span className="text-gray-700 font-medium">+{country.dial}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-150 ${showDrop ? 'rotate-180' : ''}`} />
      </button>

      <input
        type="tel"
        value={localNumber}
        onChange={e => handleLocalChange(e.target.value)}
        placeholder={countryCode === 'PH' ? '9XXXXXXXXX' : 'Phone number'}
        className={input + ' flex-1'}
      />

      {showDrop && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-64 max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 shrink-0">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country…"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c.code)}
                className={`flex items-center gap-2.5 px-3 py-2 w-full text-left text-sm transition-colors ${c.code === countryCode ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
              >
                <span>{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-gray-400 text-xs">+{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium break-words min-w-0">{value}</span>
    </div>
  );
}
