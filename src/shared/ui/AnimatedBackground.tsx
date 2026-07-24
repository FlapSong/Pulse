import React from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Grid - made brighter for visibility */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Glowing Orbs - made brighter and larger */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-[#22D3EE]/20 blur-[100px]"
      />
      <motion.div
        animate={{
          y: [0, 40, 0],
          x: [0, -20, 0],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[30%] -right-[5%] w-[50%] h-[70%] rounded-full bg-[#A855F7]/20 blur-[100px]"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.15, 0.4, 0.15],
          scale: [1, 1.25, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-[-5%] left-[25%] w-[40%] h-[50%] rounded-full bg-emerald-500/20 blur-[100px]"
      />
      
      {/* Floating Particles - made brighter and more numerous */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`bg-particle-${i}`}
          className="absolute w-1.5 h-1.5 bg-white/70 rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            opacity: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 2 + 0.5
          }}
          animate={{
            y: [null, Math.random() * -200 - 50],
            opacity: [null, 0]
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
};
