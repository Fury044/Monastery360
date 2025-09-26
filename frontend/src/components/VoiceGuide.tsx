import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { RouteStep, Monastery } from '../lib/api';
import { aiNarrate } from '../lib/api';

export default function VoiceGuide({
  steps,
  monasteries,
  defaultLang = 'en',
  requestPlanRoute,
}: {
  steps: RouteStep[];
  monasteries: Monastery[];
  defaultLang?: string;
  requestPlanRoute?: () => void;
}) {
  const [lang, setLang] = useState(defaultLang);
  const [busy, setBusy] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedMonasteryId, setSelectedMonasteryId] = useState<number | ''>('');
  const autoAdvanceRef = useRef<boolean>(false);
  const cacheRef = useRef<Map<string, string>>(new Map()); // key: `${lang}:${hash(text)}` -> file_url

  const hasRoute = steps && steps.length > 0;

  const languageOptions = [
    { v: 'en', label: 'English' },
    { v: 'hi', label: 'Hindi' },
    { v: 'bn', label: 'Bengali' },
    { v: 'mr', label: 'Marathi' },
    { v: 'gu', label: 'Gujarati' },
    { v: 'ta', label: 'Tamil' },
    { v: 'te', label: 'Telugu' },
    { v: 'kn', label: 'Kannada' },
    { v: 'ml', label: 'Malayalam' },
    { v: 'pa', label: 'Punjabi' },
    { v: 'ur', label: 'Urdu' },
    { v: 'ne', label: 'Nepali' },
  ];

  const findMonasteryByTitle = useCallback((title?: string) => {
    if (!title) return undefined;
    const t = title.toLowerCase();
    return monasteries.find(m => (m.name || '').toLowerCase() === t);
  }, [monasteries]);

  const buildStepScript = useCallback((idx: number) => {
    const s = steps[idx];
    if (!s) return '';
    let text = `Next stop: ${s.title}. ${s.description || ''}. Estimated time here is ${s.estimated_minutes || 10} minutes.`;
    const mon = findMonasteryByTitle(s.title);
    if (mon) {
      const info = mon.info || {};
      const desc = info.description ? ` ${info.description}` : '';
      const founded = mon.founded ? ` Founded: ${mon.founded}.` : '';
      text = `Now visiting ${mon.name} in ${mon.location}.` + founded + desc + ` ${s.description || ''}`;
    }
    return text;
  }, [steps, findMonasteryByTitle]);

  function hashStr(str: string): string {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  }

  const handleOnEnded = useCallback(() => {
    setPlaying(false);
    if (autoAdvanceRef.current && hasRoute) {
      setCurrentIdx((i) => {
        const next = i + 1;
        if (next < steps.length) {
          // queue next step
          setTimeout(() => speak(buildStepScript(next), { setIdxTo: next }), 0);
          return next;
        } else {
          autoAdvanceRef.current = false;
          return i;
        }
      });
    }
  }, [hasRoute, steps.length, buildStepScript]);

  const speak = useCallback(async (text: string, opts?: { setIdxTo?: number }) => {
    setBusy(true);
    try {
      const key = `${lang}:${hashStr(text)}`;
      let url = cacheRef.current.get(key);
      if (!url) {
        const res = await aiNarrate({ text, lang, title: 'Tour Guide' });
        url = res.file_url;
        cacheRef.current.set(key, url);
      }
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.onended = handleOnEnded;
      audioRef.current.src = url;
      if (typeof opts?.setIdxTo === 'number') setCurrentIdx(opts.setIdxTo);
      await audioRef.current.play();
      setPlaying(true);
    } finally {
      setBusy(false);
    }
  }, [lang, handleOnEnded]);

  const startTour = useCallback(async () => {
    if (!hasRoute) {
      requestPlanRoute && requestPlanRoute();
      return;
    }
    setCurrentIdx(0);
    autoAdvanceRef.current = true;
    const text = `Welcome to your guided tour. We have ${steps.length} stops planned. Starting now.`;
    // After welcome ends, autoAdvance handler will kick in to play step 1
    await speak(text);
  }, [hasRoute, steps.length, speak, requestPlanRoute]);

  const playCurrent = useCallback(async () => {
    if (!hasRoute) return;
    await speak(buildStepScript(currentIdx));
  }, [hasRoute, speak, buildStepScript, currentIdx]);

  const playNext = useCallback(async () => {
    if (!hasRoute) return;
    autoAdvanceRef.current = false;
    setCurrentIdx(i => {
      const n = Math.min(steps.length - 1, i + 1);
      setTimeout(() => speak(buildStepScript(n), { setIdxTo: n }), 0);
      return n;
    });
  }, [hasRoute, buildStepScript, speak, steps.length]);

  const playPrev = useCallback(async () => {
    if (!hasRoute) return;
    autoAdvanceRef.current = false;
    setCurrentIdx(i => {
      const n = Math.max(0, i - 1);
      setTimeout(() => speak(buildStepScript(n), { setIdxTo: n }), 0);
      return n;
    });
  }, [hasRoute, buildStepScript, speak]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const resumeAudio = useCallback(() => {
    audioRef.current?.play();
    setPlaying(true);
  }, []);

  const selectedMonastery = useMemo(() => {
    if (selectedMonasteryId === '') return undefined;
    return monasteries.find(m => m.id === selectedMonasteryId);
  }, [selectedMonasteryId, monasteries]);

  const narrateSelectedMonastery = useCallback(async () => {
    if (!selectedMonastery) return;
    const info = selectedMonastery.info || {};
    const text = `About ${selectedMonastery.name}, located in ${selectedMonastery.location}. Founded ${selectedMonastery.founded}. ${info.description || ''}`;
    autoAdvanceRef.current = false;
    await speak(text);
  }, [selectedMonastery, speak]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <div className="text-lg font-montserrat mb-2">Audio Tour Guide</div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm text-gray-700">Guide language</label>
        <select value={lang} onChange={e => setLang(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {languageOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
        <button onClick={startTour} disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">Start Tour</button>
        <button onClick={playCurrent} disabled={busy || !hasRoute} className="rounded-lg bg-indigo-600 px-3 py-2 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">Play Current</button>
        <button onClick={playPrev} disabled={busy || !hasRoute} className="rounded-lg bg-gray-100 border px-3 py-2 text-sm hover:bg-gray-200">Prev</button>
        <button onClick={playNext} disabled={busy || !hasRoute} className="rounded-lg bg-gray-100 border px-3 py-2 text-sm hover:bg-gray-200">Next</button>
        {!playing ? (
          <button onClick={resumeAudio} disabled={busy} className="rounded-lg bg-gray-100 border px-3 py-2 text-sm hover:bg-gray-200">Play</button>
        ) : (
          <button onClick={pauseAudio} disabled={busy} className="rounded-lg bg-gray-100 border px-3 py-2 text-sm hover:bg-gray-200">Pause</button>
        )}
        <button onClick={stopAudio} className="rounded-lg bg-gray-100 border px-3 py-2 text-sm hover:bg-gray-200">Stop</button>
      </div>
      <div className="text-xs text-gray-600 mb-3">{hasRoute ? `Stop ${currentIdx + 1} of ${steps.length}` : 'No planned route yet.'}</div>

      <div className="mt-3">
        <div className="text-sm font-medium mb-2">Monastery overview narration</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedMonasteryId} onChange={(e) => setSelectedMonasteryId(e.target.value ? Number(e.target.value) : '')} className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Select monastery…</option>
            {monasteries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={narrateSelectedMonastery} disabled={!selectedMonastery || busy} className="rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">Narrate Overview</button>
        </div>
      </div>

      {!hasRoute && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-3 p-2">No route is planned. Click "Start Tour" to plan a route first.</div>
      )}
    </div>
  );
}
