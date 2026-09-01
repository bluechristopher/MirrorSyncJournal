import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Image as ImageIcon, Check, AlertTriangle, ChevronLeft, ChevronRight, Pencil, Edit3, X, Maximize2, Minimize2 } from 'lucide-react';
import type { DomainCategory } from '../types';
import { workBannerImg, personalBannerImg, creativeBannerImg, emailBannerImg } from '../assets/bannerAssets';
import { uploadBannerImageToStorage, deleteCloudStorageFile, auth } from '../firebase';

const defaultDomainBanners: Record<string, string> = {
  Work: workBannerImg,
  Personal: personalBannerImg,
  Creative: creativeBannerImg,
  'Email Drafting': emailBannerImg
};

interface EditorialArtCanvasProps {
  entryId?: string;
  prompt?: string;
  domain?: DomainCategory;
  imageUrl?: string | null;
  storagePath?: string | null;
  rawText?: string;
  topicTitle?: string;
  className?: string;
  isExpanded?: boolean;
  onRegenerate?: () => void;
  onImageGenerated?: (newUrl: string, storagePath?: string) => void;
  onClickToggleExpand?: () => void;
}

export function EditorialArtCanvas({ 
  entryId,
  prompt = 'Journal reflection moment', 
  domain = 'Work', 
  imageUrl: initialImageUrl,
  storagePath = null,
  rawText = '',
  topicTitle,
  className = '',
  isExpanded = false,
  onRegenerate,
  onImageGenerated,
  onClickToggleExpand
}: EditorialArtCanvasProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialImageUrl || null);
  const requestedKeyRef = useRef<string | null>(null);

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
    if (isLoading) return; // Prevent duplicate overlapping generation calls
    const oldUrl = currentImageUrl;
    setIsLoading(true);
    setHasError(false);
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
          let finalUrl = data.imageUrl;
          let newStoragePath: string | undefined = undefined;

          // If user is authenticated in Pro Mode, persist banner directly to Cloud Storage
          const currentUser = auth.currentUser;
          if (currentUser && entryId) {
            try {
              const uploaded = await uploadBannerImageToStorage(currentUser.uid, entryId, data.imageUrl);
              finalUrl = uploaded.url;
              newStoragePath = uploaded.storagePath;

              // Purge previous banner asset from Cloud Storage if one existed
              if (storagePath && storagePath !== newStoragePath) {
                await deleteCloudStorageFile(storagePath);
              }
            } catch (storageErr) {
              console.warn('[EditorialArtCanvas] Cloud Storage upload fallback to data url:', storageErr);
            }
          }

          setCurrentImageUrl(finalUrl);
          if (data.generatedArtPrompt) {
            setActivePrompt(data.generatedArtPrompt);
            setCustomPromptInput(data.generatedArtPrompt);
          }
          onImageGenerated?.(finalUrl, newStoragePath);
          if (isCustomPrompt) {
            showStatusNotice('success', '✨ AI Banner updated & saved!');
          }
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

  // Trigger banner generation automatically for any post without an image
  useEffect(() => {
    const textSignature = `${domain}::${(rawText || prompt || '').trim().slice(0, 160)}`;
    if (!initialImageUrl && !currentImageUrl && textSignature.length > 5 && requestedKeyRef.current !== textSignature && !isLoading) {
      requestedKeyRef.current = textSignature;
      handleGeneratePhotorealisticImage(prompt, domain, rawText, false);
    }
  }, [initialImageUrl, currentImageUrl, rawText, prompt, domain, isLoading]);

  const handleRegenerateButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customPromptInput && (activePrompt || prompt)) {
      setCustomPromptInput(activePrompt || prompt);
    }
    setIsEditingPrompt(true);
  };

  const handleRegenerateWithCustomPrompt = async () => {
    const promptToUse = customPromptInput.trim() || activePrompt.trim() || prompt;
    if (!promptToUse) return;
    setIsEditingPrompt(false);
    setActivePrompt(promptToUse);
    await handleGeneratePhotorealisticImage(promptToUse, domain, rawText, true);
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
        className={`relative w-full h-64 sm:h-72 md:h-84 overflow-hidden bg-[#060b18] flex items-center justify-center cursor-pointer group/canvas transition-transform duration-300 active:scale-[0.995] ${onClickToggleExpand ? 'hover:brightness-105' : ''}`}
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
                setCurrentImageUrl(null);
                setHasError(true);
              }}
            />
            {/* Metallic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060b18]/60 via-transparent to-[#060b18]/40 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Subtle Translucent Floating Expand/Collapse Indicator Badge on Hover */}
            {onClickToggleExpand && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 z-15">
                <div className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-medium shadow-lg flex items-center gap-1.5 transform group-hover/canvas:scale-100 scale-95 transition-all">
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-white/80" />
                      <span>Tap image to collapse details</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                      <span>Tap image to expand details</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : isLoading ? (
          /* Active Generating State */
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
                Gemini Lite is creating artwork...
              </span>
            </div>
          </div>
        ) : (
          /* Clean Standby / Quota Exceeded Card (No fake images, retry button available) */
          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-[#0c1527] via-[#060b18] to-[#040710] p-5 sm:p-6 border border-white/5">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }}
                />
                <span className="text-xs font-semibold text-slate-300 tracking-wide font-sans">
                  {meta.themeName}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 font-mono">
                {domain}
              </span>
            </div>

            {/* Title & prompt hint */}
            <div className="space-y-1.5 py-2">
              <h3 className="text-white font-semibold text-base sm:text-lg font-sans tracking-tight">
                {topicTitle || `${domain} Reflection`}
              </h3>
              <p className="text-xs text-slate-400 font-mono line-clamp-2">
                {activePrompt || prompt || 'Reflective journaling context illustration'}
              </p>
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-slate-500 font-sans">
                AI Banner Standby
              </span>
              <button
                type="button"
                onClick={handleRegenerateButtonClick}
                className="px-3 py-1.5 rounded-lg metallic-gold-button text-xs font-medium transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate / Retry AI Banner</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay when regenerating over existing image */}
        {isLoading && currentImageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10 space-y-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-[#f6e7b8] shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f6e7b8]" />
              <span className="font-medium font-sans">Regenerating illustration...</span>
            </div>
          </div>
        )}

        {/* Subtle Translucent Status Notice Overlay with Smooth Fade-Off */}
        <AnimatePresence>
          {statusNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96, transition: { duration: 0.4, ease: 'easeOut' } }}
              transition={{ duration: 0.25 }}
              className={`absolute top-10 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-medium shadow-lg flex items-center gap-1.5 ${
                statusNotice.type === 'success'
                  ? 'bg-black/45 border-emerald-400/40 text-emerald-200 shadow-emerald-950/30'
                  : 'bg-black/45 border-rose-400/40 text-rose-200 shadow-rose-950/30'
              }`}
            >
              {statusNotice.type === 'success' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{statusNotice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Badges (Only shown when image is loaded) */}
        {currentImageUrl && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/20 shadow-lg text-[11px] font-medium text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="text-[#f6e7b8] font-bold">Gemini AI</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">Context AI Illustration</span>
            </div>
          </div>
        )}

        {/* Sleek bottom overlay with White Topic Header at Bottom-Left & Actions at Bottom-Right */}
        {currentImageUrl && (
          <div className="absolute bottom-3 left-3.5 right-3.5 sm:bottom-3.5 sm:left-4 sm:right-4 flex items-end justify-between gap-3 z-10 pointer-events-none">
            {/* White Semi-Bold Large Topic Header (Bottom Left) */}
            <div className="flex-1 min-w-0 pr-2 space-y-1 sm:space-y-1.5">
              <h3 className="text-white font-semibold text-lg sm:text-xl md:text-2xl font-sans tracking-tight leading-snug drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                {topicTitle || `${domain} Reflection`}
              </h3>
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }}
                />
                <span className="font-medium text-slate-200 text-xs sm:text-sm tracking-wide truncate drop-shadow-md">
                  {meta.themeName}
                </span>
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#f6e7b8] border border-white/20 flex-shrink-0 font-semibold drop-shadow-sm">
                  {domain}
                </span>
              </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity flex-shrink-0 pointer-events-auto">
              <button
                type="button"
                onClick={handleRegenerateButtonClick}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg metallic-titanium-button text-slate-100 hover:text-[#f6e7b8] text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                title="Edit AI visual prompt and regenerate image"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gemini AI Art Prompt Editor Drawer (ONLY shown when user clicks Regenerate) */}
      <AnimatePresence>
        {isEditingPrompt && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden bg-[#0a1224]/95 border-t border-white/15"
          >
            <div className="p-3.5 sm:p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                    Edit AI Image Prompt
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  title="Close prompt editor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={customPromptInput}
                onChange={(e) => setCustomPromptInput(e.target.value)}
                autoFocus
                rows={2}
                className="w-full p-2.5 sm:p-3 rounded-xl bg-black/75 border border-amber-400/40 text-[#fef6e4] text-xs font-sans focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/30 transition-all leading-relaxed shadow-inner"
                placeholder="Customize the visual scene description for Gemini AI..."
              />

              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateWithCustomPrompt}
                  disabled={isLoading || !customPromptInput.trim()}
                  className="px-3.5 py-1.5 rounded-lg metallic-gold-button text-[#070d1e] font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#070d1e]" />
                  <span>Generate & Replace Image</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
