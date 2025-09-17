import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
});

export type MediaItem = {
  title: string;
  type: string;
  file_url: string;
};

export type Monastery = {
  id: number;
  name: string;
  location: string;
  founded: string;
  media: MediaItem[];
};

export async function fetchMonasteries(): Promise<Monastery[]> {
  const res = await api.get<Monastery[]>('/monasteries');
  return res.data;
}

export async function fetchMonasteryById(id: number): Promise<Monastery | undefined> {
  const monasteries = await fetchMonasteries();
  return monasteries.find((m) => m.id === id);
}


