/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getDocuments, addDocument, removeDocument, testConnection } from './services/dbService';
import { ArchiveDocument, ArchiveUser } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import SearchPortal from './components/SearchPortal';
import UploadForm from './components/UploadForm';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [userProfile, setUserProfile] = useState<ArchiveUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'digital' | 'warehouse' | 'upload' | 'admin'>('dashboard');
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const profile = await res.json();
          setUserProfile(profile);
          fetchDocuments();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsAuthReady(true);
      }
    };
    checkAuth();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const profile = await res.json();
      setUserProfile(profile);
      fetchDocuments();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUserProfile(null);
      setDocuments([]);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpload = async (data: any) => {
    if (!userProfile) return;
    
    const result = await addDocument(data);
    fetchDocuments();
    // Delay navigation to allow user to see the tracking codes
    setTimeout(() => setActiveTab('digital'), 10000); 
    return result;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document de l\'archive ?')) {
      await removeDocument(id);
      fetchDocuments();
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Auth 
        onLogin={handleLogin} 
        onGoogleLogin={async () => {}} // Not used in local version
        isLoading={isLoading} 
      />
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userProfile={userProfile}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard documents={documents} />
      )}
      {activeTab === 'digital' && (
        <SearchPortal documents={documents} onDelete={handleDelete} onUpdate={fetchDocuments} mode="digital" />
      )}
      {activeTab === 'warehouse' && (
        <SearchPortal documents={documents} onDelete={handleDelete} onUpdate={fetchDocuments} mode="warehouse" />
      )}
      {activeTab === 'upload' && (
        <UploadForm onUpload={handleUpload} />
      )}
      {activeTab === 'admin' && (
        <AdminPanel />
      )}
    </Layout>
  );
}
