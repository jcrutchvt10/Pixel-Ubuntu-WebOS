import React from 'react';
import { AppId } from '../../types';
import { Monitor, Image, Settings, Terminal, FolderPlus } from 'lucide-react';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onOpenApp }) => {
  if (!position) return null;

  // Adjust position if it's too close to the edge
  const style: React.CSSProperties = {
    top: position.y,
    left: position.x,
  };

  const MenuOption = ({ icon, label, onClick, separator = false }: any) => (
    <>
        <button 
            className="w-full text-left px-3 py-1.5 hover:bg-[#E95420] hover:text-white flex items-center gap-3 transition-colors rounded-md text-sm text-gray-200"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
                onClose();
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
        {separator && <div className="h-px bg-gray-700 my-1 mx-2" />}
    </>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div 
        style={style}
        className="fixed z-50 bg-[#1D1D1D]/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl p-1.5 w-56 animate-in fade-in zoom-in-95 duration-100"
      >
        <MenuOption icon={<FolderPlus size={16} />} label="New Folder" onClick={() => {}} />
        <MenuOption icon={<Terminal size={16} />} label="Open in Terminal" onClick={() => onOpenApp(AppId.TERMINAL)} separator />
        
        <MenuOption icon={<Image size={16} />} label="Change Background..." onClick={() => onOpenApp(AppId.SETTINGS)} />
        <MenuOption icon={<Monitor size={16} />} label="Display Settings" onClick={() => onOpenApp(AppId.SETTINGS)} />
        <MenuOption icon={<Settings size={16} />} label="Settings" onClick={() => onOpenApp(AppId.SETTINGS)} />
      </div>
    </>
  );
};

export default ContextMenu;