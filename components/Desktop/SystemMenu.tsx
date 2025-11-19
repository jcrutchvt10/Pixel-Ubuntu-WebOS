import React, { useState } from 'react';
import { Wifi, Bluetooth, Battery, Lock, Power, Settings, Moon, Sun, Volume2 } from 'lucide-react';
import { AppId } from '../../types';

interface SystemMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const SystemMenu: React.FC<SystemMenuProps> = ({ isOpen, onClose, onLogout, onOpenSettings }) => {
  const [volume, setVolume] = useState(80);
  const [brightness, setBrightness] = useState(100);
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  if (!isOpen) return null;

  // Don't close when clicking inside
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const ToggleButton = ({ active, icon, label, onClick }: any) => (
    <div className="flex flex-col items-center gap-2">
        <button 
            onClick={onClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${active ? 'bg-[#E95420] text-white' : 'bg-[#3e3e3e] text-gray-300 hover:bg-[#4e4e4e]'}`}
        >
            {icon}
        </button>
        <span className="text-xs text-gray-300">{label}</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed top-9 right-2 w-80 bg-[#1D1D1D] rounded-2xl shadow-2xl border border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 text-gray-200 select-none"
        onClick={handleContentClick}
      >
        <div className="flex justify-between gap-4 mb-6 px-2">
             <ToggleButton active={wifi} onClick={() => setWifi(!wifi)} icon={<Wifi size={20} />} label="Wi-Fi" />
             <ToggleButton active={bt} onClick={() => setBt(!bt)} icon={<Bluetooth size={20} />} label="Bluetooth" />
             <ToggleButton active={darkMode} onClick={() => setDarkMode(!darkMode)} icon={darkMode ? <Moon size={20} /> : <Sun size={20} />} label="Dark Mode" />
             <ToggleButton active={false} onClick={() => {}} icon={<Lock size={20} />} label="Rotation" />
        </div>

        <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-6 text-gray-400"><Volume2 size={18} /></div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="flex-grow h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#E95420]"
                />
            </div>
            <div className="flex items-center gap-3">
                <div className="w-6 text-gray-400"><Sun size={18} /></div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="flex-grow h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#E95420]"
                />
            </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <button onClick={() => { onOpenSettings(); onClose(); }} className="p-3 hover:bg-gray-700 rounded-full text-gray-300 transition-colors">
                <Settings size={20} />
            </button>
             <button onClick={onLogout} className="p-3 hover:bg-gray-700 rounded-full text-gray-300 transition-colors flex items-center gap-2">
                <Lock size={18} />
                <span className="text-sm font-medium">Lock</span>
            </button>
             <button onClick={() => window.location.reload()} className="p-3 hover:bg-gray-700 rounded-full text-gray-300 transition-colors">
                <Power size={20} />
            </button>
        </div>
      </div>
    </>
  );
};

export default SystemMenu;