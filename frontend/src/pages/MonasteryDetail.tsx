import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMonasteryDetail, type Monastery } from '../lib/api';
import PanoramaViewer from '../components/PanoramaViewer';

export default function MonasteryDetail() {
  const params = useParams();
  const id = useMemo(() => Number(params.id), [params.id]);
  const [monastery, setMonastery] = useState<Monastery | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [filterLang, setFilterLang] = useState<string>('*');

  const langCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const list = monastery?.media || [];
    for (const m of list) {
      if (m.type !== 'audio') continue;
      const code = ((m as any).language?.toLowerCase?.()) || extractLangFromTitle(m.title) || 'unknown';
      counts[code] = (counts[code] || 0) + 1;
    }
    return counts;
  }, [monastery]);

  function extractLangFromTitle(title?: string): string | null {
    if (!title) return null;
    const m = title.match(/\(([^)]+)\)/);
    if (m && m[1]) {
      const code = m[1].trim().toLowerCase();
      if (code.length <= 5) return code;
    }
    return null;
  }

  async function reload() {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonasteryDetail(id);
      setMonastery(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  // Backend generation/upload controls removed in frontend-only mode

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!monastery) return <div className="p-6">Not found.</div>;

  const firstImage = (monastery.media.find((m) => m.type === 'image' || m.type === 'panorama')?.file_url) || monastery.media[0]?.file_url;

  // Upload and narration generation removed

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{monastery.name}</h1>
          <p className="text-gray-600">{monastery.location} • Founded: {monastery.founded}</p>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {firstImage && (
        <div className="rounded overflow-hidden border border-gray-200">
          <PanoramaViewer imageUrl={firstImage} />
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Media</h2>
          <div className="text-xs text-gray-500">Panorama items are shown as images.</div>
        </div>
        {/* Audio playback controls (existing audio only) */}
        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Play narration:</span>
            <select
              className="px-2 py-2 border border-gray-300 rounded text-sm bg-white"
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
            >
              <option value="">— Select —</option>
              {monastery.media.filter(m => m.type === 'audio').map((m, idx) => (
                <option key={idx} value={m.file_url}>{m.title || `Audio ${idx+1}`}</option>
              ))}
            </select>
            <div className="flex-1" />
          </div>
          {/* Audio language filter */}
          <div className="md:col-span-2 flex items-center gap-2">
            <span className="text-sm text-gray-700">Filter audio by language:</span>
            <select className="px-2 py-1 border border-gray-300 rounded text-sm bg-white" value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
              <option value="*">All</option>
              {['en','hi','mr','bn','gu','ta','te','kn','ml','pa','ur','ne'].map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          {selectedAudio && (
            <div className="md:col-span-2">
              <audio controls className="w-full">
                <source src={selectedAudio} />
              </audio>
            </div>
          )}
          {/* Per-language counts removed; generation controls removed */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monastery.media
            .filter(m => filterLang === '*' || (m.type === 'audio' && ((m as any).language ? (m as any).language?.toLowerCase() === filterLang : extractLangFromTitle(m.title) === filterLang)))
            .map((m, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-3 space-y-2 bg-white">
              <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <span>{m.title || m.type}</span>
                {m.type === 'audio' && (((m as any).language) || extractLangFromTitle(m.title)) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">{((m as any).language || extractLangFromTitle(m.title)) as string}</span>
                )}
              </div>
              {(m.type === 'image' || m.type === 'panorama') && (
                <img src={m.file_url} alt={m.title} className="w-full rounded" />
              )}
              {m.type === 'audio' && (
                <audio controls className="w-full">
                  <source src={m.file_url} />
                </audio>
              )}
              {m.type === 'video' && (
                <video controls className="w-full rounded">
                  <source src={m.file_url} />
                </video>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Modal removed */}
    </div>
  );
}


