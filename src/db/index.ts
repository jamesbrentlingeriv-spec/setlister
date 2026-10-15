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
    id: 'demo-1-midnight-highway',
    title: 'Midnight Highway',
    artist: 'Antigravity Band',
    album: 'Neon Nights',
    originalKey: 'Dm',
    type: 'original',
    tuning: 'Drop D',
    capo: 0,
    timeSignature: '4/4',
    bpm: 120,
    duration: 225, // 3m 45s
    defaultScrollSpeed: 1.5,
    tags: ['Original', 'Drop D', 'Distortion', 'Lead Vox', 'Rock'],
    notes: 'Switch to overdrive pedal on Chorus 2. Drop D tuning essential for heavy low riff.',
    content: `{title: Midnight Highway}
{artist: Antigravity Band}
{key: Dm}
{tuning: Drop D}
{bpm: 120}

[Dm]          [Bb]          [C]          [Dm]
(Heavy low D drum and bass intro riff)

[Dm]Headlights cutting through the [Bb]pouring rain
[C]Running from the static of a [Dm]broken name
[Dm]The engine's roaring in a [Bb]low D tone
[C]Three hundred miles from a [Dm]place called home

{comment: Chorus}
[Bb]Midnight [C]highway, don't let me [Dm]down
[Bb]Tires scream [C]fire through this empty [F]town  [C/E]
[Bb]Take every [C]secret that I [Dm]left behind
[Bb]Out on the [C]blacktop with a [Dm]free mind

{comment: Verse 2}
[Dm]Fluorescent neon flickering in the [Bb]rear-view glass
[C]Shadows move too slow and the [Dm]years move fast
[Dm]Pedal to the floorboard, hear the [Bb]turbo scream
[C]Living on the wire of a [Dm]half-burnt dream

{comment: Chorus}
[Bb]Midnight [C]highway, don't let me [Dm]down
[Bb]Tires scream [C]fire through this empty [F]town  [C/E]
[Bb]Take every [C]secret that I [Dm]left behind
[Bb]Out on the [C]blacktop with a [Dm]free mind

{comment: Bridge}
[Gm]No speed limits, [Am]no red lights
[Bb]Only the thunder and the [C]electric night
[Gm]Hold that wheel with a [Am]steady hand
[Bb]Driving off the edges of the [C]promised land!

{comment: Guitar Solo (Drop D Riffage)}
[Dm]    [Bb]    [C]    [Dm]
[Dm]    [Bb]    [C]    [Dm]

{comment: Final Chorus}
[Bb]Midnight [C]highway, don't let me [Dm]down
[Bb]Tires scream [C]fire through this empty [F]town  [C/E]
[Bb]Take every [C]secret that I [Dm]left behind
[Bb]Out on the [C]blacktop with a [Dm]free mind!

{comment: Outro}
[Dm]          [Bb]          [C]          [Dm]
(Let low D ring out to feedback)`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
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
  },
  {
    id: 'demo-3-superstition',
    title: 'Superstition',
    artist: 'Stevie Wonder',
    album: 'Talking Book',
    originalKey: 'Ebm',
    type: 'cover',
    tuning: 'Eb Standard',
    capo: 0,
    timeSignature: '4/4',
    bpm: 100,
    duration: 265, // 4m 25s
    defaultScrollSpeed: 2.0,
    tags: ['Cover', 'Clavinet Funk', 'Eb Tuning', 'High Energy', 'Groove'],
    notes: 'Guitars tuned down half step (Eb Ab Db Gb Bb Eb) to match clavinet root key. Huge crowd mover!',
    content: `{title: Superstition}
{artist: Stevie Wonder}
{key: Ebm}
{tuning: Eb Standard}
{bpm: 100}

{comment: Funk Clavinet Riff}
[Ebm7]               [Ebm7]               [Ebm7]               [Ebm7]

{comment: Verse 1}
[Ebm7]Very superstitious, writing's on the wall
[Ebm7]Very superstitious, ladders 'bout to fall
[Ebm7]Thirteen-month-old baby, broke the lookin' glass
[Ebm7]Seven years of bad luck, the good things in your past

{comment: Chorus}
[Bb7#9]When you believe in [A7]things that you [Ab7]don't understand
Then you [Bb7#9]suffer,
[A7]    [Ab7]Superstition ain't the [Ebm7]way!

{comment: Clavinet Break}
[Ebm7]               [Ebm7]

{comment: Verse 2}
[Ebm7]Very superstitious, wash your face and hands
[Ebm7]Rid me of the problem, do all that you can
[Ebm7]Keep me in a daydream, keep me goin' strong
[Ebm7]You don't wanna save me, sad is my song

{comment: Chorus}
[Bb7#9]When you believe in [A7]things that you [Ab7]don't understand
Then you [Bb7#9]suffer,
[A7]    [Ab7]Superstition ain't the [Ebm7]way!

{comment: Horn / Solo Section}
[Ebm7]               [Ebm7]               [Ebm7]               [Ebm7]
[Bb7#9]              [A7]   [Ab7]         [Ebm7]

{comment: Verse 3}
[Ebm7]Very superstitious, nothin' more to say
[Ebm7]Very superstitious, the devil's on his way
[Ebm7]Thirteen-month-old baby, broke the lookin' glass
[Ebm7]Seven years of bad luck, good things in your past

{comment: Final Chorus & Outro}
[Bb7#9]When you believe in [A7]things that you [Ab7]don't understand
Then you [Bb7#9]suffer,
[A7]    [Ab7]Superstition ain't the [Ebm7]way!
(Vamp on Ebm7 groove with vocal ad-libs to end)`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    id: 'demo-4-neon-horizons',
    title: 'Neon Horizons',
    artist: 'Antigravity Band',
    album: 'Echoes & Electricity',
    originalKey: 'D',
    type: 'original',
    tuning: 'DADGAD',
    capo: 2,
    timeSignature: '4/4',
    bpm: 95,
    duration: 250, // 4m 10s
    defaultScrollSpeed: 1.0,
    tags: ['Original', 'DADGAD', 'Ambient Reverb', 'Fingerpicking', 'Synth Pad'],
    notes: 'DADGAD tuning with capo on 2nd fret (sounding in E). Heavy lush delay & ambient synth accompaniment.',
    content: `{title: Neon Horizons}
{artist: Antigravity Band}
{key: D}
{tuning: DADGAD}
{capo: 2}
{bpm: 95}

{comment: Ambient DADGAD intro - open drone strings}
[Dsus4]          [Gadd9]          [Bm7]          [Asus4]

{comment: Verse 1}
[Dsus4]City lights fade into violet skies
[Gadd9]Reflections dancing in your emerald eyes
[Bm7]Every sound reverberates through space
[Asus4]Time standing still in this secret place

{comment: Chorus}
[Gadd9]Chasing neon ho[Dsus4]rizons, out where the wire ends
[Bm7]Searching for the frequencies that [Asus4]heal broken bends
[Gadd9]Let the synth pad wash over the [Dsus4]night
[Bm7]Step into the glowing, [Asus4]golden light [Dsus4]

{comment: Verse 2}
[Dsus4]Fingers gliding over open brass
[Gadd9]Watch the midnight shadows softly pass
[Bm7]Echoing chords ring clear and free
[Asus4]Dissolving inside the melody

{comment: Chorus}
[Gadd9]Chasing neon ho[Dsus4]rizons, out where the wire ends
[Bm7]Searching for the frequencies that [Asus4]heal broken bends
[Gadd9]Let the synth pad wash over the [Dsus4]night
[Bm7]Step into the glowing, [Asus4]golden light [Dsus4]

{comment: Outro Drone}
[Dsus4]          [Gadd9]          [Dsus4]
(Sustain final open DADGAD chord)`,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12
  }
];

