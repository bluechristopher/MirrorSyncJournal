import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  Gauge, 
  Headphones,
  Sliders,
  Check
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface JournalVoicePlayerProps {
  entry: JournalEntry;
  className?: string;
  onClose?: () => void;
}

export function JournalVoicePlayer({ entry, className = '', onClose }: JournalVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [readScope, setReadScope] = useState<'full' | 'journal' | 'coaching'>(
    entry.reflectionSummary ? 'full' : 'journal'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentSpokenWord, setCurrentSpokenWord] = useState('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackSpeedRef = useRef<number>(1.0);
  const isMutedRef = useRef<boolean>(false);
  const fullTextRef = useRef<string>('');
  const currentCharIndexRef = useRef<number>(0);
  const progressTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Sync refs with state
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const clearTimer = () => {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  // Load available system voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);

        // Pick a natural sounding English voice by default
        if (!selectedVoiceURI && available.length > 0) {
          const preferred = available.find(
            (v) =>
              (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Samantha') || v.name.includes('Daniel')))
          ) || available.find((v) => v.lang.startsWith('en')) || available[0];

          if (preferred) {
            setSelectedVoiceURI(preferred.voiceURI);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      clearTimer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Construct text based on selected scope
  const getPreparedText = (): string => {
    if (readScope === 'journal') {
      return `Original Journal Entry: ${entry.rawText}`;
    }
    if (readScope === 'coaching') {
      const summaryPart = entry.reflectionSummary ? `Summary takeaway: ${entry.reflectionSummary}. ` : '';
      const coachPart = entry.adaptiveResponse ? `Partner Reflection: ${entry.adaptiveResponse}. ` : '';
      return `${summaryPart}${coachPart}`;
    }
    // Full
    let text = `Journal Entry for ${entry.category?.domain || 'reflection'}. `;
    text += `${entry.rawText}. `;
    if (entry.reflectionSummary) {
      text += `Takeaway Summary: ${entry.reflectionSummary}. `;
    }
    if (entry.adaptiveResponse) {
      text += `Coaching perspective: ${entry.adaptiveResponse}. `;
    }
    if (entry.creativeSpark) {
      text += `Creative Spark: ${entry.creativeSpark}. `;
    }
    if (entry.emailDraft) {
      text += `Email draft to ${entry.emailDraft.recipient || 'team'}. Subject: ${entry.emailDraft.subject}. ${entry.emailDraft.body}. `;
    }
    return text;
  };

  // Robust speak engine starting from any character offset
  const speakFromOffset = (startCharIndex: number, overrideSpeed?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser window.');
      return;
    }

    isTransitioningRef.current = true;
    clearTimer();
    window.speechSynthesis.cancel();

    const preparedText = getPreparedText();
    fullTextRef.current = preparedText;

    const clampedOffset = Math.max(0, Math.min(startCharIndex, preparedText.length - 1));
    const textToSpeak = preparedText.slice(clampedOffset);

    if (!textToSpeak.trim()) {
      setProgressPercent(100);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSpokenWord('');
      currentCharIndexRef.current = 0;
      isTransitioningRef.current = false;
      return;
    }

    const currentSpeed = overrideSpeed ?? playbackSpeedRef.current;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = currentSpeed;
    utterance.pitch = 1.0;
    utterance.volume = isMutedRef.current ? 0 : 1;

    // Apply chosen voice
    if (selectedVoiceURI && voices.length > 0) {
      const v = voices.find((vox) => vox.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    const startTime = Date.now();
    const startOffset = clampedOffset;
    currentCharIndexRef.current = startOffset;

    // Reading speed heuristic: ~15.5 characters per second at 1.0x rate
    const charsPerSec = 15.5 * currentSpeed;

    utterance.onstart = () => {
      isTransitioningRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);

      // Start continuous interval timer to guarantee smooth progress
      clearTimer();
      progressTimerRef.current = window.setInterval(() => {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const estimatedChar = Math.min(preparedText.length, Math.round(startOffset + elapsedSec * charsPerSec));
        currentCharIndexRef.current = Math.max(currentCharIndexRef.current, estimatedChar);

        const pct = Math.min(99, Math.round((currentCharIndexRef.current / preparedText.length) * 100));
        setProgressPercent(pct);

        const remaining = preparedText.slice(currentCharIndexRef.current);
        const currentWord = remaining.split(/\s+/)[0] || '';
        if (currentWord) {
          setCurrentSpokenWord(currentWord.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''));
        }
      }, 120);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' || typeof event.charIndex === 'number') {
        const actualCharIdx = Math.min(preparedText.length, startOffset + event.charIndex);
        currentCharIndexRef.current = actualCharIdx;

        const remaining = preparedText.slice(actualCharIdx);
        const word = remaining.split(/\s+/)[0] || '';
        if (word) {
          setCurrentSpokenWord(word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''));
        }

        const pct = Math.min(99, Math.round((actualCharIdx / preparedText.length) * 100));
        setProgressPercent(pct);
      }
    };

    utterance.onend = () => {
      if (isTransitioningRef.current) {
        return;
      }
      clearTimer();
      setIsPlaying(false);
      setIsPaused(false);
      setProgressPercent(100);
      setCurrentSpokenWord('');
      currentCharIndexRef.current = 0;
    };

    utterance.onerror = (e) => {
      if (isTransitioningRef.current) {
        return;
      }
      console.warn('Speech synthesis playback ended or interrupted:', e);
      clearTimer();
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start / Resume speech synthesis
  const handlePlay = () => {
    const preparedText = getPreparedText();
    if (isPaused && currentCharIndexRef.current > 0 && currentCharIndexRef.current < preparedText.length) {
      speakFromOffset(currentCharIndexRef.current);
      return;
    }
    if (progressPercent >= 100) {
      setProgressPercent(0);
      currentCharIndexRef.current = 0;
    }
    speakFromOffset(currentCharIndexRef.current > 0 ? currentCharIndexRef.current : 0);
  };

  const handlePause = () => {
    isTransitioningRef.current = true;
    clearTimer();
    const savedPos = currentCharIndexRef.current;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentCharIndexRef.current = savedPos;
    setIsPaused(true);
    setIsPlaying(false);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 50);
  };

  const handleStop = () => {
    isTransitioningRef.current = false;
    clearTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgressPercent(0);
    setCurrentSpokenWord('');
    currentCharIndexRef.current = 0;
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    playbackSpeedRef.current = speed;

    if (isPlaying) {
      isTransitioningRef.current = true;
      const currentPos = currentCharIndexRef.current;
      speakFromOffset(currentPos, speed);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 50);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    
    const preparedText = getPreparedText();
    const targetCharIdx = Math.floor(ratio * preparedText.length);
    setProgressPercent(Math.round(ratio * 100));

    if (isPlaying) {
      speakFromOffset(targetCharIdx);
    } else {
      currentCharIndexRef.current = targetCharIdx;
      if (isPaused) {
        setIsPaused(false);
      }
    }
  };

  const handleScopeChange = (newScope: 'full' | 'journal' | 'coaching') => {
    setReadScope(newScope);
    handleStop();
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#1a0b2e]/95 via-[#120520]/98 to-[#250d3d]/95 border border-purple-400/45 space-y-3.5 shadow-2xl backdrop-blur-xl ${className}`}>
      {/* Header bar: Title, Audio Visualizer & Close */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-purple-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-200 shadow-sm">
            <Headphones className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-purple-200 uppercase tracking-wider">
                Voice Audio Reader
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-mono border border-purple-400/30">
                Natural Voice
              </span>
            </div>
            <p className="text-[11px] text-purple-200/70">
              Listen to your thoughts, reflection summary, and AI coaching.
            </p>
          </div>
        </div>

        {/* Dynamic Animated Soundwave Bars when active */}
        <div className="flex items-center gap-1 h-5 px-2 py-1 rounded-lg bg-black/50 border border-purple-500/30">
          {[0.4, 0.9, 0.6, 1.0, 0.7, 0.5, 0.8].map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-purple-400 animate-pulse shadow-[0_0_6px_#c084fc]'
                  : 'bg-purple-900/60'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, height * 18)}px` : '4px',
                animationDelay: `${i * 0.12}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Scope Selector: Full Reflection vs Journal Only vs Coaching Only */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-purple-500/25">
          <button
            type="button"
            onClick={() => handleScopeChange('full')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              readScope === 'full'
                ? 'bg-purple-600/80 text-white font-semibold border border-purple-400/60 shadow-xs'
                : 'text-purple-200/70 hover:text-white'
            }`}
          >
            Full Reflection
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('journal')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              readScope === 'journal'
                ? 'bg-purple-600/80 text-white font-semibold border border-purple-400/60 shadow-xs'
                : 'text-purple-200/70 hover:text-white'
            }`}
          >
            Journal Only
          </button>
          {entry.adaptiveResponse && (
            <button
              type="button"
              onClick={() => handleScopeChange('coaching')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                readScope === 'coaching'
                  ? 'bg-purple-600/80 text-white font-semibold border border-purple-400/60 shadow-xs'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              Coaching Only
            </button>
          )}
        </div>

        {/* Speed Selection */}
        <div className="flex items-center gap-1 text-[11px] text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-purple-200/80">Speed:</span>
          {[0.9, 1.0, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleChangeSpeed(speed)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                playbackSpeed === speed
                  ? 'bg-purple-500/30 border border-purple-400/50 text-purple-100 font-bold'
                  : 'text-purple-200/60 hover:text-white bg-white/5'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar & Word Teleprompter */}
      <div className="space-y-1.5 pt-1">
        <div 
          onClick={handleSeek}
          className="w-full bg-black/50 hover:bg-black/70 rounded-full h-2 overflow-hidden border border-purple-500/30 cursor-pointer relative group transition-all"
          title="Click to jump to point in audio"
        >
          <div
            className="bg-gradient-to-r from-purple-500 via-[#c084fc] to-pink-400 h-2 transition-all duration-150 rounded-full shadow-[0_0_10px_#c084fc] group-hover:brightness-125"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-purple-200/80 font-mono font-medium">
          <span className="truncate max-w-[240px]">
            {isPlaying && currentSpokenWord ? `Reading: "${currentSpokenWord}"` : isPaused ? '⏸ Paused' : 'Ready to listen'}
          </span>
          <span className="text-purple-300 font-bold">{progressPercent}%</span>
        </div>
      </div>

      {/* Controls Bar: Play / Pause / Stop / Voice selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Main Controls: Play/Pause, Stop */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl metallic-purple-button text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(192,132,252,0.35)] hover:brightness-115 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isPaused ? 'Resume' : 'Play'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(192,132,252,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused && progressPercent === 0}
            className="p-2 rounded-xl bg-black/40 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400 disabled:opacity-40 transition-colors cursor-pointer"
            title="Stop & Reset"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              handleStop();
              handlePlay();
            }}
            className="p-2 rounded-xl bg-black/40 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-black/40 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Voice Selector Pill */}
        <div className="flex items-center gap-2">
          {voices.length > 0 && (
            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="bg-[#120722] text-[11px] text-purple-200 rounded-xl px-2.5 py-1.5 border border-purple-500/30 focus:outline-none focus:border-purple-400 max-w-[160px] truncate"
            >
              {voices
                .filter((v) => v.lang.startsWith('en'))
                .map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0e041d] text-purple-200">
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              Hide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
