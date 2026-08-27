import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, EyeOff, Image as ImageIcon, Check, AlertTriangle, ChevronLeft, ChevronRight, Pencil, Edit3, X, Maximize2, Minimize2 } from 'lucide-react';
import type { DomainCategory } from '../types';

interface EditorialArtCanvasProps {
  prompt?: string;
  domain?: DomainCategory;
  imageUrl?: string | null;
  rawText?: string;
  className?: string;
  isExpanded?: boolean;
  onRegenerate?: () => void;
  onClose?: () => void;
  onImageGenerated?: (newUrl: string) => void;
  onClickToggleExpand?: () => void;
}

export function EditorialArtCanvas({ 
  prompt = 'Journal reflection moment', 
  domain = 'Work', 
  imageUrl: initialImageUrl,
  rawText = '',
  className = '',
  isExpanded = false,
  onRegenerate,
  onClose,
  onImageGenerated,
  onClickToggleExpand
}: EditorialArtCanvasProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialImageUrl || null);

  useEffect(() => {
    setCurrentImageUrl(initialImageUrl || null);
  }, [initialImageUrl]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom Prompt Editing state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string>(prompt || '');
  const [customPromptInput, setCustomPromptInput] = useState<string>(prompt || '');

  useEffect(() => {
    setActivePrompt(prompt || '');
    setCustomPromptInput(prompt || '');
  }, [prompt]);

  const showStatusNotice = (type: 'success' | 'error', message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatusNotice({ type, message });
    timerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 3500);
  };

  const handleGeneratePhotorealisticImage = async (artPrompt: string, artDomain: string, textContext: string, isCustomPrompt: boolean = false) => {
    const oldUrl = currentImageUrl;
    setIsLoading(true);
    setHasError(false);
    setCurrentImageUrl(null);
    try {
      const res = await fetch('/api/gemini/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: artPrompt,
          domain: artDomain,
          rawText: textContext || artPrompt,
          isCustomPrompt,
          oldImageUrl: oldUrl || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setCurrentImageUrl(data.imageUrl);
          if (data.generatedArtPrompt) {
            setActivePrompt(data.generatedArtPrompt);
            setCustomPromptInput(data.generatedArtPrompt);
          }
          onImageGenerated?.(data.imageUrl);
          showStatusNotice('success', '✨ AI Banner updated (previous image deleted)!');
        } else {
          setHasError(true);
          showStatusNotice('error', '⚠️ Banner generation response empty');
        }
      } else {
        setHasError(true);
        showStatusNotice('error', '⚠️ Banner generation service error');
      }
    } catch (err) {
      console.warn('Failed to generate banner image:', err);
      setHasError(true);
      showStatusNotice('error', '⚠️ Network error during banner generation');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically trigger image generation on mount if no image exists yet!
  useEffect(() => {
    if (!initialImageUrl && !currentImageUrl) {
      handleGeneratePhotorealisticImage(prompt, domain, rawText, false);
    }
  }, []);

  const handleManualRegenerate = async () => {
    setCurrentImageUrl(null);
    onRegenerate?.();
    await handleGeneratePhotorealisticImage(customPromptInput || prompt, domain, rawText, !!customPromptInput.trim());
  };

  const handleRegenerateWithCustomPrompt = async () => {
    if (!customPromptInput.trim()) return;
    setIsEditingPrompt(false);
    setActivePrompt(customPromptInput);
    await handleGeneratePhotorealisticImage(customPromptInput, domain, rawText, true);
  };

  const handleSelectHistoryImage = (idx: number) => {
    if (history[idx]) {
      setHistoryIndex(idx);
      const url = history[idx];
      setCurrentImageUrl(url);
      onSelectImageFromHistory?.(url);
      onImageGenerated?.(url);
    }
  };

  const domainLabels: Record<string, { themeName: string; accent: string }> = {
    Work: { themeName: 'Architectural Focus', accent: '#60a5fa' },
    Personal: { themeName: 'Mindful Serenity', accent: '#f472b6' },
    Creative: { themeName: 'Generative Flow', accent: '#34d399' },
    'Email Drafting': { themeName: 'Executive Precision', accent: '#a78bfa' }
  };
  const meta = domainLabels[domain] || domainLabels.Work;

  return (
    <div className={`relative overflow-hidden rounded-2xl metallic-card group transition-all duration-300 ${className}`}>
      {/* Image Container (Clickable to toggle expand/collapse details) */}
      <div 
        onClick={onClickToggleExpand}
        className={`relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-[#060b18] flex items-center justify-center cursor-pointer group/canvas transition-transform duration-300 active:scale-[0.995] ${onClickToggleExpand ? 'hover:brightness-105' : ''}`}
        title={onClickToggleExpand ? `Tap image to ${isExpanded ? 'collapse' : 'expand'} journal post details` : undefined}
      >
        
        {/* Render actual generated image ONLY when currentImageUrl exists */}
        {currentImageUrl ? (
          <>
            <img
              src={currentImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-700 group-hover/canvas:scale-[1.04] ${isLoading ? 'blur-sm brightness-75 scale-105' : 'brightness-90 contrast-105'}`}
              onError={() => {
                // Clear broken image immediately so no broken image/alt renders, and auto-regenerate
                setCurrentImageUrl(null);
                setHasError(true);
                handleGeneratePhotorealisticImage(customPromptInput || prompt, domain, rawText, false);
              }}
            />
            {/* Metallic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060b18]/60 via-transparent to-[#060b18]/40 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Cool Floating Expand/Collapse Indicator Badge on Hover */}
            {onClickToggleExpand && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 z-15">
                <div className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/50 text-[#f6e7b8] text-xs font-bold shadow-2xl flex items-center gap-2 transform group-hover/canvas:scale-100 scale-90 transition-transform">
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-amber-300" />
                      <span>Tap image to collapse details</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-amber-300" />
                      <span>Tap image to expand details</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Loading / Generating Placeholder State (NO STOCK IMAGE AT ALL) */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1224] via-[#060b18] to-[#040710] p-6 text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-amber-400/10 animate-ping" />
              <div className="p-3.5 rounded-full bg-black/70 border border-amber-500/40 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-300" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-amber-200 tracking-wide font-sans block">
                Generating Context Illustration...
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                Gemini AI is analyzing prompt & creating artwork...
              </span>
            </div>
          </div>
        )}

        {/* Loading Overlay when regenerating over existing image */}
        {isLoading && currentImageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10 space-y-2">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full metallic-gold-panel text-xs text-[#f6e7b8] shadow-2xl">
              <RefreshCw className="w-4 h-4 animate-spin text-[#f6e7b8]" />
              <span className="font-semibold font-sans">Regenerating Context Illustration...</span>
            </div>
          </div>
        )}

        {/* FADING STATUS NOTICE TOAST OVERLAY */}
        {statusNotice && (
          <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-bold shadow-2xl transition-all animate-in fade-in-50 zoom-in-95 duration-200 flex items-center gap-2 ${
            statusNotice.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400/70 text-emerald-100 shadow-emerald-950/80 ring-2 ring-emerald-400/30'
              : 'bg-rose-950/95 border-rose-400/70 text-rose-100 shadow-rose-950/80 ring-2 ring-rose-400/30'
          }`}>
            {statusNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
        )}

        {/* Top Badges (Only shown when image is loaded) */}
        {currentImageUrl && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/20 shadow-lg text-[11px] font-medium text-slate-100 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="text-[#f6e7b8] font-bold">Gemini AI</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">Context AI Illustration</span>
            </div>
          </div>
        )}

        {/* Sleek bottom info bar (Only shown when image is loaded) */}
        {currentImageUrl && (
          <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-xs text-slate-200 z-10">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span 
                className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }}
              />
              <span className="font-semibold text-slate-100 text-xs tracking-wide truncate">
                {meta.themeName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#f6e7b8] border border-white/15 flex-shrink-0 font-medium">
                {domain}
              </span>
            </div>

          <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              type="button"
              onClick={handleManualRegenerate}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg metallic-titanium-button text-slate-100 hover:text-[#f6e7b8] text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="Regenerate photorealistic AI banner"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-400 hover:text-white border border-white/15 text-[11px] backdrop-blur-md transition-all cursor-pointer"
                title="Hide Banner"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Gemini AI Art Prompt Caption Below Image (With Customize Prompt Editor) */}
      <div className="px-4 py-3 bg-[#0a1224]/95 border-t border-white/15 text-xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[10px] font-mono text-amber-300 font-extrabold uppercase tracking-wider block">
              Gemini AI Art Prompt
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingPrompt(!isEditingPrompt)}
            className="text-[11px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 font-semibold hover:underline cursor-pointer transition-colors"
            title="Customize image generation prompt"
          >
            {isEditingPrompt ? (
              <>
                <X className="w-3 h-3 text-rose-300" />
                <span className="text-rose-300">Close Editor</span>
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3 text-amber-300" />
                <span>Customize Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Prompt Form OR Display Mode */}
        {isEditingPrompt ? (
          <div className="space-y-2 pt-1 animate-in fade-in-50 duration-150">
            <textarea
              value={customPromptInput}
              onChange={(e) => setCustomPromptInput(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl bg-black/70 border border-amber-400/50 text-[#fef6e4] text-xs font-sans focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/30 transition-all leading-relaxed"
              placeholder="Enter custom visual prompt for Gemini AI (e.g. A pickleball paddle resting on a green court in morning sun)..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingPrompt(false)}
                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateWithCustomPrompt}
                disabled={isLoading || !customPromptInput.trim()}
                className="px-3 py-1 rounded-lg metallic-gold-button text-[#070d1e] font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#070d1e]" />
                <span>Regenerate with Custom Prompt</span>
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={() => setIsEditingPrompt(true)}
            className="text-slate-200 text-[11px] sm:text-xs leading-relaxed italic select-text cursor-pointer hover:text-amber-200 transition-colors group/prompt"
            title="Tap to customize prompt before regenerating"
          >
            "{activePrompt || rawText.slice(0, 120) || 'Minimalist illustration summarizing journal reflection'}"
            <span className="text-[10px] text-amber-300/60 font-mono ml-2 not-italic opacity-0 group-hover/prompt:opacity-100 transition-opacity">
              (Tap to edit prompt)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
