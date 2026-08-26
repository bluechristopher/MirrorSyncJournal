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
  X
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
  totalEntriesCount,
  isSigningIn = false,
  isHistoryOpen,
  onToggleHistorySidebar
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full metallic-header shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 space-y-2">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Past Entries Button */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {/* Prominent Past Entries Button */}
            <button
              id="header-history-toggle-btn"
              type="button"
              onClick={onToggleHistorySidebar}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-md shrink-0 ${
                isHistoryOpen
                  ? 'metallic-gold-button text-[#070d1e] shadow-[0_0_15px_rgba(246,231,184,0.4)]'
                  : 'metallic-titanium-button text-slate-100 hover:text-[#f6e7b8]'
              }`}
              title="Open Past Entries Vault"
            >
              <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 stroke-[2.5]" />
              <span className="font-bold tracking-tight text-[11px] sm:text-xs">Vault</span>
              <span className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold border ${
                isHistoryOpen
                  ? 'bg-black/30 text-[#070d1e] border-black/20'
                  : 'bg-black/50 text-[#f6e7b8] border-[#f6e7b8]/40'
              }`}>
                {totalEntriesCount}
              </span>
            </button>

            {/* App Logo & Prominent Title */}
            <div className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0" onClick={() => { onSelectCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <div className="relative shrink-0">
                {/* Glowing Aura Ring */}
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] to-[#c084fc] opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
                <img
                  src={logoImg}
                  alt="MirrorSync Logo"
                  referrerPolicy="no-referrer"
                  className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl object-cover border-2 border-[#f6e7b8] shadow-lg shadow-black/80 group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold tracking-tight text-sm sm:text-base md:text-lg text-white flex items-center gap-0.5 sm:gap-1 leading-tight drop-shadow-sm truncate">
                  <span>Mirror</span>
                  <span className="text-[#f6e7b8] drop-shadow-[0_0_10px_rgba(246,231,184,0.5)]">Sync</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#f6e7b8]/80 font-mono tracking-wider uppercase hidden sm:block">
                  AI Reflection Vault
                </span>
              </div>
            </div>

            {/* Persona Role Tag (if configured) */}
            {persona && persona.occupation && (
              <div 
                onClick={onOpenPersonaModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl metallic-panel text-xs text-slate-300 hover:text-[#f6e7b8] cursor-pointer transition-all shadow-sm shrink-0"
                title="Click to adjust your coaching lens & persona"
              >
                <span className="w-2 h-2 rounded-full bg-[#f6e7b8] shadow-[0_0_6px_#f6e7b8]" />
                <span className="font-medium text-slate-200 truncate max-w-[130px]">
                  {persona.occupation}
                </span>
                <Sliders className="w-3 h-3 text-slate-400 ml-0.5" />
              </div>
            )}
          </div>

          {/* Right Action Controls & Auth Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Insights & Analytics */}
            <button
              id="header-insights-btn"
              onClick={onOpenInsightsModal}
              title="View Insights & Journal Stats"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="hidden md:inline">Insights</span>
            </button>

            {/* Privacy & Security Modal Button */}
            <button
              id="header-threat-btn"
              onClick={onOpenThreatModal}
              title="Privacy, Security & Data Safety"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl metallic-panel text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Privacy</span>
            </button>

            {/* Persona Setup Button */}
            <button
              id="header-persona-btn"
              onClick={onOpenPersonaModal}
              title="Edit Profile & Coaching Style"
              className="p-1.5 sm:p-2 rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all cursor-pointer shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
            </button>

            {/* Google Authentication User Avatar / Button */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-1.5 pr-2 sm:pr-3 py-1 rounded-full metallic-panel text-xs text-slate-200 hover:text-[#f6e7b8] transition-all cursor-pointer shadow-sm"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-[#f6e7b8]/40"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#f6e7b8] to-[#d4af37] flex items-center justify-center text-[#070d1e] text-[10px] font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="font-semibold text-slate-100 text-[11px] truncate max-w-[85px] leading-tight">
                      {user.displayName?.split(' ')[0] || 'User'}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5 leading-tight">
                      <Cloud className="w-2.5 h-2.5" /> Synced
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl metallic-card shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl animate-in fade-in-50 duration-150">
                    <div className="px-3 py-2.5 border-b border-white/10">
                      <p className="font-semibold text-slate-100 truncate">{user.displayName || 'Google User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono">
                        <Cloud className="w-3 h-3" />
                        <span>Cloud Database Synced</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPersonaModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#f6e7b8]" />
                      <span>Coaching & Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="google-signin-btn"
                  onClick={onSignInGoogle}
                  disabled={isSigningIn}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Sign in with Google to sync your journals securely across devices"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-[#070d1e] animate-spin" />
                      <span className="hidden sm:inline">Signing In...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5 text-[#070d1e]" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
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
