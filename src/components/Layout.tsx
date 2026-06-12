import React from 'react';
import { Archive, Search, Upload, LogOut, ShieldCheck, User as UserIcon, LayoutDashboard, FolderOpen, MapPin, ChevronRight, Bell, Command, QrCode, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ArchiveUser } from '@/src/types';
import QRScannerPortal from './QRScannerPortal';
import SemanticSearch from './SemanticSearch';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'digital' | 'warehouse' | 'upload' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'digital' | 'warehouse' | 'upload' | 'admin') => void;
  userProfile: ArchiveUser | null;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, userProfile, onLogout }: LayoutProps) {
  const [isQRScannerOpen, setIsQRScannerOpen] = React.useState(false);
  const [initialScanCode, setInitialScanCode] = React.useState<string | null>(null);
  const [isSemanticSearchOpen, setIsSemanticSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanCode = params.get('scan');
    if (scanCode) {
      setInitialScanCode(scanCode);
      setIsQRScannerOpen(true);
      // Clean up URL without refreshing
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  const canEdit = userProfile?.role === 'editor' || userProfile?.role === 'admin';
  const isAdmin = userProfile?.role === 'admin';

  const themeDefinitions: { [key: string]: { primary: string; accent: string; bg: string; glow: string; border: string; ambientBg: string; profileBg: string; profileIconBgBg: string; badgeBorder: string; badgeBg: string; fontColor: string; borderFocus: string; textAccent: string } } = {
    indigo: { 
      primary: 'indigo', 
      accent: 'text-indigo-400', 
      bg: 'bg-indigo-500', 
      glow: 'shadow-indigo-500/30', 
      border: 'border-indigo-500/30',
      ambientBg: 'bg-indigo-500/30',
      profileBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      profileIconBgBg: 'bg-indigo-600/20 group-hover:bg-indigo-600',
      badgeBorder: 'border-indigo-400',
      badgeBg: 'bg-indigo-500',
      fontColor: 'text-indigo-500',
      borderFocus: 'focus:border-indigo-500',
      textAccent: 'group-focus-within:text-indigo-400'
    },
    emerald: { 
      primary: 'emerald', 
      accent: 'text-emerald-400', 
      bg: 'bg-emerald-500', 
      glow: 'shadow-emerald-500/30', 
      border: 'border-emerald-500/30',
      ambientBg: 'bg-emerald-500/30',
      profileBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      profileIconBgBg: 'bg-emerald-600/20 group-hover:bg-emerald-600',
      badgeBorder: 'border-emerald-400',
      badgeBg: 'bg-emerald-500',
      fontColor: 'text-emerald-500',
      borderFocus: 'focus:border-emerald-500',
      textAccent: 'group-focus-within:text-emerald-400'
    },
    amber: { 
      primary: 'amber', 
      accent: 'text-amber-400', 
      bg: 'bg-amber-500', 
      glow: 'shadow-amber-500/30', 
      border: 'border-amber-500/30',
      ambientBg: 'bg-amber-500/30',
      profileBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      profileIconBgBg: 'bg-amber-600/20 group-hover:bg-amber-600',
      badgeBorder: 'border-amber-400',
      badgeBg: 'bg-amber-500',
      fontColor: 'text-amber-500',
      borderFocus: 'focus:border-amber-500',
      textAccent: 'group-focus-within:text-amber-400'
    },
    purple: { 
      primary: 'purple', 
      accent: 'text-purple-400', 
      bg: 'bg-purple-500', 
      glow: 'shadow-purple-500/30', 
      border: 'border-purple-500/30',
      ambientBg: 'bg-purple-500/30',
      profileBg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
      profileIconBgBg: 'bg-purple-600/20 group-hover:bg-purple-600',
      badgeBorder: 'border-purple-400',
      badgeBg: 'bg-purple-500',
      fontColor: 'text-purple-500',
      borderFocus: 'focus:border-purple-500',
      textAccent: 'group-focus-within:text-purple-400'
    },
    rose: { 
      primary: 'rose', 
      accent: 'text-rose-400', 
      bg: 'bg-rose-500', 
      glow: 'shadow-rose-500/30', 
      border: 'border-rose-500/30',
      ambientBg: 'bg-rose-500/30',
      profileBg: 'bg-rose-500/10 group-hover:bg-rose-500/20',
      profileIconBgBg: 'bg-rose-600/20 group-hover:bg-rose-600',
      badgeBorder: 'border-rose-400',
      badgeBg: 'bg-rose-500',
      fontColor: 'text-rose-500',
      borderFocus: 'focus:border-rose-500',
      textAccent: 'group-focus-within:text-rose-400'
    },
    slate: { 
      primary: 'slate', 
      accent: 'text-slate-400', 
      bg: 'bg-slate-500', 
      glow: 'shadow-slate-500/30', 
      border: 'border-slate-500/30',
      ambientBg: 'bg-slate-500/30',
      profileBg: 'bg-slate-500/10 group-hover:bg-slate-500/20',
      profileIconBgBg: 'bg-slate-600/20 group-hover:bg-slate-600',
      badgeBorder: 'border-slate-400',
      badgeBg: 'bg-slate-500',
      fontColor: 'text-slate-500',
      borderFocus: 'focus:border-slate-500',
      textAccent: 'group-focus-within:text-slate-400'
    },
  };

  const themes = {
    dashboard: themeDefinitions.indigo,
    digital: themeDefinitions.emerald,
    warehouse: themeDefinitions.amber,
    upload: themeDefinitions.indigo,
    admin: themeDefinitions.slate,
  };

  const [selectedThemeColor, setSelectedThemeColor] = React.useState<string>(() => {
    return localStorage.getItem('theme_color') || 'auto';
  });

  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme_mode') as 'light' | 'dark') || 'dark';
  });

  React.useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [themeMode]);

  const handleModeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('theme_mode', mode);
  };

  const availableColors = [
    { id: 'auto', label: 'Auto (Dynamic)', bg: 'bg-gradient-to-tr from-indigo-500 via-emerald-500 to-amber-500' },
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-500' },
    { id: 'amber', label: 'Ambre', bg: 'bg-amber-500' },
    { id: 'purple', label: 'Violet', bg: 'bg-purple-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { id: 'slate', label: 'Acier', bg: 'bg-slate-500' },
  ];

  const currentTheme = React.useMemo(() => {
    if (selectedThemeColor === 'auto') {
      return themes[activeTab] || themes.dashboard;
    }
    return themeDefinitions[selectedThemeColor] || themes.dashboard;
  }, [selectedThemeColor, activeTab]);

  const handleThemeChange = (colorId: string) => {
    setSelectedThemeColor(colorId);
    localStorage.setItem('theme_color', colorId);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, group: 'Principal' },
    { id: 'digital', label: 'Archive Numérique', icon: FolderOpen, group: 'Principal' },
    { id: 'warehouse', label: 'Gestion Entrepôt', icon: MapPin, group: 'Principal' },
    { id: 'upload', label: 'Numériser', icon: Upload, group: 'Opérations', condition: canEdit },
    { id: 'admin', label: 'Administration', icon: ShieldCheck, group: 'Système', condition: isAdmin },
  ];

  return (
    <div className={cn(
      "min-h-screen font-sans flex overflow-hidden relative w-full",
      themeMode === 'light' ? "bg-slate-50 text-slate-800 selection:bg-indigo-500/10" : "bg-[#02040a] text-slate-200 selection:bg-indigo-500/30"
    )}>
      {/* Dynamic Mesh Background - The "Wonderful Mixture" */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000 opacity-20",
            currentTheme.ambientBg
          )} 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-purple-600/10 opacity-20"
        />
        <div className="absolute inset-0 grid-bg opacity-10" />
      </div>

      {/* Sidebar - Integrated Structure */}
      <aside className="w-80 glass-card-light border-r border-white/5 flex flex-col z-50 relative shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]">
        {/* Brand Header */}
        <div className="p-12">
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700 group cursor-pointer border border-white/10 overflow-hidden p-1",
              currentTheme.glow
            )}>
              <img 
                src="/logo.png" 
                alt="YM-Archive Logo" 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/archive/200/200';
                }}
              />
            </div>
            <div>
              <h1 className="font-black text-3xl tracking-tighter text-white leading-none">YM-<span className={currentTheme.fontColor}>Archive</span></h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2 font-mono">DMS ENTERPRISE</p>
            </div>
          </div>
        </div>

        {/* AI & QR Quick Actions */}
        <div className="px-8 mb-8 grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsSemanticSearchOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] group hover:bg-indigo-500 transition-all duration-500"
          >
            <Sparkles className="w-6 h-6 text-indigo-400 group-hover:text-white mb-3" />
            <span className="text-[9px] font-black text-indigo-300 group-hover:text-white uppercase tracking-widest">Assistant IA</span>
          </button>
          <button 
            onClick={() => setIsQRScannerOpen(true)}
            className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-all duration-500"
          >
            <QrCode className="w-6 h-6 text-slate-400 group-hover:text-white mb-3" />
            <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">Scanner QR</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-12">
          {['Principal', 'Opérations', 'Système'].map((group) => {
            const items = menuItems.filter(item => item.group === group && (item.condition === undefined || item.condition));
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-4 font-mono">{group}</p>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const isTabActive = activeTab === item.id;
                    const itemTheme = themes[item.id as keyof typeof themes] || themes.dashboard;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={cn(
                          "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden border border-transparent",
                          isTabActive 
                            ? "text-white font-bold border-white/10 shadow-xl" 
                            : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        {isTabActive && (
                          <motion.div 
                            layoutId="nav-bg"
                            className={cn("absolute inset-0", itemTheme.bg)}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <div className="flex items-center gap-4 relative z-10">
                          <item.icon className={cn(
                            "w-5 h-5 transition-all duration-500", 
                            isTabActive ? "text-white scale-110" : "text-slate-500 group-hover:text-slate-200"
                          )} />
                          <span className="text-sm tracking-tight">{item.label}</span>
                        </div>
                        {isTabActive && (
                          <ChevronRight className="w-4 h-4 text-white/60 relative z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Theme Switcher Console */}
        <div className="px-8 mb-4">
          <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Thème Visuel</span>
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                {availableColors.find(c => c.id === selectedThemeColor)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              {availableColors.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleThemeChange(color.id)}
                  title={color.label}
                  className={cn(
                    "w-6 h-6 rounded-full border transition-all duration-300 relative hover:scale-110",
                    selectedThemeColor === color.id 
                      ? "border-white scale-105 ring-2 ring-indigo-500/20" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <span className={cn("absolute inset-0.5 rounded-full block", color.bg)} />
                </button>
              ))}
            </div>

            {/* Mode Toggle (Windows-style Light vs Dark) */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">CONTRASTE (WINDOWS)</span>
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                  {themeMode === 'light' ? 'Clair' : 'Sombre'}
                </span>
              </div>
              <div className="flex bg-black/10 p-1 rounded-xl border border-white/5 w-full">
                <button
                  onClick={() => handleModeChange('dark')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-300",
                    themeMode === 'dark' 
                      ? "bg-white text-slate-900 shadow-sm font-bold scale-102" 
                      : "text-slate-400 hover:text-white"
                  )}
                  title="Mode Sombre (Dark)"
                >
                  <span>🌙</span>
                  <span className="text-[9px] font-black uppercase tracking-wider">Sombre</span>
                </button>
                <button
                  onClick={() => handleModeChange('light')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-300",
                    themeMode === 'light' 
                      ? "bg-white text-slate-900 shadow-sm font-bold scale-102" 
                      : "text-slate-400 hover:text-white"
                  )}
                  title="Mode Clair (Light)"
                >
                  <span>☀️</span>
                  <span className="text-[9px] font-black uppercase tracking-wider">Clair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile - Premium Card */}
        <div className="p-8">
          <div className="p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] relative overflow-hidden group border border-white/5 transition-all duration-700 hover:border-white/10">
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-700", currentTheme.profileBg)} />
            
            <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white border border-white/10 transition-all duration-700",
                currentTheme.profileIconBgBg
              )}>
                {userProfile?.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Opérateur</p>
                <p className="text-base font-black text-white truncate tracking-tight">{userProfile?.username || 'Invité'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                userProfile?.role === 'admin' ? "bg-white text-slate-900 border-white" :
                userProfile?.role === 'editor' ? cn("text-white", currentTheme.badgeBg, currentTheme.badgeBorder) :
                "bg-white/10 text-slate-300 border-white/10"
              )}>
                {userProfile?.role === 'admin' ? 'ADMINISTRATEUR' : userProfile?.role === 'editor' ? 'ÉDITEUR' : 'LECTEUR'}
              </span>
              <button 
                onClick={onLogout}
                className="p-3 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Top Header Bar */}
        <header className="h-24 glass-card-light border-b border-white/5 px-12 flex items-center justify-between z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={cn("w-1.5 h-1.5 rounded-full", currentTheme.bg)} />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-mono">
                {menuItems.find(i => i.id === activeTab)?.label}
              </span>
            </div>
            <div className="h-4 w-px bg-white/5" />
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", currentTheme.bg)} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Node</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Recherche globale..." 
                className={cn(
                  "pl-12 pr-6 py-3 bg-white/5 border border-white/5 rounded-2xl transition-all outline-none text-xs font-bold w-64 shadow-inner text-white placeholder:text-slate-600",
                  currentTheme.borderFocus, "focus:bg-white/10"
                )}
              />
              <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-white", currentTheme.textAccent)} />
            </div>
            <button className="p-3 text-slate-500 hover:text-white transition-colors relative bg-white/5 rounded-2xl border border-white/5">
              <Bell className="w-5 h-5" />
              <span className={cn("absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-slate-950", currentTheme.bg)} />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer Info Rail */}
        <footer className="h-12 bg-slate-950/40 border-t border-white/5 px-12 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono">
          <div className="flex items-center gap-8">
            <span>YM-ARCHIVE DMS v2.1.0</span>
            <span className="text-indigo-500/50">ENCRYPTED CHANNEL</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-emerald-400 rounded-full" />
              <span>SYNC OK</span>
            </div>
            <span>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </footer>
      </div>
      {/* Portals */}
      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScannerPortal 
            isOpen={isQRScannerOpen} 
            onClose={() => {
              setIsQRScannerOpen(false);
              setInitialScanCode(null);
            }} 
            initialCode={initialScanCode}
          />
        )}
        {isSemanticSearchOpen && (
          <SemanticSearch 
            isOpen={isSemanticSearchOpen} 
            onClose={() => setIsSemanticSearchOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
