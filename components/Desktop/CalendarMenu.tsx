import React from 'react';
import { Bell, ChevronRight, Cloud, MoreVertical, Play, SkipBack, SkipForward, X } from 'lucide-react';

interface CalendarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarMenu: React.FC<CalendarMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); // 0 = Sunday

  const renderCalendarDays = () => {
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Header
    weekDays.forEach((d, i) => days.push(
      <div key={`h-${i}`} className="text-xs text-gray-500 font-bold flex justify-center items-center h-8">
        {d}
      </div>
    ));

    // Empty slots
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`e-${i}`} />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === currentDay;
      days.push(
        <div 
          key={`d-${i}`} 
          className={`h-8 w-8 text-sm flex items-center justify-center rounded-full mx-auto
            ${isToday ? 'bg-[#E95420] text-white font-bold' : 'text-gray-300 hover:bg-gray-700 cursor-pointer'}
          `}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-9 left-1/2 -translate-x-1/2 z-50 flex gap-4 h-[600px] animate-in fade-in zoom-in-95 duration-200 select-none">
        
        {/* Left Column: Notifications */}
        <div className="w-[400px] flex flex-col gap-3">
            <div className="bg-[#1D1D1D] border border-gray-700 rounded-2xl p-4 shadow-2xl flex-grow overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-300 font-bold">Notifications</h3>
                    <div className="flex gap-2">
                        <div className="bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-300">Do Not Disturb</div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18}/></button>
                    </div>
                </div>
                
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 gap-4 opacity-60">
                    <Bell size={48} />
                    <p>No Notifications</p>
                </div>
            </div>

            {/* Media Controls */}
            <div className="bg-[#1D1D1D] border border-gray-700 rounded-2xl p-4 shadow-2xl h-32">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        M
                    </div>
                    <div className="flex-grow">
                         <div className="text-gray-200 font-bold text-sm">Rhythmbox</div>
                         <div className="text-gray-400 text-xs">Music Player</div>
                    </div>
                    <div className="text-gray-400"><MoreVertical size={16} /></div>
                </div>
                <div className="flex justify-center items-center gap-6 mt-4 text-gray-200">
                    <SkipBack size={20} className="cursor-pointer hover:text-white"/>
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                        <Play size={18} fill="white" className="ml-0.5" />
                    </div>
                    <SkipForward size={20} className="cursor-pointer hover:text-white"/>
                </div>
            </div>
        </div>

        {/* Right Column: Calendar & World Clocks */}
        <div className="w-[340px] bg-[#1D1D1D] border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar">
            {/* Date Header */}
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl text-gray-200 font-bold">
                    {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                 </h2>
                 <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded-full text-gray-400"><ChevronRight className="rotate-180" size={20}/></button>
                    <button className="p-1 hover:bg-gray-700 rounded-full text-gray-400"><ChevronRight size={20}/></button>
                 </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-2 mb-8">
                {renderCalendarDays()}
            </div>

            <div className="h-px bg-gray-700 my-2"></div>

            {/* World Clocks / Weather */}
            <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-gray-300">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">New York</span>
                        <span className="text-xs text-gray-500">Yesterday</span>
                    </div>
                    <span className="text-sm">{(today.getHours() - 3) % 24}:00</span>
                </div>
                 <div className="flex items-center justify-between text-gray-300">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">London</span>
                        <span className="text-xs text-gray-500">Today</span>
                    </div>
                    <span className="text-sm">{(today.getHours() + 5) % 24}:00</span>
                </div>

                <div className="h-px bg-gray-700 my-2"></div>

                <div className="flex items-center justify-between text-gray-300 mt-4">
                    <div className="flex items-center gap-3">
                        <Cloud size={24} className="text-gray-400" />
                        <div className="flex flex-col">
                             <span className="font-bold text-sm">Mountain View</span>
                             <span className="text-xs text-gray-500">Clear</span>
                        </div>
                    </div>
                    <span className="font-bold">18°C</span>
                </div>
            </div>

        </div>
      </div>
    </>
  );
};

export default CalendarMenu;