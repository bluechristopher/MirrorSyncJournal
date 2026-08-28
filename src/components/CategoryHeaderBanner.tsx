import { motion } from 'motion/react';
import type { DomainCategory } from '../types';
import { 
  logoImg, 
  fountainPenImg,
  workBannerImg, 
  personalBannerImg, 
  creativeBannerImg, 
  emailBannerImg 
} from '../assets/bannerAssets';
import { Sparkles, Briefcase, Heart, Palette, Mail, BookOpen, Home } from 'lucide-react';

interface CategoryHeaderBannerProps {
  category: DomainCategory | 'All';
  totalCount: number;
}

export function CategoryHeaderBanner({ category, totalCount }: CategoryHeaderBannerProps) {
  if (category === 'All') {
    return (
      <motion.div
        key="banner-all"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-white/20 p-6 sm:p-8 md:p-10 shadow-2xl bg-gradient-to-br from-[#081226] via-[#0e1d3e] to-[#150d2b]"
      >
        {/* Cool Metallic Aero Multi-Spectrum Ambient Mesh */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-sky-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#f6e7b8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Specular Aero Glass Top Reflection Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f6e7b8]/80 to-transparent pointer-events-none" />
        
        {/* Subtle Cyber-Metallic Geometric Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 text-center sm:text-left">
            {/* Prominent Larger Logo with Glowing Halo */}
            <div className="relative shrink-0 group">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] to-[#c084fc] opacity-75 blur-md group-hover:opacity-100 transition duration-500" />
              <img
                src={fountainPenImg}
                alt="MirrorSync Journal"
                referrerPolicy="no-referrer"
                className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl object-cover border-2 border-[#f6e7b8] shadow-2xl shadow-black/90 group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5 drop-shadow-md">
                  <Home className="w-7 h-7 sm:w-8 sm:h-8 text-[#f6e7b8]" />
                  <span>All Journal Entries</span>
                </h1>
                <span className="px-3.5 py-1.5 rounded-full metallic-gold-panel text-[#f6e7b8] text-xs sm:text-sm font-sans font-bold shadow-[0_0_16px_rgba(246,231,184,0.4)] flex items-center gap-1.5 border border-[#f6e7b8]/40">
                  <span className="text-sm leading-none">✨</span>
                  <span>{totalCount} {totalCount === 1 ? 'entry' : 'entries'}</span>
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed font-normal drop-shadow-sm">
                Your personal and work reflections
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Category Configuration
  const categoryConfig: Record<
    DomainCategory, 
    {
      title: string;
      emoji: string;
      image: string;
      description: string;
      accentColor: string;
      badgeBorder: string;
      icon: typeof Briefcase;
    }
  > = {
    Work: {
      title: 'Work Reflections',
      emoji: '💼',
      image: workBannerImg,
      description: 'Strategic decisions, project milestones, team collaboration, and proactive action checklists.',
      accentColor: 'from-[#38bdf8]/25 to-transparent',
      badgeBorder: 'metallic-blue-panel border-sky-400/60 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]',
      icon: Briefcase,
    },
    Personal: {
      title: 'Personal Growth & Well-being',
      emoji: '🎾',
      image: personalBannerImg,
      description: 'Health, fitness, mental clarity, relationships, and holistic daily reflection.',
      accentColor: 'from-[#34d399]/25 to-transparent',
      badgeBorder: 'metallic-green-panel border-emerald-400/60 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)]',
      icon: Heart,
    },
    Creative: {
      title: 'Creative Sparks & Ideas',
      emoji: '🎨',
      image: creativeBannerImg,
      description: 'Artistic thoughts, lateral brainstorms, story concepts, and unconventional inspiration.',
      accentColor: 'from-[#c084fc]/25 to-transparent',
      badgeBorder: 'metallic-purple-panel border-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(192,132,252,0.3)]',
      icon: Palette,
    },
    'Email Drafting': {
      title: 'Email Drafting & Communications',
      emoji: '✉️',
      image: emailBannerImg,
      description: 'Polished client emails, status updates, team announcements, and clear call-to-actions.',
      accentColor: 'from-[#34d399]/25 to-transparent',
      badgeBorder: 'metallic-green-panel border-emerald-400/60 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)]',
      icon: Mail,
    },
  };

  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <motion.div
      key={`banner-${category}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-[#040813] flex flex-col"
    >
      {/* Full Vertical Display of Banner Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.5/1] max-h-[440px] overflow-hidden bg-black/40">
        <img
          src={config.image}
          alt={`${category} Banner`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle Bottom & Side Gradients for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040813] via-[#040813]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040813]/70 via-transparent to-transparent" />

        {/* Content overlay on full vertical banner */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl">{config.emoji}</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] sm:text-xs font-sans font-semibold tracking-wide uppercase ${config.badgeBorder}`}>
                {category} Stream
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/25 text-slate-100 text-xs font-sans font-medium flex items-center gap-1.5 shadow-sm">
                <span className="text-xs leading-none">{config.emoji}</span>
                <span>{totalCount} {totalCount === 1 ? 'entry' : 'entries'}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {config.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed drop-shadow-sm font-light">
              {config.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
