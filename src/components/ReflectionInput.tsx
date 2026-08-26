import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { 
  Sparkles, 
  ArrowUpRight, 
  HelpCircle, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Copy, 
  Check, 
  X, 
  BookmarkPlus, 
  MapPin, 
  Mail, 
  BookOpen,
  Zap,
  Briefcase,
  Heart,
  Palette
} from 'lucide-react';
import type { UserPersona, SynthesisStatusStage, LocationPin, DomainCategory, JournalEntry, EmailDraft, ChatMessage } from '../types';
import { LocationPickerModal } from './LocationPickerModal';
import { EmailDraftingStudio } from './EmailDraftingStudio';
import { classifyContentDomain } from '../utils/topicClustering';

interface ReflectionInputProps {
  persona: UserPersona;
  selectedCategory?: 'All' | DomainCategory;
  onSelectCategory?: (category: 'All' | DomainCategory) => void;
  onSaveJournal: (
    rawText: string, 
    autoReflect?: boolean, 
    location?: LocationPin | null,
    preGeneratedEntry?: Partial<JournalEntry>,
    chosenCategory?: DomainCategory | 'auto'
  ) => Promise<void>;
  isLoading: boolean;
  onOpenPersonaModal: () => void;
  lastFailedText?: string | null;
  externalError?: string | null;
  onClearError?: () => void;
}

const INSPIRATION_PROMPTS = [
  { text: 'Navigated an architectural bottleneck between write throughput and latency...', domain: 'Work' },
  { text: 'Took a quiet morning walk to recalibrate sleep hygiene and set healthy boundaries...', domain: 'Personal' },
  { text: 'Brainstormed a radical interactive canvas using procedural shaders and poetry...', domain: 'Creative' },
  { text: 'Celebrated major team milestone after resolving high-friction deployment blockers...', domain: 'Work' }
];

