import { ArchiveDocument, ArchiveUser } from '../types';

export async function testConnection() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Not authenticated');
  } catch (error) {
    console.error("Local API connection failed:", error);
  }
}

export async function getDocuments(): Promise<ArchiveDocument[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function addDocument(docData: Omit<ArchiveDocument, 'id'>) {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docData)
  });
  if (!res.ok) throw new Error('Failed to add document');
  return res.json();
}

export async function removeDocument(docId: string) {
  const res = await fetch(`/api/documents/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

// User Management
export async function getUsers(): Promise<ArchiveUser[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUserProfile(user: any) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

// Folder Management
export async function getFolders(): Promise<any[]> {
  const res = await fetch('/api/folders');
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function createFolder(folder: { name: string; parentPath?: string; type: 'digital' | 'warehouse' }) {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folder)
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return res.json();
}

// Monitoring
export async function getMonitoringStats(mode?: string): Promise<{ departments: { department: string; count: number }[]; total: number }> {
  const url = mode ? `/api/monitoring?mode=${mode}` : '/api/monitoring';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch monitoring stats');
  return res.json();
}

// Department Management
export async function getDepartments(): Promise<{ id: number; name: string }[]> {
  const res = await fetch('/api/departments');
  if (!res.ok) throw new Error('Failed to fetch departments');
  return res.json();
}

export async function createDepartment(name: string) {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create department');
  return res.json();
}

export async function deleteDepartment(id: number) {
  const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete department');
  return res.json();
}

// Category Management
export async function getCategories(): Promise<{ id: number; name: string }[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function deleteCategory(id: number) {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
}

export async function uploadFile(file: File, department: string, category: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`/api/upload?department=${encodeURIComponent(department)}&category=${encodeURIComponent(category)}`, {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) throw new Error('Failed to upload file');
  const data = await res.json();
  return data.path;
}
