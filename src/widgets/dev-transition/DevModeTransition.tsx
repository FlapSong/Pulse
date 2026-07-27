import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ShieldAlert, Cpu, Code2, Database, Network } from 'lucide-react';
import { useGameStore } from '../../entities/game/gameStore';

export const DevModeTransition = () => {
  const { showDevModeTransition, setShowDevModeTransition, setDevMode } = useGameStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (showDevModeTransition) {
      setStep(1);
      
      const t1 = setTimeout(() => setStep(2), 800);
      const t2 = setTimeout(() => setStep(3), 1600);
      const t3 = setTimeout(() => setStep(4), 2400);
      const t4 = setTimeout(() => {
        setDevMode(true);
        setShowDevModeTransition(false);
        setStep(0);
      }, 3500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [showDevModeTransition, setShowDevModeTransition, setDevMode]);

  return (
    <AnimatePresence>
      {showDevModeTransition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center font-mono overflow-hidden"
        >
          {/* Matrix-like background effect */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #22D3EE 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          
          <div className="relative flex flex-col items-center max-w-md w-full p-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-24 h-24 rounded-3xl bg-[#22D3EE]/10 border-2 border-[#22D3EE]/30 flex items-center justify-center mb-8 relative overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#22D3EE]/20 to-transparent" />
              <Terminal className="w-12 h-12 text-[#22D3EE]" />
            </motion.div>

            <h2 className="text-2xl font-bold text-[#F5F5F7] mb-2 uppercase tracking-widest text-center">
              Инициализация
            </h2>
            <p className="text-[#22D3EE] font-bold mb-8 uppercase tracking-widest text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              Developer Mode
            </p>

            <div className="w-full space-y-4">
              <LogItem 
                icon={<ShieldAlert />} 
                text="Обход системных ограничений..." 
                active={step >= 1} 
              />
              <LogItem 
                icon={<Cpu />} 
                text="Разблокировка метрик производительности..." 
                active={step >= 2} 
              />
              <LogItem 
                icon={<Database />} 
                text="Подключение к локальной БД..." 
                active={step >= 3} 
              />
              <LogItem 
                icon={<Code2 />} 
                text="Инъекция инструментов разработчика..." 
                active={step >= 4} 
              />
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mt-10 overflow-hidden">
              <motion.div 
                className="h-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LogItem = ({ icon, text, active }: { icon: React.ReactNode, text: string, active: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
    className="flex items-center gap-3 text-xs"
  >
    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${active ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'bg-white/5 text-white/20'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3 h-3' })}
    </div>
    <span className={active ? 'text-[#F5F5F7]' : 'text-white/20'}>{text}</span>
  </motion.div>
);
