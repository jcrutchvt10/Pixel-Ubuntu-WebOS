import React, { useState, useEffect } from 'react';
import { Wifi, Volume2, Battery, Power } from 'lucide-react';
import SystemMenu from './SystemMenu';
import CalendarMenu from './CalendarMenu';
import { AppId } from '../../types';

interface TopBarProps {
    onActivitiesClick: () => void;
    onLogout: () => void;
    onOpenApp: (id: AppId) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onActivitiesClick, onLogout, onOpenApp }) => {
  const [date, setDate] = useState(new Date());
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <>
    <div className="h-7 bg-[#1D1D1D] text-gray-200 flex items-center justify-between px-4 text-xs select-none z-[60] shadow-sm fixed w-full top-0 left-0 border-b border-gray-800 font-medium">
      <div 
        className="font-bold hover:bg-[#333] px-3 py-1 rounded-full cursor-pointer transition-all duration-200 active:bg-[#444]"
        onClick={onActivitiesClick}
      >
        Activities
      </div>
      
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 font-medium cursor-default hover:bg-[#333] px-3 py-1 rounded-full transition-colors duration-200 ${isCalendarOpen ? 'bg-[#333]' : ''}`}
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        {formattedDate}
      </div>

      <div 
        className={`flex items-center gap-3 hover:bg-[#333] px-2 py-1 rounded-full cursor-pointer transition-colors duration-200 ${isSystemMenuOpen ? 'bg-[#333]' : ''}`}
        onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
      >
        <div className="flex items-center gap-2">
            <Wifi size={14} />
            <Volume2 size={14} />
            <Battery size={14} />
            <div className="w-0 border-l border-gray-600 h-3 mx-1"></div>
            <Power size={14} />
        </div>
      </div>
    </div>
    
    <SystemMenu 
        isOpen={isSystemMenuOpen} 
        onClose={() => setIsSystemMenuOpen(false)} 
        onLogout={onLogout}
        onOpenSettings={() => onOpenApp(AppId.SETTINGS)}
    />

    <CalendarMenu 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
    />
    </>
  );
};

export default TopBar;