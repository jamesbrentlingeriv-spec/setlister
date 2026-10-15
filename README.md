# Setlister — Live Performance & Rehearsal Companion

**Setlister** is a high-contrast, offline-first cross-platform application engineered specifically for live gigs, stage performances, rehearsal spaces, and band jam sessions. Built with React (TypeScript), Tailwind CSS, Dexie.js (IndexedDB), and pre-configured with Capacitor for direct Android APK compilation and PWA installation.

---

## 🌟 Key Features

### 1. Dual-Theme Stage Engine
- **AMOLED Dark Mode (Stage Default)**:
  - Background: Pure AMOLED black (`#000000`).
  - Cards & Borders: Deep charcoal (`#0c0c0c` / `#141414`).
  - Accents: High-visibility neon green (`#22c55e` / `#10b981`) for chords, active playback states, and transport controls.
- **Daylight White Mode (Outdoor / Glare-Resistant)**:
  - Background: Pure stark white (`#ffffff`).
  - High-contrast pitch-black text (`#000000`) for direct sunlight readability.
  - Emerald/Forest accents (`#15803d` / `#16a34a`).
- **Dynamic System Tinting**: Seamlessly syncs `<meta name="theme-color">` to match system bars on mobile and desktop.

### 2. Live Hardware & Stage-Ready UX
- **Screen Wake Lock**: Integrated via `navigator.wakeLock` with automatic state persistence and tab re-activation to ensure your screen never dims or locks during a set.
- **Large Touch Targets**: 48px+ minimum touch targets across all interactive buttons for quick stage tapping on floor tablets or mic stands.
- **Orientation Responsive**: Fluid layout adapting to portrait (mic stand clamp) and landscape (stage floor monitor / wedge).
- **Bluetooth Foot Pedal & Keyboard Mapping**:
  - `Spacebar`: Play / Pause auto-scroll & audio.
  - `PageDown` / `Down Arrow`: Scroll down / advance stage section.
  - `PageUp` / `Up Arrow`: Scroll up / previous section.
  - `Right Arrow`: Jump to next song in the setlist queue.
  - `Left Arrow`: Jump to previous song in the setlist queue.
  - `Shift + Up / Down`: Increase or decrease scroll speed on the fly.

### 3. Song Library & Multi-Attribute Search Engine
- **Complete Song Metadata**: Title, Artist, Album, Key, Original vs. Cover badge, Guitar Tuning (Standard, Drop D, DADGAD, Eb, Open G, etc.), Capo Position, Time Signature, BPM, Duration, Default Scroll Speed, and Instrumentation/Gear tags.
- **Deep Filter & Sort**: Real-time fuzzy filtering across titles, artists, lyrics, tunings, and gear tags. Sort by Title, Artist, BPM, Key, or Recently Updated.
- **ChordPro & Transposition Engine**:
  - Full ChordPro bracket parsing (`[Am]Walking down the [F]street`) and `{comment: ...}` section highlights.
  - Real-time semitone transposer (`+1` / `-1` / Reset) with sharp/flat toggle (`#` / `b`).
  - Aligns chords directly above words and syllables in fixed monospace stage typography.
- **Integrated Audio Deck & Live Recording**:
  - Record live rehearsals and vocal memos directly via `navigator.mediaDevices.getUserMedia` into IndexedDB.
  - Import external reference tracks (`.mp3`, `.wav`, `.m4a`).
  - Scrubber, tempo slider (0.75x to 1.25x), and A-B looper for practicing complex bridges or guitar solos.

### 4. Multi-Setlist Builder & Dynamic Analytics
- Create, duplicate, rename, and delete unlimited custom setlists.
- Reorder songs with simple Up/Down controls.
- Insert intermission / break markers (e.g., "15 Min Intermission") with custom stage cues.
- **Live Analytics**: Total gig runtime calculation, song count, break count, and guitar tuning transition breakdown.
- **JSON Backup & Restore**: Full export/import utility including Base64-serialized audio recordings.

### 5. Multi-Speed Continuous Auto-Scroll Engine
- Continuous smooth scrolling powered by `requestAnimationFrame`.
- Preset speed tiers: `0.5x` (Ballads), `1.0x` (Standard), `1.5x` (Brisk Rock), `2.0x` (High Tempo Punk/Funk), and custom fine-step `+` / `-` adjustments.
- **Pacing Calculation Mode**: Automatically computes required velocity (pixels/second) based on total song duration so the sheet reaches the bottom precisely when the song finishes.
- **Per-Song Speed Memory**: Remembers and loads each song's individual speed preference.
- **Reference Audio Sync**: Scrolling automatically syncs with reference audio playback.

