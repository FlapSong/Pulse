import React, { useState } from 'react';
import { UserStatus } from '../types';

interface AvatarProps {
  src?: string;
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
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg'
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

  const initialLetter = (alt || '?').charAt(0).toUpperCase();
  const defaultFallbackUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;

  const effectiveSrc = !src || imgError ? defaultFallbackUrl : src;

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`
          relative rounded-full overflow-hidden bg-gradient-to-tr from-cyan-600 to-indigo-600 transition-all duration-200 flex items-center justify-center font-bold text-white shadow-inner
          ${sizeMap[size]}
          ${isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}
        `}
      >
        {imgError ? (
          <span className="select-none font-bold text-white/90">{initialLetter}</span>
        ) : (
          <img
            src={effectiveSrc}
            alt={alt}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
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

