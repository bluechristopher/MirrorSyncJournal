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
  const [showSettings, setShowSettings] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const fullTextRef = useRef<string>('');

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

  // Start speech synthesis
  const handlePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser window.');
      return;
    }

    // If currently paused, resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const preparedText = getPreparedText();
    fullTextRef.current = preparedText;
    
    const utterance = new SpeechSynthesisUtterance(preparedText);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : 1;

    // Apply chosen voice
    if (selectedVoiceURI && voices.length > 0) {
      const v = voices.find((vox) => vox.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setProgressPercent(0);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        const remaining = preparedText.slice(charIdx);
        const word = remaining.split(/\s+/)[0] || '';
        setCurrentSpokenWord(word);

        const pct = Math.min(100, Math.round((charIdx / preparedText.length) * 100));
        setProgressPercent(pct);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgressPercent(100);
      setCurrentSpokenWord('');
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis playback ended or interrupted:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgressPercent(0);
      setCurrentSpokenWord('');
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying) {
      // Re-trigger with new speed
      handleStop();
      setTimeout(() => {
        handlePlay();
      }, 100);
    }
  };

  const handleScopeChange = (newScope: 'full' | 'journal' | 'coaching') => {
    setReadScope(newScope);
    if (isPlaying || isPaused) {
      handleStop();
    }
  };

  return (
    <div className={`p-4 rounded-2xl metallic-card border border-[#f6e7b8]/30 space-y-3.5 shadow-2xl bg-black/60 ${className}`}>
      {/* Header bar: Title, Audio Visualizer & Close */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#f6e7b8]/15 border border-[#f6e7b8]/30 flex items-center justify-center text-[#f6e7b8] shadow-sm">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#f6e7b8] uppercase tracking-wider">
                Voice Audio Reader
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Natural TTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Listen to your thoughts, reflection summary, and AI coaching.
            </p>
          </div>
        </div>

        {/* Dynamic Animated Soundwave Bars when active */}
        <div className="flex items-center gap-1 h-5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
          {[0.4, 0.9, 0.6, 1.0, 0.7, 0.5, 0.8].map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-[#f6e7b8] animate-pulse'
                  : 'bg-slate-600'
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
        <div className="flex items-center gap-1 p-1 rounded-xl metallic-panel border border-white/10">
          <button
            type="button"
            onClick={() => handleScopeChange('full')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              readScope === 'full'
                ? 'metallic-gold-button text-[#070d1e] font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Reflection
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('journal')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              readScope === 'journal'
                ? 'metallic-gold-button text-[#070d1e] font-semibold'
                : 'text-slate-400 hover:text-slate-200'
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
                  ? 'metallic-gold-button text-[#070d1e] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coaching Only
            </button>
          )}
        </div>

        {/* Speed Selection */}
        <div className="flex items-center gap-1 text-[11px] text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Speed:</span>
          {[0.9, 1.0, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleChangeSpeed(speed)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                playbackSpeed === speed
                  ? 'bg-[#f6e7b8]/20 border border-[#f6e7b8]/40 text-[#f6e7b8] font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar & Word Teleprompter */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 via-[#f6e7b8] to-emerald-400 h-1.5 transition-all duration-150 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="truncate max-w-[200px]">
            {isPlaying && currentSpokenWord ? `Reading: "${currentSpokenWord}"` : isPaused ? 'Paused' : 'Ready to listen'}
          </span>
          <span>{progressPercent}%</span>
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f6e7b8] via-[#e5d298] to-[#f6e7b8] text-[#070d1e] font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(246,231,184,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#070d1e]" />
              <span>{isPaused ? 'Resume Playback' : 'Play Narration'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused && progressPercent === 0}
            className="p-2 rounded-xl metallic-titanium-button text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
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
            className="p-2 rounded-xl metallic-titanium-button text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted ? 'bg-rose-500/20 text-rose-300' : 'metallic-titanium-button text-slate-300 hover:text-white'
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
              className="metallic-panel text-[11px] text-slate-200 rounded-xl px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-[#f6e7b8] max-w-[160px] truncate"
            >
              {voices
                .filter((v) => v.lang.startsWith('en'))
                .map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-slate-200">
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
