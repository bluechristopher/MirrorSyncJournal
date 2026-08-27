import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { ReflectionCard } from './ReflectionCard';

interface BookJournalViewProps {
  entries: JournalEntry[];
  persona: UserPersona;
  activeEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onToggleActionItem: (entryId: string, actionId: string) => void;
  onToggleBookmark: (entryId: string, bookmarked: boolean) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<JournalEntry>) => void;
  onTriggerAiReflection: (entryId: string) => void;
  onWriteNewJournal: () => void;
  onClearAllPosts?: () => void;
  viewMode: 'book' | 'feed';
  onToggleViewMode: (mode: 'book' | 'feed') => void;
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
  onToggleViewMode
}: BookJournalViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0); // -1 for prev, 1 for next

  // Sync index when activeEntryId changes externally without forcing scroll
  useEffect(() => {
    if (activeEntryId && entries.length > 0) {
      const idx = entries.findIndex(e => e.id === activeEntryId);
      if (idx !== -1 && idx !== currentIndex) {
        setDirection(idx > currentIndex ? 1 : -1);
        setCurrentIndex(idx);
      }
    }
  }, [activeEntryId, entries]);

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
    }
  }, [currentIndex, entries, onSelectEntry]);

  const handlePrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onSelectEntry?.(entries[prevIdx].id);
    }
  }, [currentIndex, entries, onSelectEntry]);

  const handleJumpToPage = (idx: number) => {
    if (idx >= 0 && idx < entries.length && idx !== currentIndex) {
      setDirection(idx > currentIndex ? 1 : -1);
      setCurrentIndex(idx);
      onSelectEntry?.(entries[idx].id);
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

  const currentEntry = entries[currentIndex];

  // 3D Page Flip Animation Variants
  const pageVariants = {
    initial: (dir: number) => ({
      opacity: 0.3,
      rotateY: dir > 0 ? 35 : -35,
      x: dir > 0 ? 80 : -80,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      rotateY: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.38,
        ease: [0.25, 1, 0.5, 1]
      }
    },
    exit: (dir: number) => ({
      opacity: 0.3,
      rotateY: dir > 0 ? -35 : 35,
      x: dir > 0 ? -80 : 80,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.5, 0, 0.75, 0]
      }
    })
  };

  return (
    <div id="journal-reader-section" className="space-y-3 scroll-mt-6">
      {/* Journal View Controls Header (Ribbons & View Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 border-b border-amber-900/30">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-200 uppercase tracking-wider text-xs flex items-center gap-2">
            <span>Leather Journal Reader</span>
            <span className="text-xs sm:text-sm font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-sm">
              Page {currentIndex + 1} of {entries.length}
            </span>
          </span>
        </div>

        {/* View Mode Switcher (Book Journal vs Timeline Feed) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-amber-900/40 shadow-inner">
            <button
              type="button"
              onClick={() => onToggleViewMode('book')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'book'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Single Page Book Journal Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book View</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode('feed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 shadow-md'
                  : 'text-slate-300 hover:text-white'
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
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Write New</span>
          </button>

          {onClearAllPosts && entries.length > 0 && (
            <button
              type="button"
              onClick={onClearAllPosts}
              title="Clear all journal posts from vault & Firestore cloud"
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/90 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP BOOKMARK RIBBONS BAR (Physical Ribbon Tabs) */}
      <div className="relative pt-2 pb-1 px-1 overflow-x-auto scrollbar-none flex items-center gap-2 -mx-1">
        <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest flex items-center gap-1 shrink-0 pr-2 border-r border-amber-900/40">
          <Bookmark className="w-3 h-3 text-amber-400" />
          <span>Bookmarks:</span>
        </div>

        {entries.map((entry, idx) => {
          const isActive = idx === currentIndex;
          const domain = entry.category?.domain || 'Work';
          
          const domainAccents: Record<string, string> = {
            Work: 'from-amber-600 via-amber-700 to-amber-800 text-amber-100 border-amber-400',
            Personal: 'from-emerald-700 via-emerald-800 to-emerald-900 text-emerald-100 border-emerald-400',
            Creative: 'from-purple-700 via-purple-800 to-purple-900 text-purple-100 border-purple-400',
            'Email Drafting': 'from-teal-700 via-teal-800 to-teal-900 text-teal-100 border-teal-400'
          };
          const accent = domainAccents[domain] || domainAccents.Work;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleJumpToPage(idx)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md ${
                isActive
                  ? `bg-gradient-to-b ${accent} border-t-2 border-x -translate-y-1 z-10 shadow-[0_-4px_14px_rgba(0,0,0,0.6)]`
                  : 'bg-[#180e08] text-amber-200/70 hover:text-amber-100 border-t border-x border-amber-900/50 hover:bg-[#26170d]'
              }`}
              title={`Jump to Page ${idx + 1}`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-300 shadow-[0_0_6px_#f59e0b]' : 'bg-amber-900/80'}`} />
              <span className="font-mono text-[11px]">#{idx + 1}</span>
              <span className="truncate max-w-[85px] text-[11px] font-medium hidden sm:inline">
                {domain}
              </span>
            </button>
          );
        })}
      </div>

      {/* TEXTURED BROWN LEATHER JOURNAL BOOK CONTAINER WITH LEFT BINDER */}
      <div className="relative perspective-[1400px] w-full">
        
        {/* Warm Brownish Leather Exterior Cover */}
        <div className="relative p-2 sm:p-4 bg-gradient-to-r from-[#22140b] via-[#321e10] to-[#1e1108] shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-t border-b border-amber-800/40 flex items-stretch">
          
          {/* SUBTLE FINE LEFT BINDER SPINE */}
          <div className="w-2 sm:w-3 bg-gradient-to-r from-[#120a05] via-[#1a0f08] to-transparent border-r border-amber-900/40 shadow-[2px_0_10px_rgba(0,0,0,0.6)] shrink-0 z-20 relative select-none rounded-l-md" />

          {/* MAIN PAGE AREA */}
          <div className="flex-1 min-w-0 pl-2 sm:pl-4 space-y-3">
            
            {/* Page Header Bar inside Book (No Page Scroll on Click) */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-amber-900/30 text-xs text-amber-200/90">
              <motion.button
                type="button"
                onClick={handlePrevPage}
                disabled={currentIndex === 0}
                whileHover={currentIndex !== 0 ? { scale: 1.04, x: -3 } : {}}
                whileTap={currentIndex !== 0 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#2a170b] via-[#3a210e] to-[#201007] border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs shadow-md hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
                title="Previous Page (Left Arrow Key)"
              >
                <div className="p-1 rounded-lg bg-amber-500/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-colors">
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="hidden sm:inline font-sans tracking-wide">Previous Page</span>
              </motion.button>

              <div className="flex items-center gap-2.5 font-mono">
                <span className="text-base sm:text-lg md:text-xl text-amber-300 font-extrabold tracking-wider drop-shadow-md">
                  PAGE {currentIndex + 1}
                </span>
                <span className="text-amber-600 font-extrabold text-base sm:text-lg">/</span>
                <span className="text-base sm:text-lg md:text-xl text-amber-200 font-extrabold">
                  {entries.length}
                </span>
                <span className="text-xs sm:text-sm text-amber-300/90 font-sans font-semibold hidden md:inline-flex items-center gap-1 ml-2.5 px-2.5 py-0.5 rounded-lg bg-black/50 border border-amber-700/50 shadow-sm">
                  (Use ← → keys)
                </span>
              </div>

              <motion.button
                type="button"
                onClick={handleNextPage}
                disabled={currentIndex === entries.length - 1}
                whileHover={currentIndex !== entries.length - 1 ? { scale: 1.04, x: 3 } : {}}
                whileTap={currentIndex !== entries.length - 1 ? { scale: 0.96 } : {}}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#201007] via-[#3a210e] to-[#2a170b] border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs shadow-md hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:x-0 disabled:hover:shadow-none"
                title="Next Page (Right Arrow Key)"
              >
                <span className="hidden sm:inline font-sans tracking-wide">Next Page</span>
                <div className="p-1 rounded-lg bg-amber-500/20 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 transition-colors">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            </div>

            {/* 3D Page Flip Animation Container */}
            <div className="relative w-full min-h-[480px] overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentEntry.id}
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full transform-gpu"
                >
                  <ReflectionCard
                    entry={currentEntry}
                    persona={persona}
                    isFocused={currentEntry.id === activeEntryId}
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
