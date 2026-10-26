import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'urgent' | 'high' | 'medium' | 'low' | 'success';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700/60',
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const dotColors = {
    default: 'bg-indigo-400',
    neutral: 'bg-slate-400',
    urgent: 'bg-rose-500 animate-pulse',
    high: 'bg-amber-400',
    medium: 'bg-indigo-400',
    low: 'bg-slate-400',
    success: 'bg-emerald-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border leading-none tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
