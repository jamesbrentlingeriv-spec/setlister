import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Music, Play, Edit3, Trash2, 
  Copy, Volume2, Layers 
} from 'lucide-react';
import type { Song, Setlist, SongType } from '../types';
import { formatDuration } from '../utils/chordEngine';

interface SongLibraryProps {
  songs: Song[];
  setlists: Setlist[];
  onOpenStageMode: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onCreateSong: () => void;
  onDeleteSong: (id: string) => void;
  onDuplicateSong: (song: Song) => void;
  onAddSongToSetlist: (songId: string, setlistId: string) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  songs,
  setlists,
  onOpenStageMode,
  onEditSong,
  onCreateSong,
  onDeleteSong,
  onDuplicateSong,
  onAddSongToSetlist
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTuning, setSelectedTuning] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<'All' | SongType>('All');
  const [selectedKey, setSelectedKey] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [minBpm] = useState<number>(0);
  const [maxBpm] = useState<number>(300);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'recent' | 'bpm' | 'key'>('recent');
  
  const [activeSetlistPickerSongId, setActiveSetlistPickerSongId] = useState<string | null>(null);

  const availableTunings = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => {
      if (s.tuning) set.add(s.tuning);
    });
    return Array.from(set).sort();
  }, [songs]);

  const availableKeys = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => {
      if (s.originalKey) set.add(s.originalKey);
    });
    return Array.from(set).sort();
  }, [songs]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => {
      s.tags?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [songs]);

  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = song.title.toLowerCase().includes(query);
        const matchesArtist = song.artist.toLowerCase().includes(query);
        const matchesAlbum = song.album?.toLowerCase().includes(query) || false;
        const matchesLyrics = song.content.toLowerCase().includes(query);
        const matchesTags = song.tags.some(t => t.toLowerCase().includes(query));

        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesLyrics && !matchesTags) {
          return false;
        }
      }

      if (selectedTuning !== 'All' && song.tuning !== selectedTuning) {
        return false;
      }

      if (selectedType !== 'All' && song.type !== selectedType) {
        return false;
      }

      if (selectedKey !== 'All' && song.originalKey !== selectedKey) {
        return false;
      }

      if (selectedTag !== 'All' && (!song.tags || !song.tags.includes(selectedTag))) {
        return false;
      }

      if (song.bpm < minBpm || song.bpm > maxBpm) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'bpm':
          return a.bpm - b.bpm;
        case 'key':
          return a.originalKey.localeCompare(b.originalKey);
        case 'recent':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [songs, searchQuery, selectedTuning, selectedType, selectedKey, selectedTag, minBpm, maxBpm, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTuning('All');
    setSelectedType('All');
    setSelectedKey('All');
    setSelectedTag('All');
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery !== '' || selectedTuning !== 'All' || selectedType !== 'All' || selectedKey !== 'All' || selectedTag !== 'All' || minBpm > 0 || maxBpm < 300;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Song <span className="text-blue-600 dark:text-blue-400">Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {songs.length} songs cataloged • {filteredSongs.length} matching current filter
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateSong}
          className="touch-target flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Song</span>
        </button>
      </div>

      {/* Global Search & Multi-Attribute Filter Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 space-y-4 shadow-sm">
        {/* Global Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search songs, artists, albums, lyrics, chords..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Quick Filter: Guitar Tuning */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Tuning:</span>
            <select
              value={selectedTuning}
              onChange={e => setSelectedTuning(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            >
              <option value="All">All Tunings</option>
              {availableTunings.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Quick Filter: Type (Original / Cover) */}
          <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-800 overflow-hidden p-0.5 bg-neutral-200 dark:bg-neutral-900">
            {(['All', 'original', 'cover'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 text-xs font-bold rounded capitalize transition-all ${
                  selectedType === t 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Key Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Key:</span>
            <select
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-stage-mono font-bold border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            >
              <option value="All">All Keys</option>
              {availableKeys.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Gear / Tag Dropdown */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Tag:</span>
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
              >
                <option value="All">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
            >
              <option value="recent">Recently Added / Updated</option>
              <option value="title">Title (A - Z)</option>
              <option value="artist">Artist</option>
              <option value="bpm">BPM (Tempo)</option>
              <option value="key">Key</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Song Grid List */}
      {filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
          <Music className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="text-lg font-bold">No songs match your criteria</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
            Try adjusting your search query, clearing filters, or create a brand new song.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-bold"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map(song => (
            <div
              key={song.id}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-[#0c0c0c] hover:border-pink-500/40 transition-all flex flex-col justify-between shadow-sm relative group"
            >
              <div>
                {/* Header: Title, Artist, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate text-neutral-900 dark:text-white group-hover:text-pink-500 transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {song.artist} {song.album ? `• ${song.album}` : ''}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 ${
                    song.type === 'original'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
                  }`}>
                    {song.type}
                  </span>
                </div>

                {/* Performance Pill Badges with Blue Touches */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {/* Key Badge */}
                  <span className="px-2 py-1 rounded-md text-xs font-stage-mono font-black text-blue-600 dark:text-blue-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                    Key: {song.originalKey}
                  </span>

                  {/* Tuning Badge */}
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-800">
                    {song.tuning}
                  </span>

                  {/* Capo Badge */}
                  {song.capo > 0 && (
                    <span className="px-2 py-1 rounded-md text-xs font-stage-mono font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      Capo {song.capo}
                    </span>
                  )}

                  {/* BPM */}
                  <span className="px-2 py-1 rounded-md text-xs font-stage-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                    {song.bpm} BPM
                  </span>

                  {/* Duration */}
                  <span className="px-2 py-1 rounded-md text-xs font-stage-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                    {formatDuration(song.duration)}
                  </span>

                  {/* Audio indicator */}
                  {song.audioBlob && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      Audio Track
                    </span>
                  )}
                </div>

                {/* Instrumentation Tags */}
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {song.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions Deck */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-850">
                {/* Launch Stage Mode Button with Blue Accent */}
                <button
                  type="button"
                  onClick={() => onOpenStageMode(song)}
                  className="touch-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Stage Mode</span>
                </button>

                {/* Secondary Actions */}
                <div className="flex items-center gap-1 relative">
                  <button
                    type="button"
                    onClick={() => setActiveSetlistPickerSongId(activeSetlistPickerSongId === song.id ? null : song.id)}
                    className="touch-target p-2 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Add to a Setlist"
                  >
                    <Layers className="w-5 h-5" />
                  </button>

                  {/* Quick Setlist Picker Dropdown */}
                  {activeSetlistPickerSongId === song.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-56 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-2xl z-30 animate-fade-in">
                      <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 px-2 py-1 mb-1 border-b border-neutral-200 dark:border-neutral-800">
                        Add to Setlist:
                      </div>
                      {setlists.length === 0 ? (
                        <div className="p-2 text-xs text-neutral-400">No setlists created yet</div>
                      ) : (
                        setlists.map(sl => (
                          <button
                            key={sl.id}
                            type="button"
                            onClick={() => {
                              onAddSongToSetlist(song.id, sl.id);
                              setActiveSetlistPickerSongId(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-pink-600 hover:text-white transition-colors truncate"
                          >
                            {sl.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onDuplicateSong(song)}
                    className="touch-target p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Duplicate Song"
                  >
                    <Copy className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditSong(song)}
                    className="touch-target p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Edit Song"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${song.title}" from library?`)) {
                        onDeleteSong(song.id);
                      }
                    }}
                    className="touch-target p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Song"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
