import { useState, type FormEvent } from 'react';
import { Sparkles, X, Loader2, Compass, CheckCircle2, ArrowRight, Brain, Zap, AlertTriangle, RotateCw, Copy, Check } from 'lucide-react';
import { extractPersonaAPI } from '../services/api';
import type { UserPersona, OnboardingExtractionResult } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePersona: (persona: Partial<UserPersona>) => Promise<void>;
  initialPersona?: UserPersona | null;
}

const PRESET_INTRODUCTIONS = [
  "I'm an A-Level Computing teacher in Singapore preparing JC2 students (age 17-18) for Theory Paper 1 and Python Practical Paper 2. I focus on algorithmic problem solving, structured revision, and de-bugging scaffolding.",
  "I'm a Junior College Computer Science lecturer mentoring students through OOP, SQLite databases, and dynamic programming algorithms. I prefer structured, pedagogical reflections.",
  "I'm a Computing educator exploring creative computing, algorithm visualization, and sociotechnical ethics in Singapore's Smart Nation ecosystem."
];

export function OnboardingModal({
  isOpen,
  onClose,
  onSavePersona,
  initialPersona
}: OnboardingModalProps) {
  const [checkInText, setCheckInText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractionStage, setExtractionStage] = useState<string>('');
  const [extractedResult, setExtractedResult] = useState<OnboardingExtractionResult | null>(null);
  const [editedOccupation, setEditedOccupation] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedStyle, setEditedStyle] = useState('analytical & structured');
  const [editedTone, setEditedTone] = useState('Strategic Advisor');
  const [error, setError] = useState<{
    message: string;
    details?: string;
    timestamp: number;
  } | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  if (!isOpen) return null;

  const handleExtract = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!checkInText.trim() || isExtracting) return;

    setIsExtracting(true);
    setError(null);
    setExtractionStage('Connecting to Gemini 3.7 Flash model...');

    const timer = setTimeout(() => {
      setExtractionStage('Extracting cognitive lens, role archetype & tone...');
    }, 900);

    try {
      const { persona } = await extractPersonaAPI(checkInText);
      setExtractedResult(persona);
      setEditedOccupation(persona.occupation);
      setEditedDepartment(persona.department);
      setEditedStyle(persona.communicationStyle);
      setEditedTone(persona.coachingTone);
    } catch (err: any) {
      console.error('Extraction error in modal:', err);
      setError({
        message: err?.message || 'Failed to extract persona profile.',
        details: err?.stack || String(err),
        timestamp: Date.now()
      });
    } finally {
      clearTimeout(timer);
      setIsExtracting(false);
      setExtractionStage('');
    }
  };

  const handleCopyError = () => {
    if (!error) return;
    const diagnostics = `MirrorSync Onboarding Error:\nTimestamp: ${new Date(error.timestamp).toISOString()}\nMessage: ${error.message}\nDetails: ${error.details || 'N/A'}`;
    navigator.clipboard.writeText(diagnostics);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2500);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await onSavePersona({
        occupation: editedOccupation || initialPersona?.occupation || 'Knowledge Strategist',
        department: editedDepartment || initialPersona?.department || 'Operations',
        communicationStyle: editedStyle || initialPersona?.communicationStyle || 'analytical & structured',
        coachingTone: editedTone || initialPersona?.coachingTone || 'Strategic Advisor',
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving persona in modal:', err);
      setError({
        message: err?.message || 'Failed to save calibrated persona.',
        details: err?.stack || String(err),
        timestamp: Date.now()
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl metallic-card border border-white/20 shadow-2xl p-6 space-y-6 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg metallic-gold-panel flex items-center justify-center text-[#f6e7b8]">
              <Brain className="w-4 h-4 text-[#f6e7b8]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#f6e7b8]">✨ Meet Your Friendly AI Guide</h2>
              <p className="text-xs text-slate-400">Warm and energetic AI coaching tailored to your day</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!extractedResult ? (
          /* Step 1: Conversational Input */
          <form onSubmit={handleExtract} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#f6e7b8]">
                Introduce your role, mindset, and preferred communication style:
              </label>
              <textarea
                rows={4}
                value={checkInText}
                onChange={(e) => setCheckInText(e.target.value)}
                placeholder="e.g. I am a Senior Product Lead managing 3 distributed pods. I value structured root-cause thinking, decisive prioritization, and zero fluff."
                className="w-full metallic-panel text-slate-100 text-sm rounded-xl p-3.5 border border-white/15 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 transition-all resize-none shadow-inner"
                disabled={isExtracting}
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Or choose a quick preset:</span>
              <div className="space-y-1.5">
                {PRESET_INTRODUCTIONS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCheckInText(preset)}
                    className="p-2 rounded-lg metallic-panel text-xs text-slate-300 hover:text-white cursor-pointer transition-all truncate hover:border-[#f6e7b8]/40"
                  >
                    "{preset}"
                  </div>
                ))}
              </div>
            </div>

            {/* Live extraction status indicator */}
            {isExtracting && (
              <div className="p-3 rounded-xl metallic-gold-panel flex items-center gap-2.5 text-xs text-[#f6e7b8] animate-in fade-in-50 duration-200">
                <Loader2 className="w-4 h-4 animate-spin text-[#f6e7b8] shrink-0" />
                <span>{extractionStage || 'Processing with Gemini AI...'}</span>
              </div>
            )}

            {/* Error Diagnostics Card */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Persona Extraction Error</span>
                </div>
                <div className="p-2 bg-black/40 rounded border border-rose-900/50 text-rose-200 font-mono text-[11px] break-words">
                  {error.message}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCopyError}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedError ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedError ? 'Copied Error' : 'Copy Diagnostics'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtract()}
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry Extraction</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="extract-persona-btn"
                disabled={!checkInText.trim() || isExtracting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[#070d1e] metallic-gold-button disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Calibrate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation & Fine-Tuning */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl metallic-gold-panel text-xs text-slate-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[#f6e7b8]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Persona Extracted Successfully</span>
              </div>
              <p className="text-[#f6e7b8] text-xs leading-relaxed">
                {extractedResult.summaryFeedback}
              </p>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#f6e7b8]">Occupation / Title</label>
                <input
                  type="text"
                  value={editedOccupation}
                  onChange={(e) => setEditedOccupation(e.target.value)}
                  className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 focus:outline-none focus:border-[#f6e7b8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#f6e7b8]">Department / Domain</label>
                <input
                  type="text"
                  value={editedDepartment}
                  onChange={(e) => setEditedDepartment(e.target.value)}
                  className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 focus:outline-none focus:border-[#f6e7b8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#f6e7b8]">Communication Style</label>
                <select
                  value={editedStyle}
                  onChange={(e) => setEditedStyle(e.target.value)}
                  className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 focus:outline-none focus:border-[#f6e7b8]"
                >
                  <option value="analytical & structured">Analytical & Structured</option>
                  <option value="concise & direct">Concise & Direct</option>
                  <option value="visionary & strategic">Visionary & Strategic</option>
                  <option value="empathetic & reflective">Empathetic & Reflective</option>
                  <option value="pragmatic & action-oriented">Pragmatic & Action-Oriented</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#f6e7b8]">Coaching Tone Archetype</label>
                <select
                  value={editedTone}
                  onChange={(e) => setEditedTone(e.target.value)}
                  className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 focus:outline-none focus:border-[#f6e7b8]"
                >
                  <option value="Strategic Advisor">Strategic Advisor (High-altitude roadmap)</option>
                  <option value="Socratic Challenger">Socratic Challenger (Pushes assumptions)</option>
                  <option value="Operational Optimizer">Operational Optimizer (Friction remover)</option>
                  <option value="Mindful Mentor">Mindful Mentor (Cognitive balance)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setExtractedResult(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Prompt
              </button>
              <button
                type="button"
                id="apply-persona-btn"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[#070d1e] metallic-gold-button transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#070d1e]" />
                    <span>Applying Lens...</span>
                  </>
                ) : (
                  <>
                    <span>Apply Persona Lens</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
