import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, EyeOff, Image as ImageIcon } from 'lucide-react';
import type { DomainCategory } from '../types';

interface EditorialArtCanvasProps {
  prompt?: string;
  domain?: DomainCategory;
  imageUrl?: string | null;
  rawText?: string;
  className?: string;
  onRegenerate?: () => void;
  onClose?: () => void;
  onImageGenerated?: (newUrl: string) => void;
}

export function EditorialArtCanvas({ 
  prompt = 'Journal reflection moment', 
  domain = 'Work', 
  imageUrl: initialImageUrl,
  rawText = '',
  className = '',
  onRegenerate,
  onClose,
  onImageGenerated
}: EditorialArtCanvasProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (initialImageUrl) {
      setCurrentImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  const handleGeneratePhotorealisticImage = async (artPrompt: string, artDomain: string, textContext: string) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/gemini/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: artPrompt,
          domain: artDomain,
          rawText: textContext
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setCurrentImageUrl(data.imageUrl);
          onImageGenerated?.(data.imageUrl);
        }
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.warn('Failed to generate banner image:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRegenerate = async () => {
    onRegenerate?.();
    await handleGeneratePhotorealisticImage(prompt, domain, rawText);
  };

  const domainLabels: Record<string, { themeName: string; accent: string }> = {
    Work: { themeName: 'Architectural Focus', accent: '#60a5fa' },
    Personal: { themeName: 'Mindful Serenity', accent: '#f472b6' },
    Creative: { themeName: 'Generative Flow', accent: '#34d399' },
    'Email Drafting': { themeName: 'Executive Precision', accent: '#a78bfa' }
  };
  const meta = domainLabels[domain] || domainLabels.Work;

  // Fallback curated photo if no image or error
  const fallbackSrc = currentImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className={`relative overflow-hidden rounded-2xl metallic-card group transition-all duration-300 ${className}`}>
      {/* Compact Photorealistic Image Container */}
      <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-950">
        <img
          src={fallbackSrc}
          alt={`Photorealistic banner for ${prompt}`}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${isLoading ? 'blur-sm brightness-75 scale-105' : 'brightness-90 contrast-105'}`}
          onError={() => setHasError(true)}
        />

        {/* Metallic Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060b18]/60 via-transparent to-[#060b18]/40 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Loading Shimmer State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full metallic-gold-panel text-xs text-[#f6e7b8]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f6e7b8]" />
              <span className="font-medium font-sans">Generating Photorealistic AI Banner...</span>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/20 shadow-lg text-[11px] font-medium text-slate-100">
            <Sparkles className="w-3 h-3 text-[#f6e7b8]" />
            <span className="text-[#f6e7b8] font-semibold">Gemini AI</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-200">Photorealistic Art</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300">
            <ImageIcon className="w-2.5 h-2.5 text-[#f6e7b8]" />
            <span>16:9 • 8K</span>
          </div>
        </div>

        {/* Sleek bottom info bar */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-xs text-slate-200 z-10">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span 
              className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }}
            />
            <span className="font-semibold text-slate-100 text-xs tracking-wide truncate">
              {meta.themeName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#f6e7b8] border border-white/15 flex-shrink-0">
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
      </div>
    </div>
  );
}
