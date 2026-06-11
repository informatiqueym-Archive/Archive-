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

  const themes = {
    dashboard: { primary: 'indigo', accent: 'text-indigo-400', bg: 'bg-indigo-500', glow: 'shadow-indigo-500/30', border: 'border-indigo-500/30' },
    digital: { primary: 'emerald', accent: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/30' },
    warehouse: { primary: 'amber', accent: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-amber-500/30', border: 'border-amber-500/30' },
    upload: { primary: 'indigo', accent: 'text-indigo-400', bg: 'bg-indigo-500', glow: 'shadow-indigo-500/30', border: 'border-indigo-500/30' },
    admin: { primary: 'slate', accent: 'text-slate-400', bg: 'bg-slate-600', glow: 'shadow-slate-500/30', border: 'border-slate-500/30' },
  };

  const currentTheme = themes[activeTab] || themes.dashboard;

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, group: 'Principal' },
    { id: 'digital', label: 'Archive Numérique', icon: FolderOpen, group: 'Principal' },
    { id: 'warehouse', label: 'Gestion Entrepôt', icon: MapPin, group: 'Principal' },
    { id: 'upload', label: 'Numériser', icon: Upload, group: 'Opérations', condition: canEdit },
    { id: 'admin', label: 'Administration', icon: ShieldCheck, group: 'Système', condition: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 font-sans selection:bg-indigo-500/30 flex overflow-hidden relative">
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
            `bg-${currentTheme.primary}-500/30`
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
              <h1 className="font-black text-3xl tracking-tighter text-white leading-none">YM-<span className={`text-${currentTheme.primary}-500`}>Archive</span></h1>
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

        {/* User Profile - Premium Card */}
        <div className="p-8">
          <div className="p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] relative overflow-hidden group border border-white/5 transition-all duration-700 hover:border-white/10">
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-700", `bg-${currentTheme.primary}-500/10 group-hover:bg-${currentTheme.primary}-500/20`)} />
            
            <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white border border-white/10 transition-all duration-700",
                `bg-${currentTheme.primary}-600/20 group-hover:bg-${currentTheme.primary}-600`
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
                userProfile?.role === 'editor' ? `bg-${currentTheme.primary}-500 text-white border-${currentTheme.primary}-400` :
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
                  `focus:border-${currentTheme.primary}-500 focus:bg-white/10`
                )}
              />
              <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-white", `group-focus-within:text-${currentTheme.primary}-400`)} />
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
