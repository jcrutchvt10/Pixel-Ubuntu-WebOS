import React, { useState, useEffect } from 'react';
import { User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { WALLPAPER_URL } from '../../constants';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;
    
    setIsLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      onLogin();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-cover bg-center flex flex-col items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        
        {/* Clock / Date (Top) */}
        <div className="absolute top-[-20vh] flex flex-col items-center text-shadow-md">
             <h1 className="text-6xl font-bold tracking-tight">
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
             </h1>
             <p className="text-xl font-medium mt-2">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </p>
        </div>

        {/* User Card */}
        <div className="flex flex-col items-center gap-6 mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-purple-600 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                         <User size={48} className="text-gray-400" />
                    </div>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-shadow-sm">Pixel User</h2>

            <form onSubmit={handleLogin} className="relative w-64">
                <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-[#2c2c2c]/80 border border-gray-600 rounded-lg py-2 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#E95420] focus:border-transparent transition-all placeholder-gray-400 text-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    disabled={isLoading}
                />
                
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>

                {password.length > 0 && !isLoading && (
                     <button 
                        type="submit"
                        className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-gray-500 hover:bg-white/10 flex items-center justify-center text-gray-300"
                    >
                        <ArrowRight size={16} />
                    </button>
                )}

                {isLoading && (
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </form>

            <div className="mt-8 text-sm text-gray-300/80 cursor-pointer hover:underline hover:text-white">
                Not listed?
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 right-8 flex gap-4 text-white/80">
         <User size={24} className="cursor-pointer hover:text-white" />
         <div className="w-px h-6 bg-white/30"></div>
         <div className="cursor-pointer hover:text-white">Accessibility</div>
      </div>
    </div>
  );
};

export default LoginScreen;