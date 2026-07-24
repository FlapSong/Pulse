import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`
        relative rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md
        transition-all duration-200
        ${hoverable ? 'hover:bg-slate-800/80 hover:border-slate-700/80 hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-[0_0_20px_rgba(99,102,241,0.15)] border-indigo-500/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
