import React from 'react';
import { Layers } from 'lucide-react';

export const PulseArena: React.FC = () => {
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-[#18181B] text-slate-300">
      <div className="z-10 text-center space-y-4 max-w-md p-8 bg-[#27272A]/80 border border-slate-700/60 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">
          Оверлей в разработке
        </h1>
        <p className="text-slate-400 text-xs leading-relaxed">
          Функция игрового оверлея находится в процессе активной разработки и скоро будет доступна.
        </p>
      </div>
    </div>
  );
};

