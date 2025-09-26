import { useState } from 'react';
import { createMonastery, type Monastery } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function AddMonastery() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [founded, setFounded] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !location || !founded) {
      setError('Please fill all fields');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created: Monastery = await createMonastery({ name, location, founded });
      navigate(`/monastery/${created.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Monastery</h1>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Rumtek Monastery" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Gangtok, Sikkim" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Founded</label>
          <input value={founded} onChange={(e) => setFounded(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="16th century" />
        </div>
        <div className="pt-2">
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
