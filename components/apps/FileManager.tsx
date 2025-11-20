
import React, { useState, useEffect } from 'react';
import { Folder, FileText, Image, ArrowLeft, ChevronRight, Search, Menu, Home, Download, HardDrive, Cloud, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import * as fs from '../../services/fileSystem';

const FileManagerApp: React.FC = () => {
  const [currentPathId, setCurrentPathId] = useState('root');
  const [pathHistory, setPathHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Home'}]);
  const [items, setItems] = useState<fs.FSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isRealDrive, setIsRealDrive] = useState(false);

  const loadDir = async (id: string) => {
      setLoading(true);
      try {
        const files = await fs.listDirectory(id);
        setItems(files);
        setIsRealDrive(fs.getFSMode() === 'DRIVE');
      } catch (e) {
          console.error("Failed to load directory", e);
          setItems([]);
      }
      setLoading(false);
  };

  useEffect(() => {
      loadDir(currentPathId);
      
      const handleAuthChange = () => {
          // Reset to root on auth change
          setPathHistory([{id: 'root', name: 'Home'}]);
          setCurrentPathId('root');
      };
      window.addEventListener('drive-auth-changed', handleAuthChange);
      return () => window.removeEventListener('drive-auth-changed', handleAuthChange);
  }, [currentPathId]);

  const handleNavigate = (item: fs.FSItem) => {
      if (item.type === 'folder') {
          setPathHistory(prev => [...prev, { id: item.id, name: item.name }]);
          setCurrentPathId(item.id);
          setSelectedItems(new Set()); // Clear selection on navigate
      }
  };

  const handleBack = () => {
      if (pathHistory.length > 1) {
          const newHistory = [...pathHistory];
          newHistory.pop();
          setPathHistory(newHistory);
          setCurrentPathId(newHistory[newHistory.length - 1].id);
      }
  };

  const handleDelete = async () => {
      if (selectedItems.size === 0) return;
      if (!confirm("Are you sure you want to delete selected items? This is REAL.")) return;
      
      setLoading(true);
      for (const id of selectedItems) {
          await fs.deleteItem(id);
      }
      setSelectedItems(new Set());
      loadDir(currentPathId);
  };

  const handleItemClick = (item: fs.FSItem) => {
      const newSet = new Set(selectedItems);
      if (newSet.has(item.id)) {
          newSet.delete(item.id);
      } else {
          newSet.clear(); // Single select mostly
          newSet.add(item.id);
      }
      setSelectedItems(newSet);
  };

  const renderIcon = (item: fs.FSItem) => {
      if (item.type === 'folder') return <Folder size={48} className="text-[#E95420] fill-[#E95420]/20" />;
      if (item.name.endsWith('.png') || item.name.endsWith('.jpg')) return <Image size={48} className="text-purple-500" />;
      return <FileText size={48} className="text-gray-500" />;
  };

  return (
    <div className="h-full w-full flex flex-col bg-white text-[#333]">
      {/* Toolbar */}
      <div className="h-12 border-b border-gray-200 flex items-center px-4 gap-4 bg-[#f6f5f4]">
        <div className="flex gap-2">
          <button onClick={handleBack} className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-30" disabled={pathHistory.length <= 1}>
            <ArrowLeft size={20} />
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="flex-grow flex items-center text-sm text-gray-600 bg-white px-2 py-1 rounded border border-gray-300 w-full h-8 overflow-hidden">
            {pathHistory.map((p, i) => (
                <React.Fragment key={p.id}>
                    {i > 0 && <ChevronRight size={14} className="mx-1 text-gray-400 flex-shrink-0" />}
                    <span className="cursor-pointer hover:text-black whitespace-nowrap" onClick={() => {
                        const newHist = pathHistory.slice(0, i + 1);
                        setPathHistory(newHist);
                        setCurrentPathId(p.id);
                    }}>
                        {p.name}
                    </span>
                </React.Fragment>
            ))}
        </div>

        <div className="flex gap-2 ml-auto">
            {selectedItems.size === 1 && items.find(i => i.id === Array.from(selectedItems)[0])?.type === 'folder' && (
                 <button 
                    className="p-2 hover:bg-gray-200 rounded text-gray-600" 
                    onClick={() => {
                        const item = items.find(i => i.id === Array.from(selectedItems)[0]);
                        if(item) handleNavigate(item);
                    }}
                    title="Open Folder"
                >
                    <ExternalLink size={18} />
                </button>
            )}

            {selectedItems.size > 0 && (
                <button className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors" onClick={handleDelete}>
                    <Trash2 size={18} />
                </button>
            )}
            <button className="p-2 hover:bg-gray-200 rounded" onClick={() => loadDir(currentPathId)}><RefreshCw size={18} /></button>
            <button className="p-2 hover:bg-gray-200 rounded"><Search size={18} /></button>
            <button className="p-2 hover:bg-gray-200 rounded"><Menu size={18} /></button>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-[#f6f5f4] border-r border-gray-200 flex flex-col py-4 text-sm">
             <div className="px-4 py-2 text-xs font-bold text-gray-500">LOCATIONS</div>
             <div 
                className={`px-4 py-1.5 flex items-center gap-3 cursor-pointer hover:bg-gray-200 ${!isRealDrive ? 'bg-gray-200' : ''}`}
                onClick={() => {
                    setPathHistory([{id: 'root', name: 'Home'}]);
                    setCurrentPathId('root');
                }}
            >
                <Home size={18} /> Home
            </div>
            <div 
                className={`px-4 py-1.5 flex items-center gap-3 cursor-pointer hover:bg-gray-200 ${isRealDrive ? 'text-green-700 font-medium' : ''}`}
                onClick={() => {
                    if(isRealDrive) {
                        setPathHistory([{id: 'root', name: 'Google Drive'}]);
                        setCurrentPathId('root');
                    } else {
                        alert("Connect via Settings app");
                    }
                }}
            >
                <Cloud size={18} /> {isRealDrive ? 'Google Drive' : 'Not Connected'}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow bg-white p-4 overflow-y-auto relative">
            {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="animate-spin w-8 h-8 border-4 border-[#E95420] border-t-transparent rounded-full"></div>
                </div>
            )}
            
            <div className="grid grid-cols-4 gap-4">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        className={`flex flex-col items-center p-4 rounded hover:bg-gray-100 cursor-pointer border border-transparent ${selectedItems.has(item.id) ? 'bg-orange-50 border-orange-200' : ''}`}
                        onDoubleClick={() => handleNavigate(item)}
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="mb-2 relative">
                            {renderIcon(item)}
                            {item.type === 'file' && isRealDrive && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                    <Cloud size={8} className="text-white" />
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-center break-all line-clamp-2 select-none">{item.name}</span>
                        {item.type === 'file' && <span className="text-xs text-gray-400 mt-1">{item.size}</span>}
                    </div>
                ))}
            </div>
            
            {!loading && items.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Folder size={64} className="mb-4 opacity-20" />
                    <p>Folder is empty</p>
                    {isRealDrive && <p className="text-xs mt-2">Synced with Google Drive</p>}
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FileManagerApp;
