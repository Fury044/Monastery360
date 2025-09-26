import React, { useEffect, useRef, useState } from 'react';
import type { RouteStep } from '../lib/api';

function project(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  size: { width: number; height: number },
) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const { width, height } = size;
  const latRange = Math.max(0.00001, maxLat - minLat);
  const lngRange = Math.max(0.00001, maxLng - minLng);
  const padding = 20;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const x = padding + ((lng - minLng) / lngRange) * usableW;
  // invert Y because canvas y grows downward
  const y = padding + (1 - (lat - minLat) / latRange) * usableH;
  return { x, y };
}

function buildSegments(points: Array<{ x: number; y: number }>) {
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number; len: number; acc: number }> = [];
  let acc = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    acc += len;
    segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len, acc });
  }
  return { segs, total: acc };
}

export default function RouteAnimator({ steps }: { steps: RouteStep[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const pts = steps
    .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
    .map(s => ({ lat: s.lat as number, lng: s.lng as number }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 360;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cssW, cssH);

    if (pts.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('No coordinates available to plot.', 12, 24);
      return;
    }

    const bounds = {
      minLat: Math.min(...pts.map(p => p.lat)),
      maxLat: Math.max(...pts.map(p => p.lat)),
      minLng: Math.min(...pts.map(p => p.lng)),
      maxLng: Math.max(...pts.map(p => p.lng)),
    };
    const size = { width: cssW, height: cssH };

    const points2d = pts.map(p => project(p.lat, p.lng, bounds, size));
    const { segs, total } = buildSegments(points2d);

    // Draw path
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1d4ed8';
    ctx.beginPath();
    points2d.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw nodes
    points2d.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#059669' : i === points2d.length - 1 ? '#dc2626' : '#111827';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw animated marker
    if (segs.length > 0 && points2d.length > 0) {
      const dist = total * Math.min(1, Math.max(0, progress));
      let x = points2d[0]!.x;
      let y = points2d[0]!.y;
      for (let i = 0; i < segs.length; i++) {
        const prevAcc = i === 0 ? 0 : segs[i - 1]!.acc;
        const curr = segs[i]!;
        if (dist <= curr.acc) {
          const within = dist - prevAcc;
          const t = curr.len > 0 ? within / curr.len : 0;
          x = curr.x1 + (curr.x2 - curr.x1) * t;
          y = curr.y1 + (curr.y2 - curr.y1) * t;
          break;
        }
      }
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [pts, progress]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const durationMs = Math.max(1500, steps.reduce((acc, s) => acc + (s.estimated_minutes || 10), 0) * 200); // basic scaling

    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setProgress(p => {
        const np = p + dt / durationMs;
        if (np >= 1) {
          cancelAnimationFrame(raf);
          raf = 0;
          return 1;
        }
        return np;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [playing, steps]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => { setProgress(0); setPlaying(true); }} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Play</button>
        <button onClick={() => setPlaying(false)} className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300">Pause</button>
        <button onClick={() => { setPlaying(false); setProgress(0); }} className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300">Reset</button>
        <div className="text-xs text-gray-600">Progress: {(progress * 100).toFixed(0)}%</div>
      </div>
      <div style={{ width: '100%', height: 360, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}
