import React, { useEffect, useRef } from 'react';

type Props = { imageUrl: string };

// Minimal integration with Pannellum (no npm dep) for equirectangular panoramas
export default function PanoramaViewer({ imageUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  // load pannellum assets once
  useEffect(() => {
    const cssId = 'pannellum-css';
    const jsId = 'pannellum-js';
    if (!document.getElementById(cssId)) {
      const l = document.createElement('link');
      l.id = cssId;
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      document.head.appendChild(l);
    }
    if (!document.getElementById(jsId)) {
      const s = document.createElement('script');
      s.id = jsId;
      s.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const iv = setInterval(() => {
      // @ts-ignore
      const pannellum = (window as any).pannellum;
      if (!pannellum || !containerRef.current) return;
      clearInterval(iv);
      if (disposed) return;
      try {
        if (viewerRef.current) {
          viewerRef.current.destroy?.();
          viewerRef.current = null;
        }
        viewerRef.current = pannellum.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: imageUrl,
          autoLoad: true,
          showControls: true,
          compass: false,
          hfov: 100,
        });
      } catch {}
    }, 50);
    return () => { disposed = true; clearInterval(iv); try { viewerRef.current?.destroy?.(); } catch {} };
  }, [imageUrl]);

  return (
    <div className="w-full" style={{ height: 420 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: '#000' }} />
    </div>
  );
}
