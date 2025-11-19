import * as drive from './googleDrive';
import { ReactNode } from 'react';

// File System Types
export interface FSItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  date?: string;
  content?: string;
  icon?: ReactNode;
}

// Simulated File System for Offline Mode
const MOCK_FS: Record<string, FSItem[]> = {
  'root': [
    { id: 'home', name: 'home', type: 'folder', date: '2024-01-01' },
    { id: 'etc', name: 'etc', type: 'folder', date: '2024-01-01' },
    { id: 'var', name: 'var', type: 'folder', date: '2024-01-01' },
  ],
  'home': [
    { id: 'pixel_user', name: 'pixel_user', type: 'folder', date: '2024-01-01' },
  ],
  'pixel_user': [
    { id: 'docs', name: 'Documents', type: 'folder', date: 'Today' },
    { id: 'downloads', name: 'Downloads', type: 'folder', date: 'Today' },
    { id: 'readme', name: 'README.txt', type: 'file', size: '1 KB', date: 'Today', content: 'Welcome to Ubuntu Web OS. This file system is simulated in LocalStorage.' },
  ],
  'docs': [
    { id: 'note1', name: 'notes.txt', type: 'file', size: '2 KB', date: 'Yesterday', content: 'Meeting notes: \n- Discuss project X\n- Review budget' },
  ],
  'downloads': [],
  'var': [ { id: 'lib', name: 'lib', type: 'folder', date: 'Today' } ],
  'lib': [ { id: 'apt', name: 'apt', type: 'folder', date: 'Today' } ],
  'apt': [], // Status file would be here
};

export const getFSMode = () => {
  return drive.isAuthenticated() ? 'DRIVE' : 'LOCAL';
};

// --- Drive Structure Initialization ---
// Ensures the standard Linux paths exist in the User's Drive
export const initializeDriveFS = async () => {
    if (!drive.isAuthenticated()) return;

    const rootId = await drive.getOsRootId();
    
    // 1. Ensure 'home'
    let home = await drive.findFileByName('home', rootId);
    if (!home) home = await drive.createFolder('home', rootId);
    
    if (home) {
        // 2. Ensure 'home/pixel_user'
        let user = await drive.findFileByName('pixel_user', home.id);
        if (!user) user = await drive.createFolder('pixel_user', home.id);
    }

    // 3. Ensure 'var/lib/apt' (for Package Storage persistence)
    let varDir = await drive.findFileByName('var', rootId);
    if (!varDir) varDir = await drive.createFolder('var', rootId);

    if (varDir) {
        let lib = await drive.findFileByName('lib', varDir.id);
        if (!lib) lib = await drive.createFolder('lib', varDir.id);

        if (lib) {
             let apt = await drive.findFileByName('apt', lib.id);
             if (!apt) await drive.createFolder('apt', lib.id);
        }
    }
};

export const listDirectory = async (folderId: string): Promise<FSItem[]> => {
  if (getFSMode() === 'DRIVE') {
    // Real Drive Implementation
    // 'root' is automatically handled by drive service to point to OS_ROOT
    const files = await drive.listFiles(folderId);
    
    return files.map(f => ({
      id: f.id,
      name: f.name,
      type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      size: f.size ? `${Math.ceil(parseInt(f.size)/1024)} KB` : '-',
      date: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Unknown'
    }));
  } else {
    // Mock Implementation
    return MOCK_FS[folderId] || [];
  }
};

export const readFile = async (fileId: string): Promise<string> => {
  if (getFSMode() === 'DRIVE') {
    return await drive.getFileContent(fileId);
  } else {
    // Search mock fs for content
    for (const key in MOCK_FS) {
        const found = MOCK_FS[key].find(f => f.id === fileId);
        if (found && found.content) return found.content;
    }
    return "";
  }
};

export const saveFile = async (name: string, content: string, parentId: string): Promise<void> => {
  if (getFSMode() === 'DRIVE') {
     await drive.createFile(name, content, parentId);
  } else {
    // Local Mock Save (Ephemeral)
    if (!MOCK_FS[parentId]) MOCK_FS[parentId] = [];
    // Remove existing if overwrite
    MOCK_FS[parentId] = MOCK_FS[parentId].filter(f => f.name !== name);
    
    MOCK_FS[parentId].push({
        id: `mock_${Date.now()}`,
        name,
        type: 'file',
        size: `${content.length} B`,
        date: 'Just now',
        content
    });
  }
};

export const createDir = async (name: string, parentId: string): Promise<void> => {
    if (getFSMode() === 'DRIVE') {
        await drive.createFolder(name, parentId);
    } else {
         if (!MOCK_FS[parentId]) MOCK_FS[parentId] = [];
         const newId = `folder_${Date.now()}`;
         MOCK_FS[parentId].push({
             id: newId,
             name,
             type: 'folder',
             date: 'Just now'
         });
         MOCK_FS[newId] = [];
    }
};

export const deleteItem = async (id: string): Promise<void> => {
    if (getFSMode() === 'DRIVE') {
        await drive.deleteFile(id);
    } else {
        // Mock delete
        for (const key in MOCK_FS) {
            MOCK_FS[key] = MOCK_FS[key].filter(f => f.id !== id);
        }
    }
};

// --- Helper for System files ---
// Finds path IDs dynamically. Very simplified for this demo.
export const resolvePathId = async (pathArray: string[]): Promise<string | null> => {
    if (!drive.isAuthenticated()) return null;
    let currentId = await drive.getOsRootId(); // Start at our custom root

    for (const segment of pathArray) {
        const file = await drive.findFileByName(segment, currentId);
        if (!file) return null;
        currentId = file.id;
    }
    return currentId;
};