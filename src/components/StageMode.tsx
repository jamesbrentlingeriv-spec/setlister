import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Eye, EyeOff, Clock, Volume2, List, X, Check, RotateCcw, Sparkles 
} from 'lucide-react';
import type { Song, Setlist } from '../types';
import { 
  parseChordProLine, transposeChordPro, 
  formatDuration, transposeChord 
} from '../utils/chordEngine';
import { AudioDeck } from './AudioDeck';
import { db } from '../db';

interface StageModeProps {
  currentSong: Song;
  setlist?: Setlist;
  onExit: () => void;
  onSelectSong: (songId: string) => void;
  onUpdateSongSpeed?: (songId: string, speed: number) => void;
}

export const StageMode: React.FC<StageModeProps> = ({
  currentSong,
  setlist,
  onExit,
  onSelectSong,
  onUpdateSongSpeed
}) => {
  // Transposition state
  const [semitones, setSemitones] = useState<number>(0);
  const [preferSharps, setPreferSharps] = useState<boolean>(true);

  // Auto-scroll state
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(currentSong.defaultScrollSpeed || 1.0);
  const [isPacingMode, setIsPacingMode] = useState<boolean>(false);
  const [pacingSpeedPps, setPacingSpeedPps] = useState<number>(20);

  // Dynamic UI Scaling & Visibility
  const [fontSize, setFontSize] = useState<number>(24);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSetlistDrawerOpen, setIsSetlistDrawerOpen] = useState<boolean>(false);
  const [isAudioDeckOpen, setIsAudioDeckOpen] = useState<boolean>(false);

  // Progress tracking
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const stageRootRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Setlist index
  const songItems = useMemo(() => {
    return setlist?.items || [];
  }, [setlist]);

  const currentIndex = useMemo(() => {
    return songItems.findIndex(item => item.songId === currentSong.id);
  }, [songItems, currentSong.id]);

  const currentSetlistItem = currentIndex >= 0 ? songItems[currentIndex] : null;

  // Initialize or reload song settings when song changes
  useEffect(() => {
    setSemitones(0);
    setSpeedMultiplier(currentSong.defaultScrollSpeed || 1.0);
    setIsScrolling(false);
    setIsPacingMode(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentSong.id]);

  // Calculate pacing speed
  useEffect(() => {
    if (!scrollContainerRef.current || !currentSong.duration) return;
    const scrollHeight = scrollContainerRef.current.scrollHeight;
    const clientHeight = scrollContainerRef.current.clientHeight;
    const scrollDistance = Math.max(0, scrollHeight - clientHeight);
    if (scrollDistance > 0 && currentSong.duration > 0) {
      const pps = scrollDistance / currentSong.duration;
      setPacingSpeedPps(pps);
    }
  }, [currentSong, fontSize]);

  // Smooth Auto-scroll animation engine using requestAnimationFrame
  const scrollStep = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const container = scrollContainerRef.current;
    if (container && isScrolling) {
      const pxPerSecond = isPacingMode ? pacingSpeedPps : 34 * speedMultiplier;
      const deltaScroll = pxPerSecond * deltaTime;
      container.scrollTop += deltaScroll;

      // Calculate progress
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const prog = Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100));
        setScrollProgress(prog);

        if (container.scrollTop >= maxScroll) {
          setIsScrolling(false);
          lastTimeRef.current = null;
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(scrollStep);
    } else {
      lastTimeRef.current = null;
    }
  }, [isScrolling, speedMultiplier, isPacingMode, pacingSpeedPps]);

  useEffect(() => {
    if (isScrolling) {
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isScrolling, scrollStep]);

  // Transposed song text
  const transposedContent = useMemo(() => {
    return transposeChordPro(currentSong.content, semitones, preferSharps);
  }, [currentSong.content, semitones, preferSharps]);

  // Display key
  const displayKey = useMemo(() => {
    if (!currentSong.originalKey) return '';
    return transposeChord(currentSong.originalKey, semitones, preferSharps);
  }, [currentSong.originalKey, semitones, preferSharps]);

  // Navigation handlers
  const handleNextSong = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < songItems.length - 1) {
      const nextItem = songItems[currentIndex + 1];
      if (nextItem.songId) {
        onSelectSong(nextItem.songId);
      }
    }
  }, [currentIndex, songItems, onSelectSong]);

  const handlePrevSong = useCallback(() => {
    if (currentIndex > 0) {
      const prevItem = songItems[currentIndex - 1];
      if (prevItem.songId) {
        onSelectSong(prevItem.songId);
      }
    }
  }, [currentIndex, songItems, onSelectSong]);

  // Bluetooth Foot Pedal & Keyboard Mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsScrolling(prev => !prev);
          break;
        case 'PageDown':
          e.preventDefault();
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: 280, behavior: 'smooth' });
          }
          break;
        case 'PageUp':
          e.preventDefault();
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: -280, behavior: 'smooth' });
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault();
            setSpeedMultiplier(prev => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))));
          } else {
            e.preventDefault();
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ top: 180, behavior: 'smooth' });
            }
          }
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault();
            setSpeedMultiplier(prev => Math.min(5.0, parseFloat((prev + 0.1).toFixed(1))));
          } else {
            e.preventDefault();
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ top: -180, behavior: 'smooth' });
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextSong();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevSong();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSong, handlePrevSong]);

  // Robust Fullscreen Toggle with Vendor Prefixes & Mobile Fallback
  const toggleFullscreen = () => {
    const targetElement = stageRootRef.current || document.documentElement;
    const doc = document as any;
    const docEl = targetElement as any;

    const isCurrentlyFullscreen = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentlyFullscreen && !isMaximized) {
      const requestMethod =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.webkitRequestFullScreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;

      if (requestMethod) {
        requestMethod.call(docEl).catch((err: any) => {
          console.warn('Native fullscreen request rejected, using virtual fullscreen:', err);
          setIsMaximized(true);
          setIsControlsVisible(false);
        });
      } else {
        // Fallback for iOS Safari & WebViews without Fullscreen API
        setIsMaximized(true);
        setIsControlsVisible(false);
      }
    } else {
      const exitMethod =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

      if (exitMethod && isCurrentlyFullscreen) {
        exitMethod.call(doc).catch(console.warn);
      }
      setIsMaximized(false);
    }
  };

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const active = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(active);
      if (!active) {
        setIsMaximized(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Save current speed as song default
  const handleSaveDefaultSpeed = async () => {
    try {
      await db.songs.update(currentSong.id, {
        defaultScrollSpeed: speedMultiplier,
        updatedAt: Date.now()
      });
      onUpdateSongSpeed?.(currentSong.id, speedMultiplier);
      alert(`Saved ${speedMultiplier}x as default scroll speed for "${currentSong.title}"`);
    } catch (err) {
      console.error(err);
    }
  };

  const isActuallyFullscreen = isFullscreen || isMaximized;

  return (
    <div 
      ref={stageRootRef}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden h-[100dvh] w-screen"
      onClick={() => {
        if (!isControlsVisible) {
          setIsControlsVisible(true);
        }
      }}
    >
      {/* Top HUD (Distraction-Free Auto-Hiding with Phone Safe Area Padding) */}
      <div 
        className={`transition-all duration-300 ease-in-out border-b border-neutral-900 bg-black/95 backdrop-blur-md px-4 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-2.5 z-20 ${
          isControlsVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          {/* Left: Exit & Song Metadata Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              className="touch-target flex items-center justify-center p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Exit Stage Mode"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold truncate text-white">
                  {currentSong.title}
                </h1>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  currentSong.type === 'original' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                }`}>
                  {currentSong.type}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                <span className="truncate">{currentSong.artist}</span>
                <span>•</span>
                <span className="font-stage-mono text-blue-400 font-bold">{currentSong.tuning}</span>
                {currentSong.capo > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-stage-mono text-amber-400 font-bold">Capo {currentSong.capo}</span>
                  </>
                )}
                <span>•</span>
                <span className="font-stage-mono">{currentSong.bpm} BPM</span>
                <span>•</span>
                <span className="font-stage-mono">{formatDuration(currentSong.duration)}</span>
              </div>
            </div>
          </div>

          {/* Center: Transposer & Blue Key Pitch Display */}
          <div className="flex items-center gap-2 bg-neutral-900/95 border border-neutral-800 rounded-xl p-1.5 shadow-md">
            <div className="px-2 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Key</div>
              <div className="font-stage-mono text-base font-black text-blue-400">
                {displayKey}
                {semitones !== 0 && (
                  <span className="text-[10px] ml-1 text-neutral-400 font-normal">
                    ({semitones > 0 ? `+${semitones}` : semitones})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSemitones(prev => prev - 1)}
                className="touch-target w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm active:scale-95 transition-all"
                title="Transpose Down 1 Semitone"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => setSemitones(prev => prev + 1)}
                className="touch-target w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm active:scale-95 transition-all"
                title="Transpose Up 1 Semitone"
              >
                +1
              </button>
              {semitones !== 0 && (
                <button
                  type="button"
                  onClick={() => setSemitones(0)}
                  className="touch-target p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
                  title="Reset to Original Key"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreferSharps(prev => !prev)}
                className="touch-target px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-stage-mono font-bold text-neutral-300"
                title="Toggle Sharps / Flats (# / b)"
              >
                {preferSharps ? '#' : 'b'}
              </button>
            </div>
          </div>

          {/* Right: Dynamic Scaling, Setlist Drawer & Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Font Scaling (A- / A+) */}
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                className="touch-target px-2.5 py-1 rounded text-xs font-bold text-neutral-300 hover:bg-neutral-800 active:scale-95 transition-all"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-xs font-stage-mono text-neutral-400 px-1">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.min(46, prev + 2))}
                className="touch-target px-2.5 py-1 rounded text-xs font-bold text-neutral-300 hover:bg-neutral-800 active:scale-95 transition-all"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* Setlist Drawer Toggle */}
            {setlist && (
              <button
                type="button"
                onClick={() => setIsSetlistDrawerOpen(true)}
                className="touch-target flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold"
                title="View Setlist Queue"
              >
                <List className="w-4 h-4 text-emerald-400" />
                <span>{currentIndex + 1}/{songItems.length}</span>
              </button>
            )}

            {/* Audio Deck Toggle */}
            {currentSong.audioBlob && (
              <button
                type="button"
                onClick={() => setIsAudioDeckOpen(prev => !prev)}
                className={`touch-target p-2 rounded-lg border transition-all ${
                  isAudioDeckOpen 
                    ? 'rainbow-bg text-white border-transparent' 
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
                title="Toggle Reference Audio Deck"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Toggle (Works across desktop, Android, iOS Safari & Capacitor) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`touch-target p-2.5 rounded-lg border transition-colors ${
                isActuallyFullscreen 
                  ? 'rainbow-bg text-white border-transparent shadow-md' 
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
              }`}
              title={isActuallyFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isActuallyFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Hide HUD Button */}
            <button
              type="button"
              onClick={() => setIsControlsVisible(false)}
              className="touch-target p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Hide Navigation Chrome (Tap screen anywhere to restore)"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Setlist Item Notes Banner */}
        {(currentSetlistItem?.notes || currentSong.notes) && (
          <div className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-neutral-900 border-l-4 border-l-pink-500 border border-neutral-800 text-neutral-200 flex items-center justify-between">
            <div>
              <span className="font-bold uppercase tracking-wider rainbow-text mr-2">Stage Cue:</span>
              {currentSetlistItem?.notes || currentSong.notes}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Audio Deck Drawer if active */}
      {isAudioDeckOpen && currentSong.audioBlob && (
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-2 z-20">
          <AudioDeck
            audioBlob={currentSong.audioBlob}
            audioName={currentSong.audioName}
            compact={true}
            onSaveAudio={() => {}}
            onPlaybackStateChange={(playing) => {
              if (playing && !isScrolling) {
                setIsScrolling(true);
              } else if (!playing && isScrolling) {
                setIsScrolling(false);
              }
            }}
          />
        </div>
      )}

      {/* Main Distraction-Free Scroll Container with Safe Area Insets */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-12 py-8 scroll-smooth pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
        style={{ scrollBehavior: isScrolling ? 'auto' : 'smooth' }}
      >
        <div className="max-w-4xl mx-auto space-y-6 pb-64">
          {transposedContent.split('\n').map((line, idx) => {
            const parsed = parseChordProLine(line);

            if (parsed.type === 'blank') {
              return <div key={idx} className="h-4" />;
            }

            if (parsed.type === 'comment') {
              return (
                <div 
                  key={idx} 
                  className="font-bold tracking-wider uppercase border-l-4 border-l-blue-500 pl-3.5 py-1.5 bg-neutral-900/60 rounded-r-xl my-4 flex items-center gap-2"
                  style={{ fontSize: `${Math.max(14, fontSize * 0.85)}px` }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 font-black">{parsed.commentText}</span>
                </div>
              );
            }

            if (parsed.type === 'directive') {
              return null;
            }

            if (parsed.type === 'chordpro' && parsed.tokens) {
              return (
                <div 
                  key={idx} 
                  className="flex flex-wrap items-end font-stage-mono leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {parsed.tokens.map((token, tIdx) => (
                    <div key={tIdx} className="inline-flex flex-col justify-end mr-2">
                      {token.chord ? (
                        <span 
                          className="font-black text-blue-400 select-none pb-0.5 tracking-tight font-stage-mono"
                          style={{ fontSize: `${Math.max(16, fontSize * 0.98)}px` }}
                        >
                          {token.chord}
                        </span>
                      ) : (
                        <span className="h-5 select-none" />
                      )}
                      <span className="text-white whitespace-pre font-stage-mono font-medium">
                        {token.lyric}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }

            // Plain text line
            return (
              <div 
                key={idx} 
                className="font-stage-mono text-white/95 leading-relaxed whitespace-pre-wrap"
                style={{ fontSize: `${fontSize}px` }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Unhide Pill (when HUD is hidden) with Rainbow Accent */}
      {!isControlsVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsControlsVisible(true);
          }}
          className="fixed top-4 right-4 z-40 touch-target flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/90 backdrop-blur border border-neutral-700 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all rainbow-border-glow"
          title="Restore Navigation Controls"
        >
          <Sparkles className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold rainbow-text">Controls</span>
        </button>
      )}

      {/* Continuous Blue Scroll Progress Bar */}
      <div className="h-1.5 bg-neutral-900 w-full z-30">
        <div 
          className="h-full bg-blue-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Bottom Transport Deck with Safe Area Insets for Phone Gesture Bar */}
      <div className="border-t border-neutral-900 bg-black/98 backdrop-blur-md px-4 pt-3 pb-[max(3rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] z-20">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          {/* Left: Previous Song in Setlist */}
          <div className="flex items-center gap-2">
            {setlist && (
              <button
                type="button"
                onClick={handlePrevSong}
                disabled={currentIndex <= 0}
                className="touch-target flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-neutral-200 text-sm font-semibold transition-all active:scale-95 border border-neutral-800"
                title="Previous Song in Setlist (Left Arrow / Pedal)"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-400" />
                <span className="hidden sm:inline">Prev</span>
              </button>
            )}

            {/* Play / Pause Auto-Scroll with Vibrant Blue Accent */}
            <button
              type="button"
              onClick={() => setIsScrolling(prev => !prev)}
              className={`touch-target flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all ${
                isScrolling 
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
              }`}
              title="Play/Pause Auto-Scroll (Spacebar)"
            >
              {isScrolling ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Scroll</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span>Start Scroll</span>
                </>
              )}
            </button>
          </div>

          {/* Center: Multi-Speed Engine & Preset Speed Tiers with Blue Accents */}
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-1.5 shadow-md">
            {/* Speed Tiers (0.5x, 1.0x, 1.5x, 2.0x) */}
            <div className="flex items-center gap-1">
              {[0.5, 1.0, 1.5, 2.0].map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    setIsPacingMode(false);
                    setSpeedMultiplier(tier);
                  }}
                  className={`touch-target px-2.5 py-1.5 rounded-xl text-xs font-stage-mono font-bold transition-all ${
                    !isPacingMode && speedMultiplier === tier
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={`Speed Tier ${tier}x`}
                >
                  {tier.toFixed(1)}x
                </button>
              ))}
            </div>

            {/* Custom Speed Step +/- */}
            <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
              <button
                type="button"
                onClick={() => {
                  setIsPacingMode(false);
                  setSpeedMultiplier(prev => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))));
                }}
                className="touch-target w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold active:scale-95"
                title="Decrease Speed (-0.1x)"
              >
                -
              </button>
              <span className="font-stage-mono text-xs font-black text-blue-400 min-w-10 text-center">
                {isPacingMode ? 'Auto' : `${speedMultiplier.toFixed(1)}x`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPacingMode(false);
                  setSpeedMultiplier(prev => Math.min(5.0, parseFloat((prev + 0.1).toFixed(1))));
                }}
                className="touch-target w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold active:scale-95"
                title="Increase Speed (+0.1x)"
              >
                +
              </button>
            </div>

            {/* Pacing Auto-Calculation Mode */}
            <button
              type="button"
              onClick={() => setIsPacingMode(prev => !prev)}
              className={`touch-target px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isPacingMode 
                  ? 'rainbow-bg text-white shadow-md' 
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Pacing Mode: Auto-calculates scroll speed to finish exactly when the song ends"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Song Pacing</span>
            </button>

            {/* Save current speed as song default memory */}
            <button
              type="button"
              onClick={handleSaveDefaultSpeed}
              className="touch-target p-2 text-neutral-500 hover:text-pink-400 transition-colors"
              title="Save current speed as default for this song"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Next Song in Setlist */}
          <div className="flex items-center gap-2">
            {setlist && (
              <button
                type="button"
                onClick={handleNextSong}
                disabled={currentIndex < 0 || currentIndex >= songItems.length - 1}
                className="touch-target flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-neutral-200 text-sm font-semibold transition-all active:scale-95 border border-neutral-800"
                title="Next Song in Setlist (Right Arrow / Pedal)"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setlist Drawer Modal */}
      {isSetlistDrawerOpen && setlist && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 flex flex-col p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-white rainbow-text">{setlist.name}</h2>
                <p className="text-xs text-neutral-400">{songItems.length} items in set</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSetlistDrawerOpen(false)}
                className="touch-target p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {songItems.map((item, index) => {
                const isSelected = item.songId === currentSong.id;
                if (item.type === 'break') {
                  return (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-xl bg-neutral-900 border-l-4 border-l-amber-500 border border-neutral-800 text-amber-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
                          {item.customTitle || 'Intermission'}
                        </span>
                        <span className="text-xs font-stage-mono">{formatDuration(item.durationSeconds)}</span>
                      </div>
                      {item.notes && <p className="text-xs text-amber-300 mt-1">{item.notes}</p>}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.songId) {
                        onSelectSong(item.songId);
                        setIsSetlistDrawerOpen(false);
                      }
                    }}
                    className={`touch-target w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'rainbow-bg text-white shadow-xl border-transparent' 
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-sm truncate">{item.customTitle || (item.songId === currentSong.id ? currentSong.title : 'Song')}</div>
                        {item.notes && <div className="text-xs text-neutral-400 truncate">{item.notes}</div>}
                      </div>
                    </div>
                    <span className="font-stage-mono text-xs text-neutral-300">
                      {formatDuration(item.durationSeconds)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
