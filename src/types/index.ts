export type SongType = 'original' | 'cover';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  originalKey: string;
  currentKey?: string;
  type: SongType;
  tuning: string;
  capo: number;
  timeSignature: string;
  bpm: number;
  duration: number; // in seconds
  defaultScrollSpeed: number; // 0.5 to 5.0 (or 1-10)
  tags: string[];
  content: string; // ChordPro or raw monospace lyrics/chords
  notes?: string;
  audioBlob?: Blob;
  audioName?: string;
  audioMime?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SetlistItem {
  id: string;
  type: 'song' | 'break';
  songId?: string;
  customTitle?: string;
  durationSeconds: number;
  notes?: string;
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  items: SetlistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number; // in px, e.g. 20
  wakeLockEnabled: boolean;
  preferSharps: boolean;
  defaultScrollSpeedTier: number;
  autoHideControls: boolean;
  pacingModeDefault: boolean;
  pedalKeybinds: {
    pageDown: string;
    pageUp: string;
    space: string;
    arrowRight: string;
    arrowLeft: string;
    arrowUp: string;
    arrowDown: string;
  };
}
