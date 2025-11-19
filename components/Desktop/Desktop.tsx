import React, { useState, useEffect } from 'react';
import TopBar from './TopBar';
import Dock from './Dock';
import Window from './Window';
import AppGrid from './AppGrid';
import LoginScreen from './LoginScreen';
import ContextMenu from './ContextMenu';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import BootScreen from './BootScreen';
import DesktopIcons from './DesktopIcons';
import SettingsApp from '../apps/Settings';
import { AppId, WindowState } from '../../types';
import { APP_CONFIGS, WALLPAPER_URL } from '../../constants';

type ViewMode = 'DESKTOP' | 'OVERVIEW' | 'APP_GRID';
type SystemState = 'BOOTING' | 'LOCKED' | 'SESSION';

const Desktop: React.FC = () => {
  const [systemState, setSystemState] = useState<SystemState>('BOOTING');
  const [viewMode, setViewMode] = useState<ViewMode>('DESKTOP');
  const [currentWorkspace, setCurrentWorkspace] = useState(0);
  const [wallpaper, setWallpaper] = useState(WALLPAPER_URL);
  const [, setTick] = useState(0); // Force update for external storage changes
  
  const [windows, setWindows] = useState<WindowState[]>([
      {
          id: AppId.TERMINAL,
          title: 'pixel@ubuntu: ~',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          zIndex: 10,
          workspaceId: 0,
          position: { x: 20, y: 60 },
          size: { width: 0, height: 0 } // Will be set by resize effect immediately
      }
  ]);
  
  const [activeAppId, setActiveAppId] = useState<AppId>(AppId.TERMINAL);
  const [contextMenuPos, setContextMenuPos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
      const handleStorageUpdate = () => setTick(t => t + 1);
      window.addEventListener('storage-update', handleStorageUpdate);
      return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  // Handle Screen Rotation / Resize
  useEffect(() => {
    const handleResize = () => {
      setWindows(prev => prev.map(w => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        // Default config size
        const config = APP_CONFIGS[w.id];
        const defaultW = config?.defaultWidth || 700;
        const defaultH = config?.defaultHeight || 500;

        // If size is 0 (initial) or needs clamping
        let currentW = w.size?.width || defaultW;
        let currentH = w.size?.height || defaultH;

        // Clamp to screen size with some padding
        const maxW = screenW - 20;
        const maxH = screenH - 80; // Dock + TopBar space

        const newW = Math.min(currentW, maxW);
        const newH = Math.min(currentH, maxH);
        
        return {
          ...w,
          size: { width: newW, height: newH },
          // Ensure window stays on screen
          position: { 
            x: Math.min(w.position?.x || 0, screenW - newW),
            y: Math.min(w.position?.y || 0, screenH - newH) 
          }
        };
      }));
    };

    // Run once on mount to set initial sizes correct for device
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Hotkeys
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Meta' && systemState === 'SESSION') {
              e.preventDefault();
              toggleOverview();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, systemState]);

  const toggleOverview = () => {
      if (viewMode === 'DESKTOP') setViewMode('OVERVIEW');
      else setViewMode('DESKTOP');
  };

  const handleOpenApp = (id: AppId) => {
    setViewMode('DESKTOP');
    setActiveAppId(id);
    
    setWindows(prev => {
      const existing = prev.find(w => w.id === id);
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0) + 1;

      if (existing) {
        if (existing.workspaceId !== currentWorkspace) {
            setCurrentWorkspace(existing.workspaceId);
        }
        return prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: maxZ } : w);
      }

      const config = APP_CONFIGS[id];
      
      // Dynamic sizing for new window based on current viewport
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const width = Math.min(config.defaultWidth, screenW - 30);
      const height = Math.min(config.defaultHeight, screenH - 100);

      const offset = prev.length * 20;
      // Center initially if possible, or cascade
      const startX = Math.max(10, (screenW - width) / 2 + (offset % 100));
      const startY = Math.max(40, (screenH - height) / 2 + (offset % 100));
      
      return [...prev, {
        id,
        title: config.name,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: maxZ,
        workspaceId: currentWorkspace,
        position: { x: startX, y: startY },
        size: { width, height }
      }];
    });
  };

  const handleCloseWindow = (id: AppId) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleMinimizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
  };

  const handleFocusWindow = (id: AppId) => {
    if (viewMode !== 'DESKTOP') {
        setViewMode('DESKTOP');
    }
    setActiveAppId(id);
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex), 0) + 1;
        return prev.map(w => w.id === id ? { ...w, zIndex: maxZ } : w);
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if (viewMode === 'DESKTOP') {
        setContextMenuPos({ x: e.clientX, y: e.clientY });
      }
  };

  const getOverviewPositions = () => {
      const workspaceWindows = windows.filter(w => w.workspaceId === currentWorkspace && w.isOpen && !w.isMinimized);
      const count = workspaceWindows.length;
      const positions: Record<string, { x: number, y: number, scale: number }> = {};

      if (count === 0) return positions;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const padding = 60; 

      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);

      const cellW = (screenW - padding * 2) / cols;
      const cellH = (screenH - padding * 2) / rows;

      workspaceWindows.forEach((win, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const centerX = padding + col * cellW + cellW / 2;
          const centerY = padding + row * cellH + cellH / 2;
          
          // Use fallback if size is 0 (rare race condition on boot)
          const winW = win.size?.width || 500;
          const winH = win.size?.height || 400;
          
          const scale = Math.min(0.6, (cellW * 0.9) / winW, (cellH * 0.9) / winH);

          const targetX = centerX - (winW / 2);
          const targetY = centerY - (winH / 2);

          positions[win.id] = { x: targetX, y: targetY, scale };
      });

      return positions;
  };

  const overviewPositions = viewMode !== 'DESKTOP' ? getOverviewPositions() : {};

  if (systemState === 'BOOTING') {
      return <BootScreen onBootComplete={() => setSystemState('LOCKED')} />;
  }

  if (systemState === 'LOCKED') {
      return <LoginScreen onLogin={() => setSystemState('SESSION')} />;
  }

  return (
    <div 
        className="h-[100dvh] w-screen overflow-hidden relative bg-cover bg-center select-none transition-all duration-500 ease-in-out"
        style={{ 
            backgroundImage: `url(${wallpaper})`,
            transform: viewMode !== 'DESKTOP' ? 'scale(1.1)' : 'scale(1)',
        }}
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenuPos(null)}
    >
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none
            ${viewMode !== 'DESKTOP' ? 'opacity-50' : 'opacity-0'}
        `} 
      />
      
      <TopBar 
          onActivitiesClick={toggleOverview} 
          onLogout={() => setSystemState('LOCKED')}
          onOpenApp={handleOpenApp}
      />

      {viewMode === 'DESKTOP' && <DesktopIcons onOpenApp={handleOpenApp} />}
      
      <div className="absolute top-7 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
          {windows
              .filter(w => w.workspaceId === currentWorkspace)
              .map(win => {
                let appComponent = APP_CONFIGS[win.id].component;
                if (win.id === AppId.SETTINGS) {
                    appComponent = <SettingsApp onUpdateWallpaper={setWallpaper} currentWallpaper={wallpaper} />;
                }

                return (
                    <Window 
                      key={win.id}
                      windowState={win}
                      isOverview={viewMode !== 'DESKTOP'}
                      overviewPosition={overviewPositions[win.id]}
                      onClose={() => handleCloseWindow(win.id)}
                      onMinimize={() => handleMinimizeWindow(win.id)}
                      onFocus={() => handleFocusWindow(win.id)}
                    >
                      {appComponent}
                    </Window>
                );
              })}
        </div>
      </div>

      <Dock 
        activeAppIds={windows.filter(w => w.workspaceId === currentWorkspace).map(w => w.id)} 
        openApps={windows.filter(w => w.isOpen).map(w => w.id)}
        onAppClick={(id) => {
            if (viewMode === 'APP_GRID') {
                handleOpenApp(id);
            } else {
                const win = windows.find(w => w.id === id);
                if (win && win.isOpen && !win.isMinimized && activeAppId === id && viewMode === 'DESKTOP') {
                    handleMinimizeWindow(id);
                } else {
                    handleOpenApp(id);
                }
            }
        }} 
        onShowGrid={() => setViewMode(viewMode === 'APP_GRID' ? 'DESKTOP' : 'APP_GRID')}
      />

      <AppGrid 
        isOpen={viewMode === 'APP_GRID'} 
        onClose={() => setViewMode('DESKTOP')} 
        onOpenApp={handleOpenApp}
      />

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)}
        onOpenApp={handleOpenApp}
      />

      {(viewMode === 'OVERVIEW' || viewMode === 'APP_GRID') && (
          <WorkspaceSwitcher 
            activeWorkspace={currentWorkspace}
            onSwitch={(idx) => setCurrentWorkspace(idx)}
          />
      )}

    </div>
  );
};

export default Desktop;