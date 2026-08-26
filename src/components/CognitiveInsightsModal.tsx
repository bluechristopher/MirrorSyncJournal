import { BarChart3, X, Sparkles, CheckCircle2, TrendingUp, Compass, Tag, Layers } from 'lucide-react';
import type { JournalEntry, UserPersona } from '../types';

interface CognitiveInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  persona: UserPersona | null;
}

export function CognitiveInsightsModal({
  isOpen,
  onClose,
  entries,
  persona
}: CognitiveInsightsModalProps) {
  if (!isOpen) return null;

  // Domain breakdown
  const workCount = entries.filter(e => e.category.domain === 'Work').length;
  const personalCount = entries.filter(e => e.category.domain === 'Personal').length;
  const creativeCount = entries.filter(e => e.category.domain === 'Creative').length;
  const total = entries.length || 1;

  const workPct = Math.round((workCount / total) * 100);
  const personalPct = Math.round((personalCount / total) * 100);
  const creativePct = Math.round((creativeCount / total) * 100);

  // Action item statistics
  let totalActions = 0;
  let completedActions = 0;
  entries.forEach(e => {
    (e.actionItems || []).forEach(a => {
      totalActions++;
      if (a.completed) completedActions++;
    });
  });

  // Average clarity score
  const scoredEntries = entries.filter(e => e.cognitiveMetrics?.clarityScore);
  const avgClarity = scoredEntries.length > 0
    ? Math.round(scoredEntries.reduce((acc, e) => acc + (e.cognitiveMetrics?.clarityScore || 0), 0) / scoredEntries.length)
    : 88;

  // Extract top tags
  const tagCounts: Record<string, number> = {};
  entries.forEach(e => {
    (e.category.projectTags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl metallic-card border border-white/20 shadow-2xl p-6 space-y-5 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg metallic-gold-panel flex items-center justify-center text-[#f6e7b8]">
              <BarChart3 className="w-4 h-4 text-[#f6e7b8]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#f6e7b8]">✨ Friendly Insights & Reflection Trends</h2>
              <p className="text-xs text-slate-400">Warm patterns and highlights across your journal entries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl metallic-panel space-y-1">
            <span className="text-[11px] text-slate-400">Total Reflections</span>
            <div className="text-2xl font-bold text-[#f6e7b8]">{entries.length}</div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-[#f6e7b8]" /> Ingested
            </span>
          </div>

          <div className="p-3.5 rounded-xl metallic-panel space-y-1">
            <span className="text-[11px] text-slate-400">Avg Clarity Score</span>
            <div className="text-2xl font-bold text-emerald-300">{avgClarity}%</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Optimal focus
            </span>
          </div>

          <div className="p-3.5 rounded-xl metallic-panel space-y-1">
            <span className="text-[11px] text-slate-400">Action Items Done</span>
            <div className="text-2xl font-bold text-[#f6e7b8]">
              {completedActions}/{totalActions}
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {totalActions > 0 ? `${Math.round((completedActions / totalActions) * 100)}% velocity` : 'No tasks yet'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl metallic-panel space-y-1">
            <span className="text-[11px] text-slate-400">Active Archetype</span>
            <div className="text-sm font-bold text-[#f6e7b8] truncate mt-1.5">
              {persona?.coachingTone || 'Strategic'}
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {persona?.communicationStyle?.split('&')[0] || 'Structured'}
            </span>
          </div>
        </div>

        {/* Domain Distribution Bar */}
        <div className="p-4 rounded-xl metallic-panel space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#f6e7b8] flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#f6e7b8]" />
              Domain Focus Distribution
            </span>
            <span className="text-slate-400 text-[11px] font-mono">Work / Personal / Creative</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-black/40 border border-white/10 flex overflow-hidden">
            <div
              style={{ width: `${workPct}%` }}
              className="h-full bg-blue-400 transition-all"
              title={`Work: ${workPct}%`}
            />
            <div
              style={{ width: `${personalPct}%` }}
              className="h-full bg-amber-400 transition-all"
              title={`Personal: ${personalPct}%`}
            />
            <div
              style={{ width: `${creativePct}%` }}
              className="h-full bg-purple-400 transition-all"
              title={`Creative: ${creativePct}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Work ({workPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Personal ({personalPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Creative ({creativePct}%)</span>
            </div>
          </div>
        </div>

        {/* Recurring Project / Cognitive Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f6e7b8]">
            <Tag className="w-3.5 h-3.5 text-[#f6e7b8]" />
            <span>Recurring Topics & Project Tags</span>
          </div>
          {topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count], idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg metallic-panel text-slate-200 text-xs flex items-center gap-1.5"
                >
                  <span className="text-[#f6e7b8] font-mono">#{tag}</span>
                  <span className="text-[10px] text-slate-400 font-mono">×{count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Log more reflections to uncover recurring cognitive themes.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl metallic-titanium-button text-slate-200 font-medium text-xs transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
