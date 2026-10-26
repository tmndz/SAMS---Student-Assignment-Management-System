import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isPast, differenceInHours, differenceInDays } from 'date-fns';
import { PriorityLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, h:mm a');
  } catch {
    return dateString;
  }
}

export function formatRelativeDeadline(dateString: string): { label: string; isUrgent: boolean; isPastDue: boolean } {
  try {
    const date = new Date(dateString);
    const past = isPast(date);
    const hours = differenceInHours(date, new Date());
    const days = differenceInDays(date, new Date());

    if (past) {
      return { label: `Overdue by ${formatDistanceToNow(date)}`, isUrgent: true, isPastDue: true };
    }

    if (hours < 24) {
      return { label: `Due in ${hours} hour${hours === 1 ? '' : 's'}`, isUrgent: true, isPastDue: false };
    }

    if (days === 1) {
      return { label: 'Due tomorrow', isUrgent: true, isPastDue: false };
    }

    return { label: `Due in ${days} days`, isUrgent: days <= 3, isPastDue: false };
  } catch {
    return { label: 'Date unavailable', isUrgent: false, isPastDue: false };
  }
}

export function getPriorityBadge(priority: PriorityLevel): { label: string; color: string; dotColor: string } {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dotColor: 'bg-rose-500' };
    case 'high':
      return { label: 'High', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-500' };
    case 'medium':
      return { label: 'Medium', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', dotColor: 'bg-indigo-500' };
    case 'low':
    default:
      return { label: 'Low', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dotColor: 'bg-slate-400' };
  }
}

export function formatFileSize(bytes?: number | string): string {
  if (!bytes) return '1.2 MB';
  if (typeof bytes === 'string') return bytes;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
