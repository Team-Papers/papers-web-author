import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  iconBg?: string;
}

export function StatCard({ title, value, icon, trend, iconBg = 'bg-primary-container text-primary' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-on-surface-variant">{title}</p>
          <p className="text-2xl font-bold text-on-surface">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-success' : 'text-error')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconBg)}>{icon}</div>
      </div>
    </Card>
  );
}
