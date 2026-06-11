import React, { useState, useEffect } from 'react';
import { Upload, FileText, MapPin, Loader2, CheckCircle2, AlertCircle, Archive, Scan, Folder, Building2, UserCheck, ShieldCheck, Fingerprint, Cpu, ArrowRight, Database, Layers, Boxes, Hash, Printer } from 'lucide-react';
import { performOCR } from '@/src/services/ocrService';
import { PhysicalLocation, DocumentStatus, Folder as FolderType } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { getFolders, getDepartments, getCategories, uploadFile } from '@/src/services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import QRGeneratorModal from './QRGeneratorModal';

interface UploadFormProps {
  onUpload: (data: {
    filename: string;
    ocrContent: string;
    physicalLocation: PhysicalLocation;
    status: DocumentStatus;
    digitalPath: string;
    category: string;
    department: string;
    folderId?: number;
    scannerSignature: string;
    notes?: string;
    client?: string;
  }) => Promise<void>;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [category, setCategory] = useState('Général');
  const [department, setDepartment] = useState('Général');
  const [folderId, setFolderId] = useState<number | undefined>(undefined);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [status, setStatus] = useState<DocumentStatus>('Archived');
  const [location, setLocation] = useState<PhysicalLocation>({
    aisle: '',
    rack: '',
    shelf: '',
    box: ''
  });
  const [digitalPath, setDigitalPath] = useState('');
  const [notes, setNotes] = useState('');
  const [client, setClient] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastUploadedCodes, setLastUploadedCodes] = useState<{ doc: string; box?: string; filename: string; boxName: string } | null>(null);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [f, d, c] = await Promise.all([getFolders(), getDepartments(), getCategories()]);
        setFolders(f);
        setDepartments(d);
        setCategories(c);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    loadData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const text = await performOCR(selectedFile);
      setOcrText(text);
      // We don't set digitalPath here anymore, we'll set it after actual upload in handleSubmit
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Échec de l\'extraction du texte. Vous pouvez le saisir manuellement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScan = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setOcrText("CONTENU DU DOCUMENT NUMÉRISÉ\nDATE: " + new Date().toLocaleDateString() + "\nARCHIVE CONFIDENTIELLE");
    setDigitalPath(`https://storage.archiveflow.com/SCAN_${Date.now()}.pdf`);
    setSuccess(true);
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !ocrText) return;

    setIsProcessing(true);
    setLastUploadedCodes(null);
    setError(null);

    try {
      let finalPath = digitalPath;
      
      // If there's a file, upload it to the server first
      if (file) {
        finalPath = await uploadFile(file, department, category);
      }

      const result = await onUpload({
        filename: file?.name || `SCAN_${Date.now()}.pdf`,
        ocrContent: ocrText,
        physicalLocation: location,
        status,
        digitalPath: finalPath,
        category,
        department,
        folderId,
        scannerSignature: 'Personnel Autorisé',
        notes,
        client
      }) as any;

      if (result?.trackingCode) {
        setLastUploadedCodes({ 
          doc: result.trackingCode, 
          box: result.boxTrackingCode,
          filename: file?.name || `SCAN_${Date.now()}.pdf`,
          boxName: location.box
        });
      }

      setSuccess(true);
      setFile(null);
      setOcrText('');
      setNotes('');
      setClient('');
      setLocation({ aisle: '', rack: '', shelf: '', box: '' });
      setDigitalPath('');
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Échec de l\'enregistrement du document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="h-px w-16 bg-indigo-500" />
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono">Terminal d'Ingestion</span>
        </div>
        <h2 className="text-7xl font-light text-white tracking-tighter font-serif italic leading-none">
          Numérisation <span className="font-black not-italic font-sans text-white">& Flux</span>
        </h2>
        <p className="text-slate-400 text-sm font-medium italic mt-2">
          Intégrez de nouveaux actifs documentaires dans le référentiel sécurisé de l'organisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 pb-32">
        {/* Source Selection - Hardware Aesthetic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative group"
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              accept="image/*,application/pdf"
            />
            <div className={cn(
              "border-2 border-dashed rounded-[3.5rem] p-12 flex flex-col items-center justify-center transition-all duration-700 h-72 shadow-2xl relative overflow-hidden backdrop-blur-xl",
              file ? "border-indigo-500 bg-indigo-500/10 shadow-indigo-500/20" : "border-white/5 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-white/5"
            )}>
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                {isProcessing && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1/2 h-full bg-indigo-500" />}
              </div>
              
              <div className="p-5 bg-slate-950 text-white rounded-3xl mb-6 shadow-xl group-hover:rotate-12 transition-transform duration-700 border border-white/5">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-black text-white text-lg tracking-tight">Téléchargement Fichier</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 font-mono">PDF, PNG, JPG / MAX 50MB</p>
              
              {file && (
                <div className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> {file.name}
                </div>
              )}
            </div>
          </motion.div>

          <motion.button
            type="button"
            onClick={handleScan}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            className="border-2 border-dashed border-white/5 bg-slate-900/40 rounded-[3.5rem] p-12 flex flex-col items-center justify-center hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-700 h-72 group shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            <div className="p-5 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl group-hover:-rotate-12 transition-transform duration-700 border border-white/5">
              <Scan className="w-8 h-8" />
            </div>
            <p className="font-black text-white text-lg tracking-tight">Scanner Physique</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 font-mono">Interface Matérielle Directe</p>
            
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono">Numérisation en cours...</p>
              </div>
            )}
          </motion.button>
        </div>

        {/* Configuration Console */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-12 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-xl border border-white/5">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Paramètres de Routage</p>
              <h3 className="text-2xl font-black tracking-tight text-white">Classification & Métadonnées</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-3 font-mono">
                <UserCheck className="w-4 h-4 text-indigo-500" /> CLIENT / TIERS
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nom du client ou tiers..."
                  className="w-full pl-8 pr-12 py-5 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[1.5rem] transition-all outline-none text-sm font-bold shadow-inner text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-3 font-mono">
                <Building2 className="w-4 h-4 text-indigo-500" /> DÉPARTEMENT
              </label>
              <div className="relative group/select">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-8 pr-12 py-5 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[1.5rem] transition-all outline-none text-sm font-bold appearance-none shadow-inner text-white"
                >
                  {departments.map(d => <option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>)}
                </select>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/select:text-indigo-400 transition-colors" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-3 font-mono">
                <Layers className="w-4 h-4 text-indigo-500" /> CATÉGORIE
              </label>
              <div className="relative group/select">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-8 pr-12 py-5 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[1.5rem] transition-all outline-none text-sm font-bold appearance-none shadow-inner text-white"
                >
                  {categories.map(c => <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>)}
                </select>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/select:text-indigo-400 transition-colors" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-3 font-mono">
                <Folder className="w-4 h-4 text-indigo-500" /> DOSSIER CIBLE
              </label>
              <div className="relative group/select">
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(Number(e.target.value))}
                  className="w-full pl-8 pr-12 py-5 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-[1.5rem] transition-all outline-none text-sm font-bold appearance-none shadow-inner text-white"
                >
                  <option value="" className="bg-slate-900">Répertoire Racine</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900">{f.name} ({f.type === 'digital' ? 'Numérique' : 'Entrepôt'})</option>
                  ))}
                </select>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/select:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* OCR Analysis - Technical Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-4 font-mono">
                <FileText className="w-5 h-5 text-indigo-500" />
                Analyse OCR & Extraction
              </label>
              {isProcessing && (
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  TRAITEMENT IA...
                </div>
              )}
            </div>
            <div className="relative">
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Le moteur OCR extraira automatiquement le contenu textuel..."
                className="w-full h-64 p-8 bg-slate-950 border border-white/10 rounded-[2.5rem] focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 transition-all duration-700 text-indigo-100 text-sm leading-relaxed font-mono shadow-2xl outline-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-4 font-mono">
                <Archive className="w-5 h-5 text-indigo-500" />
                Notes & Description Opérateur
              </label>
            </div>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes supplémentaires sur l'état du document, des références internes ou des instructions particulières..."
                className="w-full h-64 p-8 bg-slate-950 border border-white/10 rounded-[2.5rem] focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 transition-all duration-700 text-white text-sm leading-relaxed shadow-2xl outline-none"
              />
              <div className="absolute bottom-6 right-6 p-3 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                <Fingerprint className="w-5 h-5 text-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Physical Mapping - Logistics Grid */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl border border-white/5">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Coordonnées Logistiques</p>
              <h3 className="text-2xl font-black tracking-tight text-white">Emplacement Physique</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(['aisle', 'rack', 'shelf', 'box'] as const).map((key) => (
              <div key={key} className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  {key === 'aisle' ? 'Allée' : key === 'rack' ? 'Rayon' : key === 'shelf' ? 'Étagère' : 'Boîte'}
                </label>
                <input
                  type="text"
                  required
                  value={location[key]}
                  onChange={(e) => setLocation({ ...location, [key]: e.target.value })}
                  placeholder="---"
                  className="w-full px-8 py-5 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-sm font-bold shadow-inner text-center font-mono text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Final Validation & Signature */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 w-full p-8 bg-white/5 rounded-[3rem] border border-white/5 flex items-center gap-6 group backdrop-blur-xl">
            <div className="p-5 bg-slate-950 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-700 border border-white/5">
              <UserCheck className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Signature de l'Opérateur</p>
              <p className="text-lg font-black text-white tracking-tight italic">Personnel ID: <span className="font-mono not-italic text-indigo-500">AUTH-992-YM</span></p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || (!file && !ocrText)}
            className="w-full md:w-96 py-8 bg-white text-slate-900 font-black rounded-[3rem] hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs group"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Database className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Finaliser l'Archivage
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center gap-6 text-red-400 shadow-xl backdrop-blur-xl">
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Erreur Critique</p>
                <p className="text-sm font-bold">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex flex-col gap-6 text-emerald-400 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Succès Opérationnel</p>
                  <p className="text-sm font-bold text-white">Document archivé avec succès dans le référentiel central.</p>
                </div>
              </div>
              
              {lastUploadedCodes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Code Document (À coller)</p>
                      <p className="text-2xl font-black text-white font-mono tracking-tighter">{lastUploadedCodes.doc}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setQrModal({
                        isOpen: true,
                        data: { type: 'document', code: lastUploadedCodes.doc, name: lastUploadedCodes.filename }
                      })}
                      className="p-4 bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                  </div>
                  {lastUploadedCodes.box && (
                    <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Code Boîte (À coller)</p>
                        <p className="text-2xl font-black text-white font-mono tracking-tighter">{lastUploadedCodes.box}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setQrModal({
                          isOpen: true,
                          data: { type: 'box', code: lastUploadedCodes.box!, name: `Boîte: ${lastUploadedCodes.boxName}` }
                        })}
                        className="p-4 bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5"
                      >
                        <Printer className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {qrModal.isOpen && (
        <QRGeneratorModal 
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal({ ...qrModal, isOpen: false })}
          data={qrModal.data}
        />
      )}
    </div>
  );
}
