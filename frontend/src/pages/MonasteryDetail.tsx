import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMonasteryDetail, uploadMonasteryMedia, generateMonasteryNarration, type Monastery } from '../lib/api';
import PanoramaViewer from '../components/PanoramaViewer';

export default function MonasteryDetail() {
  const params = useParams();
  const id = useMemo(() => Number(params.id), [params.id]);
  const [monastery, setMonastery] = useState<Monastery | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!monastery) return <div className="p-6">Not found.</div>;

  const firstImage = (monastery.media.find((m) => m.type === 'image' || m.type === 'panorama')?.file_url) || monastery.media[0]?.file_url;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!monastery || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setBusy(true);
    try {
      const inferredType = file.type.startsWith('image') ? 'image' : undefined;
      await uploadMonasteryMedia(monastery.id, file, { title: file.name, type: inferredType });
      await reload();
    } catch (err) {
      alert('Upload failed: ' + String(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function handleGenerateNarration() {
    if (!monastery) return;
    setBusy(true);
    try {
      await generateMonasteryNarration(monastery.id, { title: 'Audio Narration', voice: 'alloy' });
      await reload();
    } catch (err) {
      alert('Narration failed: ' + String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{monastery.name}</h1>
          <p className="text-gray-600">{monastery.location} • Founded: {monastery.founded}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center px-3 py-2 rounded border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50">
            <input type="file" className="hidden" onChange={handleUpload} disabled={busy} />
            Upload media
          </label>
          <button onClick={handleGenerateNarration} disabled={busy} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">
            Generate narration
          </button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monastery.media.map((m, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-3 space-y-2 bg-white">
              <div className="text-sm text-gray-700 font-medium">{m.title || m.type}</div>
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
    </div>
  );
}


