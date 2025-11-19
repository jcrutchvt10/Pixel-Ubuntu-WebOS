import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Check, RotateCcw, Box, Settings, HardDrive, CloudOff } from 'lucide-react';
import { 
    ALL_PACKAGES, 
    Package, 
    getDriveStatus, 
    installPackage, 
    uninstallPackage, 
    isPackageInstalled, 
    parseSize,
    isGoogleDriveConnected
} from '../../services/storageService';

const SECTIONS = ['All', 'Development', 'Graphics', 'Multimedia', 'System', 'Universe', 'Utils', 'Web'];
const DRIVE_CAPACITY = 15 * 1024 * 1024 * 1024; // 15 GB

interface UIPackage extends Package {
  installed: boolean;
  status: 'clean' | 'install' | 'remove';
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SynapticApp: React.FC = () => {
  const [packages, setPackages] = useState<UIPackage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing package cache...');
  const [driveUsedBytes, setDriveUsedBytes] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Load Data
  useEffect(() => {
      const loadData = () => {
        const { usedBytes } = getDriveStatus();
        setDriveUsedBytes(usedBytes);
        setIsConnected(isGoogleDriveConnected());

        const uiPackages: UIPackage[] = ALL_PACKAGES.map(pkg => ({
            ...pkg,
            installed: isPackageInstalled(pkg.name),
            status: 'clean',
        }));
        
        setPackages(uiPackages);
        setStatusMessage('Ready');
      };

      loadData();

      // Listen for updates from Terminal
      const handleStorageUpdate = () => loadData();
      window.addEventListener('storage-update', handleStorageUpdate);
      return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'All' || pkg.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const selectedPkg = packages.find(p => p.id === selectedPackageId);

  const handleToggleStatus = (id: string) => {
    setPackages(prev => prev.map(pkg => {
      if (pkg.id !== id) return pkg;
      
      if (pkg.installed) {
        return { ...pkg, status: pkg.status === 'remove' ? 'clean' : 'remove' };
      } else {
        return { ...pkg, status: pkg.status === 'install' ? 'clean' : 'install' };
      }
    }));
  };

  const handleApply = () => {
    if (!isConnected) {
        alert("Error: No active storage pool found. Please connect Google Drive in Settings -> Online Accounts to install packages.");
        return;
    }

    const changes = packages.filter(p => p.status !== 'clean');
    if (changes.length === 0) return;

    setIsApplying(true);
    setProgress(0);
    setStatusMessage("Authenticating with Google Drive...");

    // Calculate Space Delta
    let bytesDelta = 0;
    changes.forEach(p => {
        const sizeBytes = parseSize(p.size);
        if (p.status === 'install') bytesDelta += sizeBytes;
        if (p.status === 'remove') bytesDelta -= sizeBytes;
    });

    // Check Quota
    if (driveUsedBytes + bytesDelta > DRIVE_CAPACITY) {
        alert("Error: Insufficient Google Drive storage space.");
        setIsApplying(false);
        return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProgress(val => Math.min(val + Math.random() * 10, 100));

      if (step === 5) setStatusMessage("Resolving dependencies...");
      if (step === 15) setStatusMessage(`Allocating ${formatBytes(Math.abs(bytesDelta))} in Cloud Pool...`);
      if (step === 25) setStatusMessage("Downloading packages...");
      if (step === 50) setStatusMessage("Unpacking...");
      if (step === 70) setStatusMessage("Configuring...");

      if (step >= 100 || (step > 30 && Math.random() > 0.95)) { 
        clearInterval(interval);
        
        // Commit Changes via Service
        changes.forEach(p => {
            if (p.status === 'install') installPackage(p.name);
            if (p.status === 'remove') uninstallPackage(p.name);
        });
        
        // Trigger refresh to reload state from service
        window.dispatchEvent(new Event('storage-update'));

        setIsApplying(false);
        setProgress(100);
        setStatusMessage("Transaction complete.");
        setTimeout(() => setStatusMessage("Ready"), 3000);
      }
    }, 100);
  };

  const handleReload = () => {
    setStatusMessage("Updating package lists from repositories...");
    setTimeout(() => setStatusMessage("Ready"), 1500);
  };

  const pendingChanges = packages.filter(p => p.status !== 'clean').length;
  const driveUsagePercent = Math.min((driveUsedBytes / DRIVE_CAPACITY) * 100, 100);

  return (
    <div className="h-full w-full flex flex-col bg-[#f6f5f4] text-[#333] font-sans text-sm">
      {/* Toolbar */}
      <div className="h-12 border-b border-gray-300 flex items-center px-2 bg-[#f6f5f4] select-none">
        <button 
            className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-200 rounded active:bg-gray-300 transition-colors"
            onClick={handleReload}
        >
            <RefreshCw size={18} className="text-[#E95420]" />
            <span className="text-xs mt-0.5">Reload</span>
        </button>
        <button 
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-colors ${pendingChanges > 0 ? 'hover:bg-gray-200 active:bg-gray-300 cursor-pointer' : 'opacity-50 cursor-default'}`}
            onClick={pendingChanges > 0 ? handleApply : undefined}
        >
            <Check size={18} className={pendingChanges > 0 ? "text-green-600" : "text-gray-400"} />
            <span className="text-xs mt-0.5">Apply</span>
        </button>
        <button className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-200 rounded active:bg-gray-300 transition-colors">
            <Settings size={18} className="text-gray-600" />
            <span className="text-xs mt-0.5">Properties</span>
        </button>
        
        <div className="w-px h-8 bg-gray-300 mx-2"></div>

        <div className="flex-grow flex justify-end items-center gap-2 mr-2">
             <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search" 
                    className="pl-8 pr-2 py-1 border border-gray-300 rounded-md focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] outline-none w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* Sidebar: Sections */}
        <div className="w-48 border-r border-gray-300 bg-white flex flex-col">
            <div className="p-2 font-bold bg-gray-100 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">Sections</div>
            <div className="overflow-y-auto flex-grow">
                {SECTIONS.map(section => (
                    <div 
                        key={section}
                        className={`px-3 py-1.5 cursor-pointer flex justify-between items-center ${selectedSection === section ? 'bg-[#E95420] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                        onClick={() => setSelectedSection(section)}
                    >
                        <span>{section}</span>
                    </div>
                ))}
            </div>
            {/* Cloud Drive Flavor */}
            <div className="border-t border-gray-300 p-3 bg-gray-50 text-xs">
                <div className="flex items-center gap-2 mb-2 text-gray-600 font-bold">
                    <HardDrive size={14} />
                    <span>Google Drive Pool</span>
                </div>
                {isConnected ? (
                    <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
                            <div 
                                className={`h-2 rounded-full transition-all duration-500 ${driveUsagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${driveUsagePercent}%` }}
                            ></div>
                        </div>
                        <div className="text-gray-500 flex justify-between">
                            <span>{formatBytes(driveUsedBytes)} used</span>
                            <span>15 GB</span>
                        </div>
                    </>
                ) : (
                    <div className="text-red-500 flex items-center gap-1">
                        <CloudOff size={12} />
                        <span>Disconnected</span>
                    </div>
                )}
            </div>
        </div>

