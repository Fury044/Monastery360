import { useEffect, useState } from 'react';
import { fetchMonasteries, type Monastery } from '../lib/api';
import MonasteryCard from '../components/MonasteryCard';

export default function Home() {
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonasteries()
      .then((data) => setMonasteries(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Monasteries</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {monasteries.map((m) => (
          <MonasteryCard key={m.id} monastery={m} />
        ))}
      </div>
    </div>
  );
}


