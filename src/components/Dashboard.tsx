import React from 'react';
import { Archive, FileText, Users, MapPin, TrendingUp, Clock, AlertCircle, BarChart3, ShieldCheck, Building2, Database, Activity, ArrowUpRight, Shield, Zap, Globe, Lock } from 'lucide-react';
import { ArchiveDocument } from '@/src/types';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  documents: ArchiveDocument[];
}

export default function Dashboard({ documents }: DashboardProps) {
  const totalDocs = documents.length;
  const archivedDocs = documents.filter(d => d.status === 'Archived').length;
  const checkedOutDocs = documents.filter(d => d.status === 'Checked-out').length;
  const destroyedDocs = documents.filter(d => d.status === 'Destroyed').length;
  
  const recentDocs = [...documents].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).slice(0, 5);

  const stats = [
    { label: 'Total Archivé', value: totalDocs, icon: Database, color: 'indigo', trend: '+12.5%' },
    { label: 'Documents Actifs', value: archivedDocs, icon: ShieldCheck, color: 'emerald', trend: '+5.2%' },
    { label: 'Sorties en Cours', value: checkedOutDocs, icon: Clock, color: 'amber', trend: '-2.1%' },
    { label: 'Détruits / Purge', value: destroyedDocs, icon: AlertCircle, color: 'red', trend: '0%' },
  ];

  const categories = Array.from(new Set(documents.map(d => d.category)));
  const categoryData = categories.map(cat => ({
    name: cat,
    value: documents.filter(d => d.category === cat).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  // Mock data for the area chart (activity over time)
  const activityData = [
    { name: 'Lun', docs: 40 },
    { name: 'Mar', docs: 30 },
    { name: 'Mer', docs: 65 },
    { name: 'Jeu', docs: 45 },
    { name: 'Ven', docs: 90 },
    { name: 'Sam', docs: 20 },
    { name: 'Dim', docs: 15 },
  ];  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Système Opérationnel</span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tight leading-none">
            Mission <span className="text-indigo-500">Control</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium italic max-w-xl">
            Surveillance en temps réel de l'écosystème documentaire de l'entreprise.
          </p>
        </div>
        
        <div className="flex items-center gap-4 glass-card-light p-2 rounded-3xl border border-white/10">
          <div className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-indigo-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
            Sync Temps Réel
          </div>
          <div className="px-6 py-3 text-slate-400 text-xs font-black uppercase tracking-widest font-mono">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            <div className={cn(
              "absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-[2.5rem]",
              `bg-${stat.color}-500`
            )} />
            <div className="relative glass-card-light p-8 rounded-[2.5rem] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-700 group-hover:rotate-12 border border-white/10",
                  stat.color === 'indigo' ? "bg-indigo-600 text-white" :
                  stat.color === 'emerald' ? "bg-emerald-600 text-white" :
                  stat.color === 'amber' ? "bg-amber-600 text-white" :
                  "bg-red-600 text-white"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className={cn("text-[10px] font-black px-3 py-1 rounded-full border border-white/5", `text-${stat.color}-400 bg-${stat.color}-500/5`)}>
                  {stat.trend}
                </span>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 font-mono">{stat.label}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{stat.value}</span>
                  <span className={cn(
                    "text-[10px] font-black font-mono",
                    stat.trend.startsWith('+') ? "text-emerald-400" : stat.trend.startsWith('-') ? "text-red-400" : "text-slate-500"
                  )}>{stat.trend}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card-light rounded-[3rem] p-10 shadow-2xl space-y-8 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Flux Documentaire</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mt-1">Volume d'ingestion hebdomadaire</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Documents</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px', 
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="docs" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorDocs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card-light rounded-[3rem] p-10 text-white shadow-2xl border border-white/10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[60px]" />
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black tracking-tight">Répartition</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono mt-1">Top 5 Catégories</p>
          </div>

          <div className="h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 relative z-10">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-400">{item.name}</span>
                </div>
                <span className="text-[10px] font-black font-mono text-slate-600">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 glass-card-light border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
              <Activity className="w-6 h-6 text-indigo-500" />
              Dernières Ingestions
            </h3>
            <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono hover:bg-white/5 px-4 py-2 rounded-xl transition-colors">Voir Tout</button>
          </div>

          <div className="space-y-4">
            {recentDocs.map((doc, idx) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] hover:bg-white/10 transition-all duration-500 group cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-white/5">
                    <FileText className="w-7 h-7 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-base font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">REF: {doc.trackingCode || doc.id.toString().slice(0, 8)}</span>
                      <div className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono">{doc.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Date</p>
                    <p className="text-xs font-bold text-slate-300">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                    doc.status === 'Archived' ? "bg-emerald-500 shadow-emerald-500/40" :
                    doc.status === 'Checked-out' ? "bg-amber-500 shadow-amber-500/40" :
                    "bg-red-500 shadow-red-500/40"
                  )} />
                </div>
              </motion.div>
            ))}
            {documents.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Archive className="w-10 h-10 text-slate-700" />
                </div>
                <p className="text-slate-600 text-sm font-black uppercase tracking-widest italic font-serif">Référentiel vide</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health & Security */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 space-y-8 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Sécurisé</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="text-xl font-black tracking-tight">Chiffrement AES-256</h4>
              <p className="text-xs font-medium text-indigo-100 mt-2 leading-relaxed">
                Tous les documents sont protégés par un chiffrement de niveau militaire au repos et en transit.
              </p>
            </div>

            <button className="relative z-10 w-full py-4 bg-white text-indigo-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-xl">
              Audit de Sécurité
            </button>
          </div>

          <div className="glass-card-light border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Disponibilité</p>
                <p className="text-lg font-black text-white tracking-tight">Multi-Région</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                <span>Uptime Global</span>
                <span className="text-emerald-400">99.99%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '99.99%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
