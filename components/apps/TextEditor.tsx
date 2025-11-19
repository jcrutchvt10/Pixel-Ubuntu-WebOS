import React, { useState, useEffect } from 'react';
import { Save, Menu, FilePlus, FolderOpen } from 'lucide-react';
import * as fs from '../../services/fileSystem';

const TextEditorApp: React.FC = () => {
  const [text, setText] = useState('');
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [filename, setFilename] = useState('Untitled Document 1');
  const [status, setStatus] = useState('');

  const handleSave = async () => {
      const name = prompt("Enter filename to save to Root:", filename);
      if (!name) return;
      
      setStatus('Saving...');
      try {
        await fs.saveFile(name, text, 'root');
        setFilename(name);
        setStatus('Saved to ' + fs.getFSMode());
      } catch (e) {
        setStatus('Error Saving');
      }
      setTimeout(() => setStatus(''), 2000);
  };

  const handleOpen = async () => {
      const files = await fs.listDirectory('root');
      const txtFiles = files.filter(f => f.type === 'file');
      if (txtFiles.length === 0) {
          alert("No files found in root.");
          return;
      }
      
      // Simple Mock Open Dialog logic (browsers block popups often, so simpler here)
      const fileToOpen = txtFiles[0]; // Just open first one for demo simplicity or implement modal
      // In a real app, this would trigger a file picker modal
      
      const content = await fs.readFile(fileToOpen.id);
      setText(content);
      setFilename(fileToOpen.name);
      setCurrentFileId(fileToOpen.id);
      setStatus('Opened ' + fileToOpen.name);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
        <div className="h-10 border-b border-gray-200 flex items-center justify-between px-2 bg-white">
            <div className="flex items-center gap-2">
                <button onClick={handleOpen} className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-2 text-sm font-medium">
                    <FolderOpen size={16} /> Open
                </button>
                 <button onClick={handleSave} className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-2 text-sm font-medium">
                    <Save size={16} /> Save
                </button>
            </div>
            <div className="font-bold text-sm text-gray-700">{filename}</div>
            <div className="w-24 text-xs text-gray-500 text-right pr-2">{status}</div>
        </div>
        <textarea 
            className="flex-grow p-8 resize-none outline-none font-mono text-sm leading-6 text-gray-800"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here..."
        />
    </div>
  );
};

export default TextEditorApp;