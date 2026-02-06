import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  iconBg?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  iconBg = 'bg-primary-container text-primary',
  index = 0,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className="stat-card animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-on-surface-variant">{title}</p>
          <p className="text-3xl font-bold text-on-surface tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              isPositive
                ? 'bg-success-container text-success'
                : 'bg-error-container text-error'
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-on-surface-variant font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
          iconBg
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
