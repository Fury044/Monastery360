import { useState } from 'react';
import { aiIngest, aiQna, aiRoute, type RouteStep } from '../lib/api';
import RouteAnimator from '../components/RouteAnimator';
import MapRouteViewer from '../components/MapRouteViewer';

export default function VisitorAssistant() {
  const [ingesting, setIngesting] = useState(false);
  const [ingestCount, setIngestCount] = useState<number | null>(null);

  const [question, setQuestion] = useState('What should a first-time visitor see in 2 hours?');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<Array<{ doc_type: string; doc_id: number; title: string }> | null>(null);
  const [busyQna, setBusyQna] = useState(false);
  const [qnaLang, setQnaLang] = useState<string>('en');

  const [routeQuestion, setRouteQuestion] = useState('Peaceful tour for a first-time visitor');
  const [duration, setDuration] = useState<number>(90);
  const [steps, setSteps] = useState<RouteStep[] | null>(null);
  const [busyRoute, setBusyRoute] = useState(false);
  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLng, setStartLng] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  async function handleIngest() {
    setIngesting(true);
    try {
      const res = await aiIngest();
      setIngestCount(res.count);
    } catch (e) {
      alert('Ingest failed: ' + String(e));
    } finally {
      setIngesting(false);
    }
  }

  async function handleAsk() {
    setBusyQna(true);
    try {
      const res = await aiQna(question, 5, qnaLang);
      setAnswer(res.answer);
      setCitations(res.citations);
    } catch (e) {
      alert('QnA failed: ' + String(e));
    } finally {
      setBusyQna(false);
    }
  }

  async function handleRoute() {
    setBusyRoute(true);
    try {
      const res = await aiRoute({
        question: routeQuestion,
        duration_minutes: duration,
        start_lat: startLat === null ? undefined : startLat,
        start_lng: startLng === null ? undefined : startLng,
      });
      setSteps(res.steps || []);
    } catch (e) {
      alert('Route failed: ' + String(e));
    } finally {
      setBusyRoute(false);
    }
  }

  function handleUseMyLocation() {
    setLocError(null);
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartLat(pos.coords.latitude);
        setStartLng(pos.coords.longitude);
      },
      (err) => {
        setLocError(err.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visitor Assistant</h1>
        <button onClick={handleIngest} disabled={ingesting} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">
          {ingesting ? 'Building knowledge…' : 'Build knowledge (ingest)'}
        </button>
      </div>
      {ingestCount !== null && (
        <div className="text-sm text-gray-600">Indexed entries: {ingestCount}</div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ask a question</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about monasteries, events, or archives"
          />
          <button onClick={handleAsk} disabled={busyQna} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">
            {busyQna ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Answer language:</span>
          <select value={qnaLang} onChange={(e) => setQnaLang(e.target.value)} className="px-2 py-1 border border-gray-300 rounded bg-white">
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
            <option value="mr">Marathi (mr)</option>
            <option value="bn">Bengali (bn)</option>
            <option value="gu">Gujarati (gu)</option>
            <option value="ta">Tamil (ta)</option>
            <option value="te">Telugu (te)</option>
            <option value="kn">Kannada (kn)</option>
            <option value="ml">Malayalam (ml)</option>
            <option value="pa">Punjabi (pa)</option>
            <option value="ur">Urdu (ur)</option>
            <option value="ne">Nepali (ne)</option>
          </select>
        </div>
        {answer && (
          <div className="p-3 bg-white border border-gray-200 rounded whitespace-pre-wrap text-sm">{answer}</div>
        )}
        {citations && citations.length > 0 && (
          <div className="text-xs text-gray-500">Sources: {citations.map(c => `[${c.doc_type}:${c.doc_id}] ${c.title}`).join('; ')}</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Suggest a route</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="px-3 py-2 border border-gray-300 rounded"
            value={routeQuestion}
            onChange={(e) => setRouteQuestion(e.target.value)}
            placeholder="Visitor intent (e.g., peaceful, first-time)"
          />
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value || '0', 10))}
            placeholder="Duration (minutes)"
            min={20}
          />
          <button onClick={handleRoute} disabled={busyRoute} className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {busyRoute ? 'Planning…' : 'Plan route'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
          <span className="font-medium">Presets:</span>
          <button onClick={() => { setRouteQuestion('Peaceful, meditative tour'); setDuration(90); }} className="px-2 py-1 rounded bg-gray-100 border hover:bg-gray-200">Peaceful (90m)</button>
          <button onClick={() => { setRouteQuestion('Kid-friendly highlights'); setDuration(60); }} className="px-2 py-1 rounded bg-gray-100 border hover:bg-gray-200">Kid-friendly (60m)</button>
          <button onClick={() => { setRouteQuestion('Quick introduction route'); setDuration(45); }} className="px-2 py-1 rounded bg-gray-100 border hover:bg-gray-200">Quick intro (45m)</button>
          <button onClick={() => { setRouteQuestion('Photowalk and scenic spots'); setDuration(120); }} className="px-2 py-1 rounded bg-gray-100 border hover:bg-gray-200">Photowalk (120m)</button>
          <button onClick={() => {
            const params = new URLSearchParams();
            params.set('q', routeQuestion);
            params.set('dur', String(duration));
            if (startLat !== null && startLng !== null) params.set('start', `${startLat},${startLng}`);
            const url = `${window.location.origin}/assistant?${params.toString()}`;
            navigator.clipboard.writeText(url).then(() => alert('Share link copied!')).catch(() => alert('Failed to copy link'));
          }} className="ml-2 px-2 py-1 rounded bg-gray-100 border hover:bg-gray-200">Copy share link</button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <button onClick={handleUseMyLocation} className="px-3 py-1.5 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200">Use my location</button>
          {startLat !== null && startLng !== null && (
            <span className="text-xs text-gray-500">Start: {startLat.toFixed(5)}, {startLng.toFixed(5)}</span>
          )}
          {locError && <span className="text-xs text-red-600">{locError}</span>}
        </div>
        {steps && steps.length > 0 && (
          <ol className="list-decimal pl-6 space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="bg-white border border-gray-200 rounded p-3">
                <div className="font-medium">{s.title} <span className="text-xs text-gray-500">(~{s.estimated_minutes} min)</span></div>
                <div className="text-sm text-gray-700">{s.description}</div>
                {(s.lat !== undefined && s.lng !== undefined) && (
                  <div className="text-xs text-gray-500">Lat: {s.lat}, Lng: {s.lng}</div>
                )}
              </li>
            ))}
          </ol>
        )}

        {steps && steps.some(s => typeof s.lat === 'number' && typeof s.lng === 'number') && (
          <div className="mt-4 space-y-4">
            <MapRouteViewer steps={steps} />
            <div className="text-xs text-gray-500">Canvas preview (fallback)</div>
            <RouteAnimator steps={steps} />
          </div>
        )}
      </section>
    </div>
  );
}
