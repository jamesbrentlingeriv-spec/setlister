import React, { useState, useRef } from 'react';
import { 
  X, Save, Music, Sliders, Check, Layers
} from 'lucide-react';
import type { Song, SongType } from '../types';
import { AudioDeck } from './AudioDeck';

interface SongEditorModalProps {
  song?: Song | null;
  onSave: (songData: Partial<Song>) => void;
  onClose: () => void;
}

const COMMON_TUNINGS = [
  'Standard (EADGBE)',
  'Drop D',
  'Eb Standard',
  'DADGAD',
  'Open G',
  'Open D',
  'Half-Step Down',
  'Drop C'
];

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Abm'
];

const COMMON_TAGS = [
  'Acoustic', 'Distortion', 'Lead Vox', 'Synth Pad', 'Electric Guitar',
  '12-String', 'Harmonica', 'Dual Solo', 'Fingerpicking', 'Ballad', 'Encore'
];

const CHORD_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

type AccidentalMode = 'natural' | 'sharp' | 'flat';

interface ChordVariationDef {
  suffix: string;
  name: string;
  badge?: string;
  category: 'triad' | 'sustain' | 'seventh' | 'extended' | 'dim-aug';
}

const CHORD_VARIATIONS: ChordVariationDef[] = [
  // Triads & Basic
  { suffix: '', name: 'Major', badge: 'Maj', category: 'triad' },
  { suffix: 'm', name: 'Minor', badge: 'Min', category: 'triad' },
  { suffix: '5', name: 'Power Chord', badge: '5', category: 'triad' },

  // Suspended & Sustain
  { suffix: 'sus4', name: 'Sustain 4 (sus4)', badge: 'sus4', category: 'sustain' },
  { suffix: 'sus2', name: 'Sustain 2 (sus2)', badge: 'sus2', category: 'sustain' },
  { suffix: '7sus4', name: 'Sustain 7 (7sus4)', badge: '7sus4', category: 'sustain' },
  { suffix: 'sus', name: 'Suspended (sus)', badge: 'sus', category: 'sustain' },

  // 7ths
  { suffix: '7', name: 'Dominant 7th', badge: '7', category: 'seventh' },
  { suffix: 'm7', name: 'Minor 7th', badge: 'm7', category: 'seventh' },
  { suffix: 'maj7', name: 'Major 7th', badge: 'maj7', category: 'seventh' },
  { suffix: 'dim7', name: 'Diminished 7th', badge: 'dim7', category: 'seventh' },
  { suffix: 'm7b5', name: 'Half-Diminished', badge: 'm7b5', category: 'seventh' },
  { suffix: 'm(maj7)', name: 'Minor-Major 7th', badge: 'm(maj7)', category: 'seventh' },

  // Extended & Add
  { suffix: 'add9', name: 'Add 9', badge: 'add9', category: 'extended' },
  { suffix: '9', name: 'Dominant 9th', badge: '9', category: 'extended' },
  { suffix: 'm9', name: 'Minor 9th', badge: 'm9', category: 'extended' },
  { suffix: 'maj9', name: 'Major 9th', badge: 'maj9', category: 'extended' },
  { suffix: '6', name: 'Major 6th', badge: '6', category: 'extended' },
  { suffix: 'm6', name: 'Minor 6th', badge: 'm6', category: 'extended' },
  { suffix: '6/9', name: 'Six-Nine (6/9)', badge: '6/9', category: 'extended' },
  { suffix: '11', name: '11th', badge: '11', category: 'extended' },
  { suffix: '13', name: '13th', badge: '13', category: 'extended' },

  // Diminished & Augmented / Altered
  { suffix: 'dim', name: 'Diminished', badge: 'dim', category: 'dim-aug' },
  { suffix: 'aug', name: 'Augmented (+)', badge: 'aug', category: 'dim-aug' },
  { suffix: '7#9', name: '7#9 (Hendrix)', badge: '7#9', category: 'dim-aug' },
  { suffix: '7b9', name: '7b9 Flat 9', badge: '7b9', category: 'dim-aug' },
  { suffix: '7#5', name: '7#5 Sharp 5', badge: '7#5', category: 'dim-aug' },
];

