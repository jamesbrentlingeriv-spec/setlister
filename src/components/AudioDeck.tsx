import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Mic, Square, Upload, Trash2, 
  Repeat, Volume2, FastForward 
} from 'lucide-react';
import { formatDuration } from '../utils/chordEngine';

interface AudioDeckProps {
  audioBlob?: Blob;
  audioName?: string;
  onSaveAudio: (blob: Blob, name: string) => void;
  onDeleteAudio?: () => void;
  onPlaybackStateChange?: (isPlaying: boolean, currentTime: number, duration: number) => void;
  compact?: boolean;
}

export const AudioDeck: React.FC<AudioDeckProps> = ({
  audioBlob,
  audioName,
  onSaveAudio,
  onDeleteAudio,
  onPlaybackStateChange,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  
  // A-B Loop markers
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLoopActive, setIsLoopActive] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Clean up object URLs
  useEffect(() => {
    if (audioBlob) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    } else {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [audioBlob]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const curr = audio.currentTime;
      setCurrentTime(curr);

      // Handle A-B Looping
      if (isLoopActive && loopA !== null && loopB !== null && loopB > loopA) {
        if (curr >= loopB) {
          audio.currentTime = loopA;
          audio.play().catch(console.error);
        }
      }

      onPlaybackStateChange?.(true, curr, audio.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isLoopActive && loopA !== null) {
        audio.currentTime = loopA;
        audio.play().catch(console.error);
      } else {
        setIsPlaying(false);
        onPlaybackStateChange?.(false, audio.duration || 0, audio.duration || 0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLoopActive, loopA, loopB, onPlaybackStateChange]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioBlob) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlaybackStateChange?.(false, audio.currentTime, audio.duration || 0);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => {
        setIsPlaying(true);
        onPlaybackStateChange?.(true, audio.currentTime, audio.duration || 0);
      }).catch(err => {
        console.warn('Audio play error:', err);
      });
    }
  }, [isPlaying, audioBlob, playbackRate, onPlaybackStateChange]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const setLoopPointA = () => {
    setLoopA(currentTime);
    if (loopB !== null && loopB <= currentTime) {
      setLoopB(null);
    }
    setIsLoopActive(true);
  };

  const setLoopPointB = () => {
    if (loopA !== null && currentTime > loopA) {
      setLoopB(currentTime);
      setIsLoopActive(true);
    }
  };

  const clearLoop = () => {
    setLoopA(null);
    setLoopB(null);
    setIsLoopActive(false);
  };

  // Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}${now.getMinutes()}`;
        onSaveAudio(blob, `Live-Rehearsal-${dateStr}.webm`);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record rehearsals. Please check microphone permissions.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSaveAudio(file, file.name);
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${
      compact 
        ? 'p-2 bg-neutral-900/95 border-neutral-800 text-white shadow-xl' 
        : 'p-4 bg-neutral-50 dark:bg-[#0c0c0c] border-neutral-200 dark:border-neutral-800'
    }`}>
      <audio ref={audioRef} preload="metadata" />

      {/* Audio Presence Check & Record / Upload Actions */}
      {!audioBlob && !isRecording && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/webm,.mp3,.wav,.m4a"
            className="hidden"
          />
          <button
            type="button"
            onClick={startRecording}
            className="touch-target flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
          >
            <Mic className="w-5 h-5 text-white animate-pulse" />
            <span>Record Rehearsal</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="touch-target flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 active:scale-95 transition-all"
          >
            <Upload className="w-5 h-5" />
            <span>Import Audio File (.mp3/.wav/.m4a)</span>
          </button>
        </div>
      )}

      {/* Active Recording UI */}
      {isRecording && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/50">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-rose-500 animate-ping" />
            <div>
              <div className="text-sm font-semibold text-rose-300">Recording Live Rehearsal...</div>
              <div className="font-stage-mono text-xs text-rose-200">{formatDuration(recordingSeconds)} elapsed</div>
            </div>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="touch-target flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg active:scale-95 transition-all"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Save Recording</span>
          </button>
        </div>
      )}

      {/* Playback Deck UI */}
      {audioBlob && !isRecording && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs font-medium truncate text-neutral-700 dark:text-neutral-300" title={audioName}>
                {audioName || 'Reference Audio Track'}
              </span>
            </div>
            {onDeleteAudio && (
              <button
                type="button"
                onClick={onDeleteAudio}
                title="Remove audio track"
                className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scrubber & Duration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-stage-mono text-neutral-500 dark:text-neutral-400">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-neutral-300 dark:bg-neutral-800 accent-blue-600"
            />
          </div>

          {/* Transport Controls & Deck Features */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="touch-target flex items-center justify-center w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                title={isPlaying ? 'Pause Audio' : 'Play Audio'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="touch-target p-2 text-neutral-600 dark:text-neutral-400 hover:text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Rewind to beginning"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* A-B Loop Controls */}
              <div className="flex items-center gap-1 border border-neutral-300 dark:border-neutral-800 rounded-lg p-1 bg-neutral-100 dark:bg-neutral-900/50">
                <button
                  type="button"
                  onClick={setLoopPointA}
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    loopA !== null ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                  title="Set Loop Point A"
                >
                  {loopA !== null ? `A: ${formatDuration(loopA)}` : 'Set A'}
                </button>
                <button
                  type="button"
                  onClick={setLoopPointB}
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    loopB !== null ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                  title="Set Loop Point B"
                >
                  {loopB !== null ? `B: ${formatDuration(loopB)}` : 'Set B'}
                </button>
                {(loopA !== null || loopB !== null) && (
                  <button
                    type="button"
                    onClick={clearLoop}
                    className="p-1 text-xs text-neutral-400 hover:text-rose-500"
                    title="Clear A-B Loop"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Playback Tempo / Speed Slider (0.75x to 1.25x) */}
            <div className="flex items-center gap-2">
              <FastForward className="w-4 h-4 text-neutral-400 shrink-0" />
              <div className="flex items-center gap-1">
                {[0.75, 0.9, 1.0, 1.1, 1.25].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeedChange(rate)}
                    className={`px-2 py-1 text-xs rounded font-stage-mono font-medium transition-colors ${
                      playbackRate === rate
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