---

## 🎵 Preloaded Realistic Demo Content

Upon first launch, Setlister automatically seeds with a classic stage-ready demo track and setlist:

1. **"Hotel California"** (Cover - Eagles):
   - Tuning: `Standard (EADGBE)` | Key: `Bm` | Capo: `7` | BPM: `75` | Duration: `6:30` | Default Speed: `0.5x`
   - Gear Tags: `Cover`, `Acoustic`, `12-String`, `Dual Guitar Solo`, `Classic Rock`
   - Features classic acoustic intro, complete verses, choruses, and dual solo outro.

**Sample Setlist**:
- **"Set 1 - Acoustic Classics"**: Hotel California.

---

## 🛠️ Step-by-Step Developer Guide

### Prerequisites
- Node.js (v18+ recommended, v24+ tested)
- npm or pnpm

---

### 1. Local Development & PWA Testing

#### Run Development Server:
```bash
npm run dev
```
Open your browser at the local URL (e.g., `http://localhost:5173/`).

#### Build Production PWA Bundle:
```bash
npm run build
```
This compiles the TypeScript code, bundles the assets with Tailwind CSS v4, and generates the offline service worker (`dist/sw.js`) and web manifest (`dist/manifest.webmanifest`).

#### Preview Offline PWA Locally:
```bash
npm run preview
```
Open in Chrome/Edge, open DevTools (`F12`), go to the **Application** tab, and test:
- **Service Workers**: Verify `sw.js` is registered and controlling the page.
- **Manifest**: Verify standalone display, theme color `#000000`, and maskable icons.
- **Offline Mode**: Check "Offline" in the Network tab and reload — the app will continue to load and function with 100% offline persistence.

---

### 2. Capacitor Android Compilation (Direct APK Build)

Capacitor is already configured (`capacitor.config.ts`) and the native Android platform has been added in the `android/` directory with all permissions (`RECORD_AUDIO`, `WAKE_LOCK`, `MODIFY_AUDIO_SETTINGS`).

#### Workflow:
```bash
# 1. Build the latest web assets
npm run build

# 2. Sync web assets and plugins to Android project
npx cap sync

# 3. Open the Android project in Android Studio
npx cap open android
```

#### Inside Android Studio:
1. Allow Gradle to finish syncing dependencies.
2. Connect your Android device via USB (with USB Debugging enabled) or start an Android Virtual Device (AVD).
3. Click **Run 'app'** (`Shift + F10`) to deploy and test directly on device.
4. To build a standalone APK:
   - Go to **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
   - Once completed, click **locate** to retrieve your `app-debug.apk`.

---

## 📂 Project Architecture

```
├── android/                   # Native Android Capacitor Gradle project
├── public/                    # PWA icons, manifest icons, favicon
│   ├── favicon.svg
│   ├── pwa-192x192.svg
│   └── pwa-512x512.svg
├── src/
│   ├── components/
│   │   ├── AudioDeck.tsx         # Audio player, recorder & A-B looper
│   │   ├── Header.tsx            # Navigation, theme toggle & wake lock
│   │   ├── SetlistBuilder.tsx    # Setlist creator, pool picker & analytics
│   │   ├── SettingsPanel.tsx     # Backup/restore, pedal mapping & APK guide
│   │   ├── SongEditorModal.tsx   # ChordPro editor & metadata manager
│   │   ├── SongLibrary.tsx       # Search, filter chips & song cards
│   │   └── StageMode.tsx         # Fullscreen distraction-free auto-scroller
│   ├── context/
│   │   └── ThemeContext.tsx      # Dual theme engine & system bar tinting
│   ├── db/
│   │   └── index.ts              # Dexie.js IndexedDB schema & demo seed
│   ├── hooks/
│   │   └── useWakeLock.ts        # Screen Wake Lock keep-alive hook
│   ├── types/
│   │   └── index.ts              # Core TypeScript interfaces
│   ├── utils/
│   │   ├── chordEngine.ts        # ChordPro parser, semitones transposer & formatting
│   │   └── exportImport.ts       # JSON database backup & restore
│   ├── App.tsx                   # Main orchestrator & routing state
│   ├── index.css                 # AMOLED Dark & Daylight themes, touch target rules
│   └── main.tsx                  # React DOM root
├── capacitor.config.ts        # Capacitor mobile configuration
├── vite.config.ts             # Vite, Tailwind v4 & VitePWA configuration
└── package.json
```

---

## 📄 License
MIT License. Built for live performers, stage musicians, and bands.
