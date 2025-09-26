import React, { useEffect, useRef } from 'react';
import type { RoutePathPoint, RouteStep } from '../lib/api';

export type MarkerPoint = { lat: number; lng: number; title?: string };

type Props = {
  steps: RouteStep[];
  markers?: MarkerPoint[];
  path?: RoutePathPoint[];
  onFailFallback?: () => void;
};

declare global {
  interface Window { Cesium?: any }
}

function ensureCesiumLoaded(): Promise<any> {
  return new Promise((resolve) => {
    if (window.Cesium) return resolve(window.Cesium);
    // Inject CSS
    const cssId = 'cesium-widgets-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/cesium@1.118.1/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }
    // Inject JS UMD bundle which defines window.Cesium
    const jsId = 'cesium-umd-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.async = true;
      script.src = 'https://unpkg.com/cesium@1.118.1/Build/Cesium/Cesium.js';
      script.onload = () => resolve(window.Cesium);
      document.body.appendChild(script);
    } else {
      // If script exists but Cesium not ready yet, poll briefly
      const iv = setInterval(() => {
        if (window.Cesium) {
          clearInterval(iv);
          resolve(window.Cesium);
        }
      }, 50);
    }
  });
}

export default function CesiumGlobeViewer({ steps, markers = [], path, onFailFallback }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const statusRef = useRef<'idle'|'loading'|'ready'|'failed'>('idle');

  useEffect(() => {
    // Use Cesium assets from CDN to avoid local static copy configuration during dev
    (window as any).CESIUM_BASE_URL = 'https://unpkg.com/cesium@1.118.1/Build/Cesium/';

    if (!containerRef.current) return;

    let disposed = false;
    statusRef.current = 'loading';

    // Try primary CDN first, then secondary if needed
    const tryLoad = async () => {
      let Cesium: any;
      try {
        Cesium = await ensureCesiumLoaded();
      } catch {}
      if (!Cesium) {
        // Retry via jsDelivr
        await new Promise<void>((resolve) => {
          const existing = document.getElementById('cesium-umd-js');
          if (existing) existing.remove();
          const script = document.createElement('script');
          script.id = 'cesium-umd-js';
          script.async = true;
          script.src = 'https://cdn.jsdelivr.net/npm/cesium@1.118.1/Build/Cesium/Cesium.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
        Cesium = (window as any).Cesium;
      }
      return Cesium;
    };

    tryLoad().then(async (Cesium: any) => {
      if (disposed || !containerRef.current) return;
      // Create Cesium Viewer
      const viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false,
        animation: false,
        geocoder: false,
        baseLayerPicker: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        terrainProvider: undefined,
      });
      viewerRef.current = viewer;
      statusRef.current = 'ready';

      // Try to add Google Photorealistic 3D Tiles (requires Google Maps API key with Photorealistic 3D Tiles enabled)
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
      try {
        if (apiKey && Cesium?.createGooglePhotorealistic3DTileset) {
          const tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: apiKey });
          viewer.scene.primitives.add(tileset);
        }
      } catch (e) {
        // silently ignore if not available
      }
    });

    return () => {
      disposed = true;
      const viewer = viewerRef.current;
      try { viewer?.destroy?.(); } catch {}
      if (statusRef.current !== 'ready') {
        statusRef.current = 'failed';
        onFailFallback && onFailFallback();
      }
    };
  }, []);

  // Update markers and path when data changes
  useEffect(() => {
    const viewer = viewerRef.current;
    const CesiumAny: any = (window as any).Cesium;
    if (!viewer || !CesiumAny) return;

    // Clear previous entities (keep base)
    viewer.entities?.removeAll?.();

    // Add markers
    const pts = (markers || []).map((m) => CesiumAny.Cartesian3.fromDegrees(m.lng, m.lat));
    (markers || []).forEach((m, idx) => {
      viewer.entities.add({
        position: CesiumAny.Cartesian3.fromDegrees(m.lng, m.lat),
        point: {
          pixelSize: 10,
          color: CesiumAny.Color.fromCssColorString(idx === 0 ? '#dc2626' : '#2563eb'), // Station red, monasteries blue
          outlineColor: CesiumAny.Color.WHITE,
          outlineWidth: 2,
        },
        label: m.title
          ? {
              text: m.title,
              font: '14px sans-serif',
              style: CesiumAny.LabelStyle.FILL,
              fillColor: CesiumAny.Color.WHITE,
              outlineWidth: 2,
              outlineColor: CesiumAny.Color.BLACK,
              pixelOffset: new CesiumAny.Cartesian2(0, -20),
            }
          : undefined,
      });
    });

    // Add route path if provided
    let positionsForView: any = pts;
    if (path && path.length > 1) {
      const degs: number[] = [];
      path.forEach((p) => {
        degs.push(p.lng, p.lat);
      });
      const polyPositions = CesiumAny.Cartesian3.fromDegreesArray(degs);
      positionsForView = polyPositions;

      viewer.entities.add({
        polyline: {
          positions: polyPositions,
          width: 4,
          material: CesiumAny.Color.fromCssColorString('#1d4ed8'),
          clampToGround: false,
        },
      });

      // Optional: add a moving point at the start for a simple cue
      const first = (Array.isArray(path) && path.length > 0) ? path[0] : undefined;
      if (first) {
        viewer.entities.add({
          position: CesiumAny.Cartesian3.fromDegrees(first.lng, first.lat),
          point: { pixelSize: 12, color: CesiumAny.Color.fromCssColorString('#10b981') },
        });
      }
    }

    // Adjust view
    try {
      if (positionsForView && positionsForView.length > 0) {
        if (positionsForView[0] instanceof CesiumAny.Cartesian3) {
          const bs = CesiumAny.BoundingSphere.fromPoints(positionsForView);
          viewer.scene.camera.flyToBoundingSphere(bs, { duration: 1.2 });
        } else if (positionsForView?.length >= 2) {
          const bs = CesiumAny.BoundingSphere.fromPoints(positionsForView);
          viewer.scene.camera.flyToBoundingSphere(bs, { duration: 1.2 });
        }
      } else {
        // Default to Sikkim region
        viewer.scene.camera.flyTo({
          destination: CesiumAny.Cartesian3.fromDegrees(88.6065, 27.3389, 250000.0),
          duration: 1.0,
        });
      }
    } catch {}
  }, [markers, path, steps]);

  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-2">3D Earth preview</div>
      <div ref={containerRef} style={{ width: '100%', height: 540, borderRadius: 8, overflow: 'hidden' }} />
      {statusRef.current === 'loading' && (
        <div className="mt-2 text-xs text-gray-500">Loading Cesium globe…</div>
      )}
      {statusRef.current === 'failed' && (
        <div className="mt-2 text-xs text-red-600">Failed to load 3D globe. Falling back to 2D map.</div>
      )}
    </div>
  );
}
