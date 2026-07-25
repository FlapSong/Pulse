import React from 'react';
import { motion } from 'motion/react';
import { Layers } from 'lucide-react';
import { useGameStore } from '../../entities/game/gameStore';

export const OverlayHUD: React.FC = () => {
  const { isOverlayOpen, setOverlayOpen } = useGameStore();

  if (!isOverlayOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#18181B] border border-slate-700/60 rounded-3xl shadow-2xl p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Оверлей в разработке</h2>
        <p className="text-sm text-slate-400 mb-6">
          Функция игрового оверлея находится в процессе активной разработки и скоро будет доступна.
        </p>
        <button
          onClick={() => setOverlayOpen(false)}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-600 cursor-pointer"
        >
          Закрыть
        </button>
      </motion.div>
    </div>
  );
};
