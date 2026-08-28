import { useState, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { 
  Sparkles, 
  Dumbbell, 
  Heart, 
  Coffee, 
  ShoppingBag, 
  Layers, 
  Briefcase, 
  Palette, 
  Mail, 
  Compass, 
  Trees, 
  BookOpen, 
  Flame, 
  Trophy, 
  Smile, 
  CheckCircle2, 
  X, 
  ChevronRight,
  Filter,
  RotateCw,
  Loader2
} from 'lucide-react';
import type { DynamicTopicCategory, DomainCategory } from '../types';

interface DynamicCategoryCardsProps {
  topics: DynamicTopicCategory[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string | null) => void;
  selectedCategory: 'All' | DomainCategory;
  isLoadingTopics?: boolean;
  onRefreshTopics?: () => void;
  totalEntriesCount: number;
}

const ICON_MAP: Record<string, any> = {
  Dumbbell,
  Heart,
  Coffee,
  ShoppingBag,
  Layers,
  Briefcase,
  Palette,
  Mail,
  Compass,
  Trees,
  BookOpen,
  Flame,
  Trophy,
  Smile,
  Sparkles
};

const ACCENT_STYLES: Record<string, {
  border: string;
  activeBorder: string;
  activeBg: string;
  activeRing: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconText: string;
  glow: string;
}> = {
  emerald: {
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    activeBorder: 'border-emerald-400',
    activeBg: 'bg-emerald-950/40',
    activeRing: 'ring-1 ring-emerald-400/50',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-300',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  },
  amber: {
    border: 'border-amber-500/25 hover:border-amber-400/50',
    activeBorder: 'border-amber-400',
    activeBg: 'bg-amber-950/40',
    activeRing: 'ring-1 ring-amber-400/50',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-[#f3e5ab]',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-[#f3e5ab]',
    glow: 'shadow-[0_0_20px_rgba(212,175,55,0.25)]'
  },
  blue: {
    border: 'border-blue-500/25 hover:border-blue-400/50',
    activeBorder: 'border-blue-400',
    activeBg: 'bg-blue-950/40',
    activeRing: 'ring-1 ring-blue-400/50',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-300',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]'
  },
  purple: {
    border: 'border-purple-500/25 hover:border-purple-400/50',
    activeBorder: 'border-purple-400',
    activeBg: 'bg-purple-950/40',
    activeRing: 'ring-1 ring-purple-400/50',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-300',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]'
  },
  rose: {
    border: 'border-rose-500/25 hover:border-rose-400/50',
    activeBorder: 'border-rose-400',
    activeBg: 'bg-rose-950/40',
    activeRing: 'ring-1 ring-rose-400/50',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-300',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]'
  },
  indigo: {
    border: 'border-indigo-500/25 hover:border-indigo-400/50',
    activeBorder: 'border-indigo-400',
    activeBg: 'bg-indigo-950/40',
    activeRing: 'ring-1 ring-indigo-400/50',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-300',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]'
  },
  cyan: {
    border: 'border-cyan-500/25 hover:border-cyan-400/50',
    activeBorder: 'border-cyan-400',
    activeBg: 'bg-cyan-950/40',
    activeRing: 'ring-1 ring-cyan-400/50',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-300',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]'
  }
};

const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
};

const CARD_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    x: -36,
    filter: 'blur(3px)',
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    filter: 'blur(3px)',
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
};

export function DynamicCategoryCards({
  topics,
  selectedTopicId,
  onSelectTopic,
  selectedCategory,
  isLoadingTopics = false,
  onRefreshTopics,
  totalEntriesCount
}: DynamicCategoryCardsProps) {
  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || null;
  }, [topics, selectedTopicId]);

  if (topics.length === 0 && !isLoadingTopics) {
    return null;
  }

  return (
    <section 
      aria-label="Dynamic AI Topics" 
      className="space-y-3 animate-in fade-in-50 duration-200"
    >
      {/* Header bar for Dynamic Topics */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shadow-md border border-[#f6e7b8]/40">
            <Sparkles className="w-4 h-4 text-[#f6e7b8] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#f6e7b8] uppercase tracking-wider flex items-center gap-2 drop-shadow-sm">
              <span>Dynamic Topic Clusters</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full metallic-panel text-slate-200 border border-white/10 lowercase">
                {selectedCategory === 'All' ? 'all domains' : selectedCategory}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isLoadingTopics && (
            <div className="flex items-center gap-1.5 text-xs text-[#f6e7b8] font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing topics...</span>
            </div>
          )}

          {onRefreshTopics && !isLoadingTopics && (
            <button
              type="button"
              onClick={onRefreshTopics}
              className="px-2.5 py-1 rounded-lg metallic-titanium-button text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Re-analyze and cluster topic categories with AI"
            >
              <RotateCw className="w-3 h-3 text-[#f6e7b8]" />
              <span>Re-cluster</span>
            </button>
          )}

          {selectedTopicId && (
            <button
              type="button"
              onClick={() => onSelectTopic(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Show All</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Cards Grid with fade-off and staggered float-in animation */}
      <div className="relative min-h-[100px]">
        <AnimatePresence mode="wait">
          {isLoadingTopics ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="py-8 px-4 rounded-2xl metallic-card border border-white/10 flex flex-col items-center justify-center gap-2.5 text-center"
            >
              <div className="w-9 h-9 rounded-xl metallic-gold-panel flex items-center justify-center border border-[#f6e7b8]/30 shadow-md">
                <Loader2 className="w-4 h-4 text-[#f6e7b8] animate-spin" />
              </div>
              <p className="text-xs font-bold text-[#f6e7b8] tracking-wide">
                Re-clustering topic categories with AI...
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Distilling semantic clusters and executive themes across journal entries
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`topics-grid-${selectedCategory}-${topics.map((t) => t.id).join('-')}`}
              variants={CONTAINER_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {topics.map((topic) => {
                const isSelected = selectedTopicId === topic.id;
                const hasAnySelection = selectedTopicId !== null;
                const isDulled = hasAnySelection && !isSelected;

                const colorKey = topic.accentColor || 'amber';
                const style = ACCENT_STYLES[colorKey] || ACCENT_STYLES.amber;
                const IconComponent = ICON_MAP[topic.iconName || 'Sparkles'] || Sparkles;

                const panelClass = {
                  emerald: 'metallic-green-panel ring-2 ring-emerald-400 shadow-[0_0_32px_rgba(52,211,153,0.55),0_0_60px_rgba(52,211,153,0.25)] scale-[1.025]',
                  blue: 'metallic-blue-panel ring-2 ring-sky-400 shadow-[0_0_32px_rgba(56,189,248,0.55),0_0_60px_rgba(56,189,248,0.25)] scale-[1.025]',
                  purple: 'metallic-purple-panel ring-2 ring-purple-400 shadow-[0_0_32px_rgba(192,132,252,0.55),0_0_60px_rgba(192,132,252,0.25)] scale-[1.025]',
                  amber: 'metallic-gold-panel ring-2 ring-[#f6e7b8] shadow-[0_0_32px_rgba(246,231,184,0.55),0_0_60px_rgba(246,231,184,0.25)] scale-[1.025]',
                  rose: 'metallic-panel border-rose-400 ring-2 ring-rose-400 shadow-[0_0_32px_rgba(244,63,94,0.55),0_0_60px_rgba(244,63,94,0.25)] scale-[1.025]',
                  indigo: 'metallic-blue-panel ring-2 ring-indigo-400 shadow-[0_0_32px_rgba(99,102,241,0.55),0_0_60px_rgba(99,102,241,0.25)] scale-[1.025]',
                  cyan: 'metallic-blue-panel ring-2 ring-cyan-400 shadow-[0_0_32px_rgba(6,182,212,0.55),0_0_60px_rgba(6,182,212,0.25)] scale-[1.025]'
                }[colorKey] || 'metallic-gold-panel ring-2 ring-[#f6e7b8] shadow-[0_0_32px_rgba(246,231,184,0.55),0_0_60px_rgba(246,231,184,0.25)] scale-[1.025]';

                const titleColorClass = {
                  emerald: 'text-emerald-200 group-hover:text-emerald-100',
                  blue: 'text-sky-200 group-hover:text-sky-100',
                  purple: 'text-purple-200 group-hover:text-purple-100',
                  amber: 'text-[#f6e7b8] group-hover:text-white',
                  rose: 'text-rose-200 group-hover:text-rose-100',
                  indigo: 'text-indigo-200 group-hover:text-indigo-100',
                  cyan: 'text-cyan-200 group-hover:text-cyan-100'
                }[colorKey] || 'text-[#f6e7b8] group-hover:text-white';

                return (
                  <motion.button
                    key={topic.id}
                    id={`topic-card-${topic.id}`}
                    type="button"
                    variants={CARD_VARIANTS}
                    whileHover={{ scale: isSelected ? 1.04 : 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      onSelectTopic(isSelected ? null : topic.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer relative group flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? `${panelClass} z-20`
                        : isDulled
                        ? `metallic-card opacity-20 grayscale brightness-50 hover:opacity-85 hover:grayscale-0 hover:brightness-100 border-white/5`
                        : `metallic-card ${style.border} hover:brightness-105`
                    }`}
                  >
                    {/* Top Row: Icon, Emoji, Entry Count */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl select-none transition-opacity ${isDulled ? 'opacity-30 group-hover:opacity-100' : ''}`} aria-hidden="true">
                          {topic.emoji}
                        </span>
                        <div className={`p-1.5 rounded-lg ${isDulled ? 'bg-white/5 text-slate-500 border-white/5' : `${style.iconBg} ${style.iconText} border border-white/10`}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isDulled ? 'bg-white/5 text-slate-500 border-white/5' : `${style.badgeBg} ${style.badgeText} border border-white/10`}`}>
                          {topic.count} {topic.count === 1 ? 'entry' : 'entries'}
                        </span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold transition-colors ${isDulled ? 'text-slate-500 group-hover:text-slate-200' : titleColorClass}`}>
                          {topic.name}
                        </h4>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-white' : isDulled ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5'}`} />
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 font-light ${isDulled ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-300'}`}>
                        {topic.description}
                      </p>
                    </div>

                    {/* Action Hint */}
                    <div className={`pt-1 border-t flex items-center justify-between text-[11px] ${isDulled ? 'border-white/5 text-slate-600 group-hover:text-slate-400' : 'border-white/10 text-slate-400'}`}>
                      <span className={`font-medium ${isSelected ? 'text-emerald-300 font-bold' : isDulled ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {isSelected ? '✓ Filter Active' : 'Tap to reveal entries'}
                      </span>
                      <span className={`${isSelected ? 'text-white' : isDulled ? 'text-slate-600 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-white'} transition-colors font-medium`}>
                        {isSelected ? 'Reset Filter ×' : 'View & Edit →'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Banner */}
      {activeTopic && (
        <div className="p-3 rounded-xl metallic-gold-panel text-xs flex flex-wrap items-center justify-between gap-2 text-slate-200 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#f6e7b8]" />
            <span>
              Showing <strong className="text-[#f6e7b8] font-bold">{activeTopic.count}</strong> {activeTopic.count === 1 ? 'entry' : 'entries'} filtered by topic: <span className="font-bold text-[#f6e7b8] bg-black/40 px-2 py-0.5 rounded-md border border-white/10">{activeTopic.emoji} {activeTopic.name}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectTopic(null)}
            className="px-2.5 py-1 rounded-lg metallic-titanium-button text-slate-200 hover:text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
            <span>Clear Topic Filter</span>
          </button>
        </div>
      )}
    </section>
  );
}
