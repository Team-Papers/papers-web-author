import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const variants = {
  filled: 'bg-primary text-white hover:bg-primary-600 shadow-sm hover:shadow-lg glow-primary-hover',
  tonal: 'bg-primary-container text-on-primary-container hover:bg-primary-100',
  outlined: 'border border-outline text-primary bg-transparent hover:bg-primary-container/30 hover:border-primary-300',
  text: 'text-primary bg-transparent hover:bg-primary-container/20',
  danger: 'bg-error text-white hover:bg-red-600 shadow-sm hover:shadow-lg',
  accent: 'bg-accent text-white hover:bg-accent-700 shadow-sm hover:shadow-lg',
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
        // Un bouton est de l'interface, pas une voix : il garde la sans. La
        // serif est reservee au titre d'un ecran et aux montants.
        //
        // Le grossissement au survol a disparu aussi : un bouton qui grandit
        // sous le curseur bouge la mise en page autour de lui, et sur un
        // telephone il n'y a pas de survol — le retour au toucher suffit.
        'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
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
