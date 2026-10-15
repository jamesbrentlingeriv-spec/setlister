import React, { useState, useMemo } from 'react';
import { 
  Plus, Play, Trash2, Copy, MoveUp, MoveDown, 
  Clock, Music, Coffee, Layers, Search, X, 
  Sliders 
} from 'lucide-react';
import type { Setlist, SetlistItem, Song } from '../types';
import { formatDuration } from '../utils/chordEngine';

interface SetlistBuilderProps {
  setlists: Setlist[];
  songs: Song[];
  activeSetlistId: string | null;
  onSelectSetlist: (id: string) => void;
  onCreateSetlist: (name: string, description?: string) => void;
  onUpdateSetlist: (setlist: Setlist) => void;
  onDeleteSetlist: (id: string) => void;
  onDuplicateSetlist: (setlist: Setlist) => void;
  onLaunchSetlistStageMode: (setlist: Setlist, startSongId?: string) => void;
}

export const SetlistBuilder: React.FC<SetlistBuilderProps> = ({
  setlists,
  songs,
  activeSetlistId,
  onSelectSetlist,
  onCreateSetlist,
  onUpdateSetlist,
  onDeleteSetlist,
  onDuplicateSetlist,
  onLaunchSetlistStageMode
}) => {
  const [isNewSetlistModalOpen, setIsNewSetlistModalOpen] = useState<boolean>(false);
  const [newSetName, setNewSetName] = useState<string>('');
  const [newSetDescription, setNewSetDescription] = useState<string>('');
  const [isSongPoolOpen, setIsSongPoolOpen] = useState<boolean>(false);
  const [songPoolSearch, setSongPoolSearch] = useState<string>('');
  const [isAddBreakModalOpen, setIsAddBreakModalOpen] = useState<boolean>(false);
  const [breakTitle, setBreakTitle] = useState<string>('15 Min Intermission');
  const [breakMins, setBreakMins] = useState<number>(15);
  const [breakNotes, setBreakNotes] = useState<string>('Band break, check gear, merchandise announcement');

  const currentSetlist = useMemo(() => {
    return setlists.find(s => s.id === activeSetlistId) || setlists[0] || null;
  }, [setlists, activeSetlistId]);

  const songsMap = useMemo(() => {
    const map = new Map<string, Song>();
    songs.forEach(s => map.set(s.id, s));
    return map;
  }, [songs]);

  const analytics = useMemo(() => {
    if (!currentSetlist) return { totalSeconds: 0, songCount: 0, breakCount: 0, tunings: [] as { tuning: string; count: number }[] };

    let totalSeconds = 0;
    let songCount = 0;
    let breakCount = 0;
    const tuningCountMap = new Map<string, number>();

    currentSetlist.items.forEach(item => {
      totalSeconds += item.durationSeconds || 0;
      if (item.type === 'song') {
        songCount++;
        const s = item.songId ? songsMap.get(item.songId) : null;
        if (s?.tuning) {
          tuningCountMap.set(s.tuning, (tuningCountMap.get(s.tuning) || 0) + 1);
        }
      } else {
        breakCount++;
      }
    });

    const tunings = Array.from(tuningCountMap.entries()).map(([tuning, count]) => ({
      tuning,
      count
    }));

    return { totalSeconds, songCount, breakCount, tunings };
  }, [currentSetlist, songsMap]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!currentSetlist) return;
    const items = [...currentSetlist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    onUpdateSetlist({
      ...currentSetlist,
      items,
      updatedAt: Date.now()
    });
  };

  const removeItem = (itemId: string) => {
    if (!currentSetlist) return;
    const items = currentSetlist.items.filter(i => i.id !== itemId);
    onUpdateSetlist({
      ...currentSetlist,
      items,
      updatedAt: Date.now()
    });
  };

  const addSongToSetlist = (song: Song) => {
    if (!currentSetlist) return;
    const newItem: SetlistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'song',
      songId: song.id,
      customTitle: song.title,
      durationSeconds: song.duration,
      notes: song.notes
    };

    onUpdateSetlist({
      ...currentSetlist,
      items: [...currentSetlist.items, newItem],
      updatedAt: Date.now()
    });
  };

  const addBreakToSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSetlist) return;

    const newItem: SetlistItem = {
      id: `break-${Date.now()}`,
      type: 'break',
      customTitle: breakTitle,
      durationSeconds: breakMins * 60,
      notes: breakNotes
    };

    onUpdateSetlist({
      ...currentSetlist,
      items: [...currentSetlist.items, newItem],
      updatedAt: Date.now()
    });

    setIsAddBreakModalOpen(false);
  };

  const handleCreateNewSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    onCreateSetlist(newSetName.trim(), newSetDescription.trim() || undefined);
    setNewSetName('');
    setNewSetDescription('');
    setIsNewSetlistModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Setlist Selector Pills & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Setlist <span className="text-blue-600 dark:text-blue-400">Builder</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Design gig runtimes, tuning transitions, and intermission pacing
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewSetlistModalOpen(true)}
          className="touch-target flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Setlist</span>
        </button>
      </div>

      {/* Setlist Tabs / Selector Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {setlists.map(sl => {
          const isSelected = currentSetlist?.id === sl.id;
          return (
            <button
              key={sl.id}
              type="button"
              onClick={() => onSelectSetlist(sl.id)}
              className={`touch-target px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected 
                  ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/25' 
                  : 'bg-white dark:bg-[#0c0c0c] text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{sl.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isSelected ? 'bg-black/25 text-white' : 'bg-neutral-200 dark:bg-neutral-900 text-neutral-500'
              }`}>
                {sl.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {currentSetlist ? (
        <div className="space-y-6">
          {/* Active Setlist Summary Card & Live Analytics */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-850">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                    {currentSetlist.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onDuplicateSetlist(currentSetlist)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded transition-colors"
                    title="Duplicate Setlist"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete setlist "${currentSetlist.name}"?`)) {
                        onDeleteSetlist(currentSetlist.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                    title="Delete Setlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {currentSetlist.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
                    {currentSetlist.description}
                  </p>
                )}
              </div>

              {/* One-Tap Launch Setlist in Stage Mode */}
              <button
                type="button"
                onClick={() => onLaunchSetlistStageMode(currentSetlist)}
                disabled={currentSetlist.items.filter(i => i.type === 'song').length === 0}
                className="touch-target flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Perform Live (Stage Mode)</span>
              </button>
            </div>

            {/* Dynamic Setlist Analytics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Total Runtime</span>
                </div>
                <div className="font-stage-mono text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {formatDuration(analytics.totalSeconds)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-500" />
                  <span>Songs</span>
                </div>
                <div className="font-stage-mono text-xl font-black text-neutral-900 dark:text-white mt-1">
                  {analytics.songCount} Tracks
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Breaks</span>
                </div>
                <div className="font-stage-mono text-xl font-black text-neutral-900 dark:text-white mt-1">
                  {analytics.breakCount} Markers
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-500" />
                  <span>Tunings</span>
                </div>
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                  {analytics.tunings.length === 0 ? 'None' : analytics.tunings.map(t => `${t.count}x ${t.tuning}`).join(', ')}
                </div>
              </div>
            </div>

            {/* Setlist Action Bar: Add Song & Add Break */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsSongPoolOpen(true)}
                className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs border border-neutral-300 dark:border-neutral-700 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-pink-500" />
                <span>Add Songs from Library</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddBreakModalOpen(true)}
                className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-400 font-bold text-xs border border-amber-300 dark:border-amber-800 active:scale-95 transition-all"
              >
                <Coffee className="w-4 h-4" />
                <span>Insert Intermission / Break</span>
              </button>
            </div>
          </div>

          {/* Setlist Items Order List */}
          <div className="space-y-3">
            {currentSetlist.items.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
                <Music className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">This setlist is empty</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Add songs from your catalog or insert intermission markers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSongPoolOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl rainbow-bg text-white font-bold text-xs"
                >
                  Pick Songs from Library
                </button>
              </div>
            ) : (
              currentSetlist.items.map((item, idx) => {
                if (item.type === 'break') {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 text-neutral-900 dark:text-neutral-100 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-amber-700 dark:text-amber-400">
                              {item.customTitle || 'Intermission'}
                            </span>
                            <span className="font-stage-mono text-xs px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              {formatDuration(item.durationSeconds)}
                            </span>
                          </div>
                          {item.notes && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{item.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === currentSetlist.items.length - 1}
                          className="p-2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-neutral-400 hover:text-rose-500"
                          title="Remove Break"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                const song = item.songId ? songsMap.get(item.songId) : null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-[#0c0c0c] hover:border-pink-500/30 flex items-center justify-between gap-3 shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center font-stage-mono font-bold text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
                        {idx + 1}
                      </span>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {song?.title || item.customTitle || 'Unknown Song'}
                          </h4>
                          {song && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-stage-mono font-black rainbow-chord bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                              {song.originalKey}
                            </span>
                          )}
                          {song && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-900">
                              {song.tuning}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          <span>{song?.artist || 'Unknown Artist'}</span>
                          <span>•</span>
                          <span className="font-stage-mono">{formatDuration(item.durationSeconds)}</span>
                          {item.notes && (
                            <>
                              <span>•</span>
                              <span className="text-amber-500 truncate">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {song && (
                        <button
                          type="button"
                          onClick={() => onLaunchSetlistStageMode(currentSetlist, song.id)}
                          className="p-2 text-neutral-500 hover:text-pink-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                          title="Start Stage Mode from this song"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === currentSetlist.items.length - 1}
                        className="p-2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-neutral-400 hover:text-rose-500"
                        title="Remove from setlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {/* Song Pool Picker Modal with Safe Area Insets */}
      {isSongPoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-[#0c0c0c] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Add Songs to "{currentSetlist?.name}"</h3>
              <button
                type="button"
                onClick={() => setIsSongPoolOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={songPoolSearch}
                  onChange={e => setSongPoolSearch(e.target.value)}
                  placeholder="Filter song library..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {songs
                .filter(s => {
                  if (!songPoolSearch.trim()) return true;
                  const q = songPoolSearch.toLowerCase();
                  return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.tuning.toLowerCase().includes(q);
                })
                .map(song => (
                  <div
                    key={song.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between gap-3 hover:border-pink-500/40 transition-colors"
                  >
                    <div className="truncate">
                      <div className="font-bold text-sm truncate text-neutral-900 dark:text-white">{song.title}</div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span>{song.artist}</span>
                        <span>•</span>
                        <span className="font-stage-mono font-black rainbow-chord">{song.originalKey}</span>
                        <span>•</span>
                        <span>{song.tuning}</span>
                        <span>•</span>
                        <span>{formatDuration(song.duration)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSongToSetlist(song)}
                      className="touch-target flex items-center gap-1 px-3.5 py-1.5 rounded-lg rainbow-bg text-white font-bold text-xs shadow active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSongPoolOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Break / Intermission Modal */}
      {isAddBreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-[#0c0c0c] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
              <Coffee className="w-5 h-5 text-amber-500" />
              <span>Insert Intermission / Break</span>
            </h3>

            <form onSubmit={addBreakToSetlist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Title / Marker Name
                </label>
                <input
                  type="text"
                  required
                  value={breakTitle}
                  onChange={e => setBreakTitle(e.target.value)}
                  placeholder="e.g. 15 Min Intermission"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={breakMins}
                  onChange={e => setBreakMins(parseInt(e.target.value, 10) || 15)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-stage-mono font-bold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Stage Cue / Band Instructions
                </label>
                <input
                  type="text"
                  value={breakNotes}
                  onChange={e => setBreakNotes(e.target.value)}
                  placeholder="e.g. Water break, guitar swap, announcement..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBreakModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Insert Marker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Setlist Modal */}
      {isNewSetlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-[#0c0c0c] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-neutral-900 dark:text-white">Create New Named Setlist</h3>
            <form onSubmit={handleCreateNewSetlist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Setlist Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSetName}
                  onChange={e => setNewSetName(e.target.value)}
                  placeholder="e.g. Festival Headline 2026, Acoustic Gig..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Description / Venue Notes
                </label>
                <textarea
                  rows={3}
                  value={newSetDescription}
                  onChange={e => setNewSetDescription(e.target.value)}
                  placeholder="e.g. 75 min headline slot, 2 encores planned."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSetlistModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl rainbow-bg text-white font-bold text-xs shadow-md"
                >
                  Create Setlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
