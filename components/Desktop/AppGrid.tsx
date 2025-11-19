import React, { useState, useEffect, useRef } from 'react';
import { AppId } from '../../types';
import { APP_CONFIGS } from '../../constants';
import { Search } from 'lucide-react';
import { isAppInstalled } from '../../services/storageService';

interface AppGridProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
}

const AppGrid: React.FC<AppGridProps> = ({ isOpen, onClose, onOpenApp }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [installedApps, setInstalledApps] = useState<AppId[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const checkInstalledApps = () => {
      const allIds = Object.keys(APP_CONFIGS) as AppId[];
      const filtered = allIds.filter(id => isAppInstalled(id));
      setInstalledApps(filtered);
  };

  useEffect(() => {
      if (isOpen) {
          setSearchTerm('');
          checkInstalledApps();
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  }, [isOpen]);

  // Listen for storage updates to refresh list even if open
  useEffect(() => {
      const handleUpdate = () => checkInstalledApps();
      window.addEventListener('storage-update', handleUpdate);
      return () => window.removeEventListener('storage-update', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const filteredApps = installedApps
    .map(id => APP_CONFIGS[id])
    .filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div 
        className="fixed inset-0 z-[45] bg-[#1D1D1D]/95 backdrop-blur-lg animate-in fade-in slide-in-from-bottom-10 duration-300 flex flex-col pt-20"
        onClick={onClose}
    >
        {/* Search Bar */}
        <div className="w-full flex justify-center mb-12" onClick={e => e.stopPropagation()}>
            <div className="relative w-1/3 max-w-lg min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type to search..."
                    className="w-full bg-[#333] border border-gray-600 text-white rounded-full py-2 pl-10 pr-4 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-all shadow-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredApps.length > 0) {
                            onOpenApp(filteredApps[0].id);
                            onClose();
                        }
                        if (e.key === 'Escape') onClose();
                    }}
                />
            </div>
        </div>

        {/* App Grid */}
        <div className="flex-grow overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto grid grid-cols-6 gap-8 justify-items-center pb-20" onClick={e => e.stopPropagation()}>
                {filteredApps.map(app => (
                    <div 
                        key={app.id}
                        className="flex flex-col items-center gap-3 group cursor-pointer w-32 p-4 rounded-xl hover:bg-white/10 transition-all duration-200"
                        onClick={() => {
                            onOpenApp(app.id);
                            onClose(); // Close grid
                        }}
                    >
                        <div className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-200 flex items-center justify-center bg-white/5 rounded-2xl p-3 shadow-lg border border-white/10">
                            {/* Clone icon to increase size for grid */}
                            {React.cloneElement(app.icon as React.ReactElement, { size: 40 })}
                        </div>
                        <span className="text-white text-sm font-medium text-center line-clamp-2 drop-shadow-md">{app.name}</span>
                    </div>
                ))}
                
                {filteredApps.length === 0 && (
                    <div className="col-span-6 text-gray-500 mt-10">No applications found.</div>
                )}
            </div>
        </div>

        {/* Pagination Dots (Mock) - Only show if no search */}
        {!searchTerm && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white/30"></div>
            </div>
        )}
    </div>
  );
};

export default AppGrid;