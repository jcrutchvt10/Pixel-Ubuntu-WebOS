
import React, { useEffect, useState } from 'react';

interface BootScreenProps {
  onBootComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onBootComplete, 500); // Small delay after 100%
          return 100;
        }
        // Simulate varying boot speeds (faster at start, slower at kernel load)
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 100);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onBootComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-between pb-20 pt-32 cursor-none">
      
      {/* Manufacturer Logo (Simulating UEFI Splash) */}
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <span className="text-white text-4xl font-sans font-medium tracking-wide flex items-center gap-2">
            <span className="font-bold">G</span>oogle
        </span>
      </div>

      {/* Ubuntu Spinner & Logo */}
      <div className="flex flex-col items-center gap-8 mb-10">
        <div className="relative w-12 h-12">
           <svg className="animate-spin" viewBox="0 0 50 50">
              <circle
                className="opacity-25"
                cx="25"
                cy="25"
                r="20"
                stroke="white"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="white"
                d="M25 5A20 20 0 0 1 45 25"
              >
              </path>
           </svg>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-white font-medium text-xl tracking-wider mb-1">
                ubuntu
            </div>
            {/* Manufacturer powered by badge */}
            <div className="text-gray-500 text-xs font-bold tracking-[0.2em]">
                powered by android
            </div>
        </div>
      </div>
      
      {/* Check File System Text (Simulated console output, hidden mostly but adds flavor if visible) */}
      <div className="absolute bottom-2 left-2 text-gray-600 text-xs font-mono opacity-50">
        /dev/sda1: clean, {Math.floor(Math.random() * 500000)}/{Math.floor(Math.random() * 2000000)} files, {Math.floor(Math.random() * 2000000)}/{Math.floor(Math.random() * 5000000)} blocks
      </div>
    </div>
  );
};

export default BootScreen;
