import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Pill, Check, Trash2, Search } from 'lucide-react';
import { getMedications, addMedication, deleteMedication, logMedicationDose } from '../services/api';
import type { Medication } from '../services/api';

const FREQ_LABELS: Record<string, string> = {
  once_daily: '1×/day',
  twice_daily: '2×/day',
  three_times_daily: '3×/day',
  as_needed: 'As needed',
  weekly: 'Weekly',
};

const FREQ_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'weekly', label: 'Weekly' },
];

const MEDICATIONS_LIST = [
  // Vitamins & Minerals
  'Vitamin A', 'Vitamin B1 (Thiamine)', 'Vitamin B2 (Riboflavin)', 'Vitamin B3 (Niacin)',
  'Vitamin B5 (Pantothenic Acid)', 'Vitamin B6', 'Vitamin B7 (Biotin)', 'Vitamin B9 (Folic Acid)',
  'Vitamin B12', 'Vitamin C', 'Vitamin D', 'Vitamin D3', 'Vitamin E', 'Vitamin K',
  'Multivitamins', 'Prenatal Vitamins', 'Calcium', 'Iron', 'Zinc', 'Magnesium',
  'Potassium', 'Selenium', 'Chromium', 'Iodine', 'Manganese',
  // Supplements
  'Fish Oil (Omega-3)', 'Collagen', 'CoQ10', 'Probiotics', 'Melatonin',
  'Glucosamine', 'Chondroitin', 'Spirulina', 'Turmeric / Curcumin', 'Ginkgo Biloba',
  'Garlic Extract', 'Whey Protein', 'Creatine',
  // Diabetes
  'Metformin', 'Glibenclamide', 'Glimepiride', 'Gliclazide', 'Sitagliptin',
  'Empagliflozin', 'Dapagliflozin', 'Pioglitazone', 'Insulin (Rapid-acting)',
  'Insulin (Long-acting)', 'Insulin (Mixed)',
  // Hypertension / Heart
  'Amlodipine', 'Losartan', 'Valsartan', 'Telmisartan', 'Enalapril', 'Lisinopril',
  'Ramipril', 'Atenolol', 'Metoprolol', 'Carvedilol', 'Bisoprolol', 'Nifedipine',
  'Diltiazem', 'Verapamil', 'Digoxin', 'Furosemide', 'Hydrochlorothiazide',
  'Spironolactone', 'Isosorbide Mononitrate', 'Nitroglycerin',
  // Cholesterol
  'Atorvastatin', 'Simvastatin', 'Rosuvastatin', 'Lovastatin', 'Fenofibrate', 'Ezetimibe',
  // Blood thinners
  'Aspirin', 'Clopidogrel', 'Warfarin', 'Rivaroxaban', 'Apixaban',
  // GI / Acid
  'Omeprazole', 'Pantoprazole', 'Lansoprazole', 'Rabeprazole', 'Famotidine',
  'Ranitidine', 'Antacids', 'Metoclopramide', 'Domperidone', 'Loperamide',
  'Bisacodyl', 'Lactulose',
  // Antibiotics
  'Amoxicillin', 'Co-amoxiclav (Augmentin)', 'Azithromycin', 'Clarithromycin',
  'Ciprofloxacin', 'Levofloxacin', 'Doxycycline', 'Tetracycline', 'Metronidazole',
  'Cotrimoxazole', 'Cephalexin', 'Cefuroxime', 'Ceftriaxone', 'Clindamycin',
  // Antifungal / Antiviral
  'Fluconazole', 'Clotrimazole', 'Acyclovir', 'Oseltamivir (Tamiflu)',
  // Pain / Anti-inflammatory
  'Paracetamol (Acetaminophen)', 'Ibuprofen', 'Mefenamic Acid', 'Naproxen',
  'Celecoxib', 'Diclofenac', 'Tramadol', 'Ketorolac',
  // Gout
  'Allopurinol', 'Colchicine', 'Febuxostat',
  // Steroids
  'Prednisone', 'Prednisolone', 'Dexamethasone', 'Methylprednisolone', 'Hydrocortisone',
  // Respiratory / Asthma / Allergy
  'Salbutamol (Albuterol)', 'Budesonide', 'Fluticasone', 'Montelukast', 'Salmeterol',
  'Ipratropium', 'Cetirizine', 'Loratadine', 'Fexofenadine', 'Diphenhydramine', 'Chlorphenamine',
  // Thyroid
  'Levothyroxine', 'Carbimazole', 'Propylthiouracil',
  // Mental health / Neuro
  'Sertraline', 'Fluoxetine', 'Escitalopram', 'Paroxetine', 'Venlafaxine',
  'Amitriptyline', 'Clonazepam', 'Alprazolam', 'Diazepam', 'Lorazepam',
  'Risperidone', 'Quetiapine', 'Haloperidol', 'Lithium', 'Valproic Acid',
  'Carbamazepine', 'Levetiracetam', 'Phenytoin', 'Gabapentin', 'Pregabalin',
  // Urology / Other
  'Tamsulosin', 'Finasteride', 'Sildenafil', 'Tadalafil',
  'Methotrexate', 'Hydroxychloroquine', 'Azathioprine',
  'Oral Contraceptives', 'Progesterone', 'Estradiol',
].sort((a, b) => a.localeCompare(b));

