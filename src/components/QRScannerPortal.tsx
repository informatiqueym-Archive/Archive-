import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X, Search, MapPin, Package, ArrowRight, Loader2, Save, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchiveDocument } from '@/src/types';
import DocumentCard from './DocumentCard';
import QRGeneratorModal from './QRGeneratorModal';

interface QRScannerPortalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string | null;
}

export default function QRScannerPortal({ isOpen, onClose, initialCode }: QRScannerPortalProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setScanResult(initialCode);
    }
  }, [initialCode]);
  const [boxDocs, setBoxDocs] = useState<ArchiveDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ aisle: '', rack: '', shelf: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null
  });

  useEffect(() => {
    if (isOpen && !scanResult) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        setScanResult(decodedText);
        scanner.clear();
      }, (error) => {
        // console.warn(error);
      });

      return () => {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      };
    }
  }, [isOpen, scanResult]);

  useEffect(() => {
    if (scanResult) {
      fetchBoxDocs(scanResult);
    }
  }, [scanResult]);

  const fetchBoxDocs = async (boxCode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boxes/${boxCode}`);
      if (res.ok) {
        const data = await res.json();
        setBoxDocs(data);
        if (data.length > 0) {
          const first = data[0].physicalLocation;
          setNewLocation({ aisle: first.aisle, rack: first.rack, shelf: first.shelf });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBoxLocation = async () => {
    if (!scanResult) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/boxes/${scanResult}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      });
      if (res.ok) {
        setIsEditingLocation(false);
        fetchBoxDocs(scanResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Scanner de Boîte</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Gestion d'Entrepôt Mobile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!scanResult ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div id="qr-reader" className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-dashed border-white/10 bg-white/5" />
              <div className="mt-8 text-center">
                <p className="text-slate-400 font-medium">Placez le QR Code de la boîte devant la caméra</p>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">Détection automatique active</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Box Info Card */}
              <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                      <Package className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Code de Boîte</p>
                        <button 
                          onClick={() => setQrModal({
                            isOpen: true,
                            data: { type: 'box', code: scanResult, name: `Boîte: ${boxDocs[0]?.physicalLocation.box || 'N/A'}` }
                          })}
                          className="p-1.5 bg-white/5 text-slate-500 hover:text-indigo-400 rounded-lg border border-white/5 transition-colors"
                          title="Imprimer QR Code Boîte"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                      <h3 className="text-3xl font-black text-white tracking-tighter">{scanResult}</h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {!isEditingLocation ? (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Emplacement Actuel</p>
                          <p className="text-lg font-black text-white font-mono">
                            {newLocation.aisle}-{newLocation.rack}-{newLocation.shelf}
                          </p>
                        </div>
                        <button 
                          onClick={() => setIsEditingLocation(true)}
                          className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg"
                        >
                          Déplacer
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="grid grid-cols-3 gap-2">
                          {['aisle', 'rack', 'shelf'].map((key) => (
                            <div key={key} className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-500 uppercase text-center">{key}</span>
                              <input 
                                type="text"
                                value={(newLocation as any)[key]}
                                onChange={(e) => setNewLocation({...newLocation, [key]: e.target.value})}
                                className="w-16 bg-slate-950 border border-indigo-500/30 rounded-lg px-2 py-1.5 text-center text-xs font-black text-white font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 self-end">
                          <button 
                            onClick={handleUpdateBoxLocation}
                            disabled={isSaving}
                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsEditingLocation(false)}
                            className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Contenu de la Boîte ({boxDocs.length})</h4>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Scanner une autre boîte
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Récupération du contenu...</p>
                  </div>
                ) : boxDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {boxDocs.map((doc) => (
                      <DocumentCard key={doc.id} doc={doc} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <p className="text-slate-500 font-medium">Cette boîte semble vide ou inconnue.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

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
