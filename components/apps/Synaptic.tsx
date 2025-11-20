
import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Check, RotateCcw, Box, Settings, HardDrive, CloudOff, ArrowUpDown, X, Info, List, FileText } from 'lucide-react';
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

type SortField = 'name' | 'status' | 'section' | 'size';
type SortDirection = 'asc' | 'desc';

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
  const [sortConfig, setSortConfig] = useState<{ field: SortField, dir: SortDirection }>({ field: 'name', dir: 'asc' });
  const [showProperties, setShowProperties] = useState(false);
  
  // Load Data
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

  useEffect(() => {
      loadData();
      const handleStorageUpdate = () => loadData();
      window.addEventListener('storage-update', handleStorageUpdate);
      return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  // --- Logic ---

  const handleSort = (field: SortField) => {
      setSortConfig(prev => ({
          field,
          dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
      }));
  };

  const processedPackages = useMemo(() => {
      let result = packages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSection = selectedSection === 'All' || pkg.section === selectedSection;
        return matchesSearch && matchesSection;
      });

      result.sort((a, b) => {
          let valA: any = a[sortConfig.field];
          let valB: any = b[sortConfig.field];

          if (sortConfig.field === 'status') {
             // Custom sort for status: install > remove > installed > clean
             const getStatusScore = (p: UIPackage) => {
                 if (p.status === 'install') return 3;
                 if (p.status === 'remove') return 2;
                 if (p.installed) return 1;
                 return 0;
             };
             valA = getStatusScore(a);
             valB = getStatusScore(b);
          }

          if (sortConfig.field === 'size') {
              valA = parseSize(a.size);
              valB = parseSize(b.size);
          }

          if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
          return 0;
      });

      return result;
  }, [packages, searchTerm, selectedSection, sortConfig]);

  // Calculate Section Counts
  const sectionCounts = useMemo(() => {
      const counts: Record<string, number> = { 'All': packages.length };
      packages.forEach(p => {
          counts[p.section] = (counts[p.section] || 0) + 1;
      });
      return counts;
  }, [packages]);


  const handleToggleStatus = (id: string) => {
    setPackages(prev => prev.map(pkg => {
      if (pkg.id !== id) return pkg;
      
      if (pkg.installed) {
        // If installed: click -> remove -> clean
        return { ...pkg, status: pkg.status === 'remove' ? 'clean' : 'remove' };
      } else {
        // If not installed: click -> install -> clean
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
        
        // Commit Changes
        changes.forEach(p => {
            if (p.status === 'install') installPackage(p.name);
            if (p.status === 'remove') uninstallPackage(p.name);
        });
        
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
    setPackages([]); // Flash empty
    setTimeout(() => {
        loadData();
        setStatusMessage("Ready");
    }, 800);
  };

  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const pendingChanges = packages.filter(p => p.status !== 'clean').length;
  const driveUsagePercent = Math.min((driveUsedBytes / DRIVE_CAPACITY) * 100, 100);

  // --- Subcomponents ---

  const SortIcon = ({ field }: { field: SortField }) => {
      if (sortConfig.field !== field) return <div className="w-4" />;
      return <ArrowUpDown size={12} className={`ml-1 ${sortConfig.dir === 'desc' ? 'rotate-180' : ''} transition-transform`} />;
  };

  const HeaderCell = ({ field, label, width }: { field: SortField, label: string, width?: string }) => (
      <th 
        className={`p-2 border-b border-gray-300 font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none ${width}`}
        onClick={() => handleSort(field)}
      >
          <div className="flex items-center">
              {label}
              <SortIcon field={field} />
          </div>
      </th>
  );

  return (
    <div className="h-full w-full flex flex-col bg-[#f6f5f4] text-[#333] font-sans text-sm relative">
      
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
        <button 
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-colors ${selectedPkg ? 'hover:bg-gray-200 active:bg-gray-300' : 'opacity-50'}`}
            onClick={() => selectedPkg && setShowProperties(true)}
        >
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
                    className="pl-8 pr-2 py-1 border border-gray-300 rounded-md focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] outline-none w-48 transition-all focus:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* Sidebar: Sections */}
        <div className="w-56 border-r border-gray-300 bg-white flex flex-col flex-shrink-0">
            <div className="p-2 font-bold bg-gray-100 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">Sections</div>
            <div className="overflow-y-auto flex-grow">
                {SECTIONS.map(section => (
                    <div 
                        key={section}
                        className={`px-3 py-1.5 cursor-pointer flex justify-between items-center ${selectedSection === section ? 'bg-[#E95420] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                        onClick={() => setSelectedSection(section)}
                    >
                        <span className="truncate">{section}</span>
                        <span className={`text-xs ${selectedSection === section ? 'text-white/80' : 'text-gray-400'}`}>
                            {sectionCounts[section] || 0}
                        </span>
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
        <div className="flex-grow flex flex-col bg-white min-w-0">
            
            {/* Package List */}
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <HeaderCell field="status" label="S" width="w-8" />
                            <HeaderCell field="name" label="Package" width="w-48" />
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600 w-24">Installed</th>
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600 w-24">Latest</th>
                            <HeaderCell field="section" label="Section" width="w-24" />
                            <HeaderCell field="size" label="Size" width="w-24" />
                            <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedPackages.map(pkg => (
                            <tr 
                                key={pkg.id} 
                                className={`cursor-pointer border-b border-gray-100 ${selectedPackageId === pkg.id ? 'bg-[#E95420] text-white' : 'hover:bg-gray-50 odd:bg-white even:bg-gray-50/30'}`}
                                onClick={() => setSelectedPackageId(pkg.id)}
                            >
                                <td className="p-2 text-center" onClick={(e) => { e.stopPropagation(); handleToggleStatus(pkg.id); }}>
                                    <div className="w-4 h-4 border border-gray-400 bg-white rounded-sm cursor-pointer flex items-center justify-center shadow-sm mx-auto">
                                        {pkg.status === 'install' && <Box size={12} className="text-green-600" fill="currentColor" />}
                                        {pkg.status === 'remove' && <RotateCcw size={12} className="text-red-500" />}
                                        {pkg.status === 'clean' && pkg.installed && <div className="w-2.5 h-2.5 bg-green-500" />}
                                    </div>
                                </td>
                                <td className="p-2 font-medium truncate">{pkg.name}</td>
                                <td className="p-2">{pkg.installed ? pkg.version : ''}</td>
                                <td className="p-2">{pkg.version}</td>
                                <td className="p-2 truncate">{pkg.section}</td>
                                <td className="p-2">{pkg.size}</td>
                                <td className="p-2 truncate opacity-90">{pkg.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details Pane (Bottom) */}
            {selectedPkg && (
                <div className="h-40 border-t border-gray-300 bg-white p-4 overflow-y-auto flex-shrink-0">
                     <div className="flex items-start gap-4">
                        <Box size={48} className="text-gray-400 shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {selectedPkg.name}
                                {selectedPkg.installed && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Installed</span>}
                            </h3>
                            <p className="text-gray-600 mb-3">{selectedPkg.description}</p>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-xs text-gray-500">
                                <div><span className="font-semibold text-gray-700">Section:</span> {selectedPkg.section}</div>
                                <div><span className="font-semibold text-gray-700">Download Size:</span> {selectedPkg.size}</div>
                                <div><span className="font-semibold text-gray-700">Maintainer:</span> Ubuntu Developers</div>
                                <div><span className="font-semibold text-gray-700">Version:</span> {selectedPkg.version}</div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button 
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium border border-gray-300"
                                    onClick={() => setShowProperties(true)}
                                >
                                    View Details
                                </button>
                                <button 
                                    className={`px-3 py-1 rounded text-xs font-medium border ${
                                        selectedPkg.installed 
                                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                                        : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                                    }`}
                                    onClick={() => handleToggleStatus(selectedPkg.id)}
                                >
                                    {selectedPkg.installed ? 'Mark for Removal' : 'Mark for Installation'}
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-200 border-t border-gray-300 flex items-center px-3 text-xs text-gray-600 gap-4 flex-shrink-0">
         <span>{processedPackages.length} packages listed</span>
         <span>{packages.filter(p => p.installed).length} installed</span>
         <span>{packages.filter(p => p.status !== 'clean').length} marked for change</span>
         <div className="flex-grow text-right truncate">{statusMessage}</div>
      </div>

      {/* Properties Modal */}
      {showProperties && selectedPkg && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowProperties(false)}>
              <div className="bg-[#f6f5f4] rounded-lg shadow-2xl border border-gray-400 w-[500px] h-[400px] flex flex-col" onClick={e => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-200 border-b border-gray-300 rounded-t-lg">
                      <span className="font-bold text-gray-700 text-sm">Properties: {selectedPkg.name}</span>
                      <button onClick={() => setShowProperties(false)} className="text-gray-500 hover:text-gray-800"><X size={16} /></button>
                  </div>
                  
                  {/* Tabs (Mock) */}
                  <div className="flex px-2 pt-2 border-b border-gray-300 bg-gray-50 gap-1">
                      <div className="px-3 py-1.5 bg-white border-t border-x border-gray-300 rounded-t text-xs font-bold text-gray-700 relative top-[1px]">General</div>
                      <div className="px-3 py-1.5 hover:bg-gray-100 border-t border-x border-transparent text-xs text-gray-600">Dependencies</div>
                      <div className="px-3 py-1.5 hover:bg-gray-100 border-t border-x border-transparent text-xs text-gray-600">Installed Files</div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 bg-white flex-grow overflow-y-auto text-sm">
                      <div className="grid grid-cols-[100px_1fr] gap-y-3">
                          <div className="font-bold text-gray-600 text-right pr-4">Package:</div>
                          <div>{selectedPkg.name}</div>
                          
                          <div className="font-bold text-gray-600 text-right pr-4">Status:</div>
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${selectedPkg.installed ? 'bg-green-500' : 'bg-gray-300'}`} />
                              {selectedPkg.installed ? 'Installed' : 'Not Installed'}
                          </div>
                          
                          <div className="font-bold text-gray-600 text-right pr-4">Version:</div>
                          <div>{selectedPkg.version}</div>
                          
                          <div className="font-bold text-gray-600 text-right pr-4">Priority:</div>
                          <div>Optional</div>
                          
                          <div className="font-bold text-gray-600 text-right pr-4">Section:</div>
                          <div>{selectedPkg.section}</div>

                          <div className="font-bold text-gray-600 text-right pr-4">Maintainer:</div>
                          <div>Ubuntu Developers &lt;ubuntu-devel-discuss@lists.ubuntu.com&gt;</div>

                          <div className="font-bold text-gray-600 text-right pr-4">Description:</div>
                          <div className="text-gray-600 leading-relaxed border p-2 bg-gray-50 rounded">{selectedPkg.description}</div>
                      </div>
                  </div>
                  
                  <div className="p-3 border-t border-gray-300 flex justify-end bg-gray-100 rounded-b-lg">
                      <button onClick={() => setShowProperties(false)} className="px-4 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-sm">Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* Apply Progress Modal */}
      {isApplying && (
          <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-[#f6f5f4] rounded-lg shadow-2xl border border-gray-400 w-96 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-gray-300 pb-2">
                      <RefreshCw className="animate-spin text-[#E95420]" size={20} />
                      <h3 className="font-bold text-gray-800">Applying Changes</h3>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                      <p className="mb-2 font-medium">{statusMessage}</p>
                      {/* Progress Bar */}
                      <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden shadow-inner border border-gray-400">
                          <div 
                            className="h-full bg-[#E95420] transition-all duration-200 flex items-center justify-center"
                            style={{ width: `${progress}%` }}
                          >
                          </div>
                      </div>
                  </div>

                  <div className="bg-black text-gray-300 border border-gray-500 h-40 rounded p-2 font-mono text-[10px] overflow-y-auto leading-tight shadow-inner">
                      <p className="text-green-400">root@pixel-ubuntu:/# apt-get upgrade</p>
                      <p>{'>'} Initiating transaction...</p>
                      {progress > 10 && <p>{'>'} Checksumming packages...</p>}
                      {progress > 20 && <p>{'>'} Syncing with Google Drive Storage Pool...</p>}
                      {progress > 30 && <p>{'>'} Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]</p>}
                      {progress > 50 && <p>{'>'} Preparing to unpack ...</p>}
                      {progress > 70 && <p>{'>'} Unpacking {packages.find(p => p.status !== 'clean')?.name || 'packages'} ...</p>}
                      {progress > 90 && <p>{'>'} Setting up ...</p>}
                      {progress >= 100 && <p className="text-green-500 font-bold">{'>'} Transaction successful.</p>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SynapticApp;
