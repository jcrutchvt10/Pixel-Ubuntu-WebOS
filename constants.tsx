import React from 'react';
import { Terminal, Globe, Settings, Activity, FolderOpen, Calculator, FileText, Package, Clapperboard, Image, Code, Music } from 'lucide-react';
import { AppId, AppConfig } from './types';
import TerminalApp from './components/apps/Terminal';
import SystemMonitorApp from './components/apps/SystemMonitor';
import BrowserApp from './components/apps/Browser';
import PlaceholderApp from './components/apps/PlaceholderApp';
import FileManagerApp from './components/apps/FileManager';
import SettingsApp from './components/apps/Settings';
import CalculatorApp from './components/apps/Calculator';
import TextEditorApp from './components/apps/TextEditor';
import SynapticApp from './components/apps/Synaptic';

// Ubuntu Colors
export const COLORS = {
  UBUNTU_ORANGE: '#E95420',
  UBUNTU_PURPLE: '#77216F',
  UBUNTU_DARK: '#2C001E',
  TEXT_GRAY: '#AEA79F',
};

// Beautiful Beach Wallpaper
export const WALLPAPER_URL = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop";

export const APP_CONFIGS: Record<AppId, AppConfig> = {
  [AppId.TERMINAL]: {
    id: AppId.TERMINAL,
    name: 'Terminal',
    icon: <Terminal className="text-white" size={28} />,
    component: <TerminalApp />,
    defaultWidth: 700,
    defaultHeight: 500,
  },
  [AppId.BROWSER]: {
    id: AppId.BROWSER,
    name: 'Firefox',
    icon: <Globe className="text-orange-500" size={28} />,
    component: <BrowserApp />,
    defaultWidth: 900,
    defaultHeight: 600,
  },
  [AppId.FILES]: {
    id: AppId.FILES,
    name: 'Files',
    icon: <FolderOpen className="text-orange-300" size={28} />,
    component: <FileManagerApp />,
    defaultWidth: 800,
    defaultHeight: 550,
  },
  [AppId.TEXT_EDITOR]: {
    id: AppId.TEXT_EDITOR,
    name: 'Text Editor',
    icon: <FileText className="text-gray-400" size={28} />,
    component: <TextEditorApp />,
    defaultWidth: 600,
    defaultHeight: 500,
  },
  [AppId.CALCULATOR]: {
    id: AppId.CALCULATOR,
    name: 'Calculator',
    icon: <Calculator className="text-green-400" size={28} />,
    component: <CalculatorApp />,
    defaultWidth: 350,
    defaultHeight: 500,
  },
  [AppId.MONITOR]: {
    id: AppId.MONITOR,
    name: 'System Monitor',
    icon: <Activity className="text-green-400" size={28} />,
    component: <SystemMonitorApp />,
    defaultWidth: 600,
    defaultHeight: 450,
  },
  [AppId.SETTINGS]: {
    id: AppId.SETTINGS,
    name: 'Settings',
    icon: <Settings className="text-gray-300" size={28} />,
    component: <SettingsApp />,
    defaultWidth: 900,
    defaultHeight: 600,
  },
  [AppId.SYNAPTIC]: {
    id: AppId.SYNAPTIC,
    name: 'Synaptic Package Manager',
    icon: <Package className="text-blue-400" size={28} />,
    component: <SynapticApp />,
    defaultWidth: 850,
    defaultHeight: 600,
  },
  // Installable Apps
  [AppId.VLC]: {
    id: AppId.VLC,
    name: 'VLC Media Player',
    icon: <Clapperboard className="text-orange-500" size={28} />,
    component: <PlaceholderApp title="VLC Media Player" description="The best open-source multimedia player." />,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  [AppId.GIMP]: {
    id: AppId.GIMP,
    name: 'GIMP Image Editor',
    icon: <Image className="text-gray-300" size={28} />,
    component: <PlaceholderApp title="GIMP" description="GNU Image Manipulation Program." />,
    defaultWidth: 1000,
    defaultHeight: 700,
  },
  [AppId.VSCODE]: {
    id: AppId.VSCODE,
    name: 'VS Code',
    icon: <Code className="text-blue-500" size={28} />,
    component: <PlaceholderApp title="Visual Studio Code" description="Code editing. Redefined." />,
    defaultWidth: 1000,
    defaultHeight: 700,
  },
  [AppId.SPOTIFY]: {
    id: AppId.SPOTIFY,
    name: 'Spotify',
    icon: <Music className="text-green-500" size={28} />,
    component: <PlaceholderApp title="Spotify" description="Music for everyone." />,
    defaultWidth: 900,
    defaultHeight: 600,
  },
};