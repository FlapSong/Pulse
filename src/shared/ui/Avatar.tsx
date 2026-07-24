import React from 'react';
import { UserStatus } from '../types';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  isSpeaking?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  status,
  isSpeaking = false,
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const statusColorMap: Record<UserStatus, string> = {
    online: 'bg-emerald-500',
    idle: 'bg-amber-500',
    dnd: 'bg-rose-500',
    offline: 'bg-slate-600'
  };

  const statusSizeMap = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2'
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`
          relative rounded-full overflow-hidden bg-slate-800 transition-all duration-200
          ${sizeMap[size]}
          ${isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}
        `}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full ring-slate-950
            ${statusColorMap[status]}
            ${statusSizeMap[size]}
          `}
        />
      )}
    </div>
  );
};
