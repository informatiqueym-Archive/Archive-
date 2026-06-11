import React, { useState } from 'react';
import { Archive, LogIn, ShieldCheck, Database, Search, User, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface AuthProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  isLoading: boolean;
}

export default function Auth({ onLogin, onGoogleLogin, isLoading }: AuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'username' | 'google'>('username');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError('Veuillez entrer un nom d\'utilisateur et un mot de passe.');
      return;
    }
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides. Veuillez réessayer.');
    }
  };

  return (    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[60rem] h-[60rem] bg-indigo-600/10 rounded-full blur-[160px] opacity-40 animate-pulse" />
        <div className="absolute -bottom-48 -right-48 w-[60rem] h-[60rem] bg-violet-600/10 rounded-full blur-[160px] opacity-40 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-12 relative z-10 border border-white/10"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div 
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-white/10 mb-8 relative group cursor-pointer overflow-hidden p-2 flex items-center justify-center"
          >
            <img 
              src="/logo.png" 
              alt="YM-Archive Logo" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/archive/200/200';
              }}
            />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
              YM-<span className="text-indigo-500">Archive</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-white/10" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">
                Enterprise DMS
              </p>
              <div className="h-px w-8 bg-white/10" />
            </div>
          </div>
        </div>

        {authMode === 'username' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 font-mono">Identifiant</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nom d'utilisateur"
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 focus:bg-white/10 rounded-3xl transition-all duration-500 outline-none font-bold text-white shadow-inner placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 font-mono">Mot de Passe</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 focus:bg-white/10 rounded-3xl transition-all duration-500 outline-none font-bold text-white shadow-inner placeholder:text-slate-600"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 text-[10px] font-black uppercase tracking-widest">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-white text-slate-900 font-black rounded-3xl hover:bg-indigo-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 shadow-[0_20px_50px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Accéder au Système
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em]">
                <span className="bg-[#020617] px-4 text-slate-600">Protocoles de Sécurité</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAuthMode('google')}
              className="w-full py-5 bg-white/5 border border-white/5 text-slate-400 font-black rounded-3xl hover:bg-white/10 hover:text-white transition-all duration-500 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em]"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Accès Administrateur
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] text-indigo-300 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-6">
              <p className="flex items-center gap-3 mb-2 text-white">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Authentification Maître
              </p>
              Compte autorisé : <span className="text-white">direction@ym-transit.com</span>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 font-mono">Email Maître</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="direction@ym-transit.com"
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 focus:bg-white/10 rounded-3xl transition-all duration-500 outline-none font-bold text-white shadow-inner placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 font-mono">Clé Maître</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 focus:bg-white/10 rounded-3xl transition-all duration-500 outline-none font-bold text-white shadow-inner placeholder:text-slate-600"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 text-[10px] font-black uppercase tracking-widest">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.4)] flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Connexion Maître
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('username')}
              className="w-full text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] hover:text-white transition-colors font-mono"
            >
              Retour à l'accès standard
            </button>
          </form>
        )}

        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="h-px w-16 bg-white/5" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.5em] font-black">
              YM-Archive DMS v2.1.0
            </p>
            <p className="text-[8px] text-slate-700 uppercase tracking-[0.3em] font-mono">
              © 2026 YM-TRANSIT LOGISTICS
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