const SLASH_BASS_NOTES: Record<string, string[]> = {
  'A': ['C#', 'E', 'G#', 'G', 'B'],
  'A#': ['D', 'F', 'A', 'G#'],
  'Ab': ['C', 'Eb', 'G', 'Gb'],
  'B': ['D#', 'F#', 'A#', 'A', 'C#'],
  'Bb': ['D', 'F', 'A', 'Ab', 'C'],
  'C': ['E', 'G', 'B', 'Bb', 'D'],
  'C#': ['F', 'G#', 'C', 'B'],
  'Db': ['F', 'Ab', 'C', 'B'],
  'D': ['F#', 'A', 'C#', 'C', 'E'],
  'D#': ['G', 'A#', 'D', 'C#'],
  'Eb': ['G', 'Bb', 'D', 'Db'],
  'E': ['G#', 'B', 'D#', 'D', 'F#'],
  'F': ['A', 'C', 'E', 'Eb', 'G'],
  'F#': ['A#', 'C#', 'F', 'E'],
  'Gb': ['Bb', 'Db', 'F', 'E'],
  'G': ['B', 'D', 'F#', 'F', 'A'],
  'G#': ['C', 'D#', 'G', 'F#'],
};

export const SongEditorModal: React.FC<SongEditorModalProps> = ({
  song,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [album, setAlbum] = useState(song?.album || '');
  const [originalKey, setOriginalKey] = useState(song?.originalKey || 'C');
  const [type, setType] = useState<SongType>(song?.type || 'original');
  const [tuning, setTuning] = useState(song?.tuning || 'Standard (EADGBE)');
  const [capo, setCapo] = useState<number>(song?.capo || 0);
  const [timeSignature, setTimeSignature] = useState(song?.timeSignature || '4/4');
  const [bpm, setBpm] = useState<number>(song?.bpm || 120);
  
  const initialDuration = song?.duration || 210;
  const [durationMins, setDurationMins] = useState<number>(Math.floor(initialDuration / 60));
  const [durationSecs, setDurationSecs] = useState<number>(initialDuration % 60);

  const [defaultScrollSpeed, setDefaultScrollSpeed] = useState<number>(song?.defaultScrollSpeed || 1.0);
  const [tags, setTags] = useState<string[]>(song?.tags || []);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [content, setContent] = useState<string>(song?.content || '');
  const [notes, setNotes] = useState<string>(song?.notes || '');

  const [audioBlob, setAudioBlob] = useState<Blob | undefined>(song?.audioBlob);
  const [audioName, setAudioName] = useState<string | undefined>(song?.audioName);

  // Popup Overlay for Chord Variations
  const [overlayRoot, setOverlayRoot] = useState<string | null>(null);
  const [overlayAccidental, setOverlayAccidental] = useState<AccidentalMode>('natural');
  const [overlayFilter, setOverlayFilter] = useState<'all' | 'triad' | 'sustain' | 'seventh' | 'extended' | 'dim-aug' | 'slash'>('all');
  const [chordToast, setChordToast] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getEffectiveRoot = (base: string, mode: AccidentalMode): string => {
    if (mode === 'sharp') {
      if (base === 'B' || base === 'E') return base;
      return base + '#';
    }
    if (mode === 'flat') {
      if (base === 'C' || base === 'F') return base;
      return base + 'b';
    }
    return base;
  };

  const effectiveOverlayRoot = overlayRoot ? getEffectiveRoot(overlayRoot, overlayAccidental) : 'G';
  const slashBassNotes = SLASH_BASS_NOTES[effectiveOverlayRoot] || ['3rd', '5th', '7th'];

  const filteredOverlayVariations = CHORD_VARIATIONS.filter(v => {
    if (overlayFilter === 'all') return true;
    return v.category === overlayFilter;
  });

  // Extract unique chords currently typed in the lyrics sheet
  const chordsInSong = Array.from(
    new Set(Array.from(content.matchAll(/\[([A-G][b#]?[^\]]*)\]/g)).map(m => m[1]))
  ).slice(0, 12);

  const insertChord = (chordSymbol: string) => {
    const chordFormatted = `[${chordSymbol}]`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const before = content.substring(0, start);
      const after = content.substring(end);
      
      const needsSpaceAfter = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n');
      const insertedText = chordFormatted + (needsSpaceAfter ? ' ' : '');
      
      const newContent = before + insertedText + after;
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + insertedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 20);
    } else {
      setContent(prev => prev + (prev.endsWith(' ') || prev.endsWith('\n') || prev === '' ? '' : ' ') + chordFormatted + ' ');
    }

    setChordToast(`Inserted ${chordFormatted}`);
    setTimeout(() => {
      setChordToast(null);
    }, 1500);
  };

  const insertComment = (label: string) => {
    const tag = `{comment: ${label}}`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const before = content.substring(0, start);
      const after = content.substring(end);

      const prefix = before.endsWith('\n') || before === '' ? '' : '\n';
      const suffix = after.startsWith('\n') ? '' : '\n';
      const inserted = prefix + tag + suffix;

      setContent(before + inserted + after);
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + inserted.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 20);
    } else {
      setContent(prev => prev + '\n' + tag + '\n');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Song title is required.');
      return;
    }

    const totalDurationSeconds = (Math.max(0, durationMins) * 60) + Math.min(59, Math.max(0, durationSecs));

    onSave({
      title: title.trim(),
      artist: artist.trim() || 'Unknown Artist',
      album: album.trim() || undefined,
      originalKey,
      type,
      tuning,
      capo,
      timeSignature,
      bpm: Math.max(20, bpm),
      duration: totalDurationSeconds,
      defaultScrollSpeed,
      tags,
      content,
      notes: notes.trim() || undefined,
      audioBlob,
      audioName
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-[max(3.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
      <div className="bg-white dark:bg-[#0c0c0c] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {song ? 'Edit Song' : 'Create New Song'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure chords, metadata, audio track, and scroll pacing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - Ample Bottom Padding to prevent cutoff on mobile */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28">
          
          {/* Basic Info: Title, Artist, Album, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Song Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Midnight Highway"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Artist
              </label>
              <input
                type="text"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                placeholder="Artist name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Album
              </label>
              <input
                type="text"
                value={album}
                onChange={e => setAlbum(e.target.value)}
                placeholder="Album name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Song Type
              </label>
              <div className="flex rounded-xl border border-neutral-300 dark:border-neutral-800 overflow-hidden p-0.5 bg-neutral-100 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setType('original')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'original' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setType('cover')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'cover' 
                      ? 'bg-neutral-800 text-white shadow-sm' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Cover
                </button>
              </div>
            </div>
          </div>

          {/* Performance & Instrument Settings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Performance &amp; Instrument Settings</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* Original Key */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Key
                </label>
                <select
                  value={originalKey}
                  onChange={e => setOriginalKey(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                >
                  {COMMON_KEYS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Guitar Tuning */}
              <div className="col-span-2 sm:col-span-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Guitar Tuning
                </label>
                <select
                  value={tuning}
                  onChange={e => setTuning(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium text-sm"
                >
                  {COMMON_TUNINGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Capo */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Capo
                </label>
                <select
                  value={capo}
                  onChange={e => setCapo(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                >
                  <option value={0}>None</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(f => (
                    <option key={f} value={f}>Fret {f}</option>
                  ))}
                </select>
              </div>

              {/* BPM */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={bpm}
                  onChange={e => setBpm(parseInt(e.target.value, 10) || 120)}
                  className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                />
              </div>

              {/* Time Signature */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Time Sig
                </label>
                <input
                  type="text"
                  value={timeSignature}
                  onChange={e => setTimeSignature(e.target.value)}
                  placeholder="4/4"
                  className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                />
              </div>
            </div>

            {/* Duration & Default Auto-Scroll Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Duration (Minutes &amp; Seconds)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={durationMins}
                    onChange={e => setDurationMins(parseInt(e.target.value, 10) || 0)}
                    placeholder="Mins"
                    className="w-20 px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                  />
                  <span className="font-bold text-neutral-400">m</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={durationSecs}
                    onChange={e => setDurationSecs(parseInt(e.target.value, 10) || 0)}
                    placeholder="Secs"
                    className="w-20 px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-stage-mono font-bold text-sm"
                  />
                  <span className="font-bold text-neutral-400">s</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Default Scroll Speed Tier: <span className="font-stage-mono font-bold text-blue-600 dark:text-blue-400">{defaultScrollSpeed.toFixed(1)}x</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={defaultScrollSpeed}
                    onChange={e => setDefaultScrollSpeed(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {[0.5, 1.0, 1.5, 2.0].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDefaultScrollSpeed(s)}
                        className={`px-2 py-1 text-xs rounded font-stage-mono font-bold ${
                          defaultScrollSpeed === s 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Audio Deck inside Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Reference Audio &amp; Live Rehearsal Memo
            </label>
            <AudioDeck
              audioBlob={audioBlob}
              audioName={audioName}
              onSaveAudio={(blob, name) => {
                setAudioBlob(blob);
                setAudioName(name);
              }}
              onDeleteAudio={() => {
                setAudioBlob(undefined);
                setAudioName(undefined);
              }}
            />
          </div>

          {/* Instrumentation & Gear Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Instrumentation &amp; Gear Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder="Add custom gear tag (e.g. Synth Pad, Distortion)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-3.5 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[11px] text-neutral-400 mr-1 self-center">Suggestions:</span>
              {COMMON_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-blue-500 border border-neutral-200 dark:border-neutral-800"
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Lyrics & ChordPro Engine Editor */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Lyrics &amp; ChordPro Sheet
              </label>

              {/* Just the Letters Visible & Small (A through G) + Section Markers */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-neutral-400 text-[11px] mr-1">Chords:</span>
                {CHORD_LETTERS.map(letter => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => {
                      setOverlayRoot(letter);
                      setOverlayAccidental('natural');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-stage-mono font-bold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 transition-all shadow-xs"
                    title={`Tap to open ${letter} chord variations overlay`}
                  >
                    {letter}
                  </button>
                ))}

                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 hidden sm:block" />

                {/* Quick Section Markers */}
                {['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => insertComment(sec)}
                    className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 font-medium transition-colors"
                  >
                    +{sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Chips of Chords already in Sheet */}
            {chordsInSong.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-500" />
                  <span>In sheet:</span>
                </span>
                {chordsInSong.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => insertChord(c)}
                    className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-stage-mono font-bold text-xs hover:bg-blue-600 hover:text-white border border-neutral-200 dark:border-neutral-800 transition-all"
                  >
                    [{c}]
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={14}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Enter lyrics with ChordPro brackets, e.g.:
[Am]Walking down the [F]street
[C]Listening to the [G]beat...

Tap any chord letter (A–G) above to open the full chord overlay!`}
              className="w-full p-4 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-black font-stage-mono text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stage Cues / Gear Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Live Stage Notes &amp; Equipment Cues
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Switch delay pedal on solo, Don harmonize chorus..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Footer Actions with Blue Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="touch-target flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Song</span>
            </button>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* OVERLAY POPUP: ALL CHORD VARIATIONS FOR CLICKED LETTER                    */}
        {/* ========================================================================= */}
        {overlayRoot && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
            onClick={() => setOverlayRoot(null)}
          >
            <div 
              className="bg-white dark:bg-[#111111] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-3xl w-full max-w-lg shadow-2xl p-4 sm:p-5 space-y-4 max-h-[82vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Overlay Top Bar */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-stage-mono font-black text-base shadow-md shadow-blue-500/25">
                    {effectiveOverlayRoot}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-1.5">
                      <span>{effectiveOverlayRoot} Chords</span>
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Tap any chord to insert into sheet at cursor
                    </p>
                  </div>
                </div>

                {/* Accidental / Modifier Pills */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setOverlayAccidental('natural')}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                      overlayAccidental === 'natural'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    ♮ Natural
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayAccidental('sharp')}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                      overlayAccidental === 'sharp'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    ♯ Sharp
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayAccidental('flat')}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                      overlayAccidental === 'flat'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    ♭ Flat
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOverlayRoot(null)}
                  className="touch-target p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100 dark:border-neutral-900 pb-2 shrink-0">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'triad', label: 'Maj / Min' },
                    { id: 'sustain', label: 'Sustain' },
                    { id: 'seventh', label: '7ths' },
                    { id: 'extended', label: 'Extended' },
                    { id: 'dim-aug', label: 'Dim / Aug' },
                    { id: 'slash', label: 'Bass / Slash' }
                  ] as const
                ).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setOverlayFilter(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      overlayFilter === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of All Chord Variations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto flex-1 pr-1 max-h-[48vh]">
                {overlayFilter !== 'slash' && filteredOverlayVariations.map(v => {
                  const chord = `${effectiveOverlayRoot}${v.suffix}`;
                  return (
                    <button
                      key={v.suffix}
                      type="button"
                      onClick={() => insertChord(chord)}
                      className="touch-target p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex flex-col items-center justify-center text-center transition-all group active:scale-95"
                    >
                      <span className="font-stage-mono font-bold text-base text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        [{chord}]
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium truncate max-w-full mt-0.5">
                        {v.name}
                      </span>
                    </button>
                  );
                })}

                {/* Slash Chords */}
                {(overlayFilter === 'all' || overlayFilter === 'slash') && slashBassNotes.map(bass => {
                  const slashChord = `${effectiveOverlayRoot}/${bass}`;
                  return (
                    <button
                      key={bass}
                      type="button"
                      onClick={() => insertChord(slashChord)}
                      className="touch-target p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex flex-col items-center justify-center text-center transition-all group active:scale-95"
                    >
                      <span className="font-stage-mono font-bold text-base text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        [{slashChord}]
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium truncate max-w-full mt-0.5">
                        /{bass} Bass
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Overlay Footer */}
              <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3 text-xs shrink-0">
                <div>
                  {chordToast ? (
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4" />
                      {chordToast}
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">
                      Tip: tap any chord to insert directly into sheet
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOverlayRoot(null)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
