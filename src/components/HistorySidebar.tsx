import { useState } from 'react';
import { 
  History, 
  Search, 
  X, 
  Briefcase, 
  Heart, 
  Palette, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  Undo2,
  Home
} from 'lucide-react';
import type { JournalEntry, DomainCategory } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
  onNewEntry: () => void;
}

type FilterTab = 'All' | DomainCategory | 'Pinned';

export function HistorySidebar({
  isOpen,
  onClose,
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry
}: HistorySidebarProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // Tab filter
    if (filterTab === 'Pinned' && !entry.location) {
      return false;
    }
    if (filterTab !== 'All' && filterTab !== 'Pinned') {
      if (entry.category?.domain !== filterTab) return false;
    }

    // Search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    const matchesRaw = entry.rawText.toLowerCase().includes(query);
    const matchesSummary = (entry.reflectionSummary || '').toLowerCase().includes(query);
    const matchesCoaching = (entry.adaptiveResponse || '').toLowerCase().includes(query);
    const matchesLocation = entry.location?.name?.toLowerCase().includes(query) || false;
    const matchesTags = (entry.category?.projectTags || []).some(t => t.toLowerCase().includes(query));
    const matchesActions = (entry.actionItems || []).some(a => (a.text || a.task || '').toLowerCase().includes(query));
    const matchesMessages = (entry.messages || []).some(m => m.content.toLowerCase().includes(query));

    return matchesRaw || matchesSummary || matchesCoaching || matchesLocation || matchesTags || matchesActions || matchesMessages;
  });

  const getDomainIcon = (domain: DomainCategory | string) => {
    switch (domain) {
      case 'Work':
        return Briefcase;
      case 'Personal':
        return Heart;
      case 'Creative':
        return Palette;
      default:
        return Sparkles;
    }
  };

  const getDomainBadge = (domain: DomainCategory | string) => {
    switch (domain) {
      case 'Work':
        return 'metallic-blue-panel text-sky-200 border-sky-400/50';
      case 'Personal':
        return 'metallic-green-panel text-emerald-200 border-emerald-400/50';
      case 'Creative':
        return 'metallic-purple-panel text-purple-200 border-purple-400/50';
      default:
        return 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/50';
    }
  };

  const pinnedCount = entries.filter(e => Boolean(e.location)).length;
  const workCount = entries.filter(e => e.category?.domain === 'Work').length;
  const personalCount = entries.filter(e => e.category?.domain === 'Personal').length;
  const creativeCount = entries.filter(e => e.category?.domain === 'Creative').length;

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
      />

      {/* Sidebar Panel with Dark Blue Gradient */}
      <aside 
        id="past-reflections-sidebar"
        className="fixed top-0 left-0 bottom-0 w-[88vw] max-w-[400px] sm:w-[440px] md:w-[480px] bg-gradient-to-b from-[#061126] via-[#091a38] to-[#040816] border-r border-blue-400/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] z-50 flex flex-col backdrop-blur-2xl animate-in slide-in-from-left duration-250 ease-out"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-blue-500/15 flex items-center justify-between gap-3 bg-blue-950/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shadow-sm">
              <Undo2 className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>📖 Journal Vault</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full metallic-gold-panel text-[#f6e7b8]">
                  {entries.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Past Entries & Insights</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onNewEntry}
              className="px-3 py-1.5 rounded-xl metallic-gold-button text-[#070d1e] text-xs flex items-center gap-1 font-bold transition-all hover:brightness-110 shadow-sm cursor-pointer"
              title="Compose New Entry"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-blue-500/15 bg-blue-950/20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, tags, locations..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/40 border border-blue-400/20 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Category Tabs with Domain Icons & Emojis */}
        <div className="px-3.5 py-2.5 border-b border-blue-500/15 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs bg-blue-950/30">
          <button
            type="button"
            onClick={() => setFilterTab('All')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'All'
                ? 'metallic-gold-button text-[#070d1e] shadow-sm'
                : 'metallic-titanium-button text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>All ({entries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('Work')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'Work'
                ? 'metallic-blue-button text-[#021428] shadow-sm'
                : 'metallic-titanium-button text-slate-300 hover:text-white'
            }`}
          >
            <span>💼</span>
            <span>Work</span>
            <span className="text-[10px] opacity-80">({workCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('Personal')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'Personal'
                ? 'metallic-green-button text-[#022014] shadow-sm'
                : 'metallic-titanium-button text-slate-300 hover:text-white'
            }`}
          >
            <span>🎾</span>
            <span>Personal</span>
            <span className="text-[10px] opacity-80">({personalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('Creative')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'Creative'
                ? 'metallic-purple-button text-[#1e0538] shadow-sm'
                : 'metallic-titanium-button text-slate-300 hover:text-white'
            }`}
          >
            <span>🎨</span>
            <span>Creative</span>
            <span className="text-[10px] opacity-80">({creativeCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('Pinned')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'Pinned'
                ? 'metallic-gold-button text-[#070d1e] shadow-sm'
                : 'metallic-titanium-button text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pinned</span>
            <span className="text-[10px] opacity-70">({pinnedCount})</span>
          </button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">No reflections found</p>
              <p className="text-[11px] text-slate-500">
                {searchQuery ? 'Try clearing search filters.' : 'Your saved reflections will appear here.'}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const domain = entry.category?.domain || 'Work';
              const DomainIcon = getDomainIcon(domain);
              const isSelected = entry.id === activeEntryId;
              const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              const completedActions = (entry.actionItems || []).filter(a => a.completed).length;
              const totalActions = (entry.actionItems || []).length;
              const previewSnippet = entry.rawText 
                ? (entry.rawText.length > 200 ? `${entry.rawText.slice(0, 200)}...` : entry.rawText)
                : (entry.reflectionSummary || '');

              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 shadow-sm ${
                    isSelected
                      ? 'metallic-gold-panel ring-1 ring-[#f6e7b8]/50 shadow-[0_0_15px_rgba(246,231,184,0.2)]'
                      : 'metallic-card hover:brightness-105'
                  }`}
                >
                  {/* Top line: domain & date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-semibold flex items-center gap-1 ${getDomainBadge(domain)}`}>
                        <DomainIcon className="w-3 h-3" />
                        <span>{domain}</span>
                      </span>
                      {entry.sentiment?.emoji && (
                        <span className="text-xs" title={`Sentiment: ${entry.sentiment.emotionalTone || ''}`}>
                          {entry.sentiment.emoji}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  {/* Summary / Snippet */}
                  <div className="space-y-1">
                    {entry.reflectionSummary && (
                      <p className="text-xs font-serif font-medium text-[#f6e7b8] line-clamp-1">
                        {entry.reflectionSummary}
                      </p>
                    )}
                    <p className="text-xs sm:text-[13px] font-neuton text-slate-200 line-clamp-3 leading-relaxed">
                      "{previewSnippet}"
                    </p>
                  </div>

                  {/* Badges / Metrics Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {totalActions > 0 && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <CheckCircle2 className={`w-3 h-3 ${completedActions === totalActions ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{completedActions}/{totalActions}</span>
                        </span>
                      )}

                      {entry.messages && entry.messages.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md metallic-panel text-slate-200 text-[10px]">
                          {entry.messages.length} msg{entry.messages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {entry.location && (
                      <span className="flex items-center gap-1 text-[#f6e7b8] text-[10px] truncate max-w-[130px]" title={entry.location.name}>
                        <MapPin className="w-3 h-3 text-[#f6e7b8] shrink-0" />
                        <span className="truncate">{entry.location.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-white/10 metallic-panel text-center text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#f6e7b8]" />
            <span>Instant Vault Sync</span>
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            {filteredEntries.length} reflection{filteredEntries.length === 1 ? '' : 's'}
          </span>
        </div>
      </aside>
    </>
  );
}
