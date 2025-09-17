import { useEffect, useState } from 'react';

type ArchiveItem = { id: number; title: string; image?: string; tags: string[] };

export default function Archives() {
  const [items, setItems] = useState<ArchiveItem[]>([]);

  useEffect(() => {
    // Mock fetch for now
    setTimeout(() => {
      setItems([
        { id: 1, title: 'Manuscript A', image: '', tags: ['Tibetan', 'Script'] },
        { id: 2, title: 'Thangka Painting', image: '', tags: ['Art'] },
        { id: 3, title: 'Scroll B', image: '', tags: ['Script'] },
      ]);
    }, 200);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Archives</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.id} className="border border-gray-200 rounded bg-white p-3">
            <div className="aspect-square bg-gray-100 rounded mb-2" />
            <div className="font-medium text-gray-800">{it.title}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {it.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


