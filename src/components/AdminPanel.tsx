import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User as UserIcon, Trash2, Loader2, CheckCircle2, AlertCircle, Key, FolderPlus, Folder, Building2, Tag, Plus, Settings2, Users, Database, ShieldCheck, Fingerprint, ArrowRight, Activity, LayoutGrid } from 'lucide-react';
import { ArchiveUser, UserRole } from '@/src/types';
import { 
  getUsers, 
  createUserProfile, 
  createFolder, 
  getFolders, 
  getDepartments, 
  createDepartment, 
  deleteDepartment,
  getCategories,
  createCategory,
  deleteCategory
} from '@/src/services/dbService';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<ArchiveUser[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  
  // User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['Général']);
  
  // Folder Form State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'digital' | 'warehouse'>('digital');

  // Dept/Cat Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userData, folderData, deptData, catData] = await Promise.all([
        getUsers(), 
        getFolders(),
        getDepartments(),
        getCategories()
      ]);
      setUsers(userData);
      setFolders(folderData);
      setDepartments(deptData);
      setCategories(catData);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await createUserProfile({
        username: newUsername,
        password: newPassword,
        role: newRole,
        department: selectedDepts[0] || 'Général',
        departments: selectedDepts.join(',')
      });

      setSuccess(`Utilisateur "${newUsername}" créé avec succès.`);
      setNewUsername('');
      setNewPassword('');
      setSelectedDepts(['Général']);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Échec de la création de l\'utilisateur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await createFolder({
        name: newFolderName,
        type: newFolderType
      });

      setSuccess(`Dossier "${newFolderName}" créé avec succès.`);
      setNewFolderName('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Échec de la création du dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    setIsLoading(true);
    try {
      await createDepartment(newDeptName);
      setNewDeptName('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setIsLoading(true);
    try {
      await createCategory(newCatName);
      setNewCatName('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section - Prestige Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="h-px w-16 bg-indigo-500" />
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono">Configuration Système</span>
        </div>
        <h2 className="text-7xl font-light text-white tracking-tighter font-serif italic leading-none">
          Administration <span className="font-black not-italic font-sans text-white">Centrale</span>
        </h2>
        <p className="text-slate-400 text-sm font-medium italic mt-2">Gestion des accès, des structures et des protocoles d'archivage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Forms */}
        <div className="lg:col-span-1 space-y-12">
          {/* User Creation - Technical Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-card-light border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-lg border border-white/10">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Sécurité</p>
                <h3 className="font-black text-white text-xl tracking-tight">Accès Personnel</h3>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono">Identifiant</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-sm font-bold shadow-inner font-mono text-white placeholder:text-slate-700"
                  placeholder="NOM_UTILISATEUR"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono">Clé d'Accès</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-sm font-bold shadow-inner font-mono text-white placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono block">DÉPARTEMENTS ACCÈS (UN OU PLUSIEURS)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 bg-white/5 rounded-2xl border border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                  {departments.map(d => (
                    <label key={d.id} className="flex items-center gap-3 cursor-pointer text-[10px] font-black text-slate-300 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={selectedDepts.includes(d.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDepts([...selectedDepts, d.name]);
                          } else {
                            if (selectedDepts.length > 1) {
                              setSelectedDepts(selectedDepts.filter(name => name !== d.name));
                            }
                          }
                        }}
                        className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500/30 bg-slate-900 w-4 h-4 cursor-pointer"
                      />
                      <span className="uppercase tracking-wide truncate">{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono block">NIVEAU D'ACCRÉDITATION</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-xs font-black uppercase tracking-tight shadow-inner appearance-none text-white font-mono"
                >
                  <option value="viewer" className="bg-slate-900">LECTEUR (VIEWER)</option>
                  <option value="editor" className="bg-slate-900">ÉDITEUR (EDITOR)</option>
                  <option value="admin" className="bg-slate-900">ADMINISTRATEUR (ADMIN)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Autoriser l'Accès
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Folder Creation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="glass-card-light border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg border border-white/10">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Structure</p>
                <h3 className="font-black text-white text-xl tracking-tight">Nouveau Répertoire</h3>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono">Nom du Répertoire</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-sm font-bold shadow-inner text-white placeholder:text-slate-700"
                  placeholder="DOSSIER_ARCHIVE"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 font-mono">Type de Flux</label>
                <select
                  value={newFolderType}
                  onChange={(e) => setNewFolderType(e.target.value as any)}
                  className="w-full px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl transition-all outline-none text-xs font-black uppercase tracking-widest shadow-inner appearance-none text-white"
                >
                  <option value="digital" className="bg-slate-900">ARCHIVE NUMÉRIQUE</option>
                  <option value="warehouse" className="bg-slate-900">GESTION ENTREPÔT</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-white hover:text-slate-900 transition-all shadow-2xl uppercase tracking-[0.3em] text-[10px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Initialiser Répertoire"}
              </button>
            </form>

            <div className="p-10 bg-white/5 border-t border-white/10 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Répertoires Actifs</p>
              {folders.map(f => (
                <div key={f.id} className="p-5 bg-slate-950/40 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between group backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg border border-white/10", f.type === 'digital' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{f.name}</p>
                      <p className="text-[8px] font-black text-indigo-400 font-mono uppercase tracking-widest">{f.trackingCode}</p>
                    </div>
                  </div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono px-2 py-1 bg-white/5 rounded-md border border-white/10">
                    {f.type === 'digital' ? 'NUM' : 'ENT'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Lists and Management */}
        <div className="lg:col-span-2 space-y-12">
          {/* Management Depts and Cats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card-light border border-white/10 rounded-[3.5rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 text-white rounded-2xl border border-white/10">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-tight text-lg">Départements</h3>
                </div>
                <span className="text-[11px] font-black text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{departments.length}</span>
              </div>
              <form onSubmit={handleCreateDept} className="flex gap-3 mb-10">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Nouveau département..."
                  className="flex-1 px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner text-white placeholder:text-slate-700"
                />
                <button type="submit" className="p-4 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </form>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {departments.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-5 bg-white/5 rounded-[1.5rem] border border-white/10 group hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300">
                    <span className="text-sm font-black text-slate-300 tracking-tight">{d.name}</span>
                    <button onClick={() => deleteDepartment(d.id).then(fetchData)} className="p-2.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-950 rounded-xl shadow-sm border border-white/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card-light border border-white/10 rounded-[3.5rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 text-white rounded-2xl border border-white/10">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-tight text-lg">Catégories</h3>
                </div>
                <span className="text-[11px] font-black text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{categories.length}</span>
              </div>
              <form onSubmit={handleCreateCat} className="flex gap-3 mb-10">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nouvelle catégorie..."
                  className="flex-1 px-6 py-4 bg-white/5 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white/10 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner text-white placeholder:text-slate-700"
                />
                <button type="submit" className="p-4 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </form>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-5 bg-white/5 rounded-[1.5rem] border border-white/10 group hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300">
                    <span className="text-sm font-black text-slate-300 tracking-tight">{c.name}</span>
                    <button onClick={() => deleteCategory(c.id).then(fetchData)} className="p-2.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-950 rounded-xl shadow-sm border border-white/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Personnel Registry */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="glass-card-light border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-12 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-950 rounded-2xl shadow-sm border border-white/10">
                  <Users className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Registre Central</p>
                  <h3 className="font-black text-white text-2xl tracking-tight">Personnel Autorisé</h3>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {users.slice(0, 5).map((u, i) => (
                    <div key={u.id} className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {users.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-slate-900 flex items-center justify-center text-slate-500 text-[10px] font-black">
                      +{users.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Identité</th>
                    <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Département</th>
                    <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Accréditation</th>
                    <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user, i) => (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-white text-lg tracking-tight">{user.username}</p>
                            <p className="text-[10px] font-black text-slate-500 font-mono uppercase tracking-widest mt-0.5">UID: {user.uid?.slice(0, 8) || user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex flex-wrap gap-2">
                          {(user.departments || user.department || 'Général').split(',').map((dept, idx) => (
                            <span key={idx} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 shadow-sm font-mono">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className={cn(
                            "w-4 h-4",
                            user.role === 'admin' ? "text-purple-400" : user.role === 'editor' ? "text-blue-400" : "text-slate-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            user.role === 'admin' ? "text-purple-400" : user.role === 'editor' ? "text-blue-400" : "text-slate-500"
                          )}>
                            {user.role === 'admin' ? 'ADMINISTRATEUR' : user.role === 'editor' ? 'ÉDITEUR' : 'LECTEUR'}
                          </span>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-right">
                        <button className="p-4 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 bg-slate-950 rounded-2xl shadow-sm border border-white/10">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-12 right-12 p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] flex items-center gap-6 text-white z-50 min-w-[320px]">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono mb-1">Succès Système</p>
            <p className="text-sm font-black tracking-tight">{success}</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-12 right-12 p-8 bg-red-950 border border-red-500/20 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] flex items-center gap-6 text-white z-50 min-w-[320px]">
          <div className="p-3 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest font-mono mb-1">Erreur Système</p>
            <p className="text-sm font-black tracking-tight">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
