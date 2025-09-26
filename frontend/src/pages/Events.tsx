import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchMonasteries, type Monastery } from '../lib/api';

export default function EventsPage() {
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

  const events = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date?: string;
      time?: string;
      description?: string;
      type?: string;
      monastery: string;
    }> = [];
    monasteries.forEach((m) => {
      (m.events || []).forEach((e: any) => {
        list.push({
          id: `${m.id}-${e.id}`,
          title: e.title,
          date: e.date,
          time: e.time,
          description: e.description,
          type: e.type,
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
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-gray-600 mt-1">Upcoming ceremonies, rituals and teachings across monasteries.</p>
      </motion.div>

      {loading && <div className="text-sm text-gray-600">Loading events…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {events.map((e, idx) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: Math.min(idx * 0.03, 0.3) }}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="text-xs text-gray-500">{e.date} {e.time ? `• ${e.time}` : ''}</div>
            <div className="mt-1 font-medium">{e.title}</div>
            {e.type && <div className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{e.type}</div>}
            {e.description && <div className="mt-2 text-sm text-gray-600 line-clamp-3">{e.description}</div>}
            <div className="mt-3 text-xs text-gray-500">{e.monastery}</div>
          </motion.div>
        ))}
      </div>

      {!loading && events.length === 0 && (
        <div className="mt-4 text-sm text-gray-600">No events yet. Add events for a monastery in Admin.</div>
      )}
    </div>
  );
}
