import React from 'react';
import { motion } from 'motion/react';

interface AudioWaveformProps {
  active?: boolean;
  bars?: number;
  height?: number;
  colorClass?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  active = true,
  bars = 5,
  height = 18,
  colorClass = 'bg-emerald-400'
}) => {
  return (
    <div className="inline-flex items-center gap-0.5" style={{ height }}>
      {Array.from({ length: bars }).map((_, index) => (
        <motion.span
          key={index}
          className={`w-0.5 rounded-full ${colorClass}`}
          animate={
            active
              ? {
                  height: ['20%', `${40 + (index % 3) * 30}%`, '20%']
                }
              : { height: '20%' }
          }
          transition={{
            duration: 0.4 + (index % 3) * 0.15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          style={{ height: '20%' }}
        />
      ))}
    </div>
  );
};
