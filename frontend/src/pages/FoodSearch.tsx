import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchFoods, getFoodCategories, logFood, scanFood } from '../services/api';
import type { ScanResult } from '../services/api';
import type { Food, MealType } from '../types';
import { Search, ChevronLeft, Plus, Check, Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-500',
};

export default function FoodSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMeal = (searchParams.get('meal') as MealType) || 'snack';
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [tab, setTab] = useState<'search' | 'scan'>('search');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal);
  const [logDate] = useState(initialDate);
  const [logging, setLogging] = useState<string | null>(null);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Scan state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanImageType, setScanImageType] = useState('image/jpeg');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loggedScan, setLoggedScan] = useState(false);

  useEffect(() => {
    getFoodCategories().then(setCategories);
    loadFoods('', '');
  }, []);

  async function loadFoods(q: string, cat: string) {
    setLoading(true);
    const results = await searchFoods(q || undefined, cat || undefined);
    setFoods(results);
    setLoading(false);
  }

  function handleSearch(q: string) {
    setQuery(q);
    loadFoods(q, category);
  }

  function handleCategory(cat: string) {
    setCategory(cat);
    loadFoods(query, cat);
  }

  async function handleLog(food: Food) {
    const qty = quantities[food.id] || 1;
    setLogging(food.id);
    await logFood({ food_id: food.id, meal_type: selectedMeal, quantity: qty, log_date: logDate });
    setLogged((prev) => new Set([...prev, food.id]));
    setLogging(null);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanResult(null);
    setLoggedScan(false);
    setScanImageType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScanImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleScan() {
    if (!scanImage) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanFood(scanImage, scanImageType);
      setScanResult(result);
    } catch {
      toast.error('Could not identify food. Try a clearer photo.');
    }
    setScanning(false);
  }

  async function handleLogScan() {
    if (!scanResult) return;
    setLogging('scan');
    try {
      await logFood({
        food_id: 'ai_scan_' + Date.now(),
        meal_type: selectedMeal,
        quantity: 1,
        log_date: logDate,
        food_name: scanResult.food_name,
        calories: scanResult.calories,
        protein_g: scanResult.protein_g,
        carbs_g: scanResult.carbs_g,
        fat_g: scanResult.fat_g,
      });
      setLoggedScan(true);
      toast.success(`${scanResult.food_name} logged!`);
    } catch {
      toast.error('Failed to log food');
    }
    setLogging(null);
  }

  function clearScan() {
    setScanImage(null);
    setScanResult(null);
    setLoggedScan(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const servingLabel = (food: Food) => {
    const qty = quantities[food.id] || 1;
    const totalCal = Math.round(food.calories * food.default_serving / 100 * qty);
    return `${totalCal} kcal`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Add Food</h1>
          </div>

          {/* Meal selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMeal(m)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedMeal === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Search / Scan tabs */}
          <div className="flex mt-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab('search')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'search' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <Search size={14} /> Search
            </button>
            <button
              onClick={() => setTab('scan')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'scan' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <Camera size={14} /> Scan Food
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Search Tab ── */}
        {tab === 'search' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search food… (e.g. adobo, chicken)"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleCategory('')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === '' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Searching…</div>
            ) : foods.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No foods found</div>
            ) : (
              <div className="space-y-2">
                {foods.map((food) => {
                  const qty = quantities[food.id] || 1;
                  const isLogged = logged.has(food.id);
                  return (
                    <div key={food.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{food.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {food.category} · {servingLabel(food)} · P:{Math.round(food.protein_g * food.default_serving / 100 * qty)}g
                          · C:{Math.round(food.carbs_g * food.default_serving / 100 * qty)}g
                          · F:{Math.round(food.fat_g * food.default_serving / 100 * qty)}g
                        </p>
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          per {food.default_serving}{food.serving_unit === 'g' ? 'g' : ` ${food.serving_unit}`} serving
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuantities((q) => ({ ...q, [food.id]: Math.max(0.5, (q[food.id] || 1) - 0.5) }))}
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center hover:bg-gray-200"
                        >−</button>
                        <span className="text-sm font-medium w-6 text-center">{qty}</span>
                        <button
                          onClick={() => setQuantities((q) => ({ ...q, [food.id]: (q[food.id] || 1) + 0.5 }))}
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center hover:bg-gray-200"
                        >+</button>
                      </div>
                      <button
                        onClick={() => !isLogged && handleLog(food)}
                        disabled={logging === food.id || isLogged}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isLogged ? 'bg-green-100 text-green-600' : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                        }`}
                      >
                        {isLogged ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Scan Tab ── */}
        {tab === 'scan' && (
          <div className="space-y-4">
            {!scanImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="text-green-600" size={26} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">Take or upload a photo</p>
                  <p className="text-sm text-gray-400 mt-1">AI will identify the food and estimate macros</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            ) : (
              <>
                {/* Image preview */}
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={scanImage} alt="Food" className="w-full object-cover max-h-64" />
                  <button
                    onClick={clearScan}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Scan button */}
                {!scanResult && (
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {scanning ? (
                      <><Loader2 size={16} className="animate-spin" /> Identifying food…</>
                    ) : (
                      <><Camera size={16} /> Identify Food</>
                    )}
                  </button>
                )}

                {/* Scan result */}
                {scanResult && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{scanResult.food_name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{scanResult.portion_description}</p>
                      </div>
                      <span className={`text-xs font-medium capitalize ${CONFIDENCE_COLOR[scanResult.confidence] || 'text-gray-500'}`}>
                        {scanResult.confidence} confidence
                      </span>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Calories', value: Math.round(scanResult.calories), unit: 'kcal' },
                        { label: 'Protein', value: Math.round(scanResult.protein_g), unit: 'g' },
                        { label: 'Carbs', value: Math.round(scanResult.carbs_g), unit: 'g' },
                        { label: 'Fat', value: Math.round(scanResult.fat_g), unit: 'g' },
                      ].map(({ label, value, unit }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                          <p className="text-sm font-bold text-gray-900">{value}<span className="text-xs font-normal">{unit}</span></p>
                          <p className="text-[10px] text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {scanResult.notes && (
                      <p className="text-xs text-gray-400 italic">{scanResult.notes}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={clearScan}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleLogScan}
                        disabled={logging === 'scan' || loggedScan}
                        className={`flex-1 py-2.5 font-medium rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all ${
                          loggedScan
                            ? 'bg-green-100 text-green-600'
                            : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                        }`}
                      >
                        {loggedScan ? <><Check size={14} /> Logged!</> : <><Plus size={14} /> Log to {MEAL_LABELS[selectedMeal]}</>}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
