import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { WindowState } from '../../types';
import { APP_CONFIGS } from '../../constants';

interface WindowProps {
  windowState: WindowState;
  isOverview: boolean;
  overviewPosition?: { x: number; y: number; scale: number };
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ windowState, isOverview, overviewPosition, onClose, onMinimize, onFocus, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(windowState.position || { x: 50, y: 50 });
  const [rel, setRel] = useState({ x: 0, y: 0 }); // Position relative to cursor
  
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (windowState.position) {
          setPosition(windowState.position);
      }
  }, [windowState.position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOverview) {
        onFocus(); // Selecting in overview brings it to focus/exits overview
        return;
    }
    if (e.button !== 0) return;
    if (windowState.isMaximized) return;
    
    onFocus();
    setIsDragging(true);
    const node = windowRef.current;
    if (node) {
        setRel({
            x: e.pageX - node.offsetLeft,
            y: e.pageY - node.offsetTop
        });
    }
    e.stopPropagation();
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.pageX - rel.x,
      y: e.pageY - rel.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);


  if (!windowState.isOpen || (windowState.isMinimized && !isOverview)) return null;

  // Dynamic Styles based on mode
  const finalX = isOverview && overviewPosition ? overviewPosition.x : (windowState.isMaximized ? 0 : position.x);
  const finalY = isOverview && overviewPosition ? overviewPosition.y : (windowState.isMaximized ? 28 : position.y);
  const finalScale = isOverview && overviewPosition ? overviewPosition.scale : 1;
  
  // In overview, we center-origin the transform for better aesthetics
  const transformStyle = isOverview 
    ? `translate(${finalX}px, ${finalY}px) scale(${finalScale})` 
    : undefined;

  const windowStyle: React.CSSProperties = {
    zIndex: windowState.zIndex,
    left: isOverview ? 0 : finalX, // Use transform in overview
    top: isOverview ? 0 : finalY,
    width: windowState.isMaximized && !isOverview ? '100%' : windowState.size?.width,
    height: windowState.isMaximized && !isOverview ? 'calc(100% - 28px)' : windowState.size?.height,
    maxWidth: isOverview ? undefined : '100vw',
    maxHeight: isOverview ? undefined : 'calc(100dvh - 28px)',
    position: 'absolute',
    transform: transformStyle,
    transformOrigin: 'top left',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smooth "Exposé" animation
    boxShadow: isOverview ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 40px -10px rgba(0,0,0,0.5)',
  };

  const appConfig = APP_CONFIGS[windowState.id];

  return (
    <div 
      ref={windowRef}
      style={windowStyle}
      className={`flex flex-col bg-[#303030] overflow-hidden font-sans
        ${windowState.isMaximized && !isOverview ? 'rounded-none' : 'rounded-xl border border-white/10'}
        ${isOverview ? 'cursor-pointer hover:brightness-110 ring-2 ring-transparent hover:ring-[#E95420]' : ''}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Overview Mode Header (Icon floating above window) */}
      {isOverview && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center group">
             <div className="p-2 bg-[#1e1e1e] rounded-lg shadow-lg mb-1">
               {React.cloneElement(appConfig.icon as React.ReactElement<any>, { size: 24 })}
             </div>
             <span className="text-white text-sm font-bold shadow-black text-shadow-sm whitespace-nowrap">{windowState.title}</span>
             <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="absolute -right-6 top-0 bg-gray-600 rounded-full p-1.5 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
             >
                 <X size={14} className="text-white" />
             </button>
          </div>
      )}

      {/* Title Bar - GTK4 Style */}
      <div 
        className={`h-11 bg-[#282828] flex items-center justify-between px-3 select-none shrink-0 ${isOverview ? 'pointer-events-none border-b border-white/5' : 'border-b border-black/20'}`}
        onMouseDown={handleMouseDown}
      >
        {/* Window Controls (Left side in Settings, Right in Default Ubuntu. Stock Ubuntu 24.04 is Right side) */}
        <div className="flex-1"></div>

        <span className="text-gray-200 font-bold text-sm flex-1 text-center truncate px-2">{windowState.title}</span>
        
        {/* Controls */}
        <div className={`flex items-center gap-3 flex-1 justify-end ${isOverview ? 'opacity-0' : 'opacity-100'}`}>
           <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors">
             <Minus size={14} />
           </button>
           <button className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors">
            {windowState.isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
           </button>
           <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-6 h-6 rounded-full hover:bg-[#E95420] flex items-center justify-center text-gray-300 hover:text-white transition-colors group">
             <X size={16} />
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-grow bg-[#1e1e1e] relative overflow-hidden ${isOverview ? 'pointer-events-none' : 'overflow-auto'}`}>
        {children}
        {/* Overlay in overview mode */}
        {isOverview && <div className="absolute inset-0 bg-transparent z-50" />}
      </div>
    </div>
  );
};

export default Window;