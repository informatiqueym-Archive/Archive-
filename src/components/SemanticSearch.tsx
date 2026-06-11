import React, { useState } from 'react';
import { Sparkles, Search, Loader2, X, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface SemanticSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SemanticSearch({ isOpen, onClose }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setAnswer(null);
    try {
      // 1. Fetch documents for context
      const docsRes = await fetch('/api/documents');
      if (!docsRes.ok) throw new Error("Failed to fetch documents context");
      const docs = await docsRes.json();

      // 2. Initialize Gemini on frontend
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAnswer("Erreur : Clé API Gemini non configurée.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Tu es un assistant expert en archivage documentaire pour YM-Archive.
        L'utilisateur pose la question suivante : "${query}"
        
        Voici la liste des documents disponibles dans la base de données :
        ${docs.map((d: any) => `ID: ${d.id} | Nom: ${d.filename} | Client: ${d.client || 'N/A'} | Date: ${d.uploadDate} | Notes: ${d.notes || 'N/A'} | Contenu OCR: ${d.ocrContent?.substring(0, 200)}...`).join('\n')}
        
        Analyse la question et les documents. Réponds de manière concise en :
        1. Identifiant les documents les plus pertinents (cite leurs noms et IDs).
        2. Résumant pourquoi ils correspondent à la recherche.
        3. Si aucun document ne correspond, indique-le poliment.
        
        Réponds en français.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAnswer(response.text || "Désolé, je n'ai pas pu générer de réponse.");
    } catch (err) {
      console.error(err);
      setAnswer("Une erreur est survenue lors de la recherche sémantique.");
    } finally {
      setIsLoading(false);
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
        className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Recherche Sémantique</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Assistant IA YM-Archive</p>
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
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Posez une question à vos archives... (ex: Litige client X en 2023)"
              className="w-full pl-16 pr-24 py-6 bg-white/5 border border-white/10 rounded-3xl text-white font-medium focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Analyser
            </button>
          </form>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full animate-ping absolute inset-0" />
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-black text-white tracking-tight">Analyse en cours...</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">L'IA parcourt vos documents</p>
                </div>
              </motion.div>
            ) : answer ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Réponse de l'Assistant</span>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="prose prose-invert max-w-none relative z-10 text-slate-300 leading-relaxed">
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={() => { setAnswer(null); setQuery(''); }}
                    className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-colors"
                  >
                    Nouvelle Recherche
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                {[
                  { icon: FileText, title: "Analyse de Contenu", desc: "L'IA lit le contenu OCR de chaque page pour trouver des informations précises." },
                  { icon: MessageSquare, title: "Synthèse Intelligente", desc: "Obtenez un résumé des documents trouvés plutôt qu'une simple liste." },
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                    <item.icon className="w-8 h-8 text-indigo-400 mb-4" />
                    <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
