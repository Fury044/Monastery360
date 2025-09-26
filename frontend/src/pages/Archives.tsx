import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchMonasteries, type Monastery } from '../lib/api';

export default function ArchivesPage() {
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMonasteries();
        setMonasteries(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type?: string;
      description?: string;
      imageUrl?: string;
      monastery: string;
    }> = [];
    monasteries.forEach((m) => {
      (m.archiveItems || []).forEach((a: any) => {
        list.push({
          id: `${m.id}-${a.id}`,
          title: a.title,
          type: a.type,
          description: a.description,
          imageUrl: a.imageUrl,
          monastery: m.name,
        });
      });
    });
    return list;
  }, [monasteries]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Digital Archives</h1>
        <p className="text-gray-600 mt-1">Manuscripts, murals, artifacts and documents curated across monasteries.</p>
      </motion.div>

      {loading && <div className="text-sm text-gray-600">Loading archives…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: Math.min(idx * 0.02, 0.25) }}
            className="group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="aspect-[4/3] overflow-hidden bg-gray-50">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400 text-sm">No image</div>
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-medium line-clamp-1">{a.title}</div>
              <div className="mt-0.5 text-xs text-gray-500">{a.monastery}</div>
              {a.type && <div className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{a.type}</div>}
              {a.description && <div className="mt-2 text-xs text-gray-600 line-clamp-2">{a.description}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="mt-4 text-sm text-gray-600">No archives yet. Add archive entries via Admin.</div>
      )}
    </div>
  );
}
