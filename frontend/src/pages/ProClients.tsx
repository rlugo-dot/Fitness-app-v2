import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProBookings } from '../services/api';
import type { ProBooking } from '../services/api';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ProBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProBookings()
      .then(data => {
        const confirmed = data.filter(b => b.status === 'confirmed');
        const seen = new Set<string>();
        const unique = confirmed.filter(b => {
          if (seen.has(b.user_id)) return false;
          seen.add(b.user_id);
          return true;
        });
        setClients(unique);
      })
      .catch(() => toast.error('Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  // Names that appear more than once need a disambiguating tag
  const duplicateNames = new Set(
    clients
      .map(b => b.client?.full_name ?? '')
      .filter((name, _, arr) => arr.filter(n => n === name).length > 1)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-slate-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">No clients yet</p>
            <p className="text-sm text-gray-400">
              Confirmed bookings will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map(b => {
              const initials = (b.client?.full_name || '?')
                .split(' ')
                .map(w => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <button
                  key={b.user_id}
                  onClick={() => navigate(`/pro/client/${b.user_id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all text-left active:scale-[0.99]"
                >
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {b.client?.full_name || 'Unknown'}
                      </p>
                      {duplicateNames.has(b.client?.full_name ?? '') && (
                        <span className="shrink-0 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{b.user_id.slice(-4).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-500 font-medium mt-0.5">View health data →</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