export const INITIAL_DEMO_SETLISTS: Setlist[] = [
  {
    id: 'setlist-1-main-show',
    name: 'Set 1 - Main Show',
    description: 'Headline festival set featuring heavy Drop D originals, ambient mid-set DADGAD and legendary classic rock anthem.',
    items: [
      {
        id: 'item-1-1',
        type: 'song',
        songId: 'demo-1-midnight-highway',
        durationSeconds: 225,
        notes: 'Kick off with high energy! Check tuner for Drop D.'
      },
      {
        id: 'item-1-2',
        type: 'song',
        songId: 'demo-4-neon-horizons',
        durationSeconds: 250,
        notes: 'Guitar switch to DADGAD acoustic. Swell delay & pad.'
      },
      {
        id: 'item-1-3',
        type: 'break',
        customTitle: '15 Min Intermission',
        durationSeconds: 900,
        notes: 'Band water break, merchandise announcement, swap pedal boards.'
      },
      {
        id: 'item-1-4',
        type: 'song',
        songId: 'demo-2-hotel-california',
        durationSeconds: 390,
        notes: 'Dual guitar solo climax with stage spotlights.'
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24
  },
  {
    id: 'setlist-2-acoustic-encore',
    name: 'Set 2 - Acoustic & Encore',
    description: 'Encore set featuring high tempo funk, extended blues breakdowns, and crowd-participation choruses.',
    items: [
      {
        id: 'item-2-1',
        type: 'song',
        songId: 'demo-2-hotel-california',
        durationSeconds: 390,
        notes: 'Acoustic stripped-down version.'
      },
      {
        id: 'item-2-2',
        type: 'song',
        songId: 'demo-3-superstition',
        durationSeconds: 265,
        notes: 'Get everyone on their feet! Clavinet solo trade-offs.'
      },
      {
        id: 'item-2-3',
        type: 'song',
        songId: 'demo-1-midnight-highway',
        durationSeconds: 225,
        notes: 'Extended encore guitar solo and band bows.'
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 18
  }
];

export async function initializeDatabase(): Promise<void> {
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
