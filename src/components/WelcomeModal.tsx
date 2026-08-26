import { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Brain, 
  Headphones, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  LogIn, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe
} from 'lucide-react';
import { logoImg } from '../assets/bannerAssets';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInGoogle: () => void;
  onContinueGuest: () => void;
  isSigningIn?: boolean;
}

export function WelcomeModal({
  isOpen,
  onClose,
  onSignInGoogle,
  onContinueGuest,
  isSigningIn = false
}: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl metallic-card border border-[#f6e7b8]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-6 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-250">
        {/* Subtle Multi-Spectrum Ambient Glow Behind Card */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#f6e7b8]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close Welcome Window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. App Logo & Prominent Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative group">
            {/* Glowing Aura Ring */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] to-[#c084fc] opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
            <img
              src={logoImg}
              alt="MirrorSync Logo"
              referrerPolicy="no-referrer"
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#f6e7b8] shadow-2xl shadow-black/80"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5 drop-shadow-md">
              <span>Mirror</span>
              <span className="text-[#f6e7b8] drop-shadow-[0_0_12px_rgba(246,231,184,0.6)]">Sync</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-md mx-auto">
              Your AI-Powered Executive & Personal Reflection Vault
            </p>
          </div>
        </div>

        {/* 2. What It Does (3 Crisp Highlights with Icons) */}
        <div className="space-y-2.5">
          <h2 className="text-[11px] font-bold text-[#f6e7b8] uppercase tracking-wider text-center">
            ✦ What MirrorSync Does
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Feature 1 */}
            <div className="p-3 sm:p-3.5 rounded-2xl metallic-panel flex items-start gap-3.5 border border-white/10 shadow-sm">
              <div className="p-2 rounded-xl metallic-gold-panel text-[#f6e7b8] shrink-0 mt-0.5 shadow-sm">
                <Brain className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Adaptive AI Coaching & Action Checklists
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Tailored insights across Work, Personal, Creative, and Email drafting with actionable next steps.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-3 sm:p-3.5 rounded-2xl metallic-panel flex items-start gap-3.5 border border-white/10 shadow-sm">
              <div className="p-2 rounded-xl metallic-blue-panel text-sky-300 shrink-0 mt-0.5 shadow-sm">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Natural Voice Audio & Editorial Art
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Listen to reflections read aloud in soothing natural voice audio and enjoy generated conceptual art.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-3 sm:p-3.5 rounded-2xl metallic-panel flex items-start gap-3.5 border border-white/10 shadow-sm">
              <div className="p-2 rounded-xl metallic-green-panel text-emerald-300 shrink-0 mt-0.5 shadow-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Spatial Location Grounding & Live AI Chat
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Pin Google Maps locations to entries and converse with an AI companion that can refine and merge updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Primary Action Buttons: Sign In with Google OR Guest Entry */}
        <div className="space-y-2.5 pt-2">
          {/* Sign In Button */}
          <button
            type="button"
            onClick={onSignInGoogle}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 rounded-2xl metallic-gold-button text-[#070d1e] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(246,231,184,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 text-[#070d1e] stroke-[2.5]" />
            <span>Sign In with Google (Cloud Sync)</span>
          </button>

          {/* Guest Entry Button */}
          <button
            type="button"
            onClick={onContinueGuest}
            className="w-full py-3 px-4 rounded-2xl metallic-titanium-button text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 hover:text-white hover:border-[#f6e7b8]/50 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Continue as Guest (Local Vault)</span>
            <ArrowRight className="w-4 h-4 text-[#f6e7b8]" />
          </button>
        </div>

        {/* 4. Concise Privacy & Security Bar with Logos */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-[#f6e7b8] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Privacy & Security
            </span>
            <span className="text-emerald-400">Zero Public Training</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-300">
            <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">Encrypted Vault</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium">Private Gemini AI</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="font-medium">Local-First Choice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
