import { useEffect, useState } from 'react';

type EventItem = { id: number; title: string; date: string };

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    // Mock fetch for now
    setTimeout(() => {
      setEvents([
        { id: 1, title: 'Losar Festival', date: '2025-02-29' },
        { id: 2, title: 'Saga Dawa', date: '2025-06-10' },
      ]);
    }, 200);
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Events</h1>
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="p-4 rounded border border-gray-200 bg-white flex items-center justify-between">
            <div className="font-medium text-gray-800">{e.title}</div>
            <div className="text-gray-600 text-sm">{new Date(e.date).toDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


