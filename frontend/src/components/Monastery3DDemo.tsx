import React, { useEffect, useRef } from 'react';

/**
 * Monastery3DDemo
 * - Uses the web component <model-viewer> loaded from a CDN (no extra NPM deps)
 * - Shows a temple/lantern style model as a stand-in demo for a monastery 3D asset
 * - Swap the src prop to point to your own GLB/GLTF when ready
 */
export default function Monastery3DDemo({ src }: { src?: string }) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const id = 'model-viewer-script';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.id = id;
      s.type = 'module';
      s.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(s);
      scriptLoaded.current = true;
    } else {
      scriptLoaded.current = true;
    }
  }, []);

  // Default demo asset (public sample from Khronos glTF Sample-Models)
  const url = src || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb';

  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-2">Monastery 3D demo (placeholder asset)</div>
      {/* @ts-ignore */}
      <model-viewer
        src={url}
        alt="Monastery 3D demo"
        style={{ width: '100%', height: 500, borderRadius: 8, overflow: 'hidden', background: '#111' }}
        camera-controls
        exposure="0.9"
        shadow-intensity="1"
        auto-rotate
        autoplay
        ar="false"
      />
    </div>
  );
}
