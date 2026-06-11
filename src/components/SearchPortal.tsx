import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Archive, Database, LayoutGrid, List, Folder, ChevronRight, FileDown, ShieldCheck, Activity, ArrowRight, Hash, SlidersHorizontal, Layers, X, Calendar, User, Building, Package, Printer } from 'lucide-react';
import { ArchiveDocument, Folder as FolderType } from '@/src/types';
import DocumentCard from './DocumentCard';
import { cn } from '@/src/lib/utils';
import { getFolders, getMonitoringStats, getDepartments, getCategories } from '@/src/services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import QRGeneratorModal from './QRGeneratorModal';

interface SearchPortalProps {
  documents: ArchiveDocument[];
  onDelete: (id: string) => void;
  onUpdate?: () => void;
  mode?: 'digital' | 'warehouse';
}

export default function SearchPortal({ documents, onDelete, onUpdate, mode = 'digital' }: SearchPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'box'>('grid');
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [monitoring, setMonitoring] = useState<{ departments: { department: string; count: number }[]; total: number } | null>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
    department: 'all',
    client: ''
  });
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [f, d, c] = await Promise.all([getFolders(), getDepartments(), getCategories()]);
        setFolders(f.filter(folder => folder.type === mode));
        setDepartments(d);
        setCategories(c);
        if (mode === 'digital') {
          const m = await getMonitoringStats();
          setMonitoring(m);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    loadData();
  }, [mode]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.ocrContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.trackingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.physicalLocation.aisle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.physicalLocation.box.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.physicalLocation.boxTrackingCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesDept = deptFilter === 'all' || doc.department === deptFilter;
      const matchesFolder = currentFolderId === null || doc.folderId === currentFolderId;
      const matchesMode = (mode === 'digital' && doc.status !== 'Archived') || 
                         (mode === 'warehouse' && doc.status === 'Archived');
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDept && matchesFolder && matchesMode;
    });
  }, [documents, searchQuery, statusFilter, categoryFilter, deptFilter, currentFolderId, mode]);

  const boxGroups = useMemo(() => {
    if (viewMode !== 'box') return [];
    const groups: { [key: string]: { code: string; name: string; docs: ArchiveDocument[] } } = {};
    filteredDocs.forEach(doc => {
      const code = doc.physicalLocation.boxTrackingCode || 'NO_CODE';
      const name = doc.physicalLocation.box || 'Sans Boîte';
      if (!groups[code]) {
        groups[code] = { code, name, docs: [] };
      }
      groups[code].docs.push(doc);
    });
    return Object.values(groups);
  }, [filteredDocs, viewMode]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
      if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
      if (exportFilters.category !== 'all') params.append('category', exportFilters.category);
      if (exportFilters.department !== 'all') params.append('department', exportFilters.department);
      if (exportFilters.client) params.append('client', exportFilters.client);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/documents/export?${params.toString()}`);
      
      const contentType = response.headers.get('content-type');
      console.log('Export response status:', response.status);
      console.log('Export response content-type:', contentType);

      const isPdf = contentType && contentType.includes('application/pdf');

      if (!response.ok || !isPdf) {
        let errorMessage = "Le serveur n'a pas renvoyé un fichier PDF valide";
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError.substring(0, 500));
          if (response.status === 404) errorMessage = "L'endpoint d'exportation est introuvable (404) ou aucun document trouvé";
          if (response.status === 500) errorMessage = "Erreur interne du serveur lors de la génération du PDF (500)";
          if (response.status === 401) errorMessage = "Session expirée, veuillez vous reconnecter (401)";
          if (response.status === 403) errorMessage = "Accès refusé pour l'exportation (403)";
          
          // If it's HTML, it's likely a redirect or a crash page
          if (textError.includes('<!doctype html>') || textError.includes('<html')) {
            errorMessage = `Le serveur a renvoyé une page HTML au lieu d'un PDF (Erreur ${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_archivage_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert(err instanceof Error ? err.message : "Une erreur est survenue lors de l'exportation");
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section - Prestige Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-indigo-500" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono">
              {mode === 'digital' ? 'Flux Numérique' : 'Gestion Physique'}
            </span>
          </div>
          <h2 className="text-7xl font-light text-white tracking-tighter font-serif italic leading-none">
            {mode === 'digital' ? 'Archive' : 'Entrepôt'} <span className="font-black not-italic font-sans text-white">{mode === 'digital' ? 'Numérique' : 'Logistique'}</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium italic mt-2">
            {mode === 'digital' 
              ? 'Référentiel centralisé des documents indexés par intelligence artificielle.' 
              : 'Système de traçabilité des unités physiques et emplacements de stockage.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-4 rounded-2xl transition-all duration-500", 
              viewMode === 'grid' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-4 rounded-2xl transition-all duration-500", 
              viewMode === 'list' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <List className="w-5 h-5" />
          </button>
          {mode === 'warehouse' && (
            <button 
              onClick={() => setViewMode('box')}
              className={cn(
                "p-4 rounded-2xl transition-all duration-500 flex items-center gap-2", 
                viewMode === 'box' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Vue Boîte</span>
            </button>
          )}
        </div>
      </div>

      {/* Monitoring Dashboard - Technical Widget */}
      {mode === 'digital' && monitoring && (
        <div className="bg-slate-900/40 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[120px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                <Activity className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Surveillance Temps Réel</p>
                <h3 className="text-2xl font-black tracking-tight">Statistiques de Répartition</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-12">
              <div className="space-y-3">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] font-mono">Volume Total</p>
                <p className="text-6xl font-black tracking-tighter tabular-nums">{monitoring.total}</p>
                <div className="h-1 w-12 bg-indigo-500 rounded-full" />
              </div>
              {monitoring.departments.map(dept => (
                <div key={dept.department} className="space-y-3 border-l border-white/5 pl-10">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] font-mono truncate">{dept.department}</p>
                  <p className="text-4xl font-black tracking-tighter tabular-nums">{dept.count}</p>
                  <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 font-mono">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    SYNC
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Navigation Console */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-12 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-600 group-focus-within:text-white transition-all duration-500" />
            <input
              type="text"
              placeholder="Rechercher par identifiant, contenu OCR, allée ou boîte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-20 pr-10 py-6 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[2rem] transition-all outline-none text-base font-bold shadow-inner font-mono text-white placeholder:text-slate-600"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-8 py-6 bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/20 rounded-[2rem] transition-all hover:bg-indigo-500 hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl"
            >
              <FileDown className="w-5 h-5" /> Export PDF
            </button>

            <div className="relative group/select">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-16 py-6 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[2rem] transition-all outline-none text-[11px] font-black uppercase tracking-widest appearance-none min-w-[220px] shadow-inner font-mono text-white"
              >
                <option value="all" className="bg-slate-900">TOUTES CATÉGORIES</option>
                {categories.map(c => <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>)}
              </select>
              <SlidersHorizontal className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover/select:text-white transition-colors" />
            </div>

            <div className="relative group/select">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-8 pr-16 py-6 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[2rem] transition-all outline-none text-[11px] font-black uppercase tracking-widest appearance-none min-w-[220px] shadow-inner font-mono text-white"
              >
                <option value="all" className="bg-slate-900">TOUS DÉPARTEMENTS</option>
                {departments.map(d => <option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>)}
              </select>
              <Filter className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover/select:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Folder Navigation - Technical Tabs */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Structure Hiérarchique</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={cn(
                "px-10 py-5 rounded-[1.5rem] transition-all duration-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 border-2",
                currentFolderId === null 
                  ? "bg-white text-slate-900 border-white shadow-2xl scale-105" 
                  : "bg-white/5 text-slate-500 hover:bg-white/10 border-white/5"
              )}
            >
              <Database className="w-4 h-4" /> Racine Archive
            </button>
            {folders.map(folder => (
              <button 
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className={cn(
                  "px-10 py-5 rounded-[1.5rem] transition-all duration-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 border-2",
                  currentFolderId === folder.id 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xl scale-105" 
                    : "bg-white/5 text-slate-500 hover:bg-white/10 border-white/5"
                )}
              >
                <Folder className={cn("w-4 h-4", currentFolderId === folder.id ? "text-white" : "text-indigo-500")} />
                <div className="flex flex-col items-start">
                  <span>{folder.name}</span>
                  <span className={cn("text-[7px] font-mono tracking-widest mt-1", currentFolderId === folder.id ? "text-white/60" : "text-slate-500")}>
                    {folder.trackingCode}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <AnimatePresence mode="wait">
        {viewMode === 'box' && mode === 'warehouse' ? (
          <motion.div 
            key="box-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {boxGroups.map(group => (
              <div key={group.code} className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 shadow-xl">
                      <Package className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-1">Unité Logistique</p>
                      <h3 className="text-3xl font-black text-white tracking-tighter">{group.name}</h3>
                      <p className="text-xs font-black text-indigo-400 font-mono uppercase tracking-widest mt-1">{group.code}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setQrModal({
                      isOpen: true,
                      data: { type: 'box', code: group.code, name: `Boîte: ${group.name}` }
                    })}
                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl flex items-center gap-3"
                  >
                    <Printer className="w-5 h-5" /> Imprimer QR Boîte
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.docs.map(doc => (
                    <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} onUpdate={onUpdate} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredDocs.length > 0 ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-12",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {filteredDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-40 text-center bg-slate-900/40 border border-white/5 rounded-[4rem] shadow-2xl backdrop-blur-xl"
          >
            <div className="inline-flex p-12 bg-white/5 rounded-[3rem] text-slate-700 mb-8 border border-white/5">
              <Search className="w-20 h-20" />
            </div>
            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Néant Documentaire</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto italic font-serif text-lg">
              Aucune correspondance trouvée dans le référentiel pour les critères spécifiés.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setDeptFilter('all');
                setCurrentFolderId(null);
              }}
              className="mt-10 px-8 py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20"
            >
              Réinitialiser les Filtres
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Export Modal */}
      <AnimatePresence>
        {qrModal.isOpen && (
          <QRGeneratorModal 
            isOpen={qrModal.isOpen}
            onClose={() => setQrModal({ ...qrModal, isOpen: false })}
            data={qrModal.data}
          />
        )}
        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Génération Rapport PDF</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Configuration du document final</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-indigo-500" /> Date Début
                    </label>
                    <input 
                      type="date" 
                      value={exportFilters.startDate}
                      onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-indigo-500" /> Date Fin
                    </label>
                    <input 
                      type="date" 
                      value={exportFilters.endDate}
                      onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Building className="w-3 h-3 text-indigo-500" /> Département
                    </label>
                    <select 
                      value={exportFilters.department}
                      onChange={(e) => setExportFilters({...exportFilters, department: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="all" className="bg-slate-900">TOUS</option>
                      {departments.map(d => <option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Layers className="w-3 h-3 text-indigo-500" /> Catégorie
                    </label>
                    <select 
                      value={exportFilters.category}
                      onChange={(e) => setExportFilters({...exportFilters, category: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="all" className="bg-slate-900">TOUTES</option>
                      {categories.map(c => <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                    <User className="w-3 h-3 text-indigo-500" /> Client / Tiers
                  </label>
                  <input 
                    type="text" 
                    placeholder="Filtrer par nom de client..."
                    value={exportFilters.client}
                    onChange={(e) => setExportFilters({...exportFilters, client: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleExport}
                    className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
                  >
                    <FileDown className="w-6 h-6" /> Générer le Rapport PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
