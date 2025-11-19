import React from 'react';
import { AppId } from '../../types';
import { APP_CONFIGS } from '../../constants';
import { Grid } from 'lucide-react';

interface DockProps {
  activeAppIds: AppId[];
  openApps: AppId[];
  onAppClick: (id: AppId) => void;
  onShowGrid: () => void;
}

const Dock: React.FC<DockProps> = ({ activeAppIds, openApps, onAppClick, onShowGrid }) => {
  // Apps pinned to the dock
  const pinnedApps = [AppId.TERMINAL, AppId.BROWSER, AppId.FILES, AppId.TEXT_EDITOR, AppId.SETTINGS];
  
  // Apps that are open but not pinned
  const runningUnpinnedApps = openApps.filter(id => !pinnedApps.includes(id));

  const renderAppIcon = (id: AppId) => {
    const config = APP_CONFIGS[id];
    const isOpen = openApps.includes(id);
    const isActive = activeAppIds.includes(id) && activeAppIds[activeAppIds.length - 1] === id;

    return (
      <div 
        key={id} 
        className="relative group flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-1" 
        onClick={() => onAppClick(id)}
      >
        {/* Tooltip */}
        <div className="absolute -top-10 bg-[#1D1D1D] text-white text-xs px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 z-50 font-medium">
          {config.name}
        </div>

        <div className={`p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#FFFFFF15]' : 'hover:bg-[#FFFFFF10]'}`}>
          {/* Clone icon to adjust size for dock */}
          {React.cloneElement(config.icon as React.ReactElement, { size: 32 })}
        </div>

        {/* Application Open Indicator Dot */}
        <div className={`h-1 w-1 rounded-full mt-1 transition-all duration-300 ${isOpen ? 'bg-[#E95420] opacity-100' : 'bg-transparent opacity-0'}`} />
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-[95vw]">
      <div className="bg-[#1D1D1D]/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl px-3 py-2 flex items-end gap-2 shadow-2xl shadow-black/50 overflow-x-auto no-scrollbar">
        
        {/* Pinned Apps */}
        {pinnedApps.map(renderAppIcon)}

        {/* Separator if there are unpinned running apps */}
        {runningUnpinnedApps.length > 0 && (
          <div className="w-px h-8 bg-gray-600/50 mx-1 mb-3 flex-shrink-0"></div>
        )}

        {/* Running Unpinned Apps */}
        {runningUnpinnedApps.map(renderAppIcon)}

        {/* Grid Separator */}
        <div className="w-px h-8 bg-gray-600/50 mx-1 mb-3 flex-shrink-0"></div>

        {/* App Grid Button */}
        <div className="relative group flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-1" onClick={onShowGrid}>
            <div className="absolute -top-10 bg-[#1D1D1D] text-white text-xs px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 z-50 font-medium">
              Show Apps
            </div>
            <div className="p-2.5 rounded-xl hover:bg-[#FFFFFF10]">
                <Grid className="text-white" size={32} />
            </div>
             <div className="h-1 w-1 rounded-full mt-1 bg-transparent" />
        </div>

      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Dock;