        {/* Main List & Details Split */}
        <div className="flex-grow flex flex-col bg-white">
            
            {/* Package List */}
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border-b border-gray-300 w-8">S</th>
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Package</th>
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Installed Version</th>
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Latest Version</th>
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPackages.map(pkg => (
                            <tr 
                                key={pkg.id} 
                                className={`cursor-pointer border-b border-gray-100 ${selectedPackageId === pkg.id ? 'bg-[#E95420] text-white' : 'hover:bg-gray-50 odd:bg-white even:bg-gray-50/30'}`}
                                onClick={() => setSelectedPackageId(pkg.id)}
                            >
                                <td className="p-2 text-center">
                                    <div 
                                        className="w-4 h-4 border border-gray-400 bg-white rounded-sm cursor-pointer flex items-center justify-center shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(pkg.id);
                                        }}
                                    >
                                        {pkg.status === 'install' && <Box size={12} className="text-green-600" fill="currentColor" />}
                                        {pkg.status === 'remove' && <RotateCcw size={12} className="text-red-500" />}
                                        {pkg.status === 'clean' && pkg.installed && <div className="w-2.5 h-2.5 bg-green-500" />}
                                    </div>
                                </td>
                                <td className="p-2 font-medium">{pkg.name}</td>
                                <td className="p-2">{pkg.installed ? pkg.version : ''}</td>
                                <td className="p-2">{pkg.version}</td>
                                <td className="p-2 truncate max-w-xs opacity-90">{pkg.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details Pane (Bottom) */}
            {selectedPkg && (
                <div className="h-32 border-t border-gray-300 bg-white p-4 overflow-y-auto">
                     <div className="flex items-start gap-4">
                        <Box size={48} className="text-gray-400" />
                        <div>
                            <h3 className="font-bold text-lg">{selectedPkg.name}</h3>
                            <p className="text-gray-600 mb-2">{selectedPkg.description}</p>
                            <div className="grid grid-cols-2 gap-x-8 text-xs text-gray-500">
                                <div><span className="font-semibold">Section:</span> {selectedPkg.section}</div>
                                <div><span className="font-semibold">Size:</span> {selectedPkg.size}</div>
                                <div><span className="font-semibold">Maintainer:</span> Ubuntu Developers &lt;ubuntu-devel-discuss@lists.ubuntu.com&gt;</div>
                                <div><span className="font-semibold">Status:</span> {selectedPkg.installed ? 'Installed' : 'Not Installed'}</div>
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-200 border-t border-gray-300 flex items-center px-3 text-xs text-gray-600 gap-4">
         <span>{filteredPackages.length} packages listed</span>
         <span>{packages.filter(p => p.installed).length} installed</span>
         <span>{packages.filter(p => p.status !== 'clean').length} marked for change</span>
         <div className="flex-grow text-right truncate">{statusMessage}</div>
      </div>

      {/* Apply Progress Modal */}
      {isApplying && (
          <div className="absolute inset-0 z-50 bg-black/20 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-[#f6f5f4] rounded-lg shadow-2xl border border-gray-400 w-96 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-gray-300 pb-2">
                      <RefreshCw className="animate-spin text-[#E95420]" size={20} />
                      <h3 className="font-bold text-gray-800">Applying Changes</h3>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                      <p className="mb-2">{statusMessage}</p>
                      {/* Progress Bar */}
                      <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-[#E95420] transition-all duration-200 flex items-center justify-center"
                            style={{ width: `${progress}%` }}
                          >
                              {progress > 10 && <span className="text-[9px] text-white font-bold">{Math.round(progress)}%</span>}
                          </div>
                      </div>
                  </div>

                  <div className="bg-white border border-gray-300 h-32 rounded p-2 font-mono text-xs overflow-y-auto text-gray-600">
                      <p>{'>'} Initiating transaction...</p>
                      {progress > 10 && <p>{'>'} Checksumming packages...</p>}
                      {progress > 20 && <p>{'>'} Syncing with Google Drive Storage Pool...</p>}
                      {progress > 30 && <p>{'>'} Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]</p>}
                      {progress > 50 && <p>{'>'} Preparing to unpack ...</p>}
                      {progress > 70 && <p>{'>'} Unpacking {packages.find(p => p.status !== 'clean')?.name || 'packages'} ...</p>}
                      {progress > 90 && <p>{'>'} Setting up ...</p>}
                      {progress >= 100 && <p className="text-green-600 font-bold">{'>'} Done.</p>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SynapticApp;