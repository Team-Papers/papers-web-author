import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-on-surface">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-on-surface transition-all duration-200',
              'placeholder:text-on-surface-variant/60',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'hover:border-on-surface-variant',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error ? 'border-error focus:ring-error/30 focus:border-error' : 'border-outline',
              className,
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-on-surface-variant">{helper}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
