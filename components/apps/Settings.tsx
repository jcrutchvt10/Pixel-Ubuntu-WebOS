
import React, { useState, useEffect } from 'react';
import { Wifi, Bluetooth, Monitor, Info, Search, Lock, Moon, Globe, Check, Cloud, LogOut, Key, Loader2, AlertCircle } from 'lucide-react';
import { isGoogleDriveConnected, connectGoogleDrive, disconnectGoogleDrive, syncFromDrive } from '../../services/storageService';
import * as drive from '../../services/googleDrive';
import * as fs from '../../services/fileSystem';

// Sample Wallpapers
const WALLPAPERS = [
    { name: 'Jellyfish', url: 'https://images.unsplash.com/photo-1625014618427-fbc980b974f9?q=80&w=2560&auto=format&fit=crop' },
    { name: 'Canyon', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2560&auto=format&fit=crop' },
    { name: 'Abstract', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2560&auto=format&fit=crop' },
    { name: 'Pixel Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop' },
    { name: 'Ubuntu Classic', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2560&auto=format&fit=crop' },
];

interface SettingsProps {
    onUpdateWallpaper?: (url: string) => void;
    currentWallpaper?: string;
}

const SettingsApp: React.FC<SettingsProps> = ({ onUpdateWallpaper, currentWallpaper }) => {
  const [activeTab, setActiveTab] = useState('About');
  const [wifiEnabled, setWifiEnabled] = useState(true);
  
  // Real Auth State
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('google_api_key') || ''); // API Key kept for potential future use or user storage, but not used for GAPI init anymore
  const [isRealAuthReady, setIsRealAuthReady] = useState(false); // Client Init complete
  const [isAuthenticated, setIsAuthenticated] = useState(false); // User logged in
  const [isInitializing, setIsInitializing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
      setIsAuthenticated(drive.isAuthenticated());
      
      // Attempt auto-init if credentials exist
      const autoInit = async () => {
          if (clientId && !isRealAuthReady) {
             try {
                 // Only init GIS now, no GAPI init
                 await drive.initGisClient({ clientId, apiKey });
                 setIsRealAuthReady(true);
             } catch (e) {
                 console.warn("Auto-init failed:", e);
             }
          }
      };
      autoInit();

      const handleAuthChange = async () => {
          const auth = drive.isAuthenticated();
          setIsAuthenticated(auth);
          if (auth) {
              // Initialize FS Structure in Drive
              await fs.initializeDriveFS();
              // Sync Package State from Drive
              await syncFromDrive();
          }
      };
      window.addEventListener('drive-auth-changed', handleAuthChange);
      return () => window.removeEventListener('drive-auth-changed', handleAuthChange);
  }, []);

  const handleInitializeAndLogin = async () => {
      if (!clientId) {
          setErrorMsg("Please enter a Client ID");
          return;
      }
      
      setIsInitializing(true);
      setStatusMsg('Initializing Google Auth...');
      setErrorMsg('');
      
      // Save for persistence
      localStorage.setItem('google_client_id', clientId);
      localStorage.setItem('google_api_key', apiKey);
      
      try {
          // 1. Init SDK (GIS Only)
          await drive.initGisClient({ clientId, apiKey });
          setIsRealAuthReady(true);
          setStatusMsg('SDK Ready. Requesting Auth...');
          
          // 2. Auto Trigger Login Popup
          drive.requestAuth();
          setStatusMsg('');
      } catch (e: any) {
          console.error(e);
          const msg = typeof e === 'string' ? e : JSON.stringify(e);
          setErrorMsg(`Initialization Failed: ${msg}`);
          setStatusMsg('');
          setIsRealAuthReady(false);
      } finally {
          setIsInitializing(false);
      }
  };

  const handleManualLogin = () => {
      if (!isRealAuthReady) {
          setErrorMsg("Please Initialize the Google API first.");
          return;
      }
      drive.requestAuth();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'About':
        return (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[#E95420] to-[#77216F] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
                    U
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Ubuntu 24.04 LTS</h2>
                <p className="text-gray-500">Noble Numbat (Web Edition)</p>
             </div>

             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <span className="text-gray-600">Hardware Model</span>
                    <span className="font-medium">Google Pixel 9 Pro XL</span>
                </div>
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <span className="text-gray-600">Cloud Integration</span>
                    <span className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`}>
                        {isAuthenticated ? 'Active (Real Drive)' : 'Simulated'}
                    </span>
                </div>
             </div>
          </div>
        );
      
      case 'Background':
        return (
            <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Background</h2>
                <div className="grid grid-cols-2 gap-4">
                    {WALLPAPERS.map((wp) => (
                        <div 
                            key={wp.name} 
                            className={`
                                relative rounded-xl overflow-hidden aspect-video cursor-pointer border-4 transition-all
                                ${currentWallpaper === wp.url ? 'border-[#E95420] shadow-lg scale-[1.02]' : 'border-transparent hover:opacity-90'}
                            `}
                            onClick={() => onUpdateWallpaper && onUpdateWallpaper(wp.url)}
                        >
                            <img src={wp.url} className="w-full h-full object-cover" alt={wp.name} />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 backdrop-blur-sm flex justify-between items-center">
                                <span>{wp.name}</span>
                                {currentWallpaper === wp.url && <Check size={14} className="text-[#E95420]" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

      case 'Wifi':
        return (
            <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <h2 className="text-xl font-bold text-gray-800">Wi-Fi</h2>
                     <div 
                        className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${wifiEnabled ? 'bg-[#E95420]' : 'bg-gray-300'}`}
                        onClick={() => setWifiEnabled(!wifiEnabled)}
                     >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${wifiEnabled ? 'translate-x-5' : ''}`} />
                     </div>
                </div>
                
                {wifiEnabled && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-medium">Pixel_Campus_Guest</span>
                            <Check size={16} className="text-[#E95420]" />
                        </div>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center text-gray-600 hover:bg-gray-50 cursor-pointer">
                            <span>GoogleStarbucks</span>
                            <Lock size={14} />
                        </div>
                    </div>
                )}
            </div>
        );

      case 'Online Accounts':
        return (
             <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Online Accounts</h2>
                <p className="text-gray-500 text-sm mb-6">Configure real cloud integration.</p>

                {/* Developer / API Config Section */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                         <Key size={18} className="text-orange-600"/>
                         <h3 className="font-bold text-orange-800 text-sm">Real Integration Setup</h3>
                    </div>
                    <p className="text-xs text-orange-800 mb-4 leading-relaxed">
                        To enable REAL Google Drive access (for FileSystem & Terminal), provide your Cloud Console credentials.
                        <br/>Required: <strong>OAuth 2.0 Client ID</strong>. (API Key optional)
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-orange-700 uppercase">Client ID</label>
                            <input 
                                type="text" 
                                placeholder="123...apps.googleusercontent.com"
                                className="w-full text-xs p-2 border border-orange-300 rounded bg-white focus:ring-1 focus:ring-orange-500 outline-none"
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                            />
                        </div>
                        
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 rounded p-2 flex gap-2 items-start text-red-700 text-xs">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <div className="break-words">{errorMsg}</div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200/50">
                            <div className="text-xs font-bold text-orange-600">{statusMsg}</div>
                            <button 
                                onClick={handleInitializeAndLogin}
                                disabled={isInitializing || isAuthenticated}
                                className={`bg-orange-600 text-white text-xs px-4 py-2 rounded font-bold hover:bg-orange-700 flex items-center gap-2 shadow-sm active:transform active:scale-95 transition-all ${isInitializing ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isInitializing && <Loader2 size={14} className="animate-spin" />}
                                {isAuthenticated ? 'Connected' : 'Initialize & Connect'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Google Account */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center p-1">
                                <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-800">Google Drive (Real)</div>
                                <div className="text-xs text-gray-500">
                                    {isAuthenticated ? 'Authenticated (Ubuntu Root: /Ubuntu_Web_OS_Data)' : 'Not Connected'}
                                </div>
                            </div>
                         </div>
                         
                         {isAuthenticated ? (
                             <button 
                                onClick={() => drive.signOut()}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                             >
                                 <LogOut size={14} /> Sign Out
                             </button>
                         ) : (
                             <button 
                                onClick={handleManualLogin}
                                disabled={!isRealAuthReady}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isRealAuthReady ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                             >
                                 <Cloud size={14} /> Sign In
                             </button>
                         )}
                    </div>
                </div>
             </div>
        );

      default:
        return (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Info size={64} className="mb-4 opacity-20" />
                <p>{activeTab} Settings not implemented in simulation.</p>
             </div>
        );
    }
  };

  const menuItems = [
    { id: 'Wifi', icon: <Wifi size={18} /> },
    { id: 'Bluetooth', icon: <Bluetooth size={18} /> },
    { id: 'Background', icon: <Monitor size={18} /> },
    { id: 'Appearance', icon: <Moon size={18} /> },
    { id: 'Online Accounts', icon: <Cloud size={18} /> },
    { id: 'Privacy', icon: <Lock size={18} /> },
    { id: 'Region', icon: <Globe size={18} /> },
    { id: 'About', icon: <Info size={18} /> },
  ];

  return (
    <div className="h-full w-full flex bg-[#f6f5f4] text-[#333]">
      {/* Sidebar */}
      <div className="w-64 h-full flex flex-col border-r border-gray-300 bg-[#fafafa]">
        <div className="h-14 flex items-center px-3 border-b border-gray-200">
             <div className="bg-gray-200 w-full rounded-lg flex items-center px-3 h-9 text-gray-500 hover:bg-gray-300 transition-colors cursor-text">
                <Search size={16} className="mr-2" />
                <span className="text-sm">Search</span>
             </div>
        </div>
        <div className="overflow-y-auto flex-grow p-2 space-y-1">
            {menuItems.map((item) => (
                <div 
                    key={item.id}
                    className={`px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm cursor-pointer font-medium transition-colors ${activeTab === item.id ? 'bg-[#E95420] text-white' : 'hover:bg-[#EAEAEA] text-gray-700'}`}
                    onClick={() => setActiveTab(item.id)}
                >
                    {item.icon} {item.id}
                </div>
            ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow overflow-auto bg-[#f6f5f4]">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsApp;
