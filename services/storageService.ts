import { AppId } from '../types';
import * as drive from './googleDrive';
import * as fs from './fileSystem';

export interface Package {
  id: string;
  name: string;
  version: string;
  description: string;
  section: string;
  size: string;
  appId?: AppId; // Links this package to a runnable App
}

const STORAGE_KEY_PACKAGES = 'ubuntu_sim_installed_pkgs';
const STORAGE_KEY_USAGE = 'ubuntu_sim_drive_usage';
const STORAGE_KEY_AUTH = 'ubuntu_sim_auth_token';

// Default Base System Usage (4.2 GB)
const BASE_USAGE = 4.2 * 1024 * 1024 * 1024;

export const ALL_PACKAGES: Package[] = [
  { id: '1', name: 'firefox', version: '124.0.1', description: 'Safe and easy web browser from Mozilla', section: 'Web', size: '245 MB', appId: AppId.BROWSER },
  { id: '2', name: 'git', version: '2.43.0', description: 'Distributed version control system', section: 'Development', size: '15 MB' },
  { id: '3', name: 'vlc', version: '3.0.20', description: 'Multimedia player and streamer', section: 'Multimedia', size: '58 MB', appId: AppId.VLC },
  { id: '4', name: 'gimp', version: '2.10.36', description: 'GNU Image Manipulation Program', section: 'Graphics', size: '450 MB', appId: AppId.GIMP },
  { id: '5', name: 'neofetch', version: '7.1.0', description: 'Shows Linux System Information with Distribution Logo', section: 'Utils', size: '350 KB' },
  { id: '6', name: 'build-essential', version: '12.10', description: 'Informational list of build-essential packages', section: 'Development', size: '5 KB' },
  { id: '7', name: 'synaptic', version: '0.91.3', description: 'Graphical package manager', section: 'System', size: '4 MB', appId: AppId.SYNAPTIC },
  { id: '8', name: 'ubuntu-desktop', version: '1.501', description: 'The Ubuntu desktop system', section: 'System', size: '1.2 GB' },
  { id: '9', name: 'gnome-tweaks', version: '46.0', description: 'Tweak advanced GNOME 3 settings', section: 'Universe', size: '800 KB' },
  { id: '10', name: 'htop', version: '3.2.2', description: 'Interactive process viewer', section: 'Utils', size: '1.2 MB', appId: AppId.MONITOR },
  { id: '11', name: 'code', version: '1.87.0', description: 'Code editing. Redefined.', section: 'Development', size: '350 MB', appId: AppId.VSCODE },
  { id: '12', name: 'python3', version: '3.12.0', description: 'Interactive high-level object-oriented language', section: 'Development', size: '55 MB' },
  { id: '13', name: 'spotify-client', version: '1.2.10', description: 'Music for everyone', section: 'Multimedia', size: '180 MB', appId: AppId.SPOTIFY },
];

// Core packages that are always installed
const CORE_PACKAGES = ['firefox', 'ubuntu-desktop', 'synaptic', 'python3', 'gnome-tweaks', 'htop'];

export const parseSize = (str: string): number => {
    const [val, unit] = str.split(' ');
    const num = parseFloat(val);
    if (unit === 'GB') return num * 1024 * 1024 * 1024;
    if (unit === 'MB') return num * 1024 * 1024;
    if (unit === 'KB') return num * 1024;
    return num;
};

// Helper to get persisted installed list (Local Cache)
const getInstalledList = (): string[] => {
    const saved = localStorage.getItem(STORAGE_KEY_PACKAGES);
    return saved ? JSON.parse(saved) : CORE_PACKAGES;
};

// --- Real Drive Sync ---

const STATUS_FILE_NAME = 'status.json';

// Finds the folder ID for 'var/lib/apt' inside our custom root
const getAptDirId = async () => {
    return await fs.resolvePathId(['var', 'lib', 'apt']);
};

/**
 * Syncs local package state to the real 'status.json' in Drive
 */
const syncToDrive = async (packages: string[]) => {
    if (!drive.isAuthenticated()) return;
    
    try {
        const aptDirId = await getAptDirId();
        if (!aptDirId) return; // Structure not ready

        const content = JSON.stringify(packages);
        
        // Check if exists
        const existing = await drive.findFileByName(STATUS_FILE_NAME, aptDirId);
        
        if (existing) {
            await drive.updateFile(existing.id, content);
        } else {
            await drive.createFile(STATUS_FILE_NAME, content, aptDirId);
        }
        console.log("[Storage] Synced package state to Google Drive");
    } catch (e) {
        console.error("Failed to sync to drive", e);
    }
};

/**
 * Loads package state from Drive into LocalStorage
 */
export const syncFromDrive = async () => {
    if (!drive.isAuthenticated()) return;

    try {
        const aptDirId = await getAptDirId();
        if (!aptDirId) return;

        const file = await drive.findFileByName(STATUS_FILE_NAME, aptDirId);
        if (file) {
            const content = await drive.getFileContent(file.id);
            if (content) {
                // Update local cache
                localStorage.setItem(STORAGE_KEY_PACKAGES, content);
                // Trigger UI Update
                window.dispatchEvent(new Event('storage-update'));
                console.log("[Storage] Restored package state from Google Drive");
            }
        }
    } catch (e) {
        console.error("Failed to sync from drive", e);
    }
};

// --- End Sync ---

export const getDriveStatus = () => {
    const installedList = getInstalledList();
    
    let calculatedUsage = BASE_USAGE;
    
    ALL_PACKAGES.forEach(pkg => {
        if (installedList.includes(pkg.name)) {
            calculatedUsage += parseSize(pkg.size);
        }
    });

    return {
        usedBytes: calculatedUsage, 
        installedPackageNames: installedList
    };
};

export const isPackageInstalled = (pkgName: string): boolean => {
    const list = getInstalledList();
    return list.includes(pkgName);
};

export const isAppInstalled = (appId: AppId): boolean => {
    if ([AppId.TERMINAL, AppId.FILES, AppId.SETTINGS, AppId.CALCULATOR, AppId.TEXT_EDITOR].includes(appId)) return true;
    const pkg = ALL_PACKAGES.find(p => p.appId === appId);
    if (pkg) {
        return isPackageInstalled(pkg.name);
    }
    return false;
};

export const installPackage = (pkgName: string) => {
    const list = getInstalledList();
    if (!list.includes(pkgName)) {
        list.push(pkgName);
        localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(list));
        syncToDrive(list); // Trigger async cloud sync
    }
};

export const uninstallPackage = (pkgName: string) => {
    let list = getInstalledList();
    if (list.includes(pkgName)) {
        list = list.filter(p => p !== pkgName);
        localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(list));
        syncToDrive(list); // Trigger async cloud sync
    }
};

export const isGoogleDriveConnected = () => {
    return drive.isAuthenticated();
};

export const connectGoogleDrive = () => {
    // Triggered by UI flow via Google Auth
};

export const disconnectGoogleDrive = () => {
    drive.signOut();
};