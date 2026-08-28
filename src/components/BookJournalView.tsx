import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookOpen, 
  Sparkles, 
  List, 
  ArrowLeft,
  ArrowRight,
  Trash2
} from 'lucide-react';
import type { JournalEntry, UserPersona } from '../types';
import type { User } from 'firebase/auth';
import { ReflectionCard } from './ReflectionCard';

interface BookJournalViewProps {
  entries: JournalEntry[];
  persona: UserPersona;
  activeEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onToggleActionItem: (entryId: string, actionId: string, completed: boolean) => void;
  onToggleBookmark: (entryId: string, bookmarked: boolean) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  onTriggerAiReflection: (entryId: string) => void;
  onWriteNewJournal: () => void;
  onClearAllPosts?: () => void;
  viewMode: 'book' | 'feed';
  onToggleViewMode: (mode: 'book' | 'feed') => void;
  isGuest?: boolean;
  onSignInGoogle?: () => void;
  currentUser?: User | null;
}

export function BookJournalView({
  entries,
  persona,
  activeEntryId,
  onSelectEntry,
  onToggleActionItem,
  onToggleBookmark,
  onDeleteEntry,
  onUpdateEntry,
  onTriggerAiReflection,
  onWriteNewJournal,
  onClearAllPosts,
  viewMode,
  onToggleViewMode,
  isGuest = false,
  onSignInGoogle,
  currentUser
}: BookJournalViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0); // -1 for prev, 1 for next

  // Smoothly scroll to the top of the post card beneath the sticky header
  const scrollToPostTop = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('journal-reader-section');
      if (el) {
        const yOffset = -70; // Offset for sticky top navbar
        const yPosition = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
          top: Math.max(0, yPosition),
          behavior: 'smooth'
        });
      }
    }, 40);
  }, []);

  // Sync index when activeEntryId changes externally
  useEffect(() => {
    if (activeEntryId && entries.length > 0) {
      const idx = entries.findIndex(e => e.id === activeEntryId);
      if (idx !== -1 && idx !== currentIndex) {
        setDirection(idx > currentIndex ? 1 : -1);
        setCurrentIndex(idx);
        scrollToPostTop();
      }
    }
  }, [activeEntryId, entries, scrollToPostTop]);

  // Keep index in valid range when entries length changes
  useEffect(() => {
    if (currentIndex >= entries.length && entries.length > 0) {
      setCurrentIndex(entries.length - 1);
    }
  }, [entries.length]);

  const handleNextPage = useCallback(() => {
    if (currentIndex < entries.length - 1) {
      setDirection(1);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onSelectEntry?.(entries[nextIdx].id);
      scrollToPostTop();
    }
  }, [currentIndex, entries, onSelectEntry, scrollToPostTop]);

  const handlePrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onSelectEntry?.(entries[prevIdx].id);
      scrollToPostTop();
    }
  }, [currentIndex, entries, onSelectEntry, scrollToPostTop]);

  const handleJumpToPage = (idx: number) => {
    if (idx >= 0 && idx < entries.length && idx !== currentIndex) {
      setDirection(idx > currentIndex ? 1 : -1);
      setCurrentIndex(idx);
      onSelectEntry?.(entries[idx].id);
      scrollToPostTop();
    }
  };

  // Keyboard arrow key listener for single-page flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't flip page if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);

  if (!entries || entries.length === 0) {
    return null;
  }

  const currentEntry = entries[currentIndex] || entries[0];
  const bookmarkedEntries = entries.filter((e) => e.bookmarked);

  // Pure Horizontal Swipe & Slide Animation Variants
  const pageVariants: Variants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 320 : dir < 0 ? -320 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        x: { type: 'spring', stiffness: 180, damping: 24, mass: 0.8 },
        opacity: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
      }
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -320 : dir < 0 ? 320 : 0,
      transition: {
        x: { type: 'spring', stiffness: 180, damping: 24, mass: 0.8 },
        opacity: { duration: 0.3, ease: 'easeInOut' }
      }
    })
  };

  const DOMAIN_RIBBON_STYLES: Record<string, {
    active: string;
    inactive: string;
    dot: string;
    emoji: string;
  }> = {
    Work: {
      active: 'bg-gradient-to-b from-sky-600 via-sky-700 to-sky-950 text-sky-100 border-sky-400 -translate-y-1 z-10 shadow-[0_-4px_14px_rgba(56,189,248,0.5)]',
      inactive: 'bg-[#091a2e] text-sky-300 hover:text-white border-t border-x border-sky-600/50 hover:bg-[#0f274a] hover:border-sky-400',
      dot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]',
      emoji: '💼'
    },
    Personal: {
      active: 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-950 text-amber-100 border-amber-400 -translate-y-1 z-10 shadow-[0_-4px_14px_rgba(245,158,11,0.5)]',
      inactive: 'bg-[#221307] text-amber-300 hover:text-white border-t border-x border-amber-600/50 hover:bg-[#341d0b] hover:border-amber-400',
      dot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
      emoji: '🎾'
    },
    Creative: {
      active: 'bg-gradient-to-b from-purple-600 via-purple-700 to-purple-950 text-purple-100 border-purple-400 -translate-y-1 z-10 shadow-[0_-4px_14px_rgba(192,132,252,0.5)]',
      inactive: 'bg-[#1e0a2e] text-purple-300 hover:text-white border-t border-x border-purple-600/50 hover:bg-[#2c1044] hover:border-purple-400',
      dot: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
      emoji: '🎨'
    },
    'Email Drafting': {
      active: 'bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-950 text-emerald-100 border-emerald-400 -translate-y-1 z-10 shadow-[0_-4px_14px_rgba(52,211,153,0.5)]',
      inactive: 'bg-[#082015] text-emerald-300 hover:text-white border-t border-x border-emerald-600/50 hover:bg-[#0d3322] hover:border-emerald-400',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
      emoji: '✉️'
    }
  };

  return (
    <div id="journal-reader-section" className="space-y-3 scroll-mt-6">
      {/* Journal View Controls Header (Ribbons & View Toggle) */}
      <div className="flex flex-wrap items-center justify-end gap-3 px-1 pb-2 border-b border-amber-900/30">
        {/* View Mode Switcher (Book Journal vs Timeline Feed) */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl metallic-panel shadow-inner gap-1 border border-white/15">
            <button
              type="button"
              onClick={() => onToggleViewMode('book')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'book'
                  ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_12px_rgba(246,231,184,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Single Page Book Journal Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book View</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_12px_rgba(246,231,184,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Vertical Scroll Feed Mode"
            >
              <List className="w-3.5 h-3.5" />
              <span>Feed View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onWriteNewJournal}
            className="px-3.5 py-2 rounded-xl metallic-sapphire-button font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            <span className="animate-star-emoji text-sm leading-none">✨</span>
            <span>New Post</span>
          </button>

          {onClearAllPosts && entries.length > 0 && (
            <button
              type="button"
              onClick={onClearAllPosts}
              title="Clear all journal posts from vault & Firestore cloud"
              className="px-3 py-2 rounded-xl metallic-titanium-button border-rose-500/40 text-rose-300 hover:text-rose-100 hover:border-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP BOOKMARK RIBBONS BAR (Only Bookmarked Entries with Category Colors) */}
      <div className="relative pt-2 pb-1 px-1 overflow-x-auto scrollbar-none flex items-center gap-2 -mx-1">
        <div className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest flex items-center gap-1.5 shrink-0 pr-2 border-r border-amber-900/40">
          <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span>Bookmarks:</span>
        </div>

        {bookmarkedEntries.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-300/60 font-medium py-1 px-2 italic">
            <span>No bookmarked posts. Tap the</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-amber-800/40 text-amber-200 not-italic text-[11px]">
              <Bookmark className="w-3 h-3 text-[#f6e7b8]" /> Bookmark
            </span>
            <span>icon on any journal post to pin it here.</span>
          </div>
        ) : (
          bookmarkedEntries.map((entry) => {
            const originalIdx = entries.findIndex((e) => e.id === entry.id);
            const isActive = currentEntry ? entry.id === currentEntry.id : false;
            const domain = entry.category?.domain || 'Work';
            const style = DOMAIN_RIBBON_STYLES[domain] || DOMAIN_RIBBON_STYLES.Work;

            return (
              <motion.button
                key={entry.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleJumpToPage(originalIdx)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md border-t-2 border-x ${
                  isActive ? style.active : style.inactive
                }`}
                title={`Jump to Page ${originalIdx + 1}: ${domain} - "${entry.reflectionSummary || entry.rawText.slice(0, 40)}"`}
              >
                <span className="text-xs select-none" aria-hidden="true">
                  {style.emoji}
                </span>
                <span className={`w-2 h-2 rounded-full ${isActive ? style.dot : 'bg-white/30'}`} />
                <span className="font-mono text-[11px]">#{originalIdx + 1}</span>
                <span className="truncate max-w-[90px] text-[11px] font-medium hidden sm:inline">
                  {domain}
                </span>
              </motion.button>
            );
          })
        )}
      </div>

      {/* TEXTURED RICH LEATHER JOURNAL BOOK CONTAINER WITH SADDLE STITCHING & SPINE */}
      <div className="relative perspective-[1400px] w-full">
        
        {/* Authentic Rich Leather Exterior Cover */}
        <div className="relative p-1 sm:p-4 rounded-xl sm:rounded-2xl leather-journal-exterior flex items-stretch overflow-hidden">
          
          {/* Subtle Saddle Stitch Perimeter Accent */}
          <div className="absolute inset-1 sm:inset-2 rounded-lg sm:rounded-xl leather-saddle-stitch pointer-events-none z-10" />

          {/* REALISTIC EMBOSSED LEATHER SPINE */}
          <div className="w-2 sm:w-4.5 leather-spine-ribs shrink-0 z-20 relative select-none rounded-l-md sm:rounded-l-lg my-0.5 sm:my-1 shadow-lg" />

          {/* MAIN PAGE AREA */}
          <div className="flex-1 min-w-0 pl-1 sm:pl-4 space-y-2 sm:space-y-3 z-10">
            
            {/* Page Header Bar inside Book */}
            <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-amber-900/30 text-xs text-amber-200/90">
              <motion.button
                type="button"
                onClick={handlePrevPage}
                disabled={currentIndex === 0}
                whileHover={currentIndex !== 0 ? { scale: 1.04, x: -3 } : {}}
                whileTap={currentIndex !== 0 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl metallic-titanium-button text-[#f6e7b8] hover:text-white font-bold text-xs shadow-md hover:border-[#f6e7b8]/60 hover:shadow-[0_0_18px_rgba(246,231,184,0.25)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
                title="Previous Page (Left Arrow Key or Swipe Right)"
              >
                <div className="p-1 rounded-lg bg-amber-400/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-[#f6e7b8] transition-colors">
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="hidden sm:inline font-sans tracking-wide">Previous Page</span>
              </motion.button>

              <div className="flex items-center gap-2.5 font-mono">
                <span className="text-base sm:text-lg md:text-xl text-[#f6e7b8] font-extrabold tracking-wider drop-shadow-md">
                  PAGE {currentIndex + 1}
                </span>
                <span className="text-amber-500/80 font-extrabold text-base sm:text-lg">/</span>
                <span className="text-base sm:text-lg md:text-xl text-amber-200 font-extrabold">
                  {entries.length}
                </span>
                <span className="text-xs sm:text-sm text-[#f6e7b8]/80 font-sans font-semibold hidden md:inline-flex items-center gap-1 ml-2.5 px-2.5 py-0.5 rounded-lg metallic-panel border-white/10 shadow-sm">
                  (Use ← → keys or swipe)
                </span>
              </div>

              <motion.button
                type="button"
                onClick={handleNextPage}
                disabled={currentIndex === entries.length - 1}
                whileHover={currentIndex !== entries.length - 1 ? { scale: 1.04, x: 3 } : {}}
                whileTap={currentIndex !== entries.length - 1 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl metallic-titanium-button text-[#f6e7b8] hover:text-white font-bold text-xs shadow-md hover:border-[#f6e7b8]/60 hover:shadow-[0_0_18px_rgba(246,231,184,0.25)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
                title="Next Page (Right Arrow Key or Swipe Left)"
              >
                <span className="hidden sm:inline font-sans tracking-wide">Next Page</span>
                <div className="p-1 rounded-lg bg-amber-400/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-[#f6e7b8] transition-colors">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            </div>

            {/* Horizontal Swipe & Page Animation Container */}
            <div className="relative w-full min-h-[480px] overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentEntry.id}
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_e, { offset, velocity }) => {
                    const swipeThreshold = 60;
                    if (offset.x < -swipeThreshold || velocity.x < -350) {
                      handleNextPage();
                    } else if (offset.x > swipeThreshold || velocity.x > 350) {
                      handlePrevPage();
                    }
                  }}
                  className="w-full transform-gpu cursor-grab active:cursor-grabbing"
                >
                  <ReflectionCard
                    entry={currentEntry}
                    persona={persona}
                    isFocused={currentEntry.id === activeEntryId}
                    isGuest={isGuest}
                    onSignInGoogle={onSignInGoogle}
                    currentUser={currentUser}
                    onToggleActionItem={onToggleActionItem}
                    onToggleBookmark={onToggleBookmark}
                    onDeleteEntry={onDeleteEntry}
                    onUpdateEntry={onUpdateEntry}
                    onTriggerAiReflection={(entryId) => {
                      const target = entries.find((e) => e.id === entryId);
                      if (target) {
                        onTriggerAiReflection(target.id);
                      }
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Book Page Navigation Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-amber-900/30 text-xs">
              <motion.button
                type="button"
                onClick={handlePrevPage}
                disabled={currentIndex === 0}
                whileHover={currentIndex !== 0 ? { scale: 1.04, x: -3 } : {}}
                whileTap={currentIndex !== 0 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#2a170b] via-[#3a210e] to-[#201007] border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs shadow-md hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
              >
                <div className="p-1 rounded-lg bg-amber-500/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-colors">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="hidden sm:inline font-sans tracking-wide">Previous Reflection</span>
                <span className="sm:hidden font-sans">Previous</span>
              </motion.button>

              {/* Quick Page Jump Dots */}
              <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[180px] sm:max-w-xs scrollbar-none">
                {entries.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToPage(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex 
                        ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]' 
                        : 'bg-amber-900/40 hover:bg-amber-800'
                    }`}
                    title={`Page ${idx + 1}`}
                  />
                ))}
              </div>

              <motion.button
                type="button"
                onClick={handleNextPage}
                disabled={currentIndex === entries.length - 1}
                whileHover={currentIndex !== entries.length - 1 ? { scale: 1.04, x: 3 } : {}}
                whileTap={currentIndex !== entries.length - 1 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#201007] via-[#3a210e] to-[#2a170b] border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs shadow-md hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
              >
                <span className="hidden sm:inline font-sans tracking-wide">Next Reflection</span>
                <span className="sm:hidden font-sans">Next</span>
                <div className="p-1 rounded-lg bg-amber-500/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
