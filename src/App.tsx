import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './db';
import type { Song, Setlist } from './types';
import { Header } from './components/Header';
import { SongLibrary } from './components/SongLibrary';
import { SetlistBuilder } from './components/SetlistBuilder';
import { StageMode } from './components/StageMode';
import { SongEditorModal } from './components/SongEditorModal';
import { SettingsPanel } from './components/SettingsPanel';
import { useWakeLock } from './hooks/useWakeLock';
import { ThemeProvider } from './context/ThemeContext';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'library' | 'setlists' | 'settings'>('library');
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  
  // Stage mode state
  const [stageSong, setStageSong] = useState<Song | null>(null);
  const [stageSetlist, setStageSetlist] = useState<Setlist | undefined>(undefined);

  // Editor modal state: undefined = closed, null = create new, Song = edit
  const [editorSong, setEditorSong] = useState<Song | null | undefined>(undefined);

  // Wake lock
  const { isActive: wakeLockActive, toggle: toggleWakeLock } = useWakeLock(true);

  // Initialize Dexie DB
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  // Reactive DB queries
  const songs = useLiveQuery(() => db.songs.toArray()) || [];
  const setlists = useLiveQuery(() => db.setlists.toArray()) || [];

  // Set default active setlist id once loaded
  useEffect(() => {
    if (!activeSetlistId && setlists.length > 0) {
      setActiveSetlistId(setlists[0].id);
    }
  }, [setlists, activeSetlistId]);

  // Song CRUD handlers
  const handleSaveSong = async (songData: Partial<Song>) => {
    if (editorSong && editorSong.id) {
      // Update existing
      await db.songs.update(editorSong.id, {
        ...songData,
        updatedAt: Date.now()
      });
    } else {
      // Create new
      const newSong: Song = {
        id: `song-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: songData.title || 'Untitled Song',
        artist: songData.artist || 'Unknown Artist',
        album: songData.album,
        originalKey: songData.originalKey || 'C',
        type: songData.type || 'original',
        tuning: songData.tuning || 'Standard (EADGBE)',
        capo: songData.capo || 0,
        timeSignature: songData.timeSignature || '4/4',
        bpm: songData.bpm || 120,
        duration: songData.duration || 210,
        defaultScrollSpeed: songData.defaultScrollSpeed || 1.0,
        tags: songData.tags || [],
        content: songData.content || '',
        notes: songData.notes,
        audioBlob: songData.audioBlob,
        audioName: songData.audioName,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.songs.add(newSong);
    }
    setEditorSong(undefined);
  };

  const handleDeleteSong = async (id: string) => {
    await db.songs.delete(id);
    // Also remove from any setlists
    const allSetlists = await db.setlists.toArray();
    for (const sl of allSetlists) {
      if (sl.items.some(i => i.songId === id)) {
        await db.setlists.update(sl.id, {
          items: sl.items.filter(i => i.songId !== id),
          updatedAt: Date.now()
        });
      }
    }
  };

  const handleDuplicateSong = async (song: Song) => {
    const duplicated: Song = {
      ...song,
      id: `song-${Date.now()}`,
      title: `${song.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.songs.add(duplicated);
  };

  const handleAddSongToSetlist = async (songId: string, setlistId: string) => {
    const targetSetlist = setlists.find(s => s.id === setlistId);
    const targetSong = songs.find(s => s.id === songId);
    if (!targetSetlist || !targetSong) return;

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'song' as const,
      songId: targetSong.id,
      customTitle: targetSong.title,
      durationSeconds: targetSong.duration,
      notes: targetSong.notes
    };

    await db.setlists.update(setlistId, {
      items: [...targetSetlist.items, newItem],
      updatedAt: Date.now()
    });

    alert(`Added "${targetSong.title}" to setlist "${targetSetlist.name}"!`);
  };

  // Setlist CRUD handlers
  const handleCreateSetlist = async (name: string, description?: string) => {
    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      name,
      description,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.setlists.add(newSetlist);
    setActiveSetlistId(newSetlist.id);
  };

  const handleUpdateSetlist = async (setlist: Setlist) => {
    await db.setlists.put(setlist);
  };

  const handleDeleteSetlist = async (id: string) => {
    await db.setlists.delete(id);
    const remaining = setlists.filter(s => s.id !== id);
    setActiveSetlistId(remaining.length > 0 ? remaining[0].id : null);
  };

  const handleDuplicateSetlist = async (setlist: Setlist) => {
    const duplicated: Setlist = {
      ...setlist,
      id: `setlist-${Date.now()}`,
      name: `${setlist.name} (Copy)`,
      items: setlist.items.map(item => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.setlists.add(duplicated);
    setActiveSetlistId(duplicated.id);
  };

  // Stage Mode Launchers
  const handleOpenStageMode = (song: Song, setlist?: Setlist) => {
    setStageSong(song);
    setStageSetlist(setlist);
  };

  const handleLaunchSetlistStageMode = (setlist: Setlist, startSongId?: string) => {
    const songItems = setlist.items.filter(i => i.type === 'song' && i.songId);
    if (songItems.length === 0) {
      alert('This setlist has no songs to perform.');
      return;
    }

    const targetSongId = startSongId || songItems[0].songId;
    const song = songs.find(s => s.id === targetSongId);
    if (song) {
      setStageSong(song);
      setStageSetlist(setlist);
    }
  };

  const handleLaunchQuickStageMode = () => {
    // If an active setlist with songs exists, open first song
    const currentSetlist = setlists.find(s => s.id === activeSetlistId);
    if (currentSetlist) {
      const firstSongItem = currentSetlist.items.find(i => i.type === 'song' && i.songId);
      if (firstSongItem) {
        const s = songs.find(item => item.id === firstSongItem.songId);
        if (s) {
          handleOpenStageMode(s, currentSetlist);
          return;
        }
      }
    }

    // Otherwise launch first song in library
    if (songs.length > 0) {
      handleOpenStageMode(songs[0]);
    } else {
      alert('Your library is empty. Create a song to launch Stage Mode!');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-white transition-colors">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        songsCount={songs.length}
        setlistsCount={setlists.length}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        onLaunchQuickStageMode={handleLaunchQuickStageMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-36 sm:pb-24">
        {activeTab === 'library' && (
          <SongLibrary
            songs={songs}
            setlists={setlists}
            onOpenStageMode={(s) => handleOpenStageMode(s)}
            onEditSong={(s) => setEditorSong(s)}
            onCreateSong={() => setEditorSong(null)}
            onDeleteSong={handleDeleteSong}
            onDuplicateSong={handleDuplicateSong}
            onAddSongToSetlist={handleAddSongToSetlist}
          />
        )}

        {activeTab === 'setlists' && (
          <SetlistBuilder
            setlists={setlists}
            songs={songs}
            activeSetlistId={activeSetlistId}
            onSelectSetlist={setActiveSetlistId}
            onCreateSetlist={handleCreateSetlist}
            onUpdateSetlist={handleUpdateSetlist}
            onDeleteSetlist={handleDeleteSetlist}
            onDuplicateSetlist={handleDuplicateSetlist}
            onLaunchSetlistStageMode={handleLaunchSetlistStageMode}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            wakeLockActive={wakeLockActive}
            onToggleWakeLock={toggleWakeLock}
            onReloadData={() => {
              // Re-read DB
            }}
          />
        )}
      </main>

      {/* Fullscreen Stage Mode Modal */}
      {stageSong && (
        <StageMode
          currentSong={stageSong}
          setlist={stageSetlist}
          onExit={() => {
            setStageSong(null);
            setStageSetlist(undefined);
          }}
          onSelectSong={(songId) => {
            const nextSong = songs.find(s => s.id === songId);
            if (nextSong) {
              setStageSong(nextSong);
            }
          }}
        />
      )}

      {/* Song Editor Modal */}
      {editorSong !== undefined && (
        <SongEditorModal
          song={editorSong}
          onSave={handleSaveSong}
          onClose={() => setEditorSong(undefined)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
