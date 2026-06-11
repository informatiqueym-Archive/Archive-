import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Download, Package, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: 'box' | 'document';
    code: string;
    name: string;
    details?: string;
  };
}

export default function QRGeneratorModal({ isOpen, onClose, data }: QRGeneratorModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_CODE_${data.code}`,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Étiquette Logistique</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Prêt pour Impression</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 flex flex-col items-center gap-8">
          {/* Printable Area */}
          <div 
            ref={printRef}
            className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6 text-slate-900 border-4 border-slate-100"
            style={{ width: '300px' }}
          >
            <div className="flex items-center gap-3 mb-2">
              {data.type === 'box' ? <Package className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">YM-ARCHIVE</span>
            </div>
            
            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl">
              <QRCodeSVG 
                value={`${window.location.origin}?scan=${data.code}`} 
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifiant Unique</p>
              <p className="text-2xl font-black tracking-tighter font-mono">{data.code}</p>
              <p className="text-xs font-bold text-slate-600 mt-2 truncate max-w-[200px]">{data.name}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 w-full text-center">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Propriété de l'Entreprise</p>
            </div>
          </div>

          <div className="grid grid-cols-1 w-full gap-4">
            <button 
              onClick={() => handlePrint()}
              className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <Printer className="w-5 h-5" />
              Imprimer l'Étiquette
            </button>
            <p className="text-[9px] font-black text-slate-500 text-center uppercase tracking-widest leading-relaxed">
              Collez cette étiquette sur la face visible de la {data.type === 'box' ? 'boîte' : 'chemise'} pour un scan rapide.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
