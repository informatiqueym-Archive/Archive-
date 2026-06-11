export type DocumentStatus = 'Archived' | 'Checked-out' | 'Destroyed';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface PhysicalLocation {
  aisle: string;
  rack: string;
  shelf: string;
  box: string;
  boxTrackingCode?: string;
}

export interface Folder {
  id: number;
  name: string;
  parentPath: string;
  type: 'digital' | 'warehouse';
  trackingCode: string;
}

export interface ArchiveDocument {
  id: string;
  filename: string;
  trackingCode: string;
  uploadDate: string;
  ocrContent: string;
  digitalPath: string;
  category: string;
  department: string;
  folderId?: number;
  folderName?: string;
  scannerSignature?: string;
  physicalLocation: PhysicalLocation;
  status: DocumentStatus;
  authorUid: string;
  authorName?: string;
  notes?: string;
  client?: string;
}

export interface ArchiveUser {
  id?: number;
  uid?: string;
  username: string;
  role: UserRole;
  department: string;
  createdAt: string;
}
