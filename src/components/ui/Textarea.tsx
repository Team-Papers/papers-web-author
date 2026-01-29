import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-on-surface">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-on-surface transition-all duration-200 resize-none',
            'placeholder:text-on-surface-variant/60',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'hover:border-on-surface-variant',
            error ? 'border-error focus:ring-error/30 focus:border-error' : 'border-outline',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-on-surface-variant">{helper}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
