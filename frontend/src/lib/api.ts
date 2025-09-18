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

export async function fetchMonasteriesApi(): Promise<ApiMonastery[]> {
  return http<ApiMonastery[]>('/monasteries');
}

export async function fetchMonasteryDetailApi(id: number): Promise<ApiMonastery> {
  return http<ApiMonastery>(`/monasteries/${id}`);
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


