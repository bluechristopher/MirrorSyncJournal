import { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  LogIn, 
  Sliders, 
  Search, 
  ChevronDown, 
  Loader2,
  Undo2,
  Home,
  Cloud,
  UserCheck,
  X,
  Trash2
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { UserPersona, DomainCategory } from '../types';
import { logoImg } from '../assets/bannerAssets';

const CATEGORY_ITEMS: Array<{
  id: 'All' | DomainCategory;
  label: string;
  emoji?: string;
  icon?: typeof Home;
  selectedClasses: string;
}> = [
  {
    id: 'All',
    label: 'All',
    icon: Home,
    selectedClasses: 'metallic-gold-button text-[#070d1e] shadow-[0_0_16px_rgba(246,231,184,0.5)]',
  },
  {
    id: 'Work',
    label: 'Work',
    emoji: '💼',
    selectedClasses: 'metallic-blue-button text-[#021428] shadow-[0_0_16px_rgba(56,189,248,0.5)]',
  },
  {
    id: 'Personal',
    label: 'Personal',
    emoji: '🎾',
    selectedClasses: 'metallic-green-button text-[#022014] shadow-[0_0_16px_rgba(52,211,153,0.5)]',
  },
  {
    id: 'Creative',
    label: 'Creative',
    emoji: '🎨',
    selectedClasses: 'metallic-purple-button text-[#1e0538] shadow-[0_0_16px_rgba(192,132,252,0.5)]',
  },
  {
    id: 'Email Drafting',
    label: 'Email Drafting',
    emoji: '✉️',
    selectedClasses: 'metallic-green-button text-[#022014] shadow-[0_0_16px_rgba(52,211,153,0.5)]',
  },
];

interface HeaderProps {
  user: User | null;
  persona: UserPersona | null;
  selectedCategory: 'All' | DomainCategory;
  onSelectCategory: (cat: 'All' | DomainCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenPersonaModal: () => void;
  onOpenThreatModal: () => void;
  onOpenInsightsModal: () => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onClearAllPosts?: () => void;
  totalEntriesCount: number;
  isSigningIn?: boolean;
  isHistoryOpen: boolean;
  onToggleHistorySidebar: () => void;
}

export function Header({
  user,
  persona,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenPersonaModal,
  onOpenThreatModal,
  onOpenInsightsModal,
  onSignInGoogle,
  onSignOut,
  onClearAllPosts,
  totalEntriesCount,
  isSigningIn = false,
  isHistoryOpen,
  onToggleHistorySidebar
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className={`sticky top-0 z-30 w-full transition-all duration-500 backdrop-blur-xl ${
      user 
        ? 'bg-gradient-to-r from-[#021c14] via-[#082e21] to-[#021810] border-b border-emerald-400/30 shadow-[0_12px_40px_rgba(2,44,29,0.85)]' 
        : 'bg-gradient-to-r from-[#0d1527] via-[#131d33] to-[#0a101f] border-b border-amber-500/25 shadow-2xl'
    }`}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 space-y-2.5">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between gap-3">
          
          {/* LEFT: Brand Identity & Mode Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              className="flex items-center gap-2.5 group cursor-pointer" 
              onClick={() => { onSelectCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div className="relative shrink-0">
                <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r opacity-70 blur-xs group-hover:opacity-100 transition duration-300 ${
                  user ? 'from-[#34d399] via-[#6EE7B7] to-[#f6e7b8]' : 'from-[#fae8a8] via-[#38bdf8] to-[#c084fc]'
                }`} />
                <img
                  src={logoImg}
                  alt="MirrorSync Logo"
                  referrerPolicy="no-referrer"
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl object-cover border-2 shadow-lg shadow-black/80 group-hover:scale-105 transition-transform ${
                    user ? 'border-emerald-400' : 'border-[#f6e7b8]'
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-base sm:text-lg md:text-xl text-white flex items-center gap-0.5 leading-none">
                    <span>Mirror</span>
                    <span className={user ? "text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "text-[#f6e7b8] drop-shadow-[0_0_10px_rgba(246,231,184,0.5)]"}>Sync</span>
                  </span>

                  {/* Mode Badge */}
                  {user ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                      <span>PREMIUM</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>DEMO</span>
                    </div>
                  )}
                </div>

                <span className={`text-[10px] sm:text-[11px] font-montserrat tracking-[0.15em] uppercase font-semibold mt-0.5 hidden sm:block ${
                  user ? 'text-emerald-300/90 drop-shadow-[0_1px_4px_rgba(52,211,153,0.3)]' : 'text-[#f6e7b8]/85 drop-shadow-[0_1px_4px_rgba(246,231,184,0.3)]'
                }`}>
                  {user ? 'Cloud Reflection Vault' : 'AI Reflection Workspace'}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: View Journal Posts Button (Dark Greenish Theme - Hides when opened) */}
          {!isHistoryOpen && (
            <div className="flex items-center gap-2">
              <button
                id="header-history-toggle-btn"
                type="button"
                onClick={onToggleHistorySidebar}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-md bg-gradient-to-r from-[#022116] via-[#093a2a] to-[#021a11] text-emerald-200 hover:text-white border border-emerald-400/40 hover:border-emerald-300/80 shadow-[0_0_16px_rgba(52,211,153,0.3)] hover:shadow-[0_0_24px_rgba(52,211,153,0.55)] active:scale-95"
                title="View Journal Posts"
              >
                <Undo2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span className="font-extrabold tracking-tight text-xs text-emerald-100 hidden sm:inline">View Journal Posts</span>
                <span className="font-extrabold tracking-tight text-xs text-emerald-100 sm:hidden inline">Posts</span>
                <span className="text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold bg-[#01140d] text-emerald-300 border border-emerald-400/50">
                  {totalEntriesCount}
                </span>
              </button>
            </div>
          )}

          {/* RIGHT: Action Tools & Auth Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Settings Logo Button (Persona & Coaching Settings) */}
            <button
              id="header-persona-btn"
              onClick={onOpenPersonaModal}
              title="Profile & Coaching Persona Settings"
              className="p-1.5 sm:p-2 rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
            >
              <Sliders className="w-4 h-4 text-slate-300" />
            </button>

            {/* Insights & Analytics */}
            <button
              id="header-insights-btn"
              onClick={onOpenInsightsModal}
              title="View Insights & Journal Stats"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="hidden lg:inline">Insights</span>
            </button>

            {/* Privacy & Security Button */}
            <button
              id="header-threat-btn"
              onClick={onOpenThreatModal}
              title="Privacy, Security & Data Safety"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl metallic-panel text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Privacy</span>
            </button>

            {/* Google Authentication User Profile / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/40 text-xs text-slate-100 hover:border-emerald-300 transition-all cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-emerald-400/60"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 text-[10px] font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="font-semibold text-slate-100 text-[11px] truncate max-w-[95px] leading-tight">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-mono flex items-center gap-0.5 leading-tight">
                      <Cloud className="w-2.5 h-2.5" /> Synced
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-emerald-300/70 ml-0.5" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#041a12] border border-emerald-400/30 shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-2xl animate-in fade-in-50 duration-150">
                    <div className="px-3 py-2.5 border-b border-emerald-500/20">
                      <p className="font-bold text-slate-100 truncate">{user.displayName || 'Google User'}</p>
                      <p className="text-[11px] text-emerald-300/80 font-mono truncate">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono">
                        <Cloud className="w-3 h-3" />
                        <span>Cloud Database Synced</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPersonaModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-emerald-900/40 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Coaching & Persona Settings</span>
                    </button>
                    {onClearAllPosts && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onClearAllPosts();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/60 transition-colors flex items-center gap-2 cursor-pointer border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Clear All Journal Posts</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="google-signin-btn"
                onClick={onSignInGoogle}
                disabled={isSigningIn}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                title="Sign in with Google to sync your journals securely"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-[#070d1e] animate-spin" />
                    <span className="hidden sm:inline">Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-[#070d1e]" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
          {/* Category Filter Pills styled like Sign In buttons with smooth horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
            {CATEGORY_ITEMS.map((item) => {
              const isActive = selectedCategory === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  id={`filter-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    onSelectCategory(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? `${item.selectedClasses} scale-[1.02]`
                      : 'metallic-titanium-button text-slate-200 hover:text-white border border-white/10 hover:border-white/20 active:scale-95'
                  }`}
                >
                  {IconComponent ? (
                    <IconComponent className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-sm leading-none">{item.emoji}</span>
                  )}
                  <span className="leading-tight whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar - Full width on mobile, compact on tablet/desktop */}
          <div className="relative w-full sm:w-44 md:w-52 lg:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="reflection-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search reflections..."
              className="w-full metallic-panel text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
