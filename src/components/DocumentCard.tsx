import React, { useState } from 'react';
import { FileText, MapPin, Calendar, ExternalLink, Trash2, CheckCircle, Clock, Database, UserCheck, ShieldCheck, Building2, Tag, Folder, Hash, Signature, ArrowRight, Search, Archive, Edit3, Save, X, QrCode } from 'lucide-react';
import { ArchiveDocument } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import QRGeneratorModal from './QRGeneratorModal';

interface DocumentCardProps {
  doc: ArchiveDocument;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

export default function DocumentCard({ doc, onDelete, onUpdate }: DocumentCardProps) {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [location, setLocation] = useState(doc.physicalLocation);
  const [isSaving, setIsSaving] = useState(false);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null
  });

  const statusColors = {
    'Archived': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Checked-out': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Destroyed': 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  const statusLabels = {
    'Archived': 'ARCHIVÉ',
    'Checked-out': 'SORTI',
    'Destroyed': 'DÉTRUIT'
  };

  const StatusIcon = {
    'Archived': CheckCircle,
    'Checked-out': Clock,
    'Destroyed': Trash2
  }[doc.status];

  const handleUpdateLocation = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      
      if (res.ok) {
        setIsEditingLocation(false);
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="bg-slate-900/40 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.3)] transition-all duration-500 group flex flex-col relative backdrop-blur-xl"
    >
      {/* Premium Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header Section - Integrated Grid */}
      <div className="p-8 border-b border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-2xl group-hover:bg-indigo-600 transition-colors duration-500 border border-white/5 flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <button 
                onClick={() => setQrModal({
                  isOpen: true,
                  data: { type: 'document', code: doc.trackingCode || doc.id.toString(), name: doc.filename }
                })}
                className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-indigo-500 rounded-xl transition-all border border-white/5 shadow-lg"
                title="Générer QR Code Document"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm whitespace-nowrap", statusColors[doc.status])}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusLabels[doc.status]}
              </div>
              {doc.physicalLocation.boxTrackingCode && (
                <button 
                  onClick={() => setQrModal({
                    isOpen: true,
                    data: { type: 'box', code: doc.physicalLocation.boxTrackingCode!, name: `Boîte: ${doc.physicalLocation.box}` }
                  })}
                  className="px-3 py-1 bg-slate-950 text-white hover:bg-indigo-600 rounded-lg text-[7px] font-black uppercase tracking-widest font-mono border border-white/5 whitespace-nowrap flex items-center gap-2 transition-colors"
                >
                  <QrCode className="w-3 h-3" />
                  BOX: {doc.physicalLocation.boxTrackingCode}
                </button>
              )}
            </div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono truncate">{doc.trackingCode || doc.id.toString().slice(0, 12)}</span>
            </div>
            <h3 className="text-lg font-black text-white leading-tight tracking-tight group-hover:text-indigo-400 transition-colors duration-500 break-words" title={doc.filename}>
              {doc.filename}
            </h3>
          </div>
        </div>
      </div>

      {/* Metadata Grid - Technical Layout */}
      <div className="grid grid-cols-2 border-b border-white/5 divide-x divide-white/5">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Localisation Physique
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Allée', key: 'aisle' },
              { label: 'Rayon', key: 'rack' },
              { label: 'Étagère', key: 'shelf' },
              { label: 'Boîte', key: 'box' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors duration-500 flex flex-col items-center justify-center relative">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">{item.label}</p>
                {isEditingLocation ? (
                  <input 
                    type="text"
                    value={(location as any)[item.key] || ''}
                    onChange={(e) => setLocation({...location, [item.key]: e.target.value})}
                    className="w-full bg-indigo-500/20 border border-indigo-500/50 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Saisir..."
                  />
                ) : (
                  <p className="text-lg font-black text-white font-mono">{(doc.physicalLocation as any)[item.key] || '-'}</p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4">
            {!isEditingLocation ? (
              <button 
                onClick={() => {
                  setLocation(doc.physicalLocation);
                  setIsEditingLocation(true);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-2xl transition-all duration-300 group/editbtn shadow-lg"
                title="Modifier la localisation"
              >
                <Edit3 className="w-4 h-4 group-hover/editbtn:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Modifier la Localisation</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleUpdateLocation}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-lg"
                  title="Enregistrer"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Valider</span>
                </button>
                <button 
                  onClick={() => {
                    setIsEditingLocation(false);
                    setLocation(doc.physicalLocation);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-2xl transition-all duration-300 shadow-lg"
                  title="Annuler"
                >
                  <X className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Annuler</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">
            <Database className="w-4 h-4 text-indigo-500" />
            Métadonnées Système
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Client / Tiers</span>
              <span className="text-sm font-black text-white uppercase tracking-tight break-words">{doc.client || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1.5 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Département</span>
              <span className="text-sm font-black text-slate-200 uppercase tracking-tight break-words">{doc.department}</span>
            </div>
            <div className="flex flex-col gap-1.5 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Catégorie</span>
              <span className="text-sm font-black text-indigo-400 uppercase tracking-tight break-words">{doc.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 flex-1 space-y-6">
        <div className="relative group/ocr">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              Analyse OCR
            </div>
            <div className="h-px flex-1 bg-white/5 mx-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium italic font-serif leading-relaxed line-clamp-2 px-4 border-l-2 border-indigo-500/20 group-hover/ocr:border-indigo-500 transition-colors">
            "{doc.ocrContent || 'Aucun texte extrait du document'}"
          </p>
        </div>

        {doc.notes && (
          <div className="relative group/notes">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">
                <Archive className="w-3.5 h-3.5 text-indigo-500" />
                Notes Opérateur
              </div>
              <div className="h-px flex-1 bg-white/5 mx-4" />
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed px-4 border-l-2 border-emerald-500/20 group-hover/notes:border-emerald-500 transition-colors">
              {doc.notes}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6">
          <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-lg border border-white/5 flex-shrink-0">
              <Signature className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Authentifié par</p>
              <p className="text-sm font-black text-white tracking-tight truncate">{doc.scannerSignature || doc.authorName || 'SYSTÈME'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-end">
            {onDelete && (
              <button
                onClick={() => onDelete(doc.id)}
                className="p-4 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all flex-shrink-0"
                title="Supprimer"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
            <a 
              href={doc.digitalPath.startsWith('http') ? doc.digitalPath : `/${doc.digitalPath}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl whitespace-nowrap"
            >
              Consulter
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
      
      {qrModal.isOpen && (
        <QRGeneratorModal 
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal({ ...qrModal, isOpen: false })}
          data={qrModal.data}
        />
      )}
    </motion.div>
  );
}
