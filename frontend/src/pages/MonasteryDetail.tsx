import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMonasteryById, type Monastery } from '../lib/api';
import PanoramaViewer from '../components/PanoramaViewer';

export default function MonasteryDetail() {
  const params = useParams();
  const id = useMemo(() => Number(params.id), [params.id]);
  const [monastery, setMonastery] = useState<Monastery | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    fetchMonasteryById(id)
      .then((data) => setMonastery(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!monastery) return <div className="p-6">Not found.</div>;

  const firstImage = monastery.media.find((m) => m.type === 'image')?.file_url || monastery.media[0]?.file_url;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{monastery.name}</h1>
        <p className="text-gray-600">{monastery.location} • Founded: {monastery.founded}</p>
      </div>

      {firstImage && (
        <div className="rounded overflow-hidden border border-gray-200">
          <PanoramaViewer imageUrl={firstImage} />
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monastery.media.map((m, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-3 space-y-2 bg-white">
              <div className="text-sm text-gray-700 font-medium">{m.title || m.type}</div>
              {m.type === 'image' && (
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