export function ReflectionInput({
  persona,
  selectedCategory,
  onSelectCategory,
  onSaveJournal,
  isLoading,
  onOpenPersonaModal,
  lastFailedText,
  externalError,
  onClearError
}: ReflectionInputProps) {
  // Mode: standard journal reflection vs dedicated email drafting studio
  const [mode, setMode] = useState<'journal' | 'email'>(
    selectedCategory === 'Email Drafting' ? 'email' : 'journal'
  );

  // Category choice: 'auto' (smart content classification) or specific domain
  const [entryCategoryChoice, setEntryCategoryChoice] = useState<'auto' | DomainCategory>(
    selectedCategory === 'All' || !selectedCategory ? 'auto' : selectedCategory
  );

  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [stage, setStage] = useState<SynthesisStatusStage>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [locationPin, setLocationPin] = useState<LocationPin | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [localError, setLocalError] = useState<{
    message: string;
    suggestion?: string;
    details?: string;
    timestamp: number;
  } | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  // Sync mode and entryCategoryChoice with selectedCategory when changed externally
  useEffect(() => {
    if (selectedCategory === 'Email Drafting') {
      setMode('email');
      setEntryCategoryChoice('Email Drafting');
    } else if (selectedCategory === 'All' || !selectedCategory) {
      setEntryCategoryChoice('auto');
    } else {
      setEntryCategoryChoice(selectedCategory);
    }
  }, [selectedCategory]);

  // Live domain detection when in auto mode
  const liveDetectedDomain = useMemo(() => {
    if (!text.trim() || text.trim().length < 8) return null;
    return classifyContentDomain(text);
  }, [text]);

  // Sync external errors from parent if any
  useEffect(() => {
    if (externalError) {
      setLocalError({
        message: externalError,
        suggestion: 'Check your connection or model parameters and retry below.',
        timestamp: Date.now()
      });
      setStage('error');
    }
  }, [externalError]);

  // If there's a preserved failed text, load it if current text is empty
  useEffect(() => {
    if (lastFailedText && !text) {
      setText(lastFailedText);
    }
  }, [lastFailedText]);

  const handleSaveAndReflect = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;

    const content = text;
    const attachedLoc = locationPin;
    const chosenCat = entryCategoryChoice;
    setLocalError(null);
    if (onClearError) onClearError();

    try {
      setText(''); // Immediate clear to prevent double-submits
      setLocationPin(null);
      setSuccessNotice('Journal saved to vault! Calibrating multi-domain reflection...');
      await onSaveJournal(content, true, attachedLoc, undefined, chosenCat);

      setTimeout(() => {
        setSuccessNotice(null);
      }, 4000);
    } catch (err: any) {
      console.error('Save & Reflect error in input:', err);
      const errorMsg = err?.message || 'Failed to save or process reflection.';
      setLocalError({
        message: errorMsg,
        suggestion: 'Your entry was preserved. You can retry below.',
        details: err?.stack || String(err),
        timestamp: Date.now()
      });
    }
  };

  const handleQuickSaveOnly = async () => {
    if (!text.trim() || isLoading) return;

    const content = text;
    const attachedLoc = locationPin;
    const chosenCat = entryCategoryChoice;
    setLocalError(null);
    if (onClearError) onClearError();

    try {
      setText(''); // Immediate clear
      setLocationPin(null);
      setSuccessNotice('Journal entry safely saved to your vault.');
      await onSaveJournal(content, false, attachedLoc, undefined, chosenCat);

      setTimeout(() => {
        setSuccessNotice(null);
      }, 3500);
    } catch (err: any) {
      console.error('Quick save error:', err);
      setLocalError({
        message: err?.message || 'Failed to store journal entry.',
        suggestion: 'Please verify connection and try saving again.',
        timestamp: Date.now()
      });
    }
  };

  // Handler for saving an email draft from the EmailDraftingStudio
  const handleSaveEmailDraftToVault = async (
    draft: EmailDraft,
    rawNotes: string,
    messages: ChatMessage[]
  ) => {
    const preGenerated: Partial<JournalEntry> = {
      rawText: rawNotes || draft.body,
      reflectionSummary: `✉️ Email Draft: ${draft.subject}`,
      adaptiveResponse: `Send-ready email draft formatted for ${draft.recipient || 'your recipient'}. Refined tone: ${draft.tone || 'Warm & Professional'}.`,
      category: {
        domain: 'Email Drafting',
        department: persona.department || 'Communications',
        projectTags: ['EmailDraft', 'Polished']
      },
      emailDraft: draft,
      actionItems: [],
      editorialArtPrompt: 'A photorealistic close-up photo of an elegant brass pen resting beside a modern laptop and written letter on a warm oak workspace',
      aiStatus: 'ready',
      messages
    };

    await onSaveJournal(rawNotes || draft.body, false, null, preGenerated);
  };

  const handleCopyError = () => {
    if (!localError) return;
    const diagnostics = `MirrorSync Error Report:\nTimestamp: ${new Date(localError.timestamp).toISOString()}\nMessage: ${localError.message}\nSuggestion: ${localError.suggestion || 'N/A'}\nDetails: ${localError.details || 'N/A'}`;
    navigator.clipboard.writeText(diagnostics);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2500);
  };

  const handleDismissError = () => {
    setLocalError(null);
    setStage('idle');
    if (onClearError) onClearError();
  };

  const handleApplyPrompt = (promptText: string) => {
    setText(promptText);
    setLocalError(null);
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLocalError({
        message: 'Voice dictation is not supported in this browser window.',
        suggestion: 'Please type your reflection in the text area above.',
        timestamp: Date.now()
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Voice recognition active: Speak your thoughts...');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        setStatusMessage('');
      };
      recognition.onerror = (e: any) => {
        setIsListening(false);
        setStatusMessage('');
        console.warn('Speech recognition warning:', e);
      };
      recognition.onend = () => {
        setIsListening(false);
        setStatusMessage('');
      };

      recognition.start();
    } catch (e: any) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const isEmailCategoryTab = selectedCategory === 'Email Drafting';

  return (
    <div className="relative rounded-2xl metallic-card p-5 sm:p-7 space-y-4 shadow-2xl transition-all duration-300">
      {/* Mode Switcher: Only display switcher if NOT already inside the dedicated Email Drafting category tab */}
      {!isEmailCategoryTab && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-xl metallic-panel border border-white/10">
            <button
              type="button"
              onClick={() => setMode('journal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'journal'
                  ? 'metallic-gold-button text-[#070d1e] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>✍️ Reflection</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'email'
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>✉️ Email Studio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenPersonaModal}
            className="text-[#f6e7b8] hover:brightness-110 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg metallic-gold-panel self-end sm:self-auto"
          >
            <span>Calibrate Lens</span>
            <ArrowUpRight className="w-3 h-3 text-[#f6e7b8]" />
          </button>
        </div>
      )}

      {/* RENDER ACTIVE MODE */}
      {(isEmailCategoryTab || mode === 'email') ? (
        <EmailDraftingStudio
          persona={persona}
          onSaveToVault={handleSaveEmailDraftToVault}
          onOpenPersonaModal={onOpenPersonaModal}
        />
      ) : (
        /* STANDARD JOURNAL REFLECTION MODE */
        <div className="space-y-4">
          {/* Active Persona Lens Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pb-3 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2 text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#f6e7b8] shadow-[0_0_8px_#f6e7b8] animate-pulse" />
                Active Partner Lens:
              </span>
              <span className="text-[#f6e7b8] font-semibold">{persona.occupation || 'Knowledge Practitioner'}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded-full metallic-panel">
                {persona.coachingTone || 'Productivity Partner'}
              </span>
            </div>
          </div>

          {/* Category Selection Bar (Allows choosing category or auto-classifying based on contents) */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span className="text-[#f6e7b8] text-xs">🎯</span>
                <span>Category:</span>
              </span>

              {/* Live auto-detection status when in auto mode */}
              {entryCategoryChoice === 'auto' && liveDetectedDomain && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1 animate-in fade-in-50">
                  <span className="text-amber-400">⚡ Auto:</span>
                  <span className={
                    liveDetectedDomain === 'Personal' 
                      ? 'text-emerald-300 font-semibold' 
                      : liveDetectedDomain === 'Creative' 
                      ? 'text-purple-300 font-semibold' 
                      : liveDetectedDomain === 'Email Drafting' 
                      ? 'text-teal-300 font-semibold' 
                      : 'text-blue-300 font-semibold'
                  }>
                    {liveDetectedDomain === 'Personal' ? '🌿 Personal' : liveDetectedDomain === 'Creative' ? '🎨 Creative' : liveDetectedDomain === 'Email Drafting' ? '✉️ Email' : '💼 Work'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {/* Auto Classify Pill */}
              <button
                type="button"
                id="category-pill-auto"
                onClick={() => setEntryCategoryChoice('auto')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  entryCategoryChoice === 'auto'
                    ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_12px_rgba(246,231,184,0.25)] font-semibold'
                    : 'metallic-panel text-slate-400 hover:text-slate-200 border-white/10'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>⚡ Auto Classify</span>
              </button>

              {/* Personal Pill */}
              <button
                type="button"
                id="category-pill-personal"
                onClick={() => setEntryCategoryChoice('Personal')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  entryCategoryChoice === 'Personal'
                    ? 'bg-emerald-950/60 border border-emerald-400/60 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)] font-semibold'
                    : 'metallic-panel text-slate-400 hover:text-emerald-300 border-white/10'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>🌿 Personal</span>
              </button>

              {/* Creative Pill */}
              <button
                type="button"
                id="category-pill-creative"
                onClick={() => setEntryCategoryChoice('Creative')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  entryCategoryChoice === 'Creative'
                    ? 'bg-purple-950/60 border border-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(192,132,252,0.25)] font-semibold'
                    : 'metallic-panel text-slate-400 hover:text-purple-300 border-white/10'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>🎨 Creative</span>
              </button>

              {/* Work Pill */}
              <button
                type="button"
                id="category-pill-work"
                onClick={() => setEntryCategoryChoice('Work')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  entryCategoryChoice === 'Work'
                    ? 'bg-blue-950/60 border border-blue-400/60 text-blue-200 shadow-[0_0_12px_rgba(96,165,250,0.25)] font-semibold'
                    : 'metallic-panel text-slate-400 hover:text-blue-300 border-white/10'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>💼 Work</span>
              </button>

              {/* Email Drafting Pill */}
              <button
                type="button"
                id="category-pill-email"
                onClick={() => setEntryCategoryChoice('Email Drafting')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  entryCategoryChoice === 'Email Drafting'
                    ? 'bg-teal-950/60 border border-teal-400/60 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.25)] font-semibold'
                    : 'metallic-panel text-slate-400 hover:text-teal-300 border-white/10'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>✉️ Email</span>
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSaveAndReflect} className="space-y-4">
            <div className="relative">
              <textarea
                id="reflection-textarea"
                rows={4}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder={`Log your daily stream of consciousness, personal well-being, creative breakthrough, or operational thoughts...\nYour entry is preserved safely first, with friendly & uplifting coaching generated in the background! ✨`}
                className="w-full metallic-panel text-slate-100 placeholder-slate-400 font-neuton text-base sm:text-lg rounded-xl p-4 sm:p-5 pb-14 sm:pb-12 border border-white/15 focus:outline-none focus:border-[#f6e7b8] focus:ring-2 focus:ring-[#f6e7b8]/30 transition-all resize-y min-h-[130px] shadow-inner leading-relaxed"
              />

              {/* Action buttons inside textarea area */}
              <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 flex items-center gap-2">
                {/* Location Pin Button - Attach Location */}
                <button
                  type="button"
                  id="location-picker-btn"
                  onClick={() => setIsLocationModalOpen(true)}
                  title={locationPin ? `Attached: ${locationPin.name}` : 'Attach Location'}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    locationPin
                      ? 'metallic-gold-panel text-[#f6e7b8] shadow-[0_0_12px_rgba(246,231,184,0.2)]'
                      : 'metallic-panel text-slate-300 hover:text-[#f6e7b8]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#f6e7b8]" />
                  <span className="text-[11px] font-medium">
                    {locationPin ? locationPin.name.slice(0, 15) : '📍 Location'}
                  </span>
                </button>

                {/* Voice Input Button */}
                <button
                  type="button"
                  id="voice-dictation-btn"
                  onClick={handleToggleVoice}
                  title={isListening ? 'Stop Dictation' : 'Voice Dictation'}
                  className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'metallic-panel text-slate-300 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[11px] hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
                </button>
              </div>
            </div>

            {/* Attached Location Pill */}
            {locationPin && (
              <div className="flex items-center justify-between p-3 rounded-xl metallic-gold-panel text-xs text-[#f6e7b8] animate-in fade-in-50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#f6e7b8]/40 flex items-center justify-center text-[#f6e7b8] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-100">{locationPin.name}</span>
                    {locationPin.address && (
                      <span className="text-slate-400 text-[11px] ml-2 truncate">({locationPin.address})</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationPin(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Remove Location"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Confirmation Notice */}
            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-400/40 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in-50 duration-200 shadow-md">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{successNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessNotice(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Detailed High-Visibility Error Diagnostics Card */}
            {localError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-3 shadow-xl animate-in fade-in-50 zoom-in-98 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Journal Action Report</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDismissError}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title="Dismiss Error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-rose-800/40 text-rose-200 font-mono text-[11px] leading-relaxed break-words">
                  <strong>Notice:</strong> {localError.message}
                </div>

                {localError.suggestion && (
                  <p className="text-slate-300 text-[11px]">
                    <strong className="text-slate-200">Suggestion:</strong> {localError.suggestion}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCopyError}
                    className="px-3 py-1.5 rounded-lg metallic-panel text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedError ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{copiedError ? 'Copied Info' : 'Copy Diagnostics'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDismissError}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAndReflect()}
                      disabled={!text.trim()}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry Save & Reflect</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Responsive 2-column on mobile, right-aligned on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-1">
              <button
                type="button"
                id="quick-save-btn"
                onClick={handleQuickSaveOnly}
                disabled={!text.trim()}
                title="Store journal entry immediately without generating AI synthesis right away"
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl font-medium text-xs text-slate-200 metallic-titanium-button active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-slate-300" />
                <span>Quick Save</span>
              </button>

              <button
                type="submit"
                id="submit-reflection-btn"
                disabled={!text.trim()}
                className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-xs text-[#070d1e] metallic-gold-button hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(246,231,184,0.25)] cursor-pointer shrink-0 sm:min-w-[150px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#070d1e]" />
                <span>Save & Reflect</span>
              </button>
            </div>

            {/* Inspiration Sparks Bubbles with smooth horizontal swipe */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none pt-2 border-t border-white/10 -mx-1 px-1 sm:mx-0 sm:px-0">
              <span className="text-slate-400 flex items-center gap-1 shrink-0 text-[11px]">
                <HelpCircle className="w-3 h-3 text-[#f6e7b8]" /> Sparks:
              </span>
              {INSPIRATION_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPrompt(prompt.text)}
                  className="shrink-0 px-3 py-1.5 rounded-lg metallic-panel text-slate-300 hover:text-[#f6e7b8] text-[11px] transition-colors truncate max-w-[210px] cursor-pointer flex items-center gap-1.5"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    prompt.domain === 'Personal' ? 'bg-amber-400' : prompt.domain === 'Creative' ? 'bg-purple-400' : 'bg-blue-400'
                  }`} />
                  <span className="truncate">{prompt.text}</span>
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setLocationPin(loc)}
        currentLocation={locationPin}
      />
    </div>
  );
}
