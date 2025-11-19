import { ReactNode } from 'react';

export enum AppId {
  TERMINAL = 'terminal',
  BROWSER = 'firefox',
  SETTINGS = 'settings',
  MONITOR = 'monitor',
  FILES = 'nautilus',
  CALCULATOR = 'calculator',
  TEXT_EDITOR = 'gedit',
  SYNAPTIC = 'synaptic',
  // Installable Apps
  VLC = 'vlc',
  GIMP = 'gimp',
  VSCODE = 'code',
  SPOTIFY = 'spotify',
}

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  workspaceId: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface AppConfig {
  id: AppId;
  name: string;
  icon: ReactNode;
  component: ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

export interface TerminalMessage {
  type: 'user' | 'system' | 'error' | 'kernel';
  content: string;
}

export enum TerminalMode {
    SHELL = 'shell',
    EMULATOR = 'emulator'
}
