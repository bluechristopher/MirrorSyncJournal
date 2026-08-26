import { motion } from 'motion/react';
import type { DomainCategory } from '../types';
import { 
  logoImg, 
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
        className="relative overflow-hidden rounded-2xl border border-white/20 p-5 sm:p-6 shadow-2xl bg-gradient-to-br from-[#0a1226] via-[#0f1d3d] to-[#150e2a]"
      >
        {/* Cool Metallic Aero Multi-Spectrum Ambient Mesh */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#f6e7b8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Specular Aero Glass Top Reflection Line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6e7b8]/70 to-transparent pointer-events-none" />
        
        {/* Subtle Cyber-Metallic Geometric Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative shrink-0 group">
              {/* Outer Golden Halo Ring */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] to-[#c084fc] opacity-60 blur-sm group-hover:opacity-100 transition duration-500" />
              
              <img
                src={logoImg}
                alt="MirrorSync Logo"
                referrerPolicy="no-referrer"
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#f6e7b8]/70 shadow-2xl shadow-black/80"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                  <Home className="w-5 h-5 text-[#f6e7b8]" />
                  <span>All Journal Entries</span>
                </h1>
                <span className="px-3 py-0.5 rounded-full metallic-gold-panel text-[#f6e7b8] text-xs font-bold shadow-[0_0_12px_rgba(246,231,184,0.35)] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#f6e7b8]" />
                  <span>{totalCount} {totalCount === 1 ? 'entry' : 'entries'}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed font-light drop-shadow-sm">
                Your unified timeline of executive reflections, personal breakthroughs, creative sparks, and email drafts.
              </p>
            </div>
          </div>

          {/* Quick Domain Matrix Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg metallic-blue-panel text-sky-200 text-[11px] font-semibold flex items-center gap-1 border border-sky-400/40 shadow-sm">
              <Briefcase className="w-3 h-3" />
              <span>Work</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg metallic-green-panel text-emerald-200 text-[11px] font-semibold flex items-center gap-1 border border-emerald-400/40 shadow-sm">
              <Heart className="w-3 h-3" />
              <span>Personal</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg metallic-purple-panel text-purple-200 text-[11px] font-semibold flex items-center gap-1 border border-purple-400/40 shadow-sm">
              <Palette className="w-3 h-3" />
              <span>Creative</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg metallic-blue-panel text-sky-200 text-[11px] font-semibold flex items-center gap-1 border border-sky-400/40 shadow-sm">
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </span>
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
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{config.emoji}</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase ${config.badgeBorder}`}>
                {category} Stream
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black/70 border border-white/20 text-slate-200 text-[11px] font-mono">
                {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
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
