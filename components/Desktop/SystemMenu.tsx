import React, { useState } from 'react';
import { Wifi, Bluetooth, Battery, Lock, Power, Settings, Moon, Sun, Volume2, RotateCw } from 'lucide-react';

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
  const [rotationLock, setRotationLock] = useState(false);
  const [powerSaver, setPowerSaver] = useState(false);

  if (!isOpen) return null;

  // Don't close when clicking inside
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const ToggleButton = ({ active, icon, label, onClick }: any) => (
    <div className="flex flex-col items-center gap-2">
        <button 
            onClick={onClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${active ? 'bg-[#E95420] text-white shadow-orange-500/20' : 'bg-[#3e3e3e] text-gray-300 hover:bg-[#4e4e4e]'}`}
        >
            {icon}
        </button>
        <span className="text-xs text-gray-300 text-center whitespace-nowrap">{label}</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed top-9 right-2 w-80 bg-[#1D1D1D] rounded-2xl shadow-2xl border border-gray-700 p-5 z-50 animate-in fade-in zoom-in-95 duration-200 text-gray-200 select-none"
        onClick={handleContentClick}
      >
        {/* Toggles Grid */}
        <div className="grid grid-cols-3 gap-y-6 mb-8">
             <ToggleButton 
                active={wifi} 
                onClick={() => setWifi(!wifi)} 
                icon={<Wifi size={20} />} 
                label="Wi-Fi" 
             />
             <ToggleButton 
                active={bt} 
                onClick={() => setBt(!bt)} 
                icon={<Bluetooth size={20} />} 
                label="Bluetooth" 
             />
             <ToggleButton 
                active={darkMode} 
                onClick={() => setDarkMode(!darkMode)} 
                icon={darkMode ? <Moon size={20} /> : <Sun size={20} />} 
                label={darkMode ? "Dark Mode" : "Light Mode"} 
             />
             <ToggleButton 
                active={rotationLock} 
                onClick={() => setRotationLock(!rotationLock)} 
                icon={rotationLock ? <Lock size={20} /> : <RotateCw size={20} />} 
                label="Rotation" 
             />
             <ToggleButton 
                active={powerSaver} 
                onClick={() => setPowerSaver(!powerSaver)} 
                icon={<Battery size={20} />} 
                label="Power Saver" 
             />
        </div>

        {/* Sliders */}
        <div className="space-y-5 mb-6 px-1">
            <div className="flex items-center gap-4 group">
                <div className="w-6 text-gray-400 group-hover:text-white transition-colors"><Volume2 size={20} /></div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="flex-grow h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#E95420] hover:accent-[#ff6b35]"
                />
            </div>
            <div className="flex items-center gap-4 group">
                <div className="w-6 text-gray-400 group-hover:text-white transition-colors"><Sun size={20} /></div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="flex-grow h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#E95420] hover:accent-[#ff6b35]"
                />
            </div>
        </div>

        {/* Footer Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-2">
            <button 
                onClick={() => { onOpenSettings(); onClose(); }} 
                className="p-3 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors"
                title="Settings"
            >
                <Settings size={22} />
            </button>
            
            <button 
                onClick={onLogout} 
                className="px-4 py-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors flex items-center gap-2 font-medium text-sm"
            >
                <Lock size={18} />
                <span>Lock</span>
            </button>
            
            <button 
                onClick={() => {
                    if(confirm("Restart simulation?")) window.location.reload();
                }} 
                className="p-3 hover:bg-red-900/30 hover:text-red-400 rounded-full text-gray-300 transition-colors"
                title="Power Off"
            >
                <Power size={22} />
            </button>
        </div>
      </div>
    </>
  );
};

export default SystemMenu;