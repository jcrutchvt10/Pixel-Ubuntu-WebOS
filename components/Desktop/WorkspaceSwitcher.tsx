import React from 'react';

interface WorkspaceSwitcherProps {
  activeWorkspace: number;
  onSwitch: (index: number) => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ activeWorkspace, onSwitch }) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-right-10 duration-300">
        {[0, 1].map((idx) => (
            <div 
                key={idx}
                onClick={() => onSwitch(idx)}
                className={`
                    w-32 h-20 border-2 rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm
                    flex items-center justify-center relative group
                    ${activeWorkspace === idx 
                        ? 'border-[#E95420] bg-white/10 scale-110 shadow-xl' 
                        : 'border-gray-600 bg-black/20 hover:bg-white/5 hover:border-gray-400'
                    }
                `}
            >
                {/* Simulated Mini Window Content */}
                <div className="flex gap-1">
                    {activeWorkspace === idx && (
                        <>
                           <div className="w-8 h-5 bg-gray-500/50 rounded-sm"></div>
                           <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                        </>
                    )}
                </div>
                
                {/* Label */}
                <div className="absolute -left-8 opacity-0 group-hover:opacity-100 text-white text-xs font-bold transition-opacity">
                    {idx + 1}
                </div>
            </div>
        ))}
    </div>
  );
};

export default WorkspaceSwitcher;