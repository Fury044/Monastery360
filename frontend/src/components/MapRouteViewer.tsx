import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L, { LatLngExpression, Marker as LeafletMarker } from 'leaflet';
import type { RouteStep, RoutePathPoint } from '../lib/api';

// Fix default marker icon paths for Leaflet in bundlers
const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0] as any, 15);
      return;
    }
    const bounds = L.latLngBounds(points as any);
    map.fitBounds(bounds.pad(0.2));
  }, [map, points]);
  return null;
}

type MarkerPoint = { lat: number; lng: number; title?: string };

export default function MapRouteViewer({ steps, markers, path, transportMode, tileStyle = 'osm' }: { steps: RouteStep[]; markers?: MarkerPoint[]; path?: RoutePathPoint[]; transportMode?: 'foot' | 'bike' | 'car'; tileStyle?: 'osm' | 'sat' }) {
  const coordsFromSteps = useMemo(() => steps
    .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
    .map(s => [s.lat as number, s.lng as number] as [number, number])
  , [steps]);

  const coordsFromMarkers = useMemo(() => (markers || [])
    .filter(m => typeof m.lat === 'number' && typeof m.lng === 'number')
    .map(m => [m.lat, m.lng] as [number, number])
  , [markers]);

  const coordsFromPath = useMemo(() => (path && path.length > 1 ? path.map(p => [p.lat, p.lng] as [number, number]) : []), [path]);

  const allPoints: LatLngExpression[] = useMemo(() => {
    if (coordsFromPath.length > 0) return coordsFromPath;
    if (coordsFromSteps.length > 0) return coordsFromSteps;
    return coordsFromMarkers;
  }, [coordsFromPath, coordsFromSteps, coordsFromMarkers]);

  const center: LatLngExpression = (coordsFromPath[0] || coordsFromSteps[0] || coordsFromMarkers[0] || [27.3389, 88.6065]); // default center (Sikkim region approx)

  // Animated marker
  const animMarkerRef = useRef<LeafletMarker | null>(null);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const animCoords = coordsFromPath.length > 1 ? coordsFromPath : coordsFromSteps;
    if (animCoords.length < 2) return; // need at least two points to animate
    let raf = 0;
    let last = performance.now();
    const totalMinutes = steps.reduce((acc, s) => acc + (s.estimated_minutes || 10), 0);
    const durationMs = Math.max(2000, totalMinutes * 200); // scale speed

    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setProgress(p => {
        const np = p + dt / durationMs;
        return np >= 1 ? 1 : np;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [coordsFromPath, coordsFromSteps, steps]);

  useEffect(() => {
    const animCoords = coordsFromPath.length > 1 ? coordsFromPath : coordsFromSteps;
    if (!animMarkerRef.current || animCoords.length < 2) return;
    // turn polyline into cumulative distances
    const pts = animCoords.map(([lat, lng]) => L.latLng(lat, lng));
    const segs = [] as Array<{ a: L.LatLng; b: L.LatLng; len: number; acc: number }>;
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!; const b = pts[i + 1]!;
      const len = a.distanceTo(b);
      acc += len;
      segs.push({ a, b, len, acc });
    }
    const total = acc || 1;
    const dist = total * Math.min(1, Math.max(0, progress));
    let pos = pts[0]!;
    for (let i = 0; i < segs.length; i++) {
      const prevAcc = i === 0 ? 0 : segs[i - 1]!.acc;
      const curr = segs[i]!;
      if (dist <= curr.acc) {
        const within = dist - prevAcc;
        const t = curr.len > 0 ? within / curr.len : 0;
        pos = L.latLng(
          curr.a.lat + (curr.b.lat - curr.a.lat) * t,
          curr.a.lng + (curr.b.lng - curr.a.lng) * t,
        );
        break;
      }
    }
    animMarkerRef.current.setLatLng(pos);
  }, [progress, coordsFromPath, coordsFromSteps]);

  const polyline = (coordsFromPath.length > 1 ? coordsFromPath : coordsFromSteps) as LatLngExpression[];

  // Style by transport mode
  const mode = transportMode || 'foot';
  const mainColor = mode === 'car' ? '#2563eb' : mode === 'bike' ? '#f59e0b' : '#10b981';
  const dash = mode === 'bike' ? '6,8' : undefined;

  // Basemap URL by style
  const tile = tileStyle === 'sat'
    ? {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    : {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      };

  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-2">Animated map preview</div>
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: 420, borderRadius: 8, overflow: 'hidden' }}>
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <FitBounds points={polyline.length > 0 ? polyline : (coordsFromMarkers as LatLngExpression[])} />

        {/* Polyline of the route with glow and mode color */}
        {polyline.length >= 2 && (
          <>
            {/* Glow layers */}
            <Polyline pathOptions={{ color: mainColor, weight: 10, opacity: 0.15 }} positions={polyline} />
            <Polyline pathOptions={{ color: mainColor, weight: 7, opacity: 0.25 }} positions={polyline} />
            {/* Main stroke */}
            <Polyline pathOptions={{ color: mainColor, weight: 4, opacity: 0.9, dashArray: dash as any }} positions={polyline} />
          </>
        )}

        {/* Static markers with indices for route steps */}
        {coordsFromSteps.map((c, idx) => (
          <Marker position={c} key={idx}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{steps[idx]?.title || `Stop ${idx + 1}`}</div>
                <div className="text-xs text-gray-600">~{steps[idx]?.estimated_minutes || 10} minutes</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Static markers for initial monasteries */}
        {(coordsFromSteps.length === 0 || (markers && markers.length > 0)) && (markers || []).map((m, i) => (
          <Marker position={[m.lat, m.lng]} key={`mk-${i}`}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{m.title || `Monastery ${i + 1}`}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Animated marker */}
        {((coordsFromPath.length >= 2) || (coordsFromSteps.length >= 2)) && (
          <Marker ref={(m: LeafletMarker | null) => { if (m) animMarkerRef.current = m; }} position={(coordsFromPath[0] || coordsFromSteps[0]) as any} />
        )}

        {/* If only one point, draw a circle */}
        {coordsFromSteps.length === 1 && coordsFromPath.length === 0 && (
          <CircleMarker center={coordsFromSteps[0] as [number, number]} radius={8} pathOptions={{ color: '#059669' }} />
        )}
      </MapContainer>
    </div>
  );
}
