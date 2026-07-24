import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../../entities/game/gameStore';
import { Crosshair, ShieldAlert } from 'lucide-react';

export const PulseArena: React.FC = () => {
  const { toggleOverlay, setOverlayOpen } = useGameStore();

  useEffect(() => {
    // Optionally close overlay when leaving
    return () => setOverlayOpen(false);
  }, [setOverlayOpen]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-transparent">
      {/* Game Environment Simulator */}
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-black pointer-events-none" />

      {/* Grid Floor */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60%] border-t border-cyan-500/20"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(34,211,238,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          transform: 'perspective(1000px) rotateX(75deg) scale(2.5)',
          transformOrigin: 'top center',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)'
        }}
      />
      
      {/* Moving stars/particles simulation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              opacity: [null, Math.random() * 0.8 + 0.2, 0.2]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="z-10 text-center space-y-6 max-w-2xl px-6 p-10 bg-transparent/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 mb-4">
          <Crosshair className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          Pulse Arena
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
          Это интерактивная песочница для тестирования игрового оверлея. Запустите оверлей, чтобы увидеть, как он работает поверх игрового процесса.
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={toggleOverlay}
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] flex items-center gap-2 transform hover:scale-105 active:scale-95"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Тест Оверлея</span>
          </button>
        </div>
        
        <div className="mt-8 text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <span>Горячая клавиша:</span>
          <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-white font-bold">Alt</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-white font-bold">U</kbd>
        </div>
      </div>

    </div>
  );
};
