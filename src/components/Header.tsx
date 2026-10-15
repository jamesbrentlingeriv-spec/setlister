import React from 'react';
import { 
  Sun, Moon, ShieldCheck, ShieldAlert, Music, Layers, 
  Play 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: 'library' | 'setlists' | 'settings';
  onSelectTab: (tab: 'library' | 'setlists' | 'settings') => void;
  songsCount: number;
  setlistsCount: number;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onLaunchQuickStageMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  songsCount,
  setlistsCount,
  wakeLockActive,
  onToggleWakeLock,
  onLaunchQuickStageMode
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-850 bg-white/95 dark:bg-black/95 backdrop-blur-md pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-3 px-4 sm:px-6 transition-colors pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Brand & Stage App Title with Electric Blue Accent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onSelectTab('library')}>
            <img 
              src="/logo.png" 
              alt="Setlister" 
              className="w-10 h-10 rounded-xl object-cover shadow-md shadow-blue-500/20 bg-black border border-neutral-800" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
                  Set<span className="text-blue-600 dark:text-blue-400">lister</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm uppercase tracking-wider">
                  Live Stage
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5 flex items-center gap-1">
                <span>Performance &amp; Rehearsal</span>
              </p>
            </div>
          </div>

          {/* Mobile Quick Action Buttons with Blue Accents */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onToggleWakeLock}
              className={`touch-target p-2.5 rounded-xl border transition-all ${
                wakeLockActive 
                  ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/25' 
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-500'
              }`}
              title={wakeLockActive ? 'Screen Wake Lock Active' : 'Screen Wake Lock Inactive'}
            >
              {wakeLockActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="touch-target p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-sm active:scale-95 transition-all"
              title="Toggle AMOLED Dark / Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Minimum 48px touch targets) */}
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectTab('library')}
            className={`touch-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Songs</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              activeTab === 'library' ? 'bg-black/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}>
              {songsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('setlists')}
            className={`touch-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'setlists'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Setlists</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              activeTab === 'setlists' ? 'bg-black/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}>
              {setlistsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onLaunchQuickStageMode}
            className="touch-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 bg-neutral-900 dark:bg-neutral-900 hover:bg-neutral-800 text-white border border-blue-500/50 shadow-md active:scale-95 transition-all shrink-0"
            title="Launch Distraction-Free Stage View"
          >
            <Play className="w-4 h-4 fill-blue-500 text-blue-500" />
            <span className="text-blue-400">Stage Mode</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`touch-target px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <span>Settings</span>
          </button>
        </nav>

        {/* Desktop Hardware & Theme Controls */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Screen Wake Lock auto-toggle */}
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`touch-target flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              wakeLockActive 
                ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/25' 
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-500 hover:text-neutral-700'
            }`}
            title="Keep screen active during rehearsals and live performances"
          >
            {wakeLockActive ? (
              <>
                <ShieldCheck className="w-4 h-4 text-white animate-pulse" />
                <span>Wake Lock: ON</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-neutral-400" />
                <span>Wake Lock: OFF</span>
              </>
            )}
          </button>

          {/* Persistent Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="touch-target flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:border-blue-500 active:scale-95 transition-all"
            title="Switch between AMOLED Pure Black and Stark White daylight themes"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>AMOLED Dark</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Daylight White</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
