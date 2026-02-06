import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({
  children,
  className,
  onClick,
  hoverable,
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface p-6 transition-all duration-200',
        variant === 'default' && 'border border-outline-variant',
        variant === 'outlined' && 'border-2 border-outline',
        variant === 'elevated' && 'shadow-md hover:shadow-lg',
        hoverable && 'hover:shadow-md hover:border-primary-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
