// Comprehensive Chord Transposition & ChordPro Parsing Engine

const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'DB': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'EB': 3, 'Eb': 3,
  'E': 4, 'FB': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'GB': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'AB': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'BB': 10, 'Bb': 10,
  'B': 11, 'CB': 11, 'Cb': 11
};

// Regex to match root note + optional accidental
const CHORD_ROOT_REGEX = /^([A-G][#b]?)(.*)$/;

/**
 * Transpose a single note by semitones
 */
export function transposeNote(note: string, semitones: number, preferSharps: boolean = true): string {
  const normalized = note.charAt(0).toUpperCase() + note.slice(1);
  const index = NOTE_TO_INDEX[normalized];
  if (index === undefined) return note;

  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return preferSharps ? SHARP_SCALE[newIndex] : FLAT_SCALE[newIndex];
}

/**
 * Transpose a single chord name (e.g. "Am", "F#m7/C#", "Cmaj7", "Bb7#9")
 */
export function transposeChord(chord: string, semitones: number, preferSharps: boolean = true): string {
  if (semitones === 0) return chord;

  // Handle slash chords (e.g. D/F#)
  if (chord.includes('/')) {
    const parts = chord.split('/');
    const mainChord = transposeChord(parts[0], semitones, preferSharps);
    const bassNote = transposeNote(parts[1], semitones, preferSharps);
    return `${mainChord}/${bassNote}`;
  }

  const match = chord.match(CHORD_ROOT_REGEX);
  if (!match) return chord;

  const [, root, extension] = match;
  const newRoot = transposeNote(root, semitones, preferSharps);
  return `${newRoot}${extension}`;
}

/**
 * Transpose all ChordPro chords inside brackets: e.g. [Am] -> [Bm]
 */
export function transposeChordPro(content: string, semitones: number, preferSharps: boolean = true): string {
  if (semitones === 0) return content;

  return content.replace(/\[([A-G][^\]]*)\]/g, (_, chord) => {
    return `[${transposeChord(chord, semitones, preferSharps)}]`;
  });
}

export interface ChordLyricToken {
  chord?: string;
  lyric: string;
}

export interface ParsedLine {
  type: 'chordpro' | 'comment' | 'blank' | 'directive' | 'plain';
  commentText?: string;
  directiveKey?: string;
  directiveValue?: string;
  tokens?: ChordLyricToken[];
  rawText?: string;
}

/**
 * Parse ChordPro line into aligned ChordLyric tokens
 * E.g.: "[Dm]Headlights cutting through the [Bb]pouring rain"
 * tokens:
 *   [chord: "Dm", lyric: "Headlights cutting through the "]
 *   [chord: "Bb", lyric: "pouring rain"]
 */
export function parseChordProLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: 'blank', rawText: '' };
  }

  // Directive check: {title: ...}, {artist: ...}, {key: ...}, {c: ...}, {comment: ...}
  const directiveMatch = line.match(/^\s*\{([^:]+)(?::\s*(.*))?\}\s*$/);
  if (directiveMatch) {
    const key = directiveMatch[1].trim().toLowerCase();
    const value = (directiveMatch[2] || '').trim();
    if (key === 'comment' || key === 'c' || key === 'ci') {
      return { type: 'comment', commentText: value, rawText: line };
    }
    return { type: 'directive', directiveKey: key, directiveValue: value, rawText: line };
  }

  // Check if line contains chords in brackets
  if (!line.includes('[') || !line.includes(']')) {
    return { type: 'plain', rawText: line };
  }

  const tokens: ChordLyricToken[] = [];
  const regex = /\[([A-G][^\]]*)\]|([^\[]+)/g;
  let match: RegExpExecArray | null;
  let currentChord: string | undefined = undefined;

  while ((match = regex.exec(line)) !== null) {
    if (match[1] !== undefined) {
      // Bracket chord found
      if (currentChord) {
        // Two consecutive chords without lyrics in between (e.g. "[G]  [C]")
        tokens.push({ chord: currentChord, lyric: ' ' });
      }
      currentChord = match[1];
    } else if (match[2] !== undefined) {
      // Lyric text found
      tokens.push({
        chord: currentChord,
        lyric: match[2]
      });
      currentChord = undefined;
    }
  }

  if (currentChord) {
    tokens.push({ chord: currentChord, lyric: '' });
  }

  return {
    type: 'chordpro',
    tokens,
    rawText: line
  };
}

/**
 * Format total duration seconds into "M:SS" or "H:MM:SS"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
