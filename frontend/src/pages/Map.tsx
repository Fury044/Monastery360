import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { aiRoute, type RouteStep, type RoutePathPoint, fetchMonasteries, type Monastery } from '../lib/api';
import CesiumGlobeViewer from '../components/CesiumGlobeViewer';
import MapRouteViewer from '../components/MapRouteViewer';

export default function MapPage() {
  const [question, setQuestion] = useState('Best 90-minute walking route to explore');
  const [duration, setDuration] = useState(90);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [path, setPath] = useState<RoutePathPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loadingMon, setLoadingMon] = useState(false);
  const [mode, setMode] = useState<'foot' | 'bike' | 'car'>('foot');
  const [useCesium, setUseCesium] = useState(false);
  const [tileStyle, setTileStyle] = useState<'osm' | 'sat'>('osm');

  // Fixed Sikkim station (adjust as needed)
  const SIKKIM_STATION = { lat: 27.3389, lng: 88.6065 };

  // Load monasteries for default markers
  useEffect(() => {
    let mounted = true;
    setLoadingMon(true);
    fetchMonasteries()
      .then((data) => { if (mounted) setMonasteries(data || []); })
      .catch((e) => { if (mounted) setError(String(e)); })
      .finally(() => { if (mounted) setLoadingMon(false); });
    return () => { mounted = false; };
  }, []);

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await aiRoute({ question, duration_minutes: duration, start_lat: SIKKIM_STATION.lat, start_lng: SIKKIM_STATION.lng, transport_mode: mode });
      setSteps(res.steps || []);
      setPath(res.path || null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const hasPath = useMemo(() => steps.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number').length >= 1, [steps]);

  const markers = useMemo(() => {
    const points = (monasteries || [])
      .map((m) => {
        const lat = m?.info?.coordinates?.lat;
        const lng = m?.info?.coordinates?.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return { lat, lng, title: m.name };
        }
        return null;
      })
      .filter(Boolean) as Array<{ lat: number; lng: number; title?: string }>;
    // Always include Sikkim Station as the origin marker at the start of the list
    points.unshift({ lat: SIKKIM_STATION.lat, lng: SIKKIM_STATION.lng, title: 'Sikkim Station (Start)' });
    return points;
  }, [monasteries]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Pilgrimage Map</h1>
          <p className="text-gray-600 mt-1">All monasteries are marked by default. Plan a route starting from the Sikkim Station.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 hidden md:inline">Basemap</label>
          <select value={tileStyle} onChange={(e) => setTileStyle(e.target.value as any)} className="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="osm">Street</option>
            <option value="sat">Satellite</option>
          </select>
          <button onClick={() => setUseCesium((v) => !v)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">{useCesium ? 'Use 2D Map' : 'Use 3D Globe'}</button>
          <button onClick={() => { setSteps([]); setPath(null); }} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Clear Route</button>
        </div>
      </motion.div>

      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}

      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {useCesium ? (
          <CesiumGlobeViewer
            steps={steps}
            markers={markers}
            path={path || undefined}
            onFailFallback={() => setUseCesium(false)}
          />
        ) : (
          <MapRouteViewer steps={steps} markers={markers} path={path || undefined} transportMode={mode} tileStyle={tileStyle} />
        )}
      </motion.div>

      {/* Plan route form below the map */}
      <motion.form
        onSubmit={handlePlan}
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to see?"
          className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="number"
          value={duration}
          min={20}
          max={240}
          onChange={(e) => setDuration(parseInt(e.target.value || '90', 10))}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Duration (minutes)"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="foot">Walking</option>
          <option value="bike">Bike</option>
          <option value="car">Car</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Planning…' : 'Plan Route'}
        </button>
      </motion.form>

      {/* Step list panel */}
      {steps.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Route steps</div>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {steps.map((s, i) => (
                <li key={i}><span className="font-medium">{s.title}</span> — ~{s.estimated_minutes} min</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {!hasPath && (
        <motion.div
          className="mt-3 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Tip: Add coordinates to your monasteries to see animated routes between stops.
        </motion.div>
      )}
    </div>
  );
}
