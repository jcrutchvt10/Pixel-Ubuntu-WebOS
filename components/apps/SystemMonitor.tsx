import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      name: i,
      cpu: Math.floor(Math.random() * 30) + 10,
      memory: Math.floor(Math.random() * 20) + 40,
    });
  }
  return data;
};

const SystemMonitorApp: React.FC = () => {
  const [data, setData] = useState(generateData(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), {
          name: prev[prev.length - 1].name + 1,
          cpu: Math.floor(Math.random() * 60) + 20, // Simulate active load
          memory: Math.floor(Math.random() * 10) + 50,
        }];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full bg-[#f2f2f2] text-[#333] flex flex-col p-4">
        <h2 className="text-lg font-normal mb-4 border-b border-gray-300 pb-2">Resources</h2>
        
        <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm">CPU History</span>
                    <span className="text-xs text-gray-500">Tensor G4 (Simulated)</span>
                </div>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px'}} />
                        <Area type="monotone" dataKey="cpu" stroke="#E95420" fill="#E95420" fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm">Memory and Swap History</span>
                    <span className="text-xs text-gray-500">16GB Total</span>
                </div>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                         <Tooltip contentStyle={{backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px'}} />
                        <Area type="monotone" dataKey="memory" stroke="#77216F" fill="#77216F" fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SystemMonitorApp;