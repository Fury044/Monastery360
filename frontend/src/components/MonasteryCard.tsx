import { Link } from 'react-router-dom';
import type { Monastery } from '../lib/api';

type Props = {
  monastery: Monastery;
};

export default function MonasteryCard({ monastery }: Props) {
  const thumbnail = monastery.media?.[0]?.file_url;
  return (
    <Link to={`/monastery/${monastery.id}`} className="group rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-md transition">
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={monastery.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{monastery.name}</h3>
        <p className="text-sm text-gray-600">{monastery.location}</p>
      </div>
    </Link>
  );
}


