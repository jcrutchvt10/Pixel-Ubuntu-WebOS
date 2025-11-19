
import React, { useState, useEffect, useRef } from 'react';
import { TerminalMessage, TerminalMode } from '../../types';
import { sendTerminalCommand, injectRealDeviceContext } from '../../services/geminiService';
import { installPackage, uninstallPackage, isPackageInstalled, ALL_PACKAGES } from '../../services/storageService';
import * as fs from '../../services/fileSystem';
import { getEmulator } from '../../services/emulatorService';

const TerminalApp: React.FC = () => {
  const [mode, setMode] = useState<TerminalMode>(TerminalMode.SHELL);
  const [history, setHistory] = useState<TerminalMessage[]>([
    { type: 'system', content: 'Ubuntu 24.04.1 LTS (GNU/Linux aarch64)' },
    { type: 'system', content: 'Kernel: 6.1.95-android16-16k-pages' },
    { type: 'system', content: 'Welcome to Pixel Ubuntu WebOS.' },
    { type: 'system', content: ' ' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emulatorInterval = useRef<number | null>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // --- EMULATOR LOGIC ---
  useEffect(() => {
      if (mode === TerminalMode.EMULATOR) {
          const emu = getEmulator();
          setHistory(prev => [...prev, { type: 'system', content: 'Starting Rust RISC-V Core...' }]);
          
          let stepCount = 0;
          emulatorInterval.current = window.setInterval(() => {
              const output = emu.cycle(5); // Run 5 cycles per tick
              if (output) {
                  setHistory(prev => [...prev, { type: 'kernel', content: output }]);
              }
              stepCount++;
              if (stepCount > 25) { // Stop auto-ticking after boot sequence
                   if (emulatorInterval.current) clearInterval(emulatorInterval.current);
              }
          }, 200);

          return () => {
              if (emulatorInterval.current) clearInterval(emulatorInterval.current);
          }
      }
  }, [mode]);

  const handleNeofetch = () => {
      const logo = `
            .-/+oossssoo+/-.
        \`:+ssssssssssssssssss+:\`
      -+ssssssssssssssssssyyssss+-
    .ossssssssssssssssssdMMMNysssso.
   /ssssssssssshdmmNNmmyNMMMMhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
 /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
 /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/
  +sssssssssdmydMMMMMMMMddddyssssssss+
   /ssssssssssshdmNNNNmyNMMMMhssssss/
    .ossssssssssssssssssdMMMNysssso.
      -+sssssssssssssssssyyyssss+-
        \`:+ssssssssssssssssss+:\`
            .-/+oossssoo+/-.
`;
      const info = [
          `\x1b[1;31mpixel@ubuntu\x1b[0m`,
          `-------------`,
          `\x1b[1;33mOS\x1b[0m: Ubuntu 24.04.1 LTS aarch64`,
          `\x1b[1;33mHost\x1b[0m: Google Pixel 9 Pro XL`,
          `\x1b[1;33mKernel\x1b[0m: 6.1.95-android16-16k`,
          `\x1b[1;33mUptime\x1b[0m: 42 mins`,
          `\x1b[1;33mPackages\x1b[0m: 12 (dpkg)`,
          `\x1b[1;33mShell\x1b[0m: bash 5.2.21`,
          `\x1b[1;33mResolution\x1b[0m: 1344x2992`,
          `\x1b[1;33mDE\x1b[0m: GNOME 46.0`,
          `\x1b[1;33mWM\x1b[0m: Mutter`,
          `\x1b[1;33mTerminal\x1b[0m: gnome-terminal`,
          `\x1b[1;33mCPU\x1b[0m: Google Tensor G4 (8) @ 3.10GHz`,
          `\x1b[1;33mGPU\x1b[0m: Mali-G715-Immortalis MC7`,
          `\x1b[1;33mMemory\x1b[0m: 2450MiB / 15890MiB`,
      ];
      
      // Simple side-by-side render
      const lines = logo.split('\n');
      let combined = "";
      for(let i=0; i<Math.max(lines.length, info.length + 5); i++) {
          const l = lines[i] || "                                        ";
          const r = info[i - 5] || "";
          combined += l + "   " + r + "\n";
      }
      
      setHistory(prev => [...prev, { type: 'system', content: combined }]);
  };

  const handleFSCommand = async (cmd: string) => {
      const parts = cmd.trim().split(' ');
      const command = parts[0];
      const arg = parts[1];

      try {
          if (command === 'ls') {
              const files = await fs.listDirectory('root');
              const output = files.map(f => `${f.type === 'folder' ? '\x1b[1;34m' + f.name + '\x1b[0m' : f.name}`).join('  ');
              setHistory(prev => [...prev, { type: 'system', content: output || '(empty)' }]);
          } else if (command === 'cat') {
              if (!arg) throw new Error("Usage: cat <filename>");
              const files = await fs.listDirectory('root');
              const file = files.find(f => f.name === arg);
              if (!file) throw new Error(`cat: ${arg}: No such file or directory`);
              const content = await fs.readFile(file.id);
              setHistory(prev => [...prev, { type: 'system', content: content }]);
          } else if (command === 'touch') {
              if (!arg) throw new Error("Usage: touch <filename>");
              await fs.saveFile(arg, "", "root");
              setHistory(prev => [...prev, { type: 'system', content: '' }]);
          } else if (command === 'rm') {
              if (!arg) throw new Error("Usage: rm <filename>");
              const files = await fs.listDirectory('root');
              const file = files.find(f => f.name === arg);
              if (!file) throw new Error(`rm: ${arg}: No such file`);
              await fs.deleteItem(file.id);
          } else {
              return false; // Not an FS command
          }
          return true;
      } catch (e: any) {
          setHistory(prev => [...prev, { type: 'error', content: e.message }]);
          return true;
      }
  };

  const handleAptCommand = async (cmd: string) => {
    const installMatch = cmd.match(/sudo (apt|apt-get) install\s+(.+)/);
    const removeMatch = cmd.match(/sudo (apt|apt-get) remove\s+(.+)/);

    if (installMatch) {
        const pkgName = installMatch[2].trim();
        const pkg = ALL_PACKAGES.find(p => p.name === pkgName);

        setHistory(prev => [...prev, 
            { type: 'system', content: 'Reading package lists... Done' },
            { type: 'system', content: 'Building dependency tree... Done' }
        ]);
        await new Promise(r => setTimeout(r, 500));

        if (!pkg) {
            setHistory(prev => [...prev, { type: 'error', content: `E: Unable to locate package ${pkgName}` }]);
            return;
        }
        if (isPackageInstalled(pkgName)) {
             setHistory(prev => [...prev, { type: 'system', content: `${pkgName} is already the newest version (${pkg.version}).` }]);
             return;
        }
        installPackage(pkgName);
        setHistory(prev => [...prev, { type: 'system', content: `Setting up ${pkgName} (${pkg.version}) ... Done.` }]);
        window.dispatchEvent(new Event('storage-update'));

    } else if (removeMatch) {
        const pkgName = removeMatch[2].trim();
        if (!isPackageInstalled(pkgName)) {
            setHistory(prev => [...prev, { type: 'error', content: `E: Package ${pkgName} is not installed` }]);
            return;
        }
        uninstallPackage(pkgName);
        setHistory(prev => [...prev, { type: 'system', content: `Removing ${pkgName}... Done.` }]);
        window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      const cmd = input.trim();
      setInput('');
      
      setHistory(prev => [...prev, { type: 'user', content: cmd }]);
      
      if (mode === TerminalMode.EMULATOR) {
          setHistory(prev => [...prev, { type: 'kernel', content: `sh: ${cmd}: command not found` }]);
          return;
      }

      setIsLoading(true);

      if (cmd === 'clear') {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      if (cmd === 'neofetch') {
          handleNeofetch();
          setIsLoading(false);
          return;
      }

      if (cmd === 'boot_linux') {
          setMode(TerminalMode.EMULATOR);
          setIsLoading(false);
          return;
      }

      // Check FS commands first
      const fsHandled = await handleFSCommand(cmd);
      if (fsHandled) {
          setIsLoading(false);
          return;
      }

      // Check APT commands
      if (cmd.startsWith('sudo apt')) {
          await handleAptCommand(cmd);
          setIsLoading(false);
          return;
      }

      // Fallback to Gemini AI
      const response = await sendTerminalCommand(cmd);
      setHistory(prev => [...prev, { type: 'system', content: response }]);
      setIsLoading(false);
    }
  };

  const prompt = mode === TerminalMode.EMULATOR ? '(initramfs)' : 'pixel@ubuntu:~$';
  const promptColor = mode === TerminalMode.EMULATOR ? 'text-red-500' : 'text-[#8ae234]';

  return (
    <div 
      className="bg-[#300a24] text-gray-100 h-full w-full p-1 ubuntu-mono text-sm overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
        {history.map((msg, idx) => (
          <div key={idx} className="mb-1 whitespace-pre-wrap break-words">
            {msg.type === 'user' ? (
              <div className="flex">
                <span className={`${promptColor} font-bold mr-2`}>{prompt}</span>
                <span>{msg.content}</span>
              </div>
            ) : msg.type === 'error' ? (
               <div className="text-red-400">{msg.content}</div>
            ) : msg.type === 'kernel' ? (
               <div className="text-gray-400 font-mono text-xs">{msg.content}</div>
            ) : (
              <div className="text-gray-300">{msg.content}</div>
            )}
          </div>
        ))}
        
        {isLoading && (
            <div className="animate-pulse text-gray-400">_</div>
        )}

        <div className="flex mt-1">
             {!isLoading && <span className={`${promptColor} font-bold mr-2`}>{prompt}</span>}
             <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none border-none flex-grow text-gray-100"
                autoFocus
                disabled={isLoading}
                autoComplete="off"
                spellCheck="false"
             />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default TerminalApp;
