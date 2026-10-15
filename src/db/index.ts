import Dexie, { type Table } from 'dexie';
import type { Song, Setlist, AppSettings } from '../types';

export class SetlisterDB extends Dexie {
  songs!: Table<Song, string>;
  setlists!: Table<Setlist, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('SetlisterDB');
    this.version(1).stores({
      songs: 'id, title, artist, album, originalKey, type, tuning, bpm, createdAt, updatedAt',
      setlists: 'id, name, createdAt, updatedAt',
      settings: 'key'
    });
  }
}

export const db = new SetlisterDB();

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 22,
  wakeLockEnabled: true,
  preferSharps: true,
  defaultScrollSpeedTier: 1.0,
  autoHideControls: false,
  pacingModeDefault: false,
  pedalKeybinds: {
    pageDown: 'scroll_down',
    pageUp: 'scroll_up',
    space: 'play_pause',
    arrowRight: 'next_song',
    arrowLeft: 'prev_song',
    arrowUp: 'speed_up',
    arrowDown: 'speed_down'
  }
};

export const INITIAL_DEMO_SONGS: Song[] = [
  {
    id: 'demo-2-hotel-california',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    originalKey: 'Bm',
    type: 'cover',
    tuning: 'Standard (EADGBE)',
    capo: 7,
    timeSignature: '4/4',
    bpm: 75,
    duration: 390, // 6m 30s
    defaultScrollSpeed: 0.5,
    tags: ['Cover', 'Acoustic', '12-String', 'Dual Guitar Solo', 'Classic Rock'],
    notes: 'Capo 7 for acoustic 12-string fingerpicking. Stage cue: Don on harmonize vocals at chorus.',
    content: `{title: Hotel California}
{artist: Eagles}
{key: Bm}
{capo: 7}
{bpm: 75}

{comment: Intro (12-string fingerstyle)}
[Bm]     [F#7]     [A]     [E7]     [G]     [D]     [Em]     [F#7]

{comment: Verse 1}
[Bm]On a dark desert highway, [F#7]cool wind in my hair
[A]Warm smell of colitas, [E7]rising up through the air
[G]Up ahead in the distance, [D]I saw a shimmering light
[Em]My head grew heavy and my sight grew dim, [F#7]I had to stop for the night

{comment: Verse 2}
[Bm]There she stood in the doorway, [F#7]I heard the mission bell
[A]And I was thinking to myself this could be [E7]heaven or this could be hell
[G]Then she lit up a candle, [D]and she showed me the way
[Em]There were voices down the corridor, [F#7]I thought I heard them say:

{comment: Chorus}
[G]Welcome to the Hotel Cali[D]fornia
Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face
[G]Plenty of room at the Hotel Cali[D]fornia
Any [Em]time of year (any time of year), you can [F#7]find it here

{comment: Verse 3}
[Bm]Her mind is Tiffany-twisted, [F#7]she got the Mercedes bends
[A]She got a lot of pretty, pretty boys [E7]she calls friends
[G]How they dance in the courtyard, [D]sweet summer sweat
[Em]Some dance to remember, [F#7]some dance to forget

{comment: Verse 4}
[Bm]So I called up the Captain, [F#7]"Please bring me my wine"
He said, [A]"We haven't had that spirit here since [E7]nineteen sixty-nine"
[G]And still those voices are calling from [D]far away
[Em]Wake you up in the middle of the night, [F#7]just to hear them say:

{comment: Chorus}
[G]Welcome to the Hotel Cali[D]fornia
Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face
[G]They livin' it up at the Hotel Cali[D]fornia
What a [Em]nice surprise (what a nice surprise), bring your [F#7]alibis

{comment: Verse 5}
[Bm]Mirrors on the ceiling, [F#7]the pink champagne on ice
And she said, [A]"We are all just prisoners here [E7]of our own device"
[G]And in the master's chambers, [D]they gathered for the feast
[Em]They stab it with their steely knives, but they [F#7]just can't kill the beast

{comment: Verse 6}
[Bm]Last thing I remember, I was [F#7]running for the door
[A]I had to find the passage back to the [E7]place I was before
[G]"Relax," said the night man, "We are [D]programmed to receive
[Em]You can check out any time you like, but [F#7]you can never leave!"

{comment: Iconic Dual Guitar Solo}
[Bm]     [F#7]     [A]     [E7]
[G]      [D]       [Em]    [F#7]
(Lead lines harmonize in thirds then fade out)`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  }
];

export const INITIAL_DEMO_SETLISTS: Setlist[] = [
  {
    id: 'setlist-1-main-show',
    name: 'Set 1 - Acoustic Classics',
    description: 'Acoustic rehearsal and live performance set.',
    items: [
      {
        id: 'item-1-1',
        type: 'song',
        songId: 'demo-2-hotel-california',
        durationSeconds: 390,
        notes: 'Dual guitar solo climax with stage spotlights.'
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24
  }
];

export async function initializeDatabase(): Promise<void> {
  // Purge deprecated demo songs if present in user's browser/device IndexedDB
  const deprecatedIds = ['demo-1-midnight-highway', 'demo-3-superstition', 'demo-4-neon-horizons'];
  await db.songs.bulkDelete(deprecatedIds);

  // Clean up any items in existing setlists that referenced deprecated demo songs
  const allSetlists = await db.setlists.toArray();
  for (const sl of allSetlists) {
    const filteredItems = sl.items.filter(item => item.type !== 'song' || !item.songId || !deprecatedIds.includes(item.songId));
    if (filteredItems.length !== sl.items.length) {
      await db.setlists.update(sl.id, { items: filteredItems });
    }
  }

  const songCount = await db.songs.count();
  if (songCount === 0) {
    await db.songs.bulkAdd(INITIAL_DEMO_SONGS);
  }

  const setlistCount = await db.setlists.count();
  if (setlistCount === 0) {
    await db.setlists.bulkAdd(INITIAL_DEMO_SETLISTS);
  }

  const currentSettings = await db.settings.get('app_settings');
  if (!currentSettings) {
    await db.settings.put({ key: 'app_settings', value: DEFAULT_SETTINGS });
  }
}
