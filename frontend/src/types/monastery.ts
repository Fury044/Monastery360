export interface Monastery {
  id: string;
  name: string;
  location: {
    district: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  foundingYear: number;
  description: string;
  significance: string;
  virtualTourImages: string[];
  archiveItems: ArchiveItem[];
  audioGuide: AudioGuideContent;
  upcomingEvents: Event[];
  imageUrl: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  type: 'manuscript' | 'mural' | 'artifact' | 'document';
  description: string;
  imageUrl: string;
  dateCreated?: string;
  digitalizedDate: string;
}

export interface AudioGuideContent {
  introduction: string;
  highlights: AudioHighlight[];
  duration: number; // in minutes
}

export interface AudioHighlight {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  location: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  type: 'festival' | 'ritual' | 'ceremony' | 'teaching';
  canBook: boolean;
  maxParticipants?: number;
}