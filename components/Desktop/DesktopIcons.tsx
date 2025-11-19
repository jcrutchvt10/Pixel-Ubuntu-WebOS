
import React, { useState } from 'react';
import { AppId } from '../../types';
import { Home, Trash2, HardDrive, FileText } from 'lucide-react';

interface DesktopIconsProps {
  onOpenApp: (id: AppId) => void;
  onOpenPath?: (path: string) => void;
}

interface DesktopItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
  color?: string;
}

const DesktopIcons: React.FC<DesktopIconsProps> = ({ onOpenApp }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items: DesktopItem[] = [
    {
      id: 'home',
      name: 'Home',
      icon: <Home size={48} className="text-gray-200 fill-gray-200/20" />,
      action: () => onOpenApp(AppId.FILES),
    },
    {
      id: 'trash',
      name: 'Trash',
      icon: <Trash2 size={48} className="text-gray-200 fill-gray-200/20" />,
      action: () => onOpenApp(AppId.FILES), // Ideally opens trash://
    },
    {
      id: 'install',
      name: 'Install Ubuntu 24.04',
      icon: <HardDrive size={48} className="text-gray-200 fill-gray-200/20" />,
      action: () => onOpenApp(AppId.TERMINAL), // Simulate installer via Terminal script
    },
    {
      id: 'readme',
      name: 'README.txt',
      icon: <FileText size={48} className="text-gray-200 fill-gray-200/20" />,
      action: () => onOpenApp(AppId.TEXT_EDITOR),
    },
  ];

  return (
    <div 
      className="absolute top-8 left-4 flex flex-col gap-2 z-0" 
      onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            w-28 p-2 rounded-lg flex flex-col items-center cursor-pointer border border-transparent transition-colors
            ${selectedId === item.id ? 'bg-[#E95420]/20 border-[#E95420]/40' : 'hover:bg-white/10'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(item.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            item.action();
            setSelectedId(null);
          }}
        >
          <div className="mb-1 drop-shadow-lg filter">
            {item.icon}
          </div>
          <span className="text-white text-xs text-center font-medium drop-shadow-md line-clamp-2 leading-tight break-words w-full">
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DesktopIcons;
