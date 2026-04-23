import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, MapPin, Navigation, Loader2, RefreshCw } from 'lucide-react';

// Fix default marker icons broken by webpack/vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const GYM_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const USER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Gym {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  distance?: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Re-center map when location changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export default function GymMap() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [radius, setRadius] = useState(3000); // metres
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  function requestLocation() {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        fetchGyms(coords, radius);
      },
      () => {
        setLocError('Location access denied. Enable location in your browser settings.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function fetchGyms(coords: [number, number], r: number) {
    setLoading(true);
    setGyms([]);
    const [lat, lon] = coords;

    const query = `
      [out:json][timeout:25];
      (
        node["leisure"="fitness_centre"](around:${r},${lat},${lon});
        node["amenity"="gym"](around:${r},${lat},${lon});
        way["leisure"="fitness_centre"](around:${r},${lat},${lon});
        way["amenity"="gym"](around:${r},${lat},${lon});
      );
      out center;
    `;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();

      const results: Gym[] = (data.elements || [])
        .map((el: any) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (!elLat || !elLon) return null;
          return {
            id: el.id,
            name: el.tags?.name || el.tags?.['name:en'] || 'Gym',
            lat: elLat,
            lon: elLon,
            tags: el.tags || {},
            distance: haversine(lat, lon, elLat, elLon),
          };
        })
        .filter(Boolean)
        .sort((a: Gym, b: Gym) => (a.distance ?? 0) - (b.distance ?? 0));

      setGyms(results);
    } catch {
      setLocError('Could not load gym data. Check your connection.');
    }
    setLoading(false);
  }

  function handleRadiusChange(newRadius: number) {
    setRadius(newRadius);
    if (location) fetchGyms(location, newRadius);
  }

  function openDirections(gym: Gym) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lon}`,
      '_blank'
    );
  }

  function scrollToGym(gym: Gym) {
    setSelectedGym(gym);
    setTimeout(() => {
      const el = document.getElementById(`gym-${gym.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  const center: [number, number] = location ?? [14.5995, 120.9842]; // default: Manila

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-[1000]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Gyms Nearby</h1>
            <button
              onClick={requestLocation}
              disabled={loading}
              className="ml-auto text-gray-400 hover:text-green-600 disabled:opacity-40"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Radius selector */}
          <div className="flex gap-2">
            {[1000, 3000, 5000, 10000].map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusChange(r)}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                  radius === r
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-64 w-full relative z-0">
        {locError ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-center px-6 gap-3">
            <MapPin size={32} className="text-gray-400" />
            <p className="text-sm text-gray-600">{locError}</p>
            <button
              onClick={requestLocation}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && (
              <MapController center={location} />
            )}
            {location && (
              <Marker position={location} icon={USER_ICON}>
                <Popup>You are here</Popup>
              </Marker>
            )}
            {gyms.map((gym) => (
              <Marker
                key={gym.id}
                position={[gym.lat, gym.lon]}
                icon={GYM_ICON}
                eventHandlers={{ click: () => scrollToGym(gym) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{gym.name}</p>
                    {gym.distance && (
                      <p className="text-gray-500 text-xs mt-0.5">{distanceLabel(gym.distance)}</p>
                    )}
                    <button
                      onClick={() => openDirections(gym)}
                      className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1"
                    >
                      <Navigation size={11} /> Get Directions
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Gym list */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4" ref={listRef}>
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Finding gyms…</span>
          </div>
        )}

        {!loading && !locError && gyms.length === 0 && location && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No gyms found within {radius / 1000}km.</p>
            <p className="text-xs mt-1">Try increasing the search radius.</p>
          </div>
        )}

        {!loading && gyms.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {gyms.length} gym{gyms.length !== 1 ? 's' : ''} found within {radius / 1000}km
            </p>
            <div className="space-y-2">
              {gyms.map((gym) => {
                const isSelected = selectedGym?.id === gym.id;
                return (
                  <div
                    key={gym.id}
                    id={`gym-${gym.id}`}
                    className={`bg-white rounded-2xl border transition-all p-4 ${
                      isSelected ? 'border-green-400 shadow-md' : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className="text-lg">🏋️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{gym.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {gym.distance !== undefined && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin size={10} /> {distanceLabel(gym.distance)}
                              </span>
                            )}
                            {gym.tags.opening_hours && (
                              <span className="text-[10px] text-gray-400 truncate">
                                · {gym.tags.opening_hours}
                              </span>
                            )}
                          </div>
                          {gym.tags['addr:street'] && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {gym.tags['addr:street']}
                              {gym.tags['addr:city'] ? `, ${gym.tags['addr:city']}` : ''}
                            </p>
                          )}
                          {gym.tags.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">{gym.tags.phone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openDirections(gym)}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl transition-colors"
                      >
                        <Navigation size={12} /> Go
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
