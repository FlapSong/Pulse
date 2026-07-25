import React from 'react';
import { motion } from 'motion/react';

export const LoadingScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-[10000] bg-[#09090B] flex flex-col items-center justify-center"
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#22D3EE 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Layered Geometric Loading */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full border-2 border-[#22D3EE]/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute w-3/4 h-3/4 border-2 border-[#22D3EE]/40 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-1/2 bg-[#22D3EE]/20 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        />
      </div>
      
      {/* Text with refined transition */}
      <motion.div 
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-[#F5F5F7] text-sm font-semibold tracking-[0.2em] uppercase"
      >
        Инициализация Pulse
      </motion.div>
    </motion.div>
  );
};
