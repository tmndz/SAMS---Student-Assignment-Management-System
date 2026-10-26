import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'focusing' | 'idle' | 'offline';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className,
  onClick,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg font-bold',
  };

  const statusSizes = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2',
  };

  const statusColors = {
    online: 'bg-emerald-500 shadow-emerald-500/50 shadow-sm',
    focusing: 'bg-amber-400 shadow-amber-400/50 shadow-sm animate-pulse',
    idle: 'bg-slate-400',
    offline: 'bg-slate-600',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full select-none',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
    >
      <div
        className={cn(
          'overflow-hidden rounded-full flex items-center justify-center font-semibold bg-gradient-to-tr from-slate-800 to-indigo-950 text-indigo-200 border border-indigo-500/20 shadow-inner',
          sizes[size]
        )}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-slate-900',
            statusSizes[size],
            statusColors[status]
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
