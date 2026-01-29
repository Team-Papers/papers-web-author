import { cn } from '@/lib/utils/cn';

const variants = {
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-yellow-800',
  error: 'bg-error-container text-error',
  info: 'bg-primary-container text-on-primary-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