// Combobox component
function MedCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? []
    : MEDICATIONS_LIST.filter((m) => m.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  useEffect(() => { setHighlighted(0); }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset to last valid value if user typed but didn't pick
        if (!MEDICATIONS_LIST.includes(query)) {
          setQuery(value);
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [query, value]);

  function select(med: string) {
    setQuery(med);
    onChange(med);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); select(filtered[highlighted]); }
    if (e.key === 'Escape')    { setOpen(false); }
  }

  const isValid = MEDICATIONS_LIST.includes(query);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(''); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search medication or vitamin…"
          className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm outline-none transition-all ${
            isValid
              ? 'border-green-400 ring-2 ring-green-100 bg-green-50/30'
              : 'border-gray-200 focus:ring-2 focus:ring-green-500'
          }`}
        />
        {isValid && (
          <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {filtered.map((med, i) => (
            <li
              key={med}
              onMouseDown={() => select(med)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlighted ? 'bg-green-50 text-green-800' : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              {med}
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-3 text-sm text-gray-400 text-center">
          No match found — try a generic name
        </div>
      )}
    </div>
  );
}

export default function Medications() {
  const navigate = useNavigate();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('once_daily');
  const [notes, setNotes] = useState('');
  const [takingId, setTakingId] = useState<string | null>(null);

  useEffect(() => {
    getMedications()
      .then(setMeds)
      .catch(() => toast.error('Failed to load medications'))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !MEDICATIONS_LIST.includes(name)) {
      toast.error('Select a medication from the list');
      return;
    }
    setSaving(true);
    try {
      const med = await addMedication({ name, dosage: dosage.trim() || undefined, frequency, notes: notes.trim() || undefined });
      setMeds((prev) => [...prev, med]);
      setName(''); setDosage(''); setFrequency('once_daily'); setNotes('');
      setShowForm(false);
      toast.success('Medication added');
    } catch {
      toast.error('Failed to add medication');
    }
    setSaving(false);
  }

  async function handleTake(med: Medication) {
    if (med.doses_needed > 0 && med.taken_today >= med.doses_needed) return;
    setTakingId(med.id);
    try {
      await logMedicationDose(med.id);
      setMeds((prev) =>
        prev.map((m) => m.id === med.id ? { ...m, taken_today: m.taken_today + 1 } : m)
      );
      toast.success(`${med.name} taken`);
    } catch {
      toast.error('Failed to log dose');
    }
    setTakingId(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMedication(id);
      setMeds((prev) => prev.filter((m) => m.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove medication');
    }
  }

  const totalNeeded = meds.filter(m => m.doses_needed > 0).reduce((s, m) => s + m.doses_needed, 0);
  const totalTaken  = meds.filter(m => m.doses_needed > 0).reduce((s, m) => s + Math.min(m.taken_today, m.doses_needed), 0);

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Medications</h1>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Today's progress */}
        {!loading && meds.length > 0 && totalNeeded > 0 && (
          <div className={`rounded-2xl p-4 ${totalTaken >= totalNeeded ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Today's doses</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {totalTaken === totalNeeded ? 'All done for today!' : `${totalNeeded - totalTaken} remaining`}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${totalTaken >= totalNeeded ? 'text-green-600' : 'text-blue-600'}`}>
                  {totalTaken}
                </p>
                <p className="text-xs text-gray-400">of {totalNeeded}</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalTaken >= totalNeeded ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(totalTaken / totalNeeded * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Add Medication</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <MedCombobox value={name} onChange={setName} />
              {name && !MEDICATIONS_LIST.includes(name) && (
                <p className="text-xs text-amber-600 mt-1">Select an item from the dropdown to continue.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  placeholder="e.g. 500mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  {FREQ_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                placeholder="e.g. take with food, after breakfast"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(''); setDosage(''); setNotes(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !MEDICATIONS_LIST.includes(name)}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
              >
                {saving ? 'Adding…' : 'Add Medication'}
              </button>
            </div>
          </form>
        )}

        {/* Medication list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
        ) : meds.length === 0 ? (
          <div className="text-center py-16">
            <Pill size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No medications added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-green-600 font-medium hover:text-green-700"
            >
              Add your first medication
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meds.map((med) => {
              const done = med.doses_needed > 0 && med.taken_today >= med.doses_needed;
              const isAsNeeded = med.doses_needed === 0;
              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${done ? 'border-green-100' : 'border-gray-100'}`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-gray-50'}`}>
                      <Pill size={18} className={done ? 'text-green-500' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{med.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {med.dosage && <span className="text-xs text-gray-400">{med.dosage}</span>}
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {FREQ_LABELS[med.frequency] ?? med.frequency}
                            </span>
                          </div>
                          {med.notes && <p className="text-xs text-gray-400 mt-1 italic">{med.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="p-1 text-gray-300 hover:text-red-500 active:scale-90 transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {!isAsNeeded && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex gap-1">
                            {Array.from({ length: med.doses_needed }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  i < med.taken_today ? 'bg-green-500 border-green-500' : 'border-gray-200'
                                }`}
                              >
                                {i < med.taken_today && <Check size={10} className="text-white" />}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {med.taken_today}/{med.doses_needed} taken
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleTake(med)}
                    disabled={(!isAsNeeded && done) || takingId === med.id}
                    className={`w-full py-2.5 text-sm font-semibold transition-all border-t ${
                      done && !isAsNeeded
                        ? 'bg-green-50 text-green-600 border-green-100 cursor-default'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100 active:bg-gray-200 disabled:opacity-50'
                    }`}
                  >
                    {takingId === med.id ? 'Logging…' : done && !isAsNeeded ? '✓ Done for today' : 'Mark as taken'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
