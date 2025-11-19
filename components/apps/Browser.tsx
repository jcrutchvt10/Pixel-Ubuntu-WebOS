import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Menu, Download, AlertTriangle } from 'lucide-react';

const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://cdimage.ubuntu.com/releases/24.04/release/');

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Browser Toolbar */}
      <div className="h-10 bg-[#f0f0f4] border-b border-[#e0e0e6] flex items-center px-2 gap-2">
        <div className="flex gap-1 text-gray-600">
             <button className="p-1 hover:bg-gray-300 rounded"><ArrowLeft size={16} /></button>
             <button className="p-1 hover:bg-gray-300 rounded"><ArrowRight size={16} /></button>
             <button className="p-1 hover:bg-gray-300 rounded"><RotateCw size={16} /></button>
             <button className="p-1 hover:bg-gray-300 rounded"><Home size={16} /></button>
        </div>
        
        <div className="flex-grow bg-white border border-gray-300 rounded-md h-7 flex items-center px-3 text-sm text-gray-700 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
           <input 
             className="w-full outline-none text-sm"
             value={url}
             onChange={(e) => setUrl(e.target.value)}
           />
           <Star size={14} className="text-gray-400 ml-2" />
        </div>

        <button className="p-1 hover:bg-gray-300 rounded text-gray-600"><Menu size={16} /></button>
      </div>

      {/* Content Mock - Ubuntu Releases */}
      <div className="flex-grow overflow-auto bg-white font-sans text-[#333]">
        
        {/* Header */}
        <div className="bg-[#E95420] text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-light">Ubuntu 24.04.1 LTS (Noble Numbat)</h1>
                <p className="mt-2 opacity-90">Select an image to download</p>
            </div>
        </div>

        <div className="max-w-4xl mx-auto p-8">
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <div className="flex items-start">
                    <AlertTriangle className="text-yellow-600 mr-3 mt-1" size={20} />
                    <div>
                        <p className="font-bold text-yellow-800">Architecture Warning</p>
                        <p className="text-sm text-yellow-700">
                            You are browsing from a <strong>Google Pixel 9 Pro XL</strong> (aarch64). 
                            Standard AMD64 (x86) desktop images will not boot. Please select an ARM64 Server image.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Server Image */}
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-[#E95420]">Server install image</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                For ARM64 architecture (Tensor, Snapdragon, Raspberry Pi). <br/>
                                Allows installing the Ubuntu Desktop environment via package manager.
                            </p>
                            <div className="mt-2 text-xs text-gray-500 font-mono">ubuntu-24.04-live-server-arm64.iso (2.6 GB)</div>
                        </div>
                        <button className="bg-[#0E8420] hover:bg-[#0c731b] text-white px-4 py-2 rounded flex items-center gap-2 font-medium">
                            <Download size={18} />
                            Download
                        </button>
                    </div>
                </div>

                {/* Desktop Image (Disabled) */}
                <div className="border border-gray-200 rounded-lg p-6 opacity-60 bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-500">Desktop image (AMD64)</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                The standard desktop image for 64-bit PC (AMD64) computers.
                            </p>
                            <div className="mt-2 text-xs text-gray-500 font-mono">ubuntu-24.04-desktop-amd64.iso</div>
                        </div>
                        <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded flex items-center gap-2 font-medium cursor-not-allowed">
                            Incompatible
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <h4 className="font-bold mb-2">Pixel 9 Installation Notes</h4>
                <p className="text-sm text-gray-600 mb-2">
                    To install on this device, you must first unlock the bootloader via <code>fastboot flashing unlock</code>.
                    Storage partitioning for native boot is complex due to Android Verified Boot (AVB).
                </p>
                <p className="text-sm text-blue-600 cursor-pointer hover:underline">
                    Read the "Pixel 9 Pro XL UFS Partitioning Guide" in the Terminal app &rarr;
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserApp;