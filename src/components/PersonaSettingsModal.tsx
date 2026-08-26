import { useState, type FormEvent } from 'react';
import { Sliders, X, Check, RefreshCw, Loader2, AlertTriangle, RotateCw, Copy, Sparkles, User, Shield } from 'lucide-react';
import type { UserPersona } from '../types';

interface PersonaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: UserPersona;
  onSavePersona: (persona: Partial<UserPersona>) => Promise<void>;
  onOpenOnboarding: () => void;
}

export function PersonaSettingsModal({
  isOpen,
  onClose,
  persona,
  onSavePersona,
  onOpenOnboarding
}: PersonaSettingsModalProps) {
  // Use pure customized state with no hardcoded fallback strings
  const [occupation, setOccupation] = useState(persona.occupation || '');
  const [department, setDepartment] = useState(persona.department || '');
  const [communicationStyle, setCommunicationStyle] = useState(persona.communicationStyle || '');
  const [coachingTone, setCoachingTone] = useState(persona.coachingTone || '');
  const [customGoals, setCustomGoals] = useState(persona.customGoals || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<{
    message: string;
    details?: string;
    timestamp: number;
  } | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSavePersona({
        occupation: occupation.trim(),
        department: department.trim(),
        communicationStyle: communicationStyle.trim(),
        coachingTone: coachingTone.trim(),
        customGoals: customGoals.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error('Error in handleSave persona:', err);
      setError({
        message: err?.message || 'Failed to save persona configuration.',
        details: err?.stack || String(err),
        timestamp: Date.now()
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyError = () => {
    if (!error) return;
    const diagnostics = `MirrorSync Persona Save Error:\nTimestamp: ${new Date(error.timestamp).toISOString()}\nMessage: ${error.message}\nDetails: ${error.details || 'N/A'}`;
    navigator.clipboard.writeText(diagnostics);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl metallic-card shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shadow-sm">
              <Sliders className="w-4 h-4 text-[#f6e7b8]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f6e7b8]">✨ Customize Your AI Companion</h2>
              <p className="text-xs text-slate-400">Personalize how your supportive companion responds to your thoughts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversational AI recalibration banner */}
        <div className="p-3.5 rounded-xl metallic-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <span className="text-slate-300">Prefer conversational setup with Gemini?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="px-3 py-1.5 rounded-lg metallic-gold-button text-[#070d1e] flex items-center justify-center gap-1.5 font-medium shrink-0 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3 h-3 text-[#070d1e]" />
            <span>AI Check-in</span>
          </button>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[#f6e7b8] font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>Occupation / Title</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Lead Architect, Founder, Product Lead..."
                className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#f6e7b8] font-medium">Department / Field</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Distributed Systems, Creative Design..."
                className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#f6e7b8] font-medium">Communication Style</label>
            <input
              type="text"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              placeholder="e.g. Analytical & structured, concise & direct, visionary & strategic, empathetic..."
              className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#f6e7b8] font-medium">Coaching Archetype / Tone</label>
            <input
              type="text"
              value={coachingTone}
              onChange={(e) => setCoachingTone(e.target.value)}
              placeholder="e.g. Supportive Cheerleader, Strategic Advisor, Mindful Mentor..."
              className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#f6e7b8] font-medium">Personal Goals or Current Focus (Optional)</label>
            <textarea
              rows={2}
              value={customGoals}
              onChange={(e) => setCustomGoals(e.target.value)}
              placeholder="e.g. Preparing for Q3 platform migration, scaling engineering culture, establishing deep work routine..."
              className="w-full metallic-panel rounded-xl p-2.5 border border-white/15 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 resize-none shadow-inner"
            />
          </div>

          {/* Error Diagnostics Card */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Save Lens Error</span>
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
                  <Copy className="w-3 h-3" />
                  <span>{copiedError ? 'Copied Error' : 'Copy Diagnostics'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry Save</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-xl text-[#070d1e] metallic-gold-button font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#070d1e]" />
                  <span>Saving Companion...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#070d1e]" />
                  <span>Save Companion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
