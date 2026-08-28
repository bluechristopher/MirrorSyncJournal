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
import { logoImg, fountainPenImg } from '../assets/bannerAssets';

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
  searchMatchCount?: number;
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
  searchMatchCount,
  isSigningIn = false,
  isHistoryOpen,
  onToggleHistorySidebar
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-700 backdrop-blur-2xl relative ${
      user 
        ? 'header-aurora-pro' 
        : 'header-aurora-demo'
    }`}>
      {/* Top subtle specular sheen bar sweep */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] pointer-events-none ${
        user 
          ? 'bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-[#fae8a8]/80 to-transparent'
      }`} />

      <div className="max-w-5xl mx-auto px-2 sm:px-6 py-1.5 sm:py-2.5 space-y-1.5 sm:space-y-2.5 relative z-10">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* LEFT: Brand Identity & Mode Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <div 
              className="flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer" 
              onClick={() => { onSelectCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div className="relative shrink-0">
                <div className={`absolute -inset-0.5 sm:-inset-1 rounded-lg sm:rounded-xl bg-gradient-to-r opacity-65 blur-xs group-hover:opacity-90 transition duration-300 ${
                  user ? 'from-[#34d399]/40 via-[#6EE7B7]/30 to-[#38bdf8]/30' : 'from-sky-400/40 via-blue-500/30 to-indigo-500/25'
                }`} />
                <img
                  src={logoImg}
                  alt="MirrorSync Logo"
                  referrerPolicy="no-referrer"
                  className="relative w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md sm:rounded-xl object-cover shadow-md shadow-black/80 group-hover:scale-105 transition-transform border border-sky-400/30"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-extrabold tracking-tight text-xs sm:text-lg md:text-xl text-white flex items-center gap-0.5 leading-none">
                    <span>Mirror</span>
                    <span className={user ? "text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "text-[#f6e7b8] drop-shadow-[0_0_10px_rgba(246,231,184,0.5)]"}>Sync</span>
                  </span>

                  {/* Mode Badge */}
                  {user ? (
                    <div className="relative group/mode cursor-help">
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full metallic-badge-3d-pro text-[9px] sm:text-[11px] font-black tracking-wider uppercase cursor-pointer">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399] animate-pulse" />
                        <span>PRO</span>
                      </div>

                      {/* Horizontally Wide Floating Translucent Tooltip */}
                      <div className="absolute top-full left-0 mt-1.5 w-[290px] sm:w-[420px] md:w-[480px] px-3 py-1.5 rounded-xl bg-[#021d13]/92 border border-emerald-400/60 shadow-[0_12px_32px_rgba(0,0,0,0.92),0_0_20px_rgba(52,211,153,0.3)] backdrop-blur-2xl z-[100] pointer-events-none opacity-0 translate-y-1 group-hover/mode:opacity-100 group-hover/mode:translate-y-0 transition-all duration-150 leading-tight">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 pb-0.5 border-b border-emerald-500/30">
                          <span>✨ Pro Workspace (Google Cloud)</span>
                          <span className="text-[9.5px] font-mono text-emerald-400 font-normal">All Unlocked</span>
                        </div>
                        <div className="text-[10px] text-slate-200 truncate pt-0.5">
                          <span className="text-emerald-400 font-bold mr-1">✓</span>
                          <span><strong>Unlocked:</strong> Firestore Cloud Sync, AI Banners & Maps</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group/mode cursor-help">
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full metallic-badge-3d-demo text-[9px] sm:text-[11px] font-black tracking-wider uppercase cursor-pointer">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fbbf24] animate-pulse" />
                        <span>DEMO</span>
                      </div>
                    </div>
                  )}
                </div>

                <span className={`text-[9px] sm:text-[11px] font-montserrat tracking-[0.12em] uppercase font-semibold mt-0.5 hidden sm:block ${
                  user ? 'text-emerald-300/90 drop-shadow-[0_1px_4px_rgba(52,211,153,0.3)]' : 'text-[#f6e7b8]/85 drop-shadow-[0_1px_4px_rgba(246,231,184,0.3)]'
                }`}>
                  {user ? 'Cloud Reflection Vault' : 'AI Reflection Workspace'}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: View Journal Posts Button */}
          {!isHistoryOpen && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="header-history-toggle-btn"
                type="button"
                onClick={onToggleHistorySidebar}
                className="group relative px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-2 transition-all cursor-pointer bg-gradient-to-r from-[#031d13]/90 via-[#073625]/90 to-[#021810]/90 text-emerald-100 hover:text-white border border-emerald-400/40 hover:border-emerald-300 shadow-[0_2px_12px_rgba(4,30,20,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-95 backdrop-blur-md"
                title="View Journal Vault & Posts"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-400/30 group-hover:text-white transition-colors">
                  <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                </div>
                <span className="font-extrabold tracking-tight text-[11px] sm:text-xs text-emerald-100 group-hover:text-white hidden md:inline">
                  View Journal Posts
                </span>
                <span className="font-extrabold tracking-tight text-[10px] sm:text-xs text-emerald-100 hidden sm:inline md:hidden">
                  Posts
                </span>
                <span className="text-[9px] sm:text-[11px] px-1 sm:px-1.5 py-0.2 rounded-full font-mono font-bold bg-black/40 text-emerald-300 border border-emerald-400/40 group-hover:border-emerald-300 shadow-inner">
                  {totalEntriesCount}
                </span>
              </button>
            </div>
          )}

          {/* RIGHT: Action Tools & Auth Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Settings Logo Button */}
            <button
              id="header-persona-btn"
              onClick={onOpenPersonaModal}
              title="Profile & Coaching Persona Settings"
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {/* Insights & Analytics */}
            <button
              id="header-insights-btn"
              onClick={onOpenInsightsModal}
              title="View Insights & Journal Stats"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl metallic-panel text-slate-300 hover:text-[#f6e7b8] transition-all flex items-center gap-1 sm:gap-1.5 text-xs font-medium cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="hidden lg:inline">Insights</span>
            </button>

            {/* Privacy & Security Button */}
            <button
              id="header-threat-btn"
              onClick={onOpenThreatModal}
              title="Privacy, Security & Data Safety"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl metallic-panel text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1 sm:gap-1.5 text-xs font-medium cursor-pointer shadow-sm border border-white/10 hover:border-white/20"
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
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 rounded-full bg-emerald-950/90 border border-emerald-400/40 text-xs text-slate-100 hover:border-emerald-300 transition-all cursor-pointer shadow-md"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-emerald-400/60"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 text-[9px] sm:text-[10px] font-bold">
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
                  <ChevronDown className="w-3 h-3 text-emerald-300/70 hidden sm:inline ml-0.5" />
                </button>

                {/* Dropdown Menu (Floats Fully Above Everything on Page) */}
                {showUserMenu && (
                  <>
                    {/* Backdrop dismiss overlay */}
                    <div 
                      className="fixed inset-0 z-[190] cursor-default" 
                      onClick={() => setShowUserMenu(false)} 
                    />

                    <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-gradient-to-b from-[#032015]/98 via-[#021810]/98 to-[#010f0a]/98 border border-emerald-400/60 shadow-[0_24px_64px_rgba(0,0,0,0.95),0_0_28px_rgba(52,211,153,0.35)] p-2 z-[200] text-xs space-y-1 backdrop-blur-3xl animate-in fade-in-50 zoom-in-95 duration-150">
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
                  </>
                )}
              </div>
            ) : (
              <button
                id="google-signin-btn"
                onClick={onSignInGoogle}
                disabled={isSigningIn}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                title="Sign in with Google to sync your journals securely"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#070d1e] animate-spin" />
                    <span className="hidden sm:inline">Signing In...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
                      alt="Google"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="hidden sm:inline">Sign In</span>
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

          {/* Search Bar with small Match Bubble on the Right */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <div className="relative w-36 sm:w-40 md:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="reflection-search-input"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full metallic-panel text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Found Match Bubble (Opaque green background with gold text) */}
            {searchQuery.trim().length > 0 && typeof searchMatchCount === 'number' && (
              <div 
                className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-sans font-semibold flex items-center gap-1.5 border animate-in fade-in-50 zoom-in-95 duration-150 shrink-0 shadow-md ${
                  searchMatchCount > 0
                    ? 'bg-gradient-to-r from-[#063b27] via-[#0d593d] to-[#042e1e] border-emerald-400/80 text-[#f6e7b8] shadow-[0_0_14px_rgba(52,211,153,0.3)] font-bold drop-shadow-sm'
                    : 'bg-gradient-to-r from-[#4a1520] to-[#250810] border-rose-500/50 text-rose-200'
                }`}
                title={`${searchMatchCount} matching ${searchMatchCount === 1 ? 'entry' : 'entries'} found`}
              >
                <span className="font-extrabold text-[#fae8a8]">{searchMatchCount}</span>
                <span className="font-semibold text-[#f6e7b8]">
                  {searchMatchCount === 1 ? 'found' : 'found'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
