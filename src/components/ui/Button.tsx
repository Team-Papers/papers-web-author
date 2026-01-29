import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const variants = {
  filled: 'bg-primary text-on-primary hover:bg-primary-dark shadow-sm hover:shadow-md',
  tonal: 'bg-primary-container text-on-primary-container hover:bg-primary-light',
  outlined: 'border border-outline text-primary bg-transparent hover:bg-primary-container/30',
  text: 'text-primary bg-transparent hover:bg-primary-container/20',
  danger: 'bg-error text-white hover:bg-red-600 shadow-sm',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'filled', size = 'md', isLoading, leftIcon, rightIcon, fullWidth,
  children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant], sizes[size], fullWidth && 'w-full', className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
