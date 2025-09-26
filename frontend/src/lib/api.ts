const BASE_URL = 'http://127.0.0.1:8000/';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL), {
    headers: { 'Accept': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type MediaItem = {
  title: string;
  type: string;
  file_url: string;
  language?: string | null;
};

export type ApiMonastery = {
  id: number;
  name: string;
  location: string;
  founded: string;
  media: MediaItem[];
  info?: any;
  events?: any[];
  archiveItems?: any[];
};

// Frontend-friendly type used by pages/components
export type Monastery = ApiMonastery;

export async function fetchMonasteriesApi(): Promise<ApiMonastery[]> {
  return http<ApiMonastery[]>('/monasteries');
}

export async function fetchMonasteryDetailApi(id: number): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}`);
}

// Convenience wrappers used by pages
export async function fetchMonasteryDetail(id: number): Promise<Monastery> {
  return fetchMonasteryDetailApi(id);
}

export async function fetchMonasteries(): Promise<Monastery[]> {
  return fetchMonasteriesApi();
}

export async function createMonastery(payload: { name: string; location: string; founded: string; }): Promise<Monastery> {
  return http<Monastery>(`/monasteries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadMonasteryMedia(
  monasteryId: number,
  file: File,
  meta?: { title?: string; type?: string }
): Promise<MediaItem> {
  const form = new FormData();
  form.append('file', file);
  if (meta?.title) form.append('title', meta.title);
  if (meta?.type) form.append('type', meta.type);
  return http<MediaItem>(`/monasteries/${monasteryId}/media`, {
    method: 'POST',
    body: form,
  });
}

export async function generateMonasteryNarration(
  monasteryId: number,
  payload: { title?: string; voice?: string; script?: string }
): Promise<MediaItem> {
  return http<MediaItem>(`/monasteries/${monasteryId}/narration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateMonasteryNarrationMultilingual(
  monasteryId: number,
  payload: { title?: string; voice?: string | null; script?: string; target_lang: string }
): Promise<MediaItem> {
  return http<MediaItem>(`/monasteries/${monasteryId}/narration_multilingual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function upsertMonasteryInfo(id: number, payload: any): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function addEvent(id: number, payload: any): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function addArchive(id: number, payload: any): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}/archives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function addAudioHighlight(id: number, payload: any): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}/audio_highlights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// --- AI: Ingest, QnA, Route ---
export async function aiIngest(): Promise<{ count: number }> {
  return http<{ count: number }>(`/ai/ingest`, { method: 'POST' });
}

export async function aiQna(
  question: string,
  top_k = 5,
  target_lang?: string
): Promise<{ answer: string; citations: Array<{ doc_type: string; doc_id: number; title: string }> }> {
  const body: any = { question, top_k };
  if (target_lang) body.target_lang = target_lang;
  return http(`/ai/qna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type RouteStep = { title: string; description: string; lat?: number; lng?: number; estimated_minutes: number };
export type RoutePathPoint = { lat: number; lng: number };
export async function aiRoute(params: { question: string; duration_minutes?: number; start_lat?: number; start_lng?: number; transport_mode?: 'foot' | 'bike' | 'car' }): Promise<{ steps: RouteStep[]; path?: RoutePathPoint[] | null }> {
  return http(`/ai/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

// --- TTS Narration (no API keys required) ---
export async function aiNarrate(params: { text: string; lang: string; title?: string }): Promise<{ file_url: string; title: string; lang: string }> {
  return http(`/ai/narrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

// --- Admin ---
export type QaCacheEntry = { id: number; question: string; lang: string; created_at?: string };
export async function adminListQaCache(): Promise<QaCacheEntry[]> {
  return http<QaCacheEntry[]>(`/admin/qa_cache`);
}

export async function adminClearQaCache(): Promise<{ deleted: number }> {
  return http<{ deleted: number }>(`/admin/qa_cache/clear`, { method: 'POST' });
}

// Mapper from API to Figma types (used by Figma App)
export function mapApiToFigma(m: ApiMonastery) {
  const info = m.info || {};
  const audioGuide = info.audioGuide || {};
  return {
    id: String(m.id),
    name: m.name,
    location: {
      district: info.district || m.location || '',
      coordinates: {
        lat: info.coordinates?.lat ?? 0,
        lng: info.coordinates?.lng ?? 0,
      },
    },
    foundingYear: (info.foundingYear ?? Number(m.founded)) || 0,
    description: info.description || '',
    significance: info.significance || '',
    virtualTourImages: (m.media || []).filter(x => x.type === 'image' || x.type === 'panorama').map(x => x.file_url),
    archiveItems: (m.archiveItems || []).map((a: any) => ({
      id: String(a.id),
      title: a.title,
      type: a.type,
      description: a.description,
      imageUrl: a.imageUrl,
      dateCreated: a.dateCreated,
      digitalizedDate: a.digitalizedDate,
    })),
    audioGuide: {
      introduction: audioGuide.introduction || info.audioGuide?.introduction || info.audioGuide?.intro || info.audio_intro || '',
      highlights: (audioGuide.highlights || []).map((h: any) => ({
        id: String(h.id),
        title: h.title,
        description: h.description,
        duration: h.duration,
        location: h.location,
      })),
      duration: audioGuide.duration || info.audio_duration_min || 0,
    },
    upcomingEvents: (m.events || []).map((e: any) => ({
      id: String(e.id),
      title: e.title,
      date: e.date,
      time: e.time,
      description: e.description,
      type: e.type,
      canBook: !!e.canBook,
      maxParticipants: e.maxParticipants,
    })),
    imageUrl: (m.media || []).find(x => x.type === 'image')?.file_url || '',
  };
}


