import { db } from '../db';
import type { Song, Setlist } from '../types';

export interface SetlisterBackupData {
  version: number;
  timestamp: number;
  songs: (Omit<Song, 'audioBlob'> & { audioBase64?: string })[];
  setlists: Setlist[];
}

// Convert Blob to Base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Data URL/Base64 string to Blob
function base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts.length > 1 ? parts[0].split(':')[1] : mimeType;
  const raw = window.atob(parts.length > 1 ? parts[1] : parts[0]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export async function exportBackup(): Promise<void> {
  const allSongs = await db.songs.toArray();
  const allSetlists = await db.setlists.toArray();

  const serializedSongs: (Omit<Song, 'audioBlob'> & { audioBase64?: string })[] = [];

  for (const song of allSongs) {
    const { audioBlob, ...rest } = song;
    let audioBase64: string | undefined = undefined;
    if (audioBlob) {
      try {
        audioBase64 = await blobToBase64(audioBlob);
      } catch (err) {
        console.warn('Failed to serialize audio for song:', song.title, err);
      }
    }
    serializedSongs.push({
      ...rest,
      audioBase64
    });
  }

  const backupData: SetlisterBackupData = {
    version: 1,
    timestamp: Date.now(),
    songs: serializedSongs,
    setlists: allSetlists
  };

  const json = JSON.stringify(backupData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const filename = `Setlister-Backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ songsCount: number; setlistsCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data: SetlisterBackupData = JSON.parse(text);

        if (!data || !data.songs || !data.setlists) {
          throw new Error('Invalid Setlister backup JSON format.');
        }

        const deserializedSongs: Song[] = [];
        for (const s of data.songs) {
          const { audioBase64, ...rest } = s;
          let audioBlob: Blob | undefined = undefined;
          if (audioBase64) {
            try {
              audioBlob = base64ToBlob(audioBase64, s.audioMime || 'audio/webm');
            } catch (err) {
              console.warn('Failed to restore audio blob for song:', s.title, err);
            }
          }
          deserializedSongs.push({
            ...rest,
            audioBlob
          });
        }

        // Save into Dexie
        await db.transaction('rw', [db.songs, db.setlists], async () => {
          for (const song of deserializedSongs) {
            await db.songs.put(song);
          }
          for (const setlist of data.setlists) {
            await db.setlists.put(setlist);
          }
        });

        resolve({
          songsCount: deserializedSongs.length,
          setlistsCount: data.setlists.length
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
