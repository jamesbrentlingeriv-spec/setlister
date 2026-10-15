import React, { useRef, useState } from 'react';
import { 
  Download, Upload, RotateCcw, Smartphone, ShieldCheck, 
  Key, HardDrive, Check 
} from 'lucide-react';
import { exportBackup, importBackup } from '../utils/exportImport';
import { db, INITIAL_DEMO_SONGS, INITIAL_DEMO_SETLISTS } from '../db';

interface SettingsPanelProps {
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onReloadData: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  wakeLockActive,
  onToggleWakeLock,
  onReloadData
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportBackup();
    } catch (err) {
      alert('Failed to export backup: ' + err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Restoring backup...');
      const res = await importBackup(file);
      setImportStatus(`Successfully restored ${res.songsCount} songs and ${res.setlistsCount} setlists!`);
      onReloadData();
    } catch (err) {
      alert('Failed to restore backup: ' + err);
      setImportStatus(null);
    }
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset library to default demo songs and sample setlists? Current songs will be preserved and demo songs refreshed.')) {
      await db.songs.bulkPut(INITIAL_DEMO_SONGS);
      await db.setlists.bulkPut(INITIAL_DEMO_SETLISTS);
      onReloadData();
      alert('Demo songs and setlists refreshed!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings &amp; Backup</h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Hardware configuration, backup/restore, Bluetooth pedals, and Android APK compilation
        </p>
      </div>

      {/* Backup & Restore Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-500" />
          <span>Local Storage &amp; Offline Backup</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Setlister stores 100% of your songs, setlists, and recorded audio memos locally in IndexedDB (Dexie.js). You can export an offline backup JSON to sync across tablets or create safety archives before gigs.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="touch-target flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export JSON Backup'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="touch-target flex items-center gap-2 px-5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:border-blue-500 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="touch-target flex items-center gap-2 px-4 py-3 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Demo Songs</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-600/50 text-blue-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-400" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Screen Wake Lock & Hardware Integration */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <span>Stage Hardware &amp; Screen Wake Lock</span>
        </h2>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850">
          <div>
            <div className="text-sm font-bold text-neutral-900 dark:text-white">
              Prevent Screen Timeout (Screen Wake Lock)
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Keeps tablet and smartphone screens continuously awake during stage sets and rehearsals.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              wakeLockActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {wakeLockActive ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Bluetooth Foot Pedal & Keyboard Mapping Guide */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" />
          <span>Bluetooth Foot Pedal &amp; Keyboard Mapping</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Setlister listens for standard Bluetooth foot pedal switches (such as PageFlip, AirTurn, Donner, Stomp) and wireless keyboards without extra setup:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Play / Pause Auto-Scroll &amp; Audio</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-blue-600 dark:text-blue-400">
              Spacebar
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Scroll Down / Advance Section</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-neutral-800 dark:text-neutral-200">
              PageDown / Down Arrow
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Scroll Up / Previous Section</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-neutral-800 dark:text-neutral-200">
              PageUp / Up Arrow
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Next Song in Setlist</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-neutral-800 dark:text-neutral-200">
              Right Arrow
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Previous Song in Setlist</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-neutral-800 dark:text-neutral-200">
              Left Arrow
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Speed Up / Slow Down Scroll</span>
            <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 font-stage-mono font-bold text-neutral-800 dark:text-neutral-200">
              Shift + Up / Down
            </kbd>
          </div>
        </div>
      </div>

      {/* Capacitor Android APK Compilation & PWA Setup */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-850 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-500" />
          <span>Android APK Compilation &amp; PWA Installation</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          This project is pre-configured with Capacitor for Android APK compilation and Vite PWA for standalone home screen installation.
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-neutral-900 text-neutral-200 border border-neutral-800 font-stage-mono space-y-2">
            <div className="text-blue-400 font-bold font-sans"># 1. Build web production bundle</div>
            <div>npm run build</div>
            <div className="text-blue-400 font-bold font-sans mt-2"># 2. Add Android platform &amp; sync files</div>
            <div>npx cap add android</div>
            <div>npx cap sync</div>
            <div className="text-blue-400 font-bold font-sans mt-2"># 3. Open in Android Studio to build APK</div>
            <div>npx cap open android</div>
          </div>
        </div>
      </div>
    </div>
  );
};
