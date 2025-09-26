import { useEffect, useState } from 'react';
import { adminListQaCache, adminClearQaCache, aiIngest, type QaCacheEntry } from '../lib/api';

export default function Admin() {
  const [entries, setEntries] = useState<QaCacheEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const rows = await adminListQaCache();
      setEntries(rows);
    } catch (e) {
      setMessage('Failed to load cache: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await adminClearQaCache();
      setMessage(`Cleared ${res.deleted} entries`);
      await load();
    } catch (e) {
      setMessage('Failed to clear: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleIngest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await aiIngest();
      setMessage(`Ingested ${res.count} items`);
    } catch (e) {
      setMessage('Ingest failed: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleIngest} disabled={busy} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">Run Ingest</button>
          <button onClick={handleClear} disabled={busy} className="px-3 py-2 rounded bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60">Clear QnA Cache</button>
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm border hover:bg-gray-200">Refresh</button>
        </div>
      </div>
      {message && <div className="text-sm text-gray-700">{message}</div>}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-3 py-2 border-b text-sm text-gray-600">QnA Cache (latest 200)</div>
        {loading ? (
          <div className="p-3 text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="divide-y">
            {entries.length === 0 && <div className="p-3 text-sm text-gray-500">No entries</div>}
            {entries.map((e) => (
              <div key={e.id} className="p-3 text-sm">
                <div className="font-medium text-gray-800">[{e.lang}] {e.question}</div>
                {e.created_at && <div className="text-xs text-gray-500">{e.created_at}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
