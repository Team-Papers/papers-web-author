import { cn } from '@/lib/utils/cn';

interface Tab { key: string; label: string; count?: number; }
interface TabsProps { tabs: Tab[]; active: string; onChange: (key: string) => void; }

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-container p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            active === tab.key
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              active === tab.key ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
