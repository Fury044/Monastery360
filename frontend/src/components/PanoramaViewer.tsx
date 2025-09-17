import { useEffect, useRef } from 'react';
import * as PANOLENS from 'panolens';

type Props = {
  imageUrl: string;
};

export default function PanoramaViewer({ imageUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<PANOLENS.Viewer | null>(null);
  const panoRef = useRef<PANOLENS.ImagePanorama | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!viewerRef.current) {
      viewerRef.current = new PANOLENS.Viewer({
        container: containerRef.current,
        autoHideInfospot: true,
        controlBar: true,
      });
    }

    if (panoRef.current) {
      viewerRef.current.remove(panoRef.current);
      panoRef.current.dispose();
      panoRef.current = null;
    }

    panoRef.current = new PANOLENS.ImagePanorama(imageUrl);
    viewerRef.current.add(panoRef.current);

    return () => {
      if (panoRef.current && viewerRef.current) {
        viewerRef.current.remove(panoRef.current);
        panoRef.current.dispose();
        panoRef.current = null;
      }
    };
  }, [imageUrl]);

  return <div ref={containerRef} className="w-full h-96 bg-black" />;
}


