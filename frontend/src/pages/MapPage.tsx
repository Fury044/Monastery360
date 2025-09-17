import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { Monastery } from '../lib/api';
import { fetchMonasteries } from '../lib/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 27.5, lng: 88.5 };

function guessCoords(location: string | undefined): LatLng {
  const loc = (location || '').toLowerCase();
  if (loc.includes('gangtok')) return { lat: 27.3389, lng: 88.6065 };
  if (loc.includes('pelling')) return { lat: 27.3000, lng: 88.2333 };
  if (loc.includes('tashiding')) return { lat: 27.3, lng: 88.3 };
  if (loc.includes('west sikkim')) return { lat: 27.3, lng: 88.2 };
  return DEFAULT_CENTER;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonasteries()
      .then((data) => setMonasteries(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const center = useMemo(() => DEFAULT_CENTER, []);

  if (loading) return <div className="p-6">Loading map...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-56px)]">
      <MapContainer center={[center.lat, center.lng]} zoom={8} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {monasteries.map((m) => {
          const pos = guessCoords(m.location);
          return (
            <Marker key={m.id} position={[pos.lat, pos.lng]}>
              <Popup>
                <div className="space-y-2">
                  <div className="font-medium">{m.name}</div>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                    onClick={() => navigate(`/monastery/${m.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}


