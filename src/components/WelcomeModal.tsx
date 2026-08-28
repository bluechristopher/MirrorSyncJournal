import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, LogIn, Image, MapPin, CheckCircle2, XCircle } from 'lucide-react';
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
  onSignInGoogle,
  onContinueGuest,
  isSigningIn = false
}: WelcomeModalProps) {
  // Modal state: options list vs. transformed demo notice
  const [isDemoNotice, setIsDemoNotice] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'demo' | 'google' | null>(null);

  if (!isOpen) return null;

  const handleSelect = (choice: 'demo' | 'google') => {
    if (isDismissing || isSigningIn) return;
    setSelectedOption(choice);

    if (choice === 'demo') {
      // Transform the modal into the friendly demo guidance notice
      setIsDemoNotice(true);
      return;
    }

    // Direct Google sign in selection: sequential fade out
    setIsDismissing(true);
    setTimeout(() => {
      onSignInGoogle();
    }, 620);
  };

  const handleProceedDemo = () => {
    if (isDismissing) return;
    setIsDismissing(true);

    // Staggered bit-by-bit fade sequence before entering demo workspace
    setTimeout(() => {
      onContinueGuest();
    }, 620);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto sm:overflow-hidden">
        {/* 1. Translucent Aurora Backdrop Layer (Fades in on mount, fades last on exit) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isDismissing ? 0 : 1 }}
          transition={{ duration: isDismissing ? 0.45 : 0.6, delay: isDismissing ? 0.35 : 0 }}
          className="absolute inset-0 bg-[#030712]/60 backdrop-blur-2xl pointer-events-auto"
        >
          {/* Animated Floating Aurora Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[480px] h-[260px] sm:h-[480px] rounded-full bg-gradient-to-tr from-sky-500/25 via-teal-400/20 to-emerald-400/20 blur-[70px] sm:blur-[90px] pointer-events-none aurora-orb-1" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[240px] sm:w-[450px] h-[240px] sm:h-[450px] rounded-full bg-gradient-to-bl from-amber-400/25 via-rose-500/20 to-purple-500/20 blur-[75px] sm:blur-[95px] pointer-events-none aurora-orb-2" />
          <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[220px] sm:w-[380px] h-[220px] sm:h-[380px] rounded-full bg-gradient-to-r from-emerald-500/20 via-[#f6e7b8]/20 to-cyan-400/20 blur-[65px] sm:blur-[85px] pointer-events-none aurora-orb-3" />
        </motion.div>

        {/* 2. Glassmorphic Pop-up Modal Container (Fades in with spring scale) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 28 }}
          animate={
            isDismissing
              ? { opacity: 0, scale: 0.96, y: -10, transition: { duration: 0.35, delay: 0.22 } }
              : { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
          }
          className="relative w-full max-w-[94vw] sm:max-w-xl md:max-w-2xl max-h-[94vh] overflow-y-auto sm:overflow-hidden rounded-2xl sm:rounded-3xl bg-[#060b18]/90 border border-white/20 backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(246,231,184,0.18)] p-4 sm:p-7 md:p-8 text-slate-100 z-10 my-auto"
        >
          {/* Subtle Glass Top Specular Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* Modal Grid: Logo on the Left/Top, Details & Options on the Right */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-7">
            
            {/* LEFT: Prominent Brand Logo Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -16 }}
              animate={
                isDismissing
                  ? { opacity: 0, scale: 0.9, x: -12, transition: { duration: 0.25, delay: 0.12 } }
                  : { opacity: 1, scale: 1, x: 0, transition: { duration: 0.55, delay: 0.08, ease: 'easeOut' } }
              }
              className="flex flex-col items-center shrink-0 text-center my-auto"
            >
              <div className="relative group">
                {/* Radiant Aurora Aura Ring */}
                <div className="absolute -inset-2.5 sm:-inset-3.5 rounded-2xl sm:rounded-[32px] bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] via-[#c084fc] to-[#34d399] opacity-80 blur-lg sm:blur-xl group-hover:opacity-100 transition duration-700 animate-pulse" />
                
                <img
                  src={logoImg}
                  alt="MirrorSync Logo"
                  referrerPolicy="no-referrer"
                  className="relative w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl sm:rounded-2xl md:rounded-[28px] object-cover border-2 border-[#f6e7b8] shadow-2xl shadow-black/90 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </motion.div>

            {/* RIGHT: Transformed View: Demo Mode Notice VS Initial 2 Workspace Options */}
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-3.5 text-center md:text-left my-auto w-full">
              
              {isDemoNotice ? (
                /* Transformed Demo Notice View */
                <motion.div
                  key="demo-notice"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={
                      isDismissing
                        ? { opacity: 0, y: -10, transition: { duration: 0.22, delay: 0.12 } }
                        : { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.05 } }
                    }
                    className="space-y-2"
                  >
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-mono font-semibold">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                      <span>Demo Mode</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      Entering Demo Mode
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      You're entering a <strong>non-personalised Demo Mode</strong>! You're welcome to enjoy a fully tailored, private journal space anytime by logging in with your Google account.
                    </p>

                    {/* Notice of Missing Features in Guest Mode */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-left space-y-1.5 text-slate-300">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <span>⚠️ Limitations in Non-Personalised Demo:</span>
                      </span>
                      <div className="grid grid-cols-1 gap-1 text-[10px] sm:text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5 text-rose-300/90">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Non-personalised persona & generic reflection defaults</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-300/90">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>No AI Banner Generation for journal posts</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-300/90">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>No Google Maps location integration</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={
                      isDismissing
                        ? { opacity: 0, y: 14, transition: { duration: 0.2, delay: 0 } }
                        : { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.15 } }
                    }
                    className="pt-1 flex flex-col sm:flex-row items-center gap-2 sm:gap-3"
                  >
                    <button
                      type="button"
                      id="welcome-enter-workspace-btn"
                      onClick={handleProceedDemo}
                      disabled={isDismissing}
                      className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl metallic-gold-button text-[#070d1e] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(246,231,184,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#070d1e] stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect('google')}
                      disabled={isDismissing || isSigningIn}
                      className="w-full sm:w-auto px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl metallic-titanium-button text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/20 hover:border-emerald-400/50 active:scale-95 transition-all cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sign In with Google Instead</span>
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                /* Initial Workspace Selection View */
                <>
                  {/* Bit 1: Header Brand Text & Tagline */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={
                      isDismissing
                        ? { opacity: 0, y: -10, transition: { duration: 0.25, delay: 0.12 } }
                        : { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1 } }
                    }
                    className="space-y-1"
                  >
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-1 leading-none">
                      <span>Mirror</span>
                      <span className="text-[#f6e7b8] drop-shadow-[0_0_14px_rgba(246,231,184,0.55)]">Sync</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-medium leading-snug">
                      Persona-Adaptive AI Cognitive Journal & Reflection Space
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 pt-0.5">
                      Choose how you'd like to experience your reflection workspace:
                    </p>
                  </motion.div>

                  {/* Bit 2: The Two Choice Options (Fades out first when selected) */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={
                      isDismissing
                        ? { opacity: 0, y: 16, transition: { duration: 0.2, delay: 0 } }
                        : { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.18 } }
                    }
                    className="space-y-2 sm:space-y-2.5 pt-0.5"
                  >
                    {/* Option 1: Explore in Demo Mode (Logged Out / Guest) */}
                    <button
                      type="button"
                      id="welcome-option-demo"
                      onClick={() => handleSelect('demo')}
                      disabled={isDismissing}
                      className={`w-full p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-300 cursor-pointer relative overflow-hidden group border ${
                        selectedOption === 'demo'
                          ? 'bg-amber-500/25 border-amber-300 shadow-[0_0_24px_rgba(246,231,184,0.4)]'
                          : 'metallic-card hover:border-[#f6e7b8]/60 hover:bg-white/[0.04] shadow-md'
                      }`}
                    >
                      <div className="flex items-center sm:items-start justify-between gap-2.5">
                        <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 min-w-0">
                          <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl metallic-gold-panel text-[#f6e7b8] shrink-0 shadow-sm group-hover:scale-105 transition-transform border border-[#f6e7b8]/30">
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f6e7b8]" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-100 group-hover:text-[#f6e7b8] transition-colors leading-tight">
                                Demo Mode
                              </h2>
                              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono font-semibold">
                                Guest
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-300 leading-snug font-light">
                              Guest access with sample reflections
                            </p>
                            {/* Small note of missing features */}
                            <p className="text-[9px] sm:text-[10px] text-amber-300/80 font-mono flex items-center gap-1 pt-0.5">
                              <span>⚠️ Missing: AI Banner Generation & Google Maps</span>
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#f6e7b8] group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </button>

                    {/* Option 2: Personal Journal Space (Logged in with Google) */}
                    <button
                      type="button"
                      id="welcome-option-google"
                      onClick={() => handleSelect('google')}
                      disabled={isDismissing || isSigningIn}
                      className={`w-full p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-300 cursor-pointer relative overflow-hidden group border ${
                        selectedOption === 'google'
                          ? 'bg-emerald-500/25 border-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.4)]'
                          : 'metallic-card-work hover:border-emerald-400/60 hover:bg-emerald-950/20 shadow-md'
                      }`}
                    >
                      <div className="flex items-center sm:items-start justify-between gap-2.5">
                        <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 min-w-0">
                          <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl metallic-green-panel text-emerald-300 shrink-0 shadow-sm group-hover:scale-105 transition-transform border border-emerald-400/40">
                            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-tight">
                                Personal Journal Space
                              </h2>
                              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-semibold">
                                Google Account
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-300 leading-snug font-light">
                              Personal cloud journaling experience
                            </p>
                            {/* Enabled features in Green */}
                            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Enabled: AI Banner Gen, Google Maps & Cloud Sync</span>
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